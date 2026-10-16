import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { merchants, operationsAudit, operationsEvents, operationsReceipts, operationsRequests } from '../../db/schema.js';
import { parseOperationsQuery, previewOnly, providerBoundaries, requireOperationsConfirmation, type OperationKind } from '../../shared/operations.js';
import { HttpError, identifier } from './platform.js';
import { settings } from './policy.js';

type Transaction = Parameters<Parameters<ReturnType<typeof database>['transaction']>[0]>[0];

export function requireOperationsPreview() {
  if (!previewOnly(process.env.CONTEXT)) throw new HttpError(403, 'مركز العمليات متاح في Deploy Preview فقط.');
}

export async function captureOperation(tx: Transaction, event: { sourceKey: string; kind: OperationKind; subjectId: string; merchantId?: string | null; provider?: string | null; createdAt?: Date }) {
  if (!previewOnly(process.env.CONTEXT)) return;
  const [captured] = await tx.insert(operationsEvents).values(event).onConflictDoNothing({ target: operationsEvents.sourceKey }).returning({ id: operationsEvents.id });
  return captured;
}

export async function captureVerifiedIdentity(tx: Transaction, user: { id: string; createdAt?: string; lastSignInAt?: string }, merchantId: string | null) {
  if (!previewOnly(process.env.CONTEXT)) return;
  for (const [kind, value] of [['customer_registration', user.createdAt], ['sign_in', user.lastSignInAt]] as const) {
    if (!value) continue;
    const createdAt = new Date(value);
    if (!Number.isFinite(createdAt.getTime()) || createdAt.getTime() > Date.now() + 60000) continue;
    const sourceKey = kind === 'customer_registration' ? `identity-signup:${user.id}` : `identity-login:${user.id}:${createdAt.toISOString()}`;
    await captureOperation(tx, { sourceKey, kind, subjectId: user.id, merchantId, createdAt });
  }
}

export async function readOperations(actorId: string, input: Record<string, unknown>) {
  requireOperationsPreview();
  let filters: ReturnType<typeof parseOperationsQuery>;
  try { filters = parseOperationsQuery(input); } catch (error) { throw new HttpError(400, (error as Error).message); }
  const merchantId = input.merchantId ? identifier(input.merchantId) : undefined;
  const pattern = `%${filters.query.replaceAll('_', '\\_')}%`;
  const join = and(eq(operationsReceipts.eventId, operationsEvents.id), eq(operationsReceipts.actorId, actorId));
  const where = and(
    merchantId ? eq(operationsEvents.merchantId, merchantId) : undefined,
    filters.kind ? eq(operationsEvents.kind, filters.kind) : undefined,
    filters.unread ? isNull(operationsReceipts.eventId) : undefined,
    filters.query ? or(ilike(sql`${operationsEvents.id}::text`, pattern), ilike(operationsEvents.subjectId, pattern), ilike(operationsEvents.kind, pattern), ilike(operationsEvents.provider, pattern)) : undefined,
  );
  const db = database();
  const records = await db.select({ id: operationsEvents.id, kind: operationsEvents.kind, merchantId: operationsEvents.merchantId, subjectId: operationsEvents.subjectId, provider: operationsEvents.provider, createdAt: operationsEvents.createdAt, read: sql<boolean>`${operationsReceipts.eventId} is not null` }).from(operationsEvents).leftJoin(operationsReceipts, join).where(where).orderBy(desc(operationsEvents.createdAt), desc(operationsEvents.id)).limit(51).offset(filters.offset);
  const [count] = await db.select({ unread: sql<number>`count(*)::integer` }).from(operationsEvents).leftJoin(operationsReceipts, join).where(and(isNull(operationsReceipts.eventId), merchantId ? eq(operationsEvents.merchantId, merchantId) : undefined));
  const audit = await db.select({ id: operationsAudit.id, action: operationsAudit.action, eventId: operationsAudit.eventId, merchantId: operationsAudit.merchantId, createdAt: operationsAudit.createdAt }).from(operationsAudit).where(and(eq(operationsAudit.actorId, actorId), merchantId ? eq(operationsAudit.merchantId, merchantId) : undefined)).orderBy(desc(operationsAudit.createdAt), desc(operationsAudit.id)).limit(30);
  const { policy } = await settings();
  return { records: records.slice(0, 50), hasMore: records.length > 50, unread: Number(count.unread), audit, providers: providerBoundaries(), aiAvailable: policy.aiEnabled && Boolean(process.env.ANTHROPIC_API_KEY) };
}

export async function mutateOperations(actorId: string, input: Record<string, unknown>) {
  requireOperationsPreview();
  try { requireOperationsConfirmation(input); } catch (error) { throw new HttpError(400, (error as Error).message); }
  if (input.action === 'set-read') {
    const eventId = identifier(input.id);
    if (typeof input.read !== 'boolean') throw new HttpError(400, 'حالة القراءة غير صالحة.');
    const read = input.read;
    return database().transaction(async tx => {
      const [event] = await tx.select({ merchantId: operationsEvents.merchantId }).from(operationsEvents).where(eq(operationsEvents.id, eventId)).for('update');
      if (!event) throw new HttpError(404, 'السجل غير موجود.');
      if (read) await tx.insert(operationsReceipts).values({ eventId, actorId }).onConflictDoNothing();
      else await tx.delete(operationsReceipts).where(and(eq(operationsReceipts.eventId, eventId), eq(operationsReceipts.actorId, actorId)));
      await tx.insert(operationsAudit).values({ actorId, eventId, merchantId: event.merchantId, action: read ? 'alert_read' : 'alert_unread' });
      return { ok: true };
    });
  }
  if (input.action === 'request-api-setup') {
    const merchantId = identifier(input.merchantId);
    return database().transaction(async tx => {
      const [merchant] = await tx.select({ id: merchants.id }).from(merchants).where(eq(merchants.id, merchantId)).for('update');
      if (!merchant) throw new HttpError(404, 'التاجر غير موجود.');
      const [existing] = await tx.select({ id: operationsRequests.id }).from(operationsRequests).where(and(eq(operationsRequests.merchantId, merchantId), eq(operationsRequests.status, 'pending_setup')));
      if (existing) throw new HttpError(409, 'يوجد طلب إعداد معلّق لهذا التاجر.');
      const [request] = await tx.insert(operationsRequests).values({ merchantId, actorId }).returning({ id: operationsRequests.id });
      const event = await captureOperation(tx, { sourceKey: `api:${request.id}`, kind: 'api_request', subjectId: request.id, merchantId, provider: 'customer_api' });
      if (!event) throw new HttpError(409, 'تعذر تسجيل طلب الإعداد. لم يُحفظ أي تغيير.');
      await tx.insert(operationsAudit).values({ actorId, eventId: event.id, merchantId, action: 'api_setup_requested' });
      return { id: request.id, status: 'pending_setup', connected: false };
    });
  }
  throw new HttpError(409, 'هذا التكامل غير مفعّل. لا يمكن إرسال بريد أو توقيع عقد أو تشغيل متصفح أو الاتصال بـ API.');
}
