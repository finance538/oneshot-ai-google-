import { and, desc, eq, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, documents, merchants, serviceOrders, walletEntries, wallets, walletTopups } from '../../db/schema.js';
import { walletServices } from '../../shared/services.js';
import { cents, email, failure, HttpError, identifier, isAdmin, jsonBody, owner, reply, sameOrigin, text, throttle } from '../lib/platform.js';
import { ensureWallet, publicGateways, syncAdminGateways } from '../lib/wallet.js';
import { settings } from '../lib/policy.js';
import { confirmPayment } from '../lib/payments.js';

export default async (req: Request) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const user = await owner();
    const wallet = await ensureWallet(user.id);
    const db = database();
    const { policy } = await settings();
    if (isAdmin(user)) {
      const [merchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
      if (merchant) await syncAdminGateways(user.id, merchant.id);
    }
    const gateways = await publicGateways(policy);
    if (req.method === 'GET') {
      const entries = await db.select().from(walletEntries).where(eq(walletEntries.walletId, wallet.id)).orderBy(desc(walletEntries.createdAt)).limit(100);
      const orders = await db.select().from(serviceOrders).where(eq(serviceOrders.walletId, wallet.id)).orderBy(desc(serviceOrders.createdAt)).limit(100);
      const topups = await db.select({ id: documents.id, amount: documents.amount, gateway: documents.gateway, status: documents.status, createdAt: documents.createdAt }).from(walletTopups).innerJoin(documents, eq(walletTopups.documentId, documents.id)).where(eq(walletTopups.walletId, wallet.id)).orderBy(desc(walletTopups.createdAt)).limit(30);
      const adminOrders = isAdmin(user) ? await db.select().from(serviceOrders).orderBy(desc(serviceOrders.createdAt)).limit(100) : undefined;
      return reply({ wallet, entries, orders, topups, adminOrders, gateways: gateways.map(row => row.gateway), paymentsEnabled: policy.paymentsEnabled });
    }
    sameOrigin(req);
    await throttle(`wallet:${user.id}`, 60);
    const body = await jsonBody(req);
    if (body.action === 'fulfill') {
      if (!isAdmin(user)) throw new HttpError(403, 'هذا الإجراء لمسؤول المنصة فقط.');
      const [order] = await db.update(serviceOrders).set({ status: 'fulfilled' }).where(eq(serviceOrders.id, identifier(body.id))).returning();
      if (!order) throw new HttpError(404, 'طلب الخدمة غير موجود.');
      return reply({ order });
    }
    if (body.action === 'verify') {
      const documentId = identifier(body.id);
      const [topup] = await db.select().from(walletTopups).where(and(eq(walletTopups.documentId, documentId), eq(walletTopups.walletId, wallet.id)));
      if (!topup) throw new HttpError(404, 'عملية الشحن غير موجودة.');
      const [attempt] = await db.select().from(attempts).where(eq(attempts.documentId, documentId)).orderBy(desc(attempts.createdAt)).limit(1);
      if (!attempt?.reference) throw new HttpError(409, 'لم يصل مرجع الدفع بعد. أكمل الدفع أو انتظر تأكيد البوابة.');
      return reply({ status: await confirmPayment(attempt.id, attempt.reference) });
    }
    if (!policy.paymentsEnabled) throw new HttpError(409, 'المدفوعات متوقفة بواسطة المسؤول.');
    const requestId = identifier(body.requestId);
    if (body.action === 'topup') {
      if (!policy.requestsEnabled) throw new HttpError(409, 'إنشاء طلبات الدفع متوقف بواسطة المسؤول.');
      const amount = cents(body.amount);
      if (amount > 1000000) throw new HttpError(400, 'الحد الأعلى للشحن في العملية الواحدة 10,000 ريال.');
      const selected = gateways.find(row => row.gateway === body.gateway);
      if (!selected) throw new HttpError(409, 'بوابة الدفع غير متاحة للموقع حالياً.');
      const documentId = await db.transaction(async tx => {
        await tx.select().from(wallets).where(eq(wallets.id, wallet.id)).for('update');
        const [existing] = await tx.select().from(walletTopups).where(and(eq(walletTopups.walletId, wallet.id), eq(walletTopups.requestId, requestId)));
        if (existing) {
          const [document] = await tx.select().from(documents).where(eq(documents.id, existing.documentId));
          if (!document || document.amount !== amount || document.gateway !== selected.gateway) throw new HttpError(409, 'معرّف الشحن مستخدم لعملية أخرى.');
          return existing.documentId;
        }
        const [document] = await tx.insert(documents).values({ merchantId: selected.merchantId, title: 'شحن محفظة ونشوت', customerName: user.name || user.email || 'عميل ونشوت', customerEmail: email(user.email), amount, method: 'hosted', gateway: selected.gateway, expiresAt: new Date(Date.now() + 86400000) }).returning();
        await tx.insert(walletTopups).values({ walletId: wallet.id, documentId: document.id, requestId });
        return document.id;
      });
      return reply({ documentId }, 201);
    }
    if (body.action === 'purchase') {
      const sku = text(body.sku, 30);
      const product = walletServices.find(item => item.sku === sku);
      if (!product) throw new HttpError(409, 'هذه الخدمة تتطلب تأكيد النطاق والسعر من فريق ونشوت قبل الدفع.');
      const amount = cents(product.amount);
      const order = await db.transaction(async tx => {
        await tx.select().from(wallets).where(eq(wallets.id, wallet.id)).for('update');
        const [existing] = await tx.select().from(serviceOrders).where(and(eq(serviceOrders.walletId, wallet.id), eq(serviceOrders.requestId, requestId)));
        if (existing) {
          if (existing.sku !== product.sku) throw new HttpError(409, 'معرّف الطلب مستخدم لخدمة أخرى.');
          return existing;
        }
        const [updated] = await tx.update(wallets).set({ balance: sql`${wallets.balance} - ${amount}` }).where(and(eq(wallets.id, wallet.id), sql`${wallets.balance} >= ${amount}`)).returning();
        if (!updated) throw new HttpError(409, 'رصيد المحفظة غير كافٍ. اشحن المحفظة أولاً.');
        const [created] = await tx.insert(serviceOrders).values({ walletId: wallet.id, requestId, sku: product.sku, title: product.nameAr, amount, billingCycle: product.billingCycle, customerName: user.name || user.email || 'عميل ونشوت', customerEmail: email(user.email) }).returning();
        await tx.insert(walletEntries).values({ walletId: wallet.id, orderId: created.id, amount: -amount, description: product.nameAr });
        return created;
      });
      return reply({ order }, 201);
    }
    throw new HttpError(400, 'عملية غير معروفة.');
  } catch (error) { return failure(error); }
};
