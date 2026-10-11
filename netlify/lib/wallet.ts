import { and, eq, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { siteGateways, walletEntries, wallets, walletTopups } from '../../db/schema.js';
import { enabledCapabilities } from './policy.js';
import { capabilities, HttpError } from './platform.js';
import { telrCapabilities, telrConfig } from './telr.js';
import type { Gateway, PaymentPolicy } from '../../shared/policy.js';

type Transaction = Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];

export async function ensureWallet(ownerId: string) {
  const db = database();
  await db.insert(wallets).values({ ownerId }).onConflictDoNothing();
  const [wallet] = await db.select().from(wallets).where(eq(wallets.ownerId, ownerId));
  if (!wallet) throw new HttpError(503, 'تعذر تجهيز المحفظة.');
  return wallet;
}

export async function syncAdminGateways(adminId: string, merchantId: string) {
  const db = database();
  for (const gateway of ['paytabs', 'telr'] as const) {
    const connected = gateway === 'paytabs' ? capabilities(merchantId).connected : telrCapabilities(merchantId).connected;
    if (connected) await db.insert(siteGateways).values({ gateway, merchantId, adminId }).onConflictDoUpdate({ target: siteGateways.gateway, set: { merchantId, adminId, updatedAt: new Date() } });
    else await db.delete(siteGateways).where(and(eq(siteGateways.gateway, gateway), eq(siteGateways.merchantId, merchantId)));
  }
}

export async function publicGateways(policy: PaymentPolicy) {
  const rows = await database().select().from(siteGateways);
  return rows.filter(row => (row.gateway === 'paytabs' || row.gateway === 'telr') && enabledCapabilities(row.merchantId, row.gateway as Gateway, policy).hosted && (row.gateway !== 'telr' || telrConfig(row.merchantId).test === 0));
}

export async function creditTopup(tx: Transaction, documentId: string, amount: number) {
  const [topup] = await tx.select().from(walletTopups).where(eq(walletTopups.documentId, documentId));
  if (!topup) return;
  const [entry] = await tx.insert(walletEntries).values({ walletId: topup.walletId, documentId, amount, description: 'شحن المحفظة' }).onConflictDoNothing().returning();
  if (entry) await tx.update(wallets).set({ balance: sql`${wallets.balance} + ${amount}` }).where(eq(wallets.id, topup.walletId));
}
