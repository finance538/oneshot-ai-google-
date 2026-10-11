import type { Config } from '@netlify/functions';
import { and, eq, lt, lte } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { attempts, documents, rateLimits, subscriptions } from '../../db/schema.js';
import { decryptToken, nextDate, paytabs } from '../lib/platform.js';
import { enabledCapabilities, settings } from '../lib/policy.js';
import { confirmPayment } from '../lib/payments.js';

export default async () => {
  const db = database();
  const now = new Date();
  const { policy } = await settings();
  await db.delete(rateLimits).where(lt(rateLimits.expiresAt, now));
  const due = await db.select().from(subscriptions).innerJoin(documents, eq(subscriptions.documentId, documents.id)).where(and(eq(subscriptions.status, 'active'), lte(subscriptions.nextChargeAt, now))).orderBy(subscriptions.nextChargeAt).limit(1);
  for (const row of due) {
    const subscription = row.subscriptions;
    const document = row.payment_documents;
    if (!enabledCapabilities(subscription.merchantId, 'paytabs', policy).recurring) continue;
    const period = `renewal:${subscription.id}:${subscription.nextChargeAt.toISOString()}`;
    const attempt = await db.transaction(async tx => {
      const [claimed] = await tx.update(subscriptions).set({ status: 'charging' }).where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.status, 'active'), eq(subscriptions.nextChargeAt, subscription.nextChargeAt))).returning();
      if (!claimed) return null;
      const [created] = await tx.insert(attempts).values({ merchantId: subscription.merchantId, documentId: document.id, period, amount: document.amount }).onConflictDoNothing().returning();
      if (!created) await tx.update(subscriptions).set({ status: 'review' }).where(eq(subscriptions.id, subscription.id));
      return created || null;
    });
    if (!attempt) continue;
    try {
      const result = await paytabs(subscription.merchantId, '/payment/request', {
        tran_type: 'sale', tran_class: 'recurring', cart_id: attempt.id, cart_description: document.title,
        cart_amount: document.amount / 100, cart_currency: 'SAR', token: decryptToken(subscription.encryptedToken),
      }, 8000);
      if (typeof result.tran_ref !== 'string') throw new Error('Missing reference');
      await db.update(attempts).set({ reference: result.tran_ref, status: 'pending' }).where(eq(attempts.id, attempt.id));
      const status = await confirmPayment(attempt.id, result.tran_ref, undefined, 8000);
      await db.update(subscriptions).set({ status: status === 'paid' ? 'active' : status === 'failed' ? 'past_due' : 'review', ...(status === 'paid' ? { nextChargeAt: nextDate(subscription.nextChargeAt, document.interval) } : {}) }).where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.status, 'charging')));
    } catch {
      await db.update(subscriptions).set({ status: 'review' }).where(and(eq(subscriptions.id, subscription.id), eq(subscriptions.status, 'charging')));
    }
  }
};

export const config: Config = { schedule: '* * * * *' };
