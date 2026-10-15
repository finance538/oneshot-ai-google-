import type { Context } from '@netlify/functions';
import { desc, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, documents, merchants, openLinks, walletTopups } from '../../db/schema.js';
import { failure, HttpError, identifier, jsonBody, paytabs, reply, safeGatewayUrl, sameOrigin, text, throttle } from '../lib/platform.js';
import { enabledCapabilities, settings } from '../lib/policy.js';
import { confirmPayment } from '../lib/payments.js';
import { ngeniusCreateOrder } from '../lib/ngenius.js';
import { telrConfig, telrRequest, telrUrl } from '../lib/telr.js';
import { publicGateways } from '../lib/wallet.js';
import { gateways, type Gateway } from '../../shared/policy.js';

export default async (req: Request, context: Context) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const url = new URL(req.url);
    const documentId = identifier(url.searchParams.get('id'));
    const db = database();
    const [row] = await db.select().from(documents).innerJoin(merchants, eq(documents.merchantId, merchants.id)).where(eq(documents.id, documentId));
    if (!row) throw new HttpError(404, 'رابط الدفع غير موجود.');
    const document = row.payment_documents;
    const merchant = row.merchants;
    const { policy } = await settings();
    const active = enabledCapabilities(merchant.id, gateways.includes(document.gateway as Gateway) ? document.gateway as Gateway : 'paytabs', policy);
    let sourceEnabled = true;
    const [topup] = await db.select().from(walletTopups).where(eq(walletTopups.documentId, document.id));
    if (topup) sourceEnabled = (await publicGateways(policy)).some(row => row.gateway === document.gateway && row.merchantId === document.merchantId);
    if (document.openLinkId) {
      const [link] = await db.select().from(openLinks).where(eq(openLinks.id, document.openLinkId));
      sourceEnabled = !!link?.enabled && policy.openLinksEnabled && !!link.allowedMethods.includes(`${document.gateway}:${document.method}`);
    }
    const [previous] = await db.select().from(attempts).where(eq(attempts.documentId, document.id)).orderBy(desc(attempts.createdAt)).limit(1);
    if (req.method === 'GET') return reply({ document: { id: document.id, title: document.title, amount: document.amount, gateway: document.gateway, method: document.method, interval: document.interval, status: document.status, expiresAt: document.expiresAt, merchantName: merchant.name }, available: sourceEnabled && active[document.method] === true, aiEnabled: policy.aiEnabled, gatewayUrl: document.gatewayUrl || previous?.gatewayUrl || null });
    sameOrigin(req);
    if (['own', 'managed'].includes(document.method) && url.protocol !== 'https:') throw new HttpError(400, 'نماذج البطاقة تتطلب رابط HTTPS آمناً.');
    await throttle(`checkout:${context.ip || 'unknown'}:${document.id}`, 15);
    const body = await jsonBody(req);
    if (body.action === 'verify') {
      if (!previous?.reference) throw new HttpError(409, 'التأكيد لم يصل بعد. انتظر إشعار بوابة الدفع.');
      return reply({ status: await confirmPayment(previous.id, previous.reference) });
    }
    if (!sourceEnabled) throw new HttpError(409, 'هذه الميزة متوقفة بواسطة مسؤول المنصة.');
    if (document.status === 'paid' || document.status === 'cancelled' || new Date(document.expiresAt).getTime() < Date.now()) throw new HttpError(409, 'هذا الرابط مكتمل أو ملغى أو منتهي الصلاحية.');
    if (!active[document.method as keyof typeof active]) throw new HttpError(409, 'طريقة الدفع غير مهيأة لهذا التاجر.');
    if (document.gatewayUrl) return reply({ url: document.gatewayUrl });
    if (previous && ['processing', 'pending', 'paid'].includes(previous.status)) {
      if (previous.gatewayUrl) return reply({ url: previous.gatewayUrl });
      throw new HttpError(409, 'توجد محاولة قيد المعالجة. لا تكرر الدفع؛ تحقق من الحالة أولاً.');
    }
    const recurring = document.method === 'recurring';
    if (recurring && body.consent !== true) throw new HttpError(400, 'الموافقة الصريحة على التجديد التلقائي مطلوبة.');
    let card: Record<string, unknown> | undefined;
    let paymentToken: string | undefined;
    const customer: Record<string, unknown> = { name: document.customerName, email: document.customerEmail, ...(context.ip ? { ip: context.ip } : {}) };
    if (document.method === 'own' || document.method === 'managed') {
      const billing = body.billing as Record<string, unknown> | undefined;
      if (!billing || typeof billing !== 'object' || Array.isArray(billing)) throw new HttpError(400, 'أكمل بيانات عنوان الفوترة.');
      const country = text(billing.country, 2).toUpperCase();
      const phone = text(billing.phone, 25);
      if (!/^[A-Z]{2}$/.test(country) || !/^\+?[\d\s()-]{5,25}$/.test(phone)) throw new HttpError(400, 'الدولة أو رقم الهاتف غير صالح.');
      Object.assign(customer, { country, phone, street1: text(billing.street, 150), city: text(billing.city, 100), state: text(billing.state, 100), zip: text(billing.zip, 15) });
    }
    if (document.method === 'managed') paymentToken = text(body.paymentToken, 256);
    if (document.method === 'own') {
      const input = body.card as Record<string, unknown> | undefined;
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'بيانات البطاقة مطلوبة.');
      const pan = text(input.pan, 23).replace(/\s/g, '');
      const cvv = text(input.cvv, 4);
      const month = Number(input.month);
      const year = Number(input.year);
      const now = new Date();
      if (!/^\d{12,19}$/.test(pan) || !/^\d{3,4}$/.test(cvv) || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < now.getUTCFullYear() || year > now.getUTCFullYear() + 20 || (year === now.getUTCFullYear() && month < now.getUTCMonth() + 1)) throw new HttpError(400, 'بيانات البطاقة غير صالحة.');
      card = { pan, cvv, expiry_month: month, expiry_year: year };
    }
    const [attempt] = await db.insert(attempts).values({ documentId: document.id, merchantId: merchant.id, amount: document.amount, period: `initial:${document.id}:${previous?.id || 'first'}`, consent: recurring && body.consent === true }).onConflictDoNothing().returning();
    if (!attempt) throw new HttpError(409, 'توجد محاولة دفع أخرى قيد المعالجة.');
    const origin = url.origin;
    if (document.gateway === 'ngenius') {
      const order = await ngeniusCreateOrder(merchant.id, { amount: document.amount, description: document.title, email: document.customerEmail, origin, documentId: document.id });
      await db.update(attempts).set({ reference: order.reference, gatewayUrl: order.url, status: 'pending' }).where(eq(attempts.id, attempt.id));
      return reply({ url: order.url, status: 'pending' });
    }
    if (document.gateway === 'telr') {
      const returnUrl = `${origin}/.netlify/functions/payment-return?id=${document.id}`;
      const result = await telrRequest(merchant.id, {
        method: 'create', framed: document.method === 'framed' ? 2 : 0,
        order: { cartid: attempt.id, test: String(telrConfig(merchant.id).test), amount: (document.amount / 100).toFixed(2), currency: 'SAR', description: document.title.slice(0, 63), trantype: 'sale' },
        return: { authorised: returnUrl, declined: returnUrl, cancelled: returnUrl },
      });
      const order = result.order as Record<string, unknown> | undefined;
      if (!order || typeof order.ref !== 'string') throw new HttpError(502, 'لم تصل بيانات جلسة Telr.');
      const redirectUrl = telrUrl(order.url, merchant.id);
      await db.update(attempts).set({ reference: order.ref, gatewayUrl: redirectUrl, status: 'pending' }).where(eq(attempts.id, attempt.id));
      return reply({ url: redirectUrl, status: 'pending' });
    }
    const payload: Record<string, unknown> = {
      tran_type: 'sale', tran_class: 'ecom', cart_id: attempt.id, cart_description: document.title,
      cart_currency: 'SAR', cart_amount: document.amount / 100,
      customer_details: customer, paypage_lang: body.language === 'en' || body.language === 'zh' || body.language === 'ru' ? 'en' : 'ar', hide_shipping: true,
      callback: `${origin}/.netlify/functions/payment-callback?merchant=${merchant.id}`,
      return: `${origin}/.netlify/functions/payment-return?id=${document.id}`,
      ...(document.method === 'framed' ? { framed: true, framed_return_top: true } : {}),
      ...(document.method === 'mada_applepay' ? { payment_methods: ['mada', 'applepay'] } : {}),
      ...(recurring ? { tokenise: 2 } : {}),
      ...(card ? { card_details: card } : {}),
      ...(paymentToken ? { payment_token: paymentToken } : {}),
    };
    let path = '/payment/request';
    if (document.method === 'paylink') {
      path = '/payment/link/create';
      const result = await paytabs(merchant.id, path, { link_title: document.title, cart_currency: 'SAR', cart_amount: document.amount / 100, return_url: `${origin}/pay/${document.id}` });
      const redirectUrl = safeGatewayUrl(result.link_url, merchant.id);
      await db.update(attempts).set({ gatewayUrl: redirectUrl, status: 'pending' }).where(eq(attempts.id, attempt.id));
      await db.update(documents).set({ gatewayUrl: redirectUrl, gatewayId: String(result.link_id || ''), status: 'published' }).where(eq(documents.id, document.id));
      return reply({ url: redirectUrl, status: 'published' });
    }
    if (document.method === 'invoice') {
      path = '/payment/invoice/new';
      payload.invoice = { lang: body.language === 'ar' ? 'ar' : 'en', expiry_date: document.expiresAt.toISOString(), line_items: [{ description: document.title, unit_cost: document.amount / 100, quantity: 1, total: document.amount / 100 }] };
    }
    const result = await paytabs(merchant.id, path, payload);
    const redirect = result.redirect_url || result.invoice_link || result.link_url;
    const reference = typeof result.tran_ref === 'string' ? result.tran_ref : null;
    const redirectUrl = redirect ? safeGatewayUrl(redirect, merchant.id) : null;
    await db.update(attempts).set({ reference, gatewayUrl: redirectUrl, status: 'pending' }).where(eq(attempts.id, attempt.id));
    if (document.method === 'paylink' || document.method === 'invoice') {
      if (!redirectUrl) throw new HttpError(502, 'لم تصل بيانات الرابط من البوابة.');
      await db.update(documents).set({ gatewayUrl: redirectUrl, gatewayId: String(result.link_id || result.invoice_id || ''), status: 'published' }).where(eq(documents.id, document.id));
    }
    if (reference && !redirectUrl) return reply({ status: await confirmPayment(attempt.id, reference), url: null });
    if (!redirectUrl) throw new HttpError(502, 'لم تصل بيانات جلسة الدفع. راجع البوابة قبل تكرار المحاولة.');
    return reply({ url: redirectUrl, status: 'pending' });
  } catch (error) { return failure(error); }
};
