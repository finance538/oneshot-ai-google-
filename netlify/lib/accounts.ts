import { createHash } from 'node:crypto';
import type { User } from '@netlify/identity';
import { desc, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { accountRegistrations, marketerCampaigns, merchants } from '../../db/schema.js';
import { captureOperation } from './operations.js';
import { HttpError, isAdmin } from './platform.js';

export type AccountRole = 'admin' | 'merchant' | 'marketer' | 'loader';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export function generateAccountId(ownerId: string): string {
  const hash = createHash('sha256').update(`oneshot-account:${ownerId}`).digest('hex');
  const numeric = (parseInt(hash.slice(0, 8), 16) % 9000000) + 1000000;
  return String(numeric);
}

export function generateReferralCode(ownerId: string): string {
  const hash = createHash('sha256').update(`oneshot-marketer:${ownerId}`).digest('hex').slice(0, 6).toUpperCase();
  return `MKT-${hash}`;
}

export function readUserMetadata(user: User): Record<string, unknown> {
  const raw = (user as unknown as { userMetadata?: Record<string, unknown>; user_metadata?: Record<string, unknown> });
  return raw.userMetadata ?? raw.user_metadata ?? {};
}

export function deriveDisplayName(user: User, fallbackName?: string): string {
  if (fallbackName && fallbackName.trim()) return fallbackName.trim().slice(0, 100);
  const meta = readUserMetadata(user);
  if (typeof meta.store_name === 'string' && meta.store_name.trim()) return meta.store_name.trim().slice(0, 100);
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) return meta.full_name.trim().slice(0, 100);
  if (typeof user.name === 'string' && user.name.trim()) return user.name.trim().slice(0, 100);
  const emailPrefix = String(user.email || '').split('@')[0]?.trim();
  return (emailPrefix || 'متجر ونشوت').slice(0, 100);
}

