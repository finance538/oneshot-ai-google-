import { and, desc, eq, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, documents, gatewayRequests, merchants, openLinks, subscriptions } from '../../db/schema.js';
import { cents, credentialPrefix, email, failure, HttpError, identifier, isAdmin, jsonBody, owner, reply, sameOrigin, tenant, text, throttle } from '../lib/platform.js';
import { enabledCapabilities, settings } from '../lib/policy.js';
import { openLinkMethods } from '../../shared/policy.js';
import { confirmPayment } from '../lib/payments.js';
import { telrPrefix } from '../lib/telr.js';
import { captureOperation, captureVerifiedIdentity } from '../lib/operations.js';
import { previewOnly } from '../../shared/operations.js';
import { ensureWallet, syncAdminGateways } from '../lib/wallet.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const user = await owner();
    await ensureWallet(user.id);
    const db = database();
    const { policy } = await settings();
    const userIsAdmin = isAdmin(user);
    if (req.method === 'GET') {
      const [merchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
      if (merchant && userIsAdmin) await syncAdminGateways(user.id, merchant.id);
      if (previewOnly(process.env.CONTEXT)) {
        try { await db.transaction(tx => captureVerifiedIdentity(tx, user, merchant?.id ?? null)); }
        catch { console.error('Preview operations session capture failed; dashboard access was not modified.'); }
      }
      if (!merchant) return reply({ merchant: null, documents: [], subscriptions: [], attempts: [], openLinks: [], policy, isAdmin: userIsAdmin });
      const reusableLinks = await db.select().from(openLinks).where(eq(openLinks.merchantId, merchant.id)).orderBy(desc(openLinks.createdAt)).limit(200);
      const docs = await db.select().from(documents).where(eq(documents.merchantId, merchant.id)).orderBy(desc(documents.createdAt)).limit(200);
      const recurring = await db.select({ id: subscriptions.id, documentId: subscriptions.documentId, status: subscriptions.status, nextChargeAt: subscriptions.nextChargeAt }).from(subscriptions).where(eq(subscriptions.merchantId, merchant.id));
      const payments = await db.select({ id: attempts.id, documentId: attempts.documentId, amount: attempts.amount, reference: attempts.reference, status: attempts.status, createdAt: attempts.createdAt }).from(attempts).where(eq(attempts.merchantId, merchant.id)).orderBy(desc(attempts.createdAt)).limit(200);
      const [paymentMetrics] = await db.select({ paidCount: sql<number>`count(*)::integer`, totalPaid: sql<number>`coalesce(sum(${attempts.amount}), 0)::bigint` }).from(attempts).where(and(eq(attempts.merchantId, merchant.id), eq(attempts.status, 'paid')));
      const [documentMetrics] = await db.select({ pendingCount: sql<number>`count(*) filter (where ${documents.status} in ('pending', 'published'))::integer`, customers: sql<number>`count(distinct lower(${documents.customerEmail}))::integer` }).from(documents).where(eq(documents.merchantId, merchant.id));
      const daily = await db.select({ day: sql<string>`to_char(${attempts.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`, amount: sql<number>`sum(${attempts.amount})::bigint` }).from(attempts).where(and(eq(attempts.merchantId, merchant.id), eq(attempts.status, 'paid'), sql`${attempts.createdAt} >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' - interval '6 days'`)).groupBy(sql`to_char(${attempts.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`);
      
      const myGatewayRequests = await db.select().from(gatewayRequests).where(eq(gatewayRequests.merchantId, merchant.id)).orderBy(desc(gatewayRequests.createdAt)).limit(50);
      let adminGatewayRequests: any[] = [];
      if (userIsAdmin) {
        adminGatewayRequests = await db.select({
          id: gatewayRequests.id,
          merchantId: gatewayRequests.merchantId,
          merchantName: merchants.name,
          gateway: gatewayRequests.gateway,
          status: gatewayRequests.status,
          variables: gatewayRequests.variables,
          notes: gatewayRequests.notes,
          submittedBy: gatewayRequests.submittedBy,
          createdAt: gatewayRequests.createdAt,
          updatedAt: gatewayRequests.updatedAt,
        }).from(gatewayRequests)
          .leftJoin(merchants, eq(gatewayRequests.merchantId, merchants.id))
          .orderBy(desc(gatewayRequests.createdAt))
          .limit(100);
      }

      return reply({
        merchant,
        documents: docs,
        subscriptions: recurring,
        attempts: payments,
        openLinks: reusableLinks,
        policy,
        isAdmin: userIsAdmin,
        metrics: {
          paidCount: Number(paymentMetrics.paidCount),
          totalPaid: Number(paymentMetrics.totalPaid),
          pendingCount: Number(documentMetrics.pendingCount),
          customers: Number(documentMetrics.customers)
        },
        daily: daily.map(row => ({ ...row, amount: Number(row.amount) })),
        capabilities: enabledCapabilities(merchant.id, 'paytabs', policy),
        telrCapabilities: enabledCapabilities(merchant.id, 'telr', policy),
        credentialPrefix: credentialPrefix(merchant.id),
        telrPrefix: telrPrefix(merchant.id),
        gatewayRequests: myGatewayRequests,
        adminGatewayRequests
      });
    }
    sameOrigin(req);
    await throttle(`owner:${user.id}`, 120);
    const body = await jsonBody(req);
    if (body.action === 'onboard') {
      const name = text(body.name, 100);
      await db.transaction(async tx => {
        const [created] = await tx.insert(merchants).values({ name, ownerId: user.id }).onConflictDoNothing().returning({ id: merchants.id });
        if (created) await captureOperation(tx, { sourceKey: `merchant:${created.id}`, kind: 'merchant_registration', subjectId: created.id, merchantId: created.id });
      });
      return reply({ ok: true }, 201);
    }
    const merchant = await tenant();
    if (body.action === 'submit-gateway-request') {
      if (!userIsAdmin) throw new HttpError(403, 'ربط بوابات الدفع يتم من حساب مسؤول المنصة.');
      const targetGateway = text(body.gateway, 30);
      if (!['paytabs', 'telr'].includes(targetGateway)) throw new HttpError(400, 'بوابة دفع غير مدعومة.');
      const variables = body.variables;
      if (!variables || typeof variables !== 'object' || Array.isArray(variables)) throw new HttpError(400, 'بيانات الربط غير صحيحة.');
      
      // Clean and sanitize keys/values
      const sanitizedVariables: Record<string, string> = {};
      for (const [key, value] of Object.entries(variables)) {
        if (typeof key === 'string' && key.length <= 60 && typeof value === 'string' && value.trim().length > 0) {
          sanitizedVariables[key.trim()] = value.trim().slice(0, 500);
        }
      }
      if (Object.keys(sanitizedVariables).length === 0) throw new HttpError(400, 'يرجى إدخال متغير واحد على الأقل للربط.');
      
      const notes = body.notes ? text(body.notes, 500) : null;
      const reqRecord = await db.transaction(async tx => {
        const [created] = await tx.insert(gatewayRequests).values({
          merchantId: merchant.id,
          gateway: targetGateway,
          status: 'pending',
          variables: sanitizedVariables,
          notes,
          submittedBy: user.email || user.id,
        }).returning();
        await captureOperation(tx, { sourceKey: `gateway:${created.id}`, kind: 'gateway_request', subjectId: created.id, merchantId: merchant.id, provider: targetGateway });
        return created;
      });
      return reply({ request: reqRecord }, 201);
    }
    if (body.action === 'update-gateway-request') {
      if (!userIsAdmin) throw new HttpError(403, 'هذا الإجراء لمسؤول المنصة فقط.');
      const requestId = identifier(body.id);
      const newStatus = text(body.status, 20);
      if (!['pending', 'configured', 'rejected'].includes(newStatus)) throw new HttpError(400, 'حالة غير صالحة.');
      const [updated] = await db.update(gatewayRequests).set({
        status: newStatus,
        updatedAt: new Date()
      }).where(eq(gatewayRequests.id, requestId)).returning();
      if (!updated) throw new HttpError(404, 'طلب الربط غير موجود.');
      return reply({ ok: true });
    }
    if (body.action === 'create-open-link') {

      if (!policy.requestsEnabled || !policy.openLinksEnabled || !policy.paymentsEnabled) throw new HttpError(409, 'هذه الميزة متوقفة بواسطة مسؤول المنصة.');
      const minimum = cents(body.minimum);
      const maximum = cents(body.maximum);
      if (maximum < minimum) throw new HttpError(400, 'الحد الأعلى أقل من الحد الأدنى.');
      if (!Array.isArray(body.allowedMethods) || !body.allowedMethods.length || body.allowedMethods.length > 16) throw new HttpError(400, 'اختر طريقة دفع متاحة.');
      const available = { paytabs: enabledCapabilities(merchant.id, 'paytabs', policy), telr: enabledCapabilities(merchant.id, 'telr', policy) };
      const selected = [...new Set(body.allowedMethods)].map(value => {
        if (typeof value !== 'string') throw new HttpError(400, 'اختر طريقة دفع متاحة.');
        const [gateway, method, extra] = value.split(':');
        if (!['paytabs', 'telr'].includes(gateway) || extra || !openLinkMethods.includes(method as typeof openLinkMethods[number]) || !available[gateway as 'paytabs' | 'telr'][method]) throw new HttpError(409, 'طريقة الدفع غير مهيأة لهذا التاجر.');
        return value;
      });
      const [link] = await db.insert(openLinks).values({ merchantId: merchant.id, title: text(body.title), minimum, maximum, allowedMethods: selected }).returning();
      return reply({ link }, 201);
    }
    if (body.action === 'toggle-open-link') {
      if (typeof body.enabled !== 'boolean') throw new HttpError(400, 'إعدادات غير صالحة.');
      const [updated] = await db.update(openLinks).set({ enabled: body.enabled }).where(and(eq(openLinks.id, identifier(body.id)), eq(openLinks.merchantId, merchant.id))).returning();
      if (!updated) throw new HttpError(404, 'رابط الدفع غير موجود.');
      return reply({ ok: true });
    }
    if (body.action === 'rename') {
      await db.update(merchants).set({ name: text(body.name, 100) }).where(eq(merchants.id, merchant.id));
      return reply({ ok: true });
    }
    if (body.action === 'create') {
      if (!policy.requestsEnabled) throw new HttpError(409, 'هذه الميزة متوقفة بواسطة مسؤول المنصة.');
      const method = text(body.method, 30);
      const selectedGateway = body.gateway === 'telr' ? 'telr' : 'paytabs';
      const supported = enabledCapabilities(merchant.id, selectedGateway, policy);
      if (!Object.hasOwn(supported, method) || method === 'connected' || !supported[method]) throw new HttpError(409, 'طريقة الدفع غير مهيأة لهذا التاجر.');
      const customerEmail = email(body.customerEmail);
      const [document] = await db.insert(documents).values({ merchantId: merchant.id, gateway: selectedGateway, title: text(body.title), customerName: text(body.customerName, 100), customerEmail, amount: cents(body.amount), method, interval: body.interval === 'yearly' ? 'yearly' : 'monthly', expiresAt: new Date(Date.now() + 30 * 86400000) }).returning();
      return reply({ document }, 201);
    }
    if (body.action === 'cancel-document') {
      const [updated] = await db.update(documents).set({ status: 'cancelled' }).where(and(eq(documents.id, identifier(body.id)), eq(documents.merchantId, merchant.id), eq(documents.status, 'pending'))).returning();
      if (!updated) throw new HttpError(409, 'لا يمكن إلغاء هذا الطلب أو أنه غير موجود.');
      return reply({ ok: true });
    }
    if (body.action === 'cancel-subscription') {
      const [updated] = await db.update(subscriptions).set({ status: 'cancelled' }).where(and(eq(subscriptions.id, identifier(body.id)), eq(subscriptions.merchantId, merchant.id))).returning();
      if (!updated) throw new HttpError(404, 'الاشتراك غير موجود.');
      return reply({ ok: true });
    }
    if (body.action === 'verify') {
      const [attempt] = await db.select().from(attempts).where(and(eq(attempts.id, identifier(body.id)), eq(attempts.merchantId, merchant.id)));
      if (!attempt) throw new HttpError(404, 'محاولة الدفع غير موجودة.');
      const reference = attempt.reference || (body.reference ? text(body.reference, 100) : null);
      if (!reference) throw new HttpError(409, 'لا يوجد مرجع للتحقق. راجع بوابة الدفع قبل تكرار المحاولة.');
      return reply({ status: await confirmPayment(attempt.id, reference) });
    }
    throw new HttpError(400, 'عملية غير معروفة.');
  } catch (error) { return failure(error); }
};
