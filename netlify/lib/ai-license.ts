// netlify/lib/ai-license.ts
// ترخيص الذكاء الاصطناعي على السيرفر: أي طبقة يملكها المستخدم، وأي كوادر مسموح له،
// وأي موديل يُستخدم فعلاً. المتصفح لا يُصدَّق في أي من هذه القرارات — يرسل اختياره فقط
// وتُتحقق الصلاحية هنا قبل لمس الموديل.

import { and, eq } from 'drizzle-orm';
import type { User } from '@netlify/identity';
import { database } from '../../db/index.js';
import { aiEntitlements, aiStaffGrants, aiUsage } from '../../db/schema.js';
import { tierGrantSignature } from './tier-grant.js';
import {
  aiTiers,
  defaultModelFor,
  isStaffTier,
  licensedTiers,
  modelsForTier,
  type AiTierId,
  type StaffTier,
} from '../../shared/ai-tiers.js';
import { isAdmin } from './platform.js';

export interface AiLicense {
  tier: StaffTier;
  tierX: boolean;
  /** الكوادر المصرّح له بها هذا الحساب. */
  staff: string[];
  admin: boolean;
  /** الطبقات المتاحة فعلياً لهذا الحساب. */
  tiers: AiTierId[];
  source: 'default' | 'grant' | 'admin';
}

/**
 * الكوادر المتاحة لكل حساب بدون ترخيص: خدمة العملاء (الباقة المجانية الدائمة)
 * والمرشد الذكي الذي يستقبل التسجيل الجديد. البقية تحتاج ترخيصاً من الإدارة.
 */
export const freeStaffIds = ['customer_care', 'onboarding_guide'];

export function tierPrice(tier: AiTierId): number | null {
  return aiTiers[tier].pricePerQuestionSar;
}

/** يقرأ ترخيص المستخدم من قاعدة البيانات؛ الافتراضي tier-1 بلا tier-x. */
export async function aiLicense(user: User): Promise<AiLicense> {
  const admin = isAdmin(user);
  if (admin) {
    return { tier: 'tier-3', tierX: true, staff: [], admin: true, tiers: licensedTiers('tier-3', true), source: 'admin' };
  }
  const db = database();
  const [entitlement] = await db.select().from(aiEntitlements).where(eq(aiEntitlements.ownerId, user.id)).limit(1) as { tier?: string; tierX?: boolean }[];
  const grants = await db.select({ staffId: aiStaffGrants.staffId }).from(aiStaffGrants).where(eq(aiStaffGrants.ownerId, user.id)) as { staffId: string }[];
  const tier: StaffTier = isStaffTier(entitlement?.tier) ? entitlement!.tier as StaffTier : 'tier-1';
  const tierX = entitlement?.tierX === true;
  const staff = [...new Set([...freeStaffIds, ...grants.map(row => row.staffId).filter(value => typeof value === 'string')])];
  return {
    tier,
    tierX,
    staff,
    admin: false,
    tiers: licensedTiers(tier, tierX),
    source: entitlement ? 'grant' : 'default',
  };
}

export function licenseAllowsStaff(license: AiLicense, staffId: unknown): boolean {
  if (license.admin) return true;
  return typeof staffId === 'string' && license.staff.includes(staffId);
}

export function licenseAllowsTier(license: AiLicense, tier: AiTierId): boolean {
  return license.tiers.includes(tier);
}

/**
 * توقيع ترخيص المستوى الرابع للبوابة: البوابة تقبل أي موديل من قائمتها، لكن نماذج
 * abliterated تحتاج توقيعاً مطابقاً لحظة الطلب (التنفيذ في `tier-grant.ts`، وتُعاد
 * تصديره هنا لأن الدوال تستورده من هذا الملف).
 */
export { tierGrantSignature };

/** يسجّل استهلاك سؤال واحد (أساس التسعير بالاستخدام). لا يفشل الطلب إذا فشل السجل. */
export async function recordUsage(ownerId: string, tier: AiTierId, modelId: string, staffId: string | null): Promise<void> {
  try {
    await database().insert(aiUsage).values({ ownerId, tier, modelId, staffId });
  } catch (error) {
    console.error(`AI usage log failed for ${tier}/${modelId}`, error instanceof Error ? error.message : error);
  }
}

/** منحة/تعديل ترخيص طبقة (إدارة فقط). tier-x منفصلة عن الطبقات المدفوعة. */
export async function grantTier(params: { ownerId: string; tier?: StaffTier; tierX?: boolean; actor: string; note?: string | null }) {
  const values = {
    ownerId: params.ownerId,
    tier: params.tier ?? 'tier-1',
    tierX: params.tierX === true,
    grantedBy: params.actor,
    note: params.note ?? null,
    updatedAt: new Date(),
  };
  const [row] = await database().insert(aiEntitlements).values(values)
    .onConflictDoUpdate({ target: aiEntitlements.ownerId, set: values })
    .returning();
  return row;
}

/** ترخيص كادر (إدارة فقط). */
export async function grantStaff(params: { ownerId: string; staffId: string; actor: string }) {
  const [row] = await database().insert(aiStaffGrants)
    .values({ ownerId: params.ownerId, staffId: params.staffId, grantedBy: params.actor })
    .onConflictDoNothing({ target: [aiStaffGrants.ownerId, aiStaffGrants.staffId] })
    .returning();
  return row;
}

/** سحب ترخيص كادر (إدارة فقط). */
export async function revokeStaff(params: { ownerId: string; staffId: string }) {
  await database().delete(aiStaffGrants).where(and(eq(aiStaffGrants.ownerId, params.ownerId), eq(aiStaffGrants.staffId, params.staffId)));
}

/** الموديل الافتراضي لطبقة (يُستخدم كقيمة عرض في الواجهة أيضاً). */
export function tierDefaultModel(tier: AiTierId): string {
  return defaultModelFor(tier);
}

export function tierModelIds(tier: AiTierId): string[] {
  return modelsForTier(tier).map(model => model.id);
}