export async function ensureAccountProvisioned(user: User) {
  const db = database();
  if (isAdmin(user)) {
    const [merchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
    return {
      accountRole: 'admin' as AccountRole,
      registrationStatus: 'approved' as AccountStatus,
      merchant: merchant ?? null,
      marketerAccount: null,
      marketerCampaigns: [],
    };
  }

  const [existingRegistration] = await db
    .select()
    .from(accountRegistrations)
    .where(eq(accountRegistrations.ownerId, user.id));

  const [existingMerchant] = await db
    .select()
    .from(merchants)
    .where(eq(merchants.ownerId, user.id));

  const meta = readUserMetadata(user);
  const metaRole = ['marketer', 'loader', 'admin'].includes(String(meta.account_type)) ? String(meta.account_type) : 'merchant';
  const metaNotes = typeof meta.marketing_notes === 'string' ? meta.marketing_notes.trim().slice(0, 400) : null;
  const fullName = deriveDisplayName(user);
  const userEmail = String(user.email || `${user.id}@oneshot.local`).trim().toLowerCase();

  const requestedRole = existingRegistration?.role ?? (!existingMerchant ? metaRole : 'merchant');
  if (requestedRole === 'loader' || requestedRole === 'admin') {
    if (!existingRegistration) {
      await db.insert(accountRegistrations).values({ ownerId: user.id, email: userEmail, fullName,
        role: requestedRole, status: requestedRole === 'admin' ? 'pending' : 'approved' }).onConflictDoNothing();
    }
    return { accountRole: requestedRole as AccountRole, registrationStatus: (existingRegistration?.status ?? (requestedRole === 'admin' ? 'pending' : 'approved')) as AccountStatus,
      merchant: null, marketerAccount: null, marketerCampaigns: [] };
  }

  // إذا كان مسجلاً كمسوّق (أو اختار مسوّق أثناء التسجيل ولم ينشأ له متجر سابقاً)
  if (existingRegistration?.role === 'marketer' || (!existingRegistration && !existingMerchant && metaRole === 'marketer')) {
    let marketer = existingRegistration;
    if (!marketer) {
      const referralCode = generateReferralCode(user.id);
      await db
        .insert(accountRegistrations)
        .values({
          ownerId: user.id,
          email: userEmail,
          fullName,
          role: 'marketer',
          status: 'approved',
          referralCode,
          commissionRate: 10,
          notes: metaNotes,
        })
        .onConflictDoNothing();
      const [created] = await db
        .select()
        .from(accountRegistrations)
        .where(eq(accountRegistrations.ownerId, user.id));
      marketer = created;
    }

    const campaigns =
      marketer && marketer.status === 'approved'
        ? await db
            .select()
            .from(marketerCampaigns)
            .where(eq(marketerCampaigns.ownerId, user.id))
            .orderBy(desc(marketerCampaigns.createdAt))
            .limit(100)
        : [];

    return {
      accountRole: 'marketer' as AccountRole,
      registrationStatus: (marketer?.status as AccountStatus) || 'pending',
      merchant: null,
      marketerAccount: marketer ?? null,
      marketerCampaigns: campaigns,
    };
  }

  // حساب التاجر: يُنشأ تلقائياً وبشكل فوري عند التسجيل دون الحاجة لإجراء يدوي منفصل
  if (!existingRegistration) {
    await db
      .insert(accountRegistrations)
      .values({
        ownerId: user.id,
        email: userEmail,
        fullName,
        role: 'merchant',
        status: 'approved',
      })
      .onConflictDoNothing();
  }

  let merchant = existingMerchant ?? null;
  if (!merchant) {
    const storeName = deriveDisplayName(user);
    const accountId = generateAccountId(user.id);
    await db.transaction(async tx => {
      const [created] = await tx
        .insert(merchants)
        .values({
          ownerId: user.id,
          name: storeName,
          accountId,
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        merchant = created;
        await captureOperation(tx, {
          sourceKey: `merchant:${created.id}`,
          kind: 'merchant_registration',
          subjectId: created.id,
          merchantId: created.id,
        });
      }
    });
    if (!merchant) {
      const [reloaded] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
      merchant = reloaded ?? null;
    }
  }

  return {
    accountRole: 'merchant' as AccountRole,
    registrationStatus: 'approved' as AccountStatus,
    merchant,
    marketerAccount: null,
    marketerCampaigns: [],
  };
}

export async function registerUserAccount(
  user: User,
  params: { role: 'merchant' | 'marketer' | 'loader' | 'admin'; name?: string; storeName?: string; notes?: string | null },
) {
  if (isAdmin(user)) {
    throw new HttpError(403, 'حساب الإدارة منفصل تماماً عن قسم تسجيل التجار والمسوّقين.');
  }

  const db = database();
  const fullName = deriveDisplayName(user, params.name);
  const storeName = deriveDisplayName(user, params.storeName || params.name);
  const userEmail = String(user.email || `${user.id}@oneshot.local`).trim().toLowerCase();
  const notes = params.notes ? params.notes.trim().slice(0, 400) : null;

  const [existing] = await db
    .select()
    .from(accountRegistrations)
    .where(eq(accountRegistrations.ownerId, user.id));

  if (existing && existing.role !== params.role) throw new HttpError(409, 'نوع الحساب مسجّل مسبقاً ولا يمكن تغييره.');
  if (params.role === 'loader' || params.role === 'admin') {
    if (!existing) await db.insert(accountRegistrations).values({ ownerId: user.id, email: userEmail, fullName,
      role: params.role, status: params.role === 'admin' ? 'pending' : 'approved' }).onConflictDoNothing();
    return ensureAccountProvisioned(user);
  }

  if (params.role === 'marketer') {
    const referralCode = existing?.referralCode || generateReferralCode(user.id);
    if (!existing) {
      await db
        .insert(accountRegistrations)
        .values({
          ownerId: user.id,
          email: userEmail,
          fullName,
          role: 'marketer',
          status: 'approved',
          referralCode,
          commissionRate: 10,
          notes,
        })
        .onConflictDoNothing();
    } else if (existing.role === 'marketer') {
      await db
        .update(accountRegistrations)
        .set({
          fullName,
          notes: notes ?? existing.notes,
          updatedAt: new Date(),
        })
        .where(eq(accountRegistrations.ownerId, user.id));
    } else {
      throw new HttpError(409, 'هذا الحساب مسجّل مسبقاً كحساب تاجر.');
    }

    const [marketer] = await db
      .select()
      .from(accountRegistrations)
      .where(eq(accountRegistrations.ownerId, user.id));

    return {
      accountRole: 'marketer' as AccountRole,
      registrationStatus: (marketer?.status as AccountStatus) || 'pending',
      marketerAccount: marketer ?? null,
      merchant: null,
    };
  }

  // تسجيل تاجر: إنشاء تلقائي وفوري لمساحة التاجر
  if (existing && existing.role === 'marketer') {
    throw new HttpError(409, 'هذا الحساب مسجّل كحساب مسوّق بانتظار أو تحت إدارة المنصة.');
  }

  if (!existing) {
    await db
      .insert(accountRegistrations)
      .values({
        ownerId: user.id,
        email: userEmail,
        fullName,
        role: 'merchant',
        status: 'approved',
      })
      .onConflictDoNothing();
  }

  let [merchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
  if (!merchant) {
    const accountId = generateAccountId(user.id);
    await db.transaction(async tx => {
      const [created] = await tx
        .insert(merchants)
        .values({
          ownerId: user.id,
          name: storeName,
          accountId,
        })
        .onConflictDoNothing()
        .returning();
      if (created) {
        merchant = created;
        await captureOperation(tx, {
          sourceKey: `merchant:${created.id}`,
          kind: 'merchant_registration',
          subjectId: created.id,
          merchantId: created.id,
        });
      }
    });
    if (!merchant) {
      [merchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
    }
  }

  return {
    accountRole: 'merchant' as AccountRole,
    registrationStatus: 'approved' as AccountStatus,
    marketerAccount: null,
    merchant: merchant ?? null,
  };
}

export async function requireApprovedMarketer(user: User) {
  if (isAdmin(user)) {
    throw new HttpError(403, 'صلاحيات الإدارة منفصلة تماماً عن صلاحيات المسوّقين.');
  }
  const db = database();
  const [registration] = await db
    .select()
    .from(accountRegistrations)
    .where(eq(accountRegistrations.ownerId, user.id));

  if (!registration || registration.role !== 'marketer') {
    throw new HttpError(403, 'هذه الصلاحية مخصصة لحسابات المسوّقين فقط.');
  }
  if (registration.status === 'pending') {
    throw new HttpError(403, 'حساب المسوّق الخاص بك بانتظار موافقة واعتماد الإدارة.');
  }
  if (registration.status === 'rejected') {
    throw new HttpError(403, 'تم رفض أو إيقاف حساب المسوّق من قبل إدارة المنصة.');
  }
  return registration;
}
