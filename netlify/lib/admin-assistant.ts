import { and, desc, eq, gt, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { database } from '../../db/index.js';
import { assistantActions, attempts, documents, gatewayRequests, merchants, openLinks, platformSettings, settingsAudit, subscriptions } from '../../db/schema.js';
import { defaultPolicy, type PaymentPolicy } from '../../shared/policy.js';
import { parseAssistantAction, type AssistantAction } from '../../shared/admin-assistant.js';
import { HttpError, identifier } from './platform.js';
import { parsePolicy, settings } from './policy.js';

type Transaction = Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];

export async function readAssistantData(input: Record<string, unknown>) {
  const db = database();
  const offset = input.offset === undefined ? 0 : Number(input.offset);
  if (!Number.isInteger(offset) || offset < 0 || offset > 10000) throw new HttpError(400, 'رقم الصفحة غير صالح.');
  const merchantId = input.merchantId === undefined ? undefined : identifier(input.merchantId);
  const filter = (column: AnyPgColumn) => merchantId ? eq(column, merchantId) : undefined;
  switch (input.resource) {
    case 'overview': {
      const [payments] = await db.select({ count: sql<number>`count(*)::integer`, paidCount: sql<number>`count(*) filter (where ${attempts.status} = 'paid')::integer`, paidTotalSARMinor: sql<string>`coalesce(sum(${attempts.amount}) filter (where ${attempts.status} = 'paid'), 0)::text` }).from(attempts).where(filter(attempts.merchantId));
      const [requests] = await db.select({ count: sql<number>`count(*)::integer`, pending: sql<number>`count(*) filter (where ${documents.status} = 'pending')::integer` }).from(documents).where(filter(documents.merchantId));
      const config = await settings();
      return { policy: parsePolicy(config.policy), version: config.version, payments, requests, currency: 'SAR', amountUnit: 'halala', note: 'Confirmed paid attempts only; published payment links are not confirmed revenue.' };
    }
    case 'merchants': return { rows: await db.select({ id: merchants.id, createdAt: merchants.createdAt }).from(merchants).where(merchantId ? eq(merchants.id, merchantId) : undefined).orderBy(desc(merchants.createdAt), desc(merchants.id)).limit(50).offset(offset), offset, limit: 50 };
    case 'documents': return { rows: await db.select({ id: documents.id, merchantId: documents.merchantId, amountSARMinor: documents.amount, method: documents.method, gateway: documents.gateway, status: documents.status, expiresAt: documents.expiresAt }).from(documents).where(filter(documents.merchantId)).orderBy(desc(documents.createdAt), desc(documents.id)).limit(50).offset(offset), offset, limit: 50 };
    case 'subscriptions': return { rows: await db.select({ id: subscriptions.id, merchantId: subscriptions.merchantId, documentId: subscriptions.documentId, status: subscriptions.status, nextChargeAt: subscriptions.nextChargeAt }).from(subscriptions).where(filter(subscriptions.merchantId)).orderBy(desc(subscriptions.createdAt), desc(subscriptions.id)).limit(50).offset(offset), offset, limit: 50 };
    case 'links': return { rows: await db.select({ id: openLinks.id, merchantId: openLinks.merchantId, minimumSARMinor: openLinks.minimum, maximumSARMinor: openLinks.maximum, enabled: openLinks.enabled }).from(openLinks).where(filter(openLinks.merchantId)).orderBy(desc(openLinks.createdAt), desc(openLinks.id)).limit(50).offset(offset), offset, limit: 50 };
    case 'gateway_requests': return { rows: await db.select({ id: gatewayRequests.id, merchantId: gatewayRequests.merchantId, gateway: gatewayRequests.gateway, status: gatewayRequests.status, updatedAt: gatewayRequests.updatedAt }).from(gatewayRequests).where(filter(gatewayRequests.merchantId)).orderBy(desc(gatewayRequests.createdAt), desc(gatewayRequests.id)).limit(50).offset(offset), offset, limit: 50 };
    case 'audit': return { rows: await db.select({ id: assistantActions.id, action: assistantActions.action, status: assistantActions.status, createdAt: assistantActions.createdAt, resolvedAt: assistantActions.resolvedAt }).from(assistantActions).orderBy(desc(assistantActions.createdAt), desc(assistantActions.id)).limit(50).offset(offset), offset, limit: 50 };
    default: throw new HttpError(400, 'أداة غير معروفة.');
  }
}

