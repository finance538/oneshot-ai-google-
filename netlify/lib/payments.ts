import { and, eq, ne } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, documents, subscriptions, walletTopups } from '../../db/schema.js';
import { encryptToken, HttpError, nextDate, paytabs } from './platform.js';
import { telrConfig, telrRequest } from './telr.js';
import { creditTopup } from './wallet.js';

export async function confirmPayment(attemptId: string, reference: string, callbackToken?: string, timeoutMs = 20000) {
  const db = database();
  const [attempt] = await db.select().from(attempts).where(eq(attempts.id, attemptId));
  if (!attempt || (attempt.reference && attempt.reference !== reference)) throw new HttpError(404, 'محاولة الدفع غير موجودة.');
  const [targetDocument] = await db.select().from(documents).where(eq(documents.id, attempt.documentId));
  if (!targetDocument) throw new HttpError(404, 'طلب الدفع غير موجود.');
  if (targetDocument.gateway === 'telr') {
    const [topup] = await db.select().from(walletTopups).where(eq(walletTopups.documentId, targetDocument.id));
    if (topup && telrConfig(attempt.merchantId).test !== 0) throw new HttpError(409, 'لا يمكن شحن المحفظة من بوابة في وضع الاختبار.');
    const result = await telrRequest(attempt.merchantId, { method: 'check', order: { ref: reference } });
    const order = result.order as Record<string, unknown> | undefined;
    if (!order || order.ref !== reference || order.cartid !== attempt.id || order.currency !== 'SAR' || Math.round(Number(order.amount) * 100) !== attempt.amount) throw new HttpError(409, 'تأكيد Telr لا يطابق الطلب.');
    const code = Number((order.status as Record<string, unknown> | undefined)?.code);
    const status = code === 3 ? 'paid' : code < 0 ? 'failed' : 'pending';
    if (attempt.status === 'paid') return 'paid';
    await db.transaction(async tx => {
      const [updated] = await tx.update(attempts).set({ status, reference }).where(and(eq(attempts.id, attempt.id), eq(attempts.status, attempt.status))).returning();
      if (updated && status === 'paid') {
        await tx.update(documents).set({ status: 'paid' }).where(eq(documents.id, attempt.documentId));
        await creditTopup(tx, attempt.documentId, attempt.amount);
      }
    });
    return status;
  }
  const result = await paytabs(attempt.merchantId, '/payment/query', { tran_ref: reference }, timeoutMs);
  if (result.tran_ref !== reference || result.cart_id !== attempt.id || result.cart_currency !== 'SAR' || Math.round(Number(result.cart_amount) * 100) !== attempt.amount || String(result.tran_type).toLowerCase() !== 'sale') throw new HttpError(409, 'بيانات التأكيد لا تطابق طلب الدفع.');
  const payment = result.payment_result as Record<string, unknown> | undefined;
  const status = payment?.response_status === 'A' ? 'paid' : ['D', 'E', 'V'].includes(String(payment?.response_status)) ? 'failed' : 'pending';
  if (attempt.status === 'paid' && status !== 'paid') return 'paid';
  await db.transaction(async tx => {
    const [updated] = await tx.update(attempts).set({ status, reference }).where(and(eq(attempts.id, attempt.id), eq(attempts.status, attempt.status))).returning();
    if (!updated) return;
    if (status !== 'paid') return;
    await tx.update(documents).set({ status: 'paid' }).where(eq(documents.id, attempt.documentId));
    await creditTopup(tx, attempt.documentId, attempt.amount);
    const [document] = await tx.select().from(documents).where(eq(documents.id, attempt.documentId));
    if (attempt.period.startsWith('renewal:')) {
      const [subscription] = await tx.select().from(subscriptions).where(eq(subscriptions.documentId, document.id));
      if (subscription && attempt.period === `renewal:${subscription.id}:${subscription.nextChargeAt.toISOString()}`) {
        await tx.update(subscriptions).set({ status: 'active', nextChargeAt: nextDate(subscription.nextChargeAt, document.interval) }).where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.nextChargeAt, subscription.nextChargeAt), ne(subscriptions.status, 'cancelled')));
      }
      return;
    }
    if (document.method !== 'recurring' || !attempt.consent) return;
    const token = typeof result.token === 'string' ? result.token : callbackToken;
    if (!token) return;
    await tx.insert(subscriptions).values({ merchantId: attempt.merchantId, documentId: attempt.documentId, encryptedToken: encryptToken(token), initialReference: reference, nextChargeAt: nextDate(new Date(), document.interval) }).onConflictDoNothing();
  });
  return status;
}
