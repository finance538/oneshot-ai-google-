import { createHash, randomInt } from 'node:crypto';
import type { User } from '@netlify/identity';
import { desc, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { accountRegistrations, marketerCampaigns, merchants } from '../../db/schema.js';
import { captureOperation } from './operations.js';
import { HttpError, isAdmin } from './platform.js';

export type AccountRole = 'admin' | 'merchant' | 'marketer' | 'loader' | 'customer';
export type AccountStatus = 'pending' | 'approved' | 'rejected';

export function generateAccountId(ownerId: string, attempt = 0): string {
  if (attempt >= 8) {
    return String(randomInt(1000000, 10000000));
  }
  const seed = attempt === 0 ? `oneshot-account:${ownerId}` : `oneshot-account:${ownerId}:retry:${attempt}`;
  const hash = createHash('sha256').update(seed).digest('hex');
  const numeric = (parseInt(hash.slice(0, 8), 16) % 9000000) + 1000000;
  return String(numeric);
}

async function provisionMerchantRecord(
  db: ReturnType<typeof database>,
  ownerId: string,
  storeName: string,
) {
  const [existingByOwner] = await db.select().from(merchants).where(eq(merchants.ownerId, ownerId));
  if (existingByOwner) return existingByOwner;

  const MAX_ATTEMPTS = 12;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const accountId = generateAccountId(ownerId, attempt);
    let createdMerchant: typeof merchants.$inferSelect | null = null;
    try {
      await db.transaction(async tx => {
        const [created] = await tx
          .insert(merchants)
          .values({
            ownerId,
            name: storeName,
            accountId,
          })
          .onConflictDoNothing()
          .returning();
        if (created) {
          createdMerchant = created;
          await captureOperation(tx, {
            sourceKey: `merchant:${created.id}`,
            kind: 'merchant_registration',
            subjectId: created.id,
            merchantId: created.id,
          });
        }
      });
    } catch (error) {
      const code = (error as { code?: string })?.code;
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (code !== '23505' && !message.includes('unique') && !message.includes('duplicate')) {
        throw error;
      }
    }

    if (createdMerchant) return createdMerchant;

    const [reloaded] = await db.select().from(merchants).where(eq(merchants.ownerId, ownerId));
    if (reloaded) return reloaded;
  }

  throw new HttpError(503, 'تعذر تخصيص رقم حساب فريد للتاجر حالياً. حاول مرة أخرى.');
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

  const [[existingRegistration], [existingMerchant]] = await Promise.all([
    db.select().from(accountRegistrations).where(eq(accountRegistrations.ownerId, user.id)),
    db.select().from(merchants).where(eq(merchants.ownerId, user.id)),
  ]);

  const meta = readUserMetadata(user);
  const rawAccountType = String(meta.account_type || '');
  if (!existingRegistration && !existingMerchant && rawAccountType === 'customer') {
    return {
      accountRole: 'customer' as AccountRole,
      registrationStatus: 'approved' as AccountStatus,
      merchant: null,
      marketerAccount: null,
      marketerCampaigns: [],
    };
  }

  const metaRole = ['marketer', 'loader', 'admin'].includes(rawAccountType) ? rawAccountType : 'merchant';
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

  const merchant = existingMerchant ?? await provisionMerchantRecord(db, user.id, deriveDisplayName(user));

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
  params: { role: 'merchant' | 'marketer' | 'loader' | 'admin' | 'customer'; name?: string; storeName?: string; notes?: string | null },
) {
  if (isAdmin(user)) {
    throw new HttpError(403, 'حساب الإدارة منفصل تماماً عن قسم تسجيل التجار والمسوّقين.');
  }

  if (params.role === 'customer') {
    return {
      accountRole: 'customer' as AccountRole,
      registrationStatus: 'approved' as AccountStatus,
      marketerAccount: null,
      merchant: null,
    };
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

  const merchant = await provisionMerchantRecord(db, user.id, storeName);

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