async function snapshot(tx: Transaction, action: AssistantAction): Promise<Record<string, unknown>> {
  if (action.type === 'set_policy') {
    const [row] = await tx.select().from(platformSettings).where(eq(platformSettings.id, 'global')).for('update');
    return { policy: parsePolicy(row?.policy ?? defaultPolicy), version: row?.version ?? 0 };
  }
  if (action.type === 'set_link') {
    const [row] = await tx.select({ enabled: openLinks.enabled }).from(openLinks).where(eq(openLinks.id, action.id)).for('update');
    if (!row) throw new HttpError(404, 'الرابط غير موجود.');
    return row;
  }
  if (action.type === 'set_gateway_request') {
    const [row] = await tx.select({ status: gatewayRequests.status, updatedAt: gatewayRequests.updatedAt }).from(gatewayRequests).where(eq(gatewayRequests.id, action.id)).for('update');
    if (!row) throw new HttpError(404, 'طلب الربط غير موجود.');
    return { status: row.status, updatedAt: row.updatedAt.toISOString() };
  }
  if (action.type === 'cancel_document') {
    const [row] = await tx.select({ status: documents.status }).from(documents).where(eq(documents.id, action.id)).for('update');
    if (!row || row.status !== 'pending') throw new HttpError(409, 'يمكن إلغاء طلبات الدفع المعلقة فقط.');
    return row;
  }
  const [row] = await tx.select({ status: subscriptions.status, nextChargeAt: subscriptions.nextChargeAt }).from(subscriptions).where(eq(subscriptions.id, action.id)).for('update');
  if (!row || row.status === 'cancelled') throw new HttpError(409, 'الاشتراك غير موجود أو ملغى بالفعل.');
  return { status: row.status, nextChargeAt: row.nextChargeAt.toISOString() };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([first], [second]) => first.localeCompare(second)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

export async function proposeAssistantAction(actorId: string, input: unknown) {
  let action: AssistantAction;
  try { action = parseAssistantAction(input); } catch { throw new HttpError(400, 'الإجراء المقترح غير صالح أو غير مدعوم.'); }
  return database().transaction(async tx => {
    const previous = await snapshot(tx, action);
    const [row] = await tx.insert(assistantActions).values({ actorId, action, previous, expiresAt: new Date(Date.now() + 10 * 60000) }).returning();
    return { id: row.id, action: row.action, previous: row.previous, expiresAt: row.expiresAt.toISOString() };
  });
}

export async function resolveAssistantAction(actorId: string, id: string, decision: 'confirm' | 'reject') {
  return database().transaction(async tx => {
    const [proposal] = await tx.update(assistantActions).set({ status: decision === 'confirm' ? 'executed' : 'rejected', resolvedAt: new Date() }).where(and(eq(assistantActions.id, id), eq(assistantActions.actorId, actorId), eq(assistantActions.status, 'pending'), gt(assistantActions.expiresAt, new Date()))).returning();
    if (!proposal) throw new HttpError(409, 'انتهت صلاحية الموافقة أو تمت معالجة الإجراء؛ اطلب اقتراحاً جديداً.');
    if (decision === 'reject') return { status: 'rejected' as const };
    const action = parseAssistantAction(proposal.action);
    const current = await snapshot(tx, action);
    if (canonical(current) !== canonical(proposal.previous)) throw new HttpError(409, 'تغيرت البيانات منذ الاقتراح. اطلب اقتراحاً جديداً قبل التنفيذ.');
    if (action.type === 'set_policy') {
      const policy = structuredClone(current.policy) as PaymentPolicy;
      const [group, field] = action.target.split('.');
      if (group === 'gateways') policy.gateways[field as keyof PaymentPolicy['gateways']] = action.enabled;
      else if (group === 'methods') policy.methods[field as keyof PaymentPolicy['methods']] = action.enabled;
      else policy[group as 'paymentsEnabled' | 'requestsEnabled' | 'openLinksEnabled' | 'aiEnabled'] = action.enabled;
      const values = { policy, version: Number(current.version) + 1, updatedBy: actorId, updatedAt: new Date() };
      if (current.version === 0) {
        const [inserted] = await tx.insert(platformSettings).values({ id: 'global', ...values }).onConflictDoNothing().returning({ id: platformSettings.id });
        if (!inserted) throw new HttpError(409, 'تغيرت الإعدادات. اطلب اقتراحاً جديداً.');
      } else await tx.update(platformSettings).set(values).where(eq(platformSettings.id, 'global'));
      await tx.insert(settingsAudit).values({ actorId, policy });
    } else if (action.type === 'set_link') await tx.update(openLinks).set({ enabled: action.enabled }).where(eq(openLinks.id, action.id));
    else if (action.type === 'set_gateway_request') await tx.update(gatewayRequests).set({ status: action.status, updatedAt: new Date() }).where(eq(gatewayRequests.id, action.id));
    else if (action.type === 'cancel_document') await tx.update(documents).set({ status: 'cancelled' }).where(eq(documents.id, action.id));
    else await tx.update(subscriptions).set({ status: 'cancelled' }).where(eq(subscriptions.id, action.id));
    return { status: 'executed' as const };
  });
}
