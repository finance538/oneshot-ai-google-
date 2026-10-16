import { and, desc, eq, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import {
  accountRegistrations,
  aiEntitlements,
  aiStaffGrants,
  attempts,
  documents,
  gatewayRequests,
  marketerCampaigns,
  merchants,
  openLinks,
  subscriptions,
} from '../../db/schema.js';
import { cents, credentialPrefix, email, failure, HttpError, identifier, isAdmin, jsonBody, owner, reply, sameOrigin, tenant, text, throttle } from '../lib/platform.js';
import { ensureAccountProvisioned, registerUserAccount, requireApprovedMarketer } from '../lib/accounts.js';
import { isStaffTier, aiTiers } from '../../shared/ai-tiers.js';
import { aiLicense, grantStaff, grantTier, revokeStaff } from '../lib/ai-license.js';
import { enabledCapabilities, settings } from '../lib/policy.js';
import { gateways, openLinkMethods, type Gateway } from '../../shared/policy.js';
import { confirmPayment } from '../lib/payments.js';
import { telrPrefix } from '../lib/telr.js';
import { ngeniusPrefix } from '../lib/ngenius.js';
import { tapCapabilities, tapPrefix } from '../lib/tap.js';
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
      const provisioned = await ensureAccountProvisioned(user);
      const { accountRole, registrationStatus, merchant, marketerAccount, marketerCampaigns: campaigns } = provisioned;

      if (merchant && userIsAdmin) await syncAdminGateways(user.id, merchant.id);
      if (previewOnly(process.env.CONTEXT)) {
        try { await db.transaction(tx => captureVerifiedIdentity(tx, user, merchant?.id ?? null)); }
        catch { console.error('Preview operations session capture failed; dashboard access was not modified.'); }
      }

      let adminGatewayRequests: unknown[] = [];
      let adminMarketers: unknown[] = [];
      let aiAdminData: unknown = null;

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

        adminMarketers = await db
          .select()
          .from(accountRegistrations)
          .where(eq(accountRegistrations.role, 'marketer'))
          .orderBy(desc(accountRegistrations.createdAt))
          .limit(200);

        aiAdminData = {
          tiers: Object.values(aiTiers).map(tier => ({ id: tier.id, label: tier.label, pricePerQuestionSar: tier.pricePerQuestionSar, selectable: tier.selectable })),
          entitlements: await db.select().from(aiEntitlements).orderBy(desc(aiEntitlements.updatedAt)).limit(200),
          staffGrants: await db.select().from(aiStaffGrants).orderBy(desc(aiStaffGrants.createdAt)).limit(500),
        };
      }

      if (!merchant) {
        return reply({
          merchant: null,
          accountRole,
          registrationStatus,
          marketerAccount,
          marketerCampaigns: campaigns,
          documents: [],
          subscriptions: [],
          attempts: [],
          openLinks: [],
          policy,
          isAdmin: userIsAdmin,
          aiLicense: await aiLicense(user),
          aiAdmin: aiAdminData,
          adminGatewayRequests,
          adminMarketers,
        });
      }

      const reusableLinks = await db.select().from(openLinks).where(eq(openLinks.merchantId, merchant.id)).orderBy(desc(openLinks.createdAt)).limit(200);
      const docs = await db.select().from(documents).where(eq(documents.merchantId, merchant.id)).orderBy(desc(documents.createdAt)).limit(200);
      const recurring = await db.select({ id: subscriptions.id, documentId: subscriptions.documentId, status: subscriptions.status, nextChargeAt: subscriptions.nextChargeAt }).from(subscriptions).where(eq(subscriptions.merchantId, merchant.id));
      const payments = await db.select({ id: attempts.id, documentId: attempts.documentId, amount: attempts.amount, reference: attempts.reference, status: attempts.status, createdAt: attempts.createdAt }).from(attempts).where(eq(attempts.merchantId, merchant.id)).orderBy(desc(attempts.createdAt)).limit(200);
      const [paymentMetrics] = await db.select({ paidCount: sql<number>`count(*)::integer`, totalPaid: sql<number>`coalesce(sum(${attempts.amount}), 0)::bigint` }).from(attempts).where(and(eq(attempts.merchantId, merchant.id), eq(attempts.status, 'paid')));
      const [documentMetrics] = await db.select({ pendingCount: sql<number>`count(*) filter (where ${documents.status} in ('pending', 'published'))::integer`, customers: sql<number>`count(distinct lower(${documents.customerEmail}))::integer` }).from(documents).where(eq(documents.merchantId, merchant.id));
      const daily = await db.select({ day: sql<string>`to_char(${attempts.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`, amount: sql<number>`sum(${attempts.amount})::bigint` }).from(attempts).where(and(eq(attempts.merchantId, merchant.id), eq(attempts.status, 'paid'), sql`${attempts.createdAt} >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC' - interval '6 days'`)).groupBy(sql`to_char(${attempts.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`);

      const myGatewayRequests = await db.select().from(gatewayRequests).where(eq(gatewayRequests.merchantId, merchant.id)).orderBy(desc(gatewayRequests.createdAt)).limit(50);

      return reply({
        merchant,
        accountRole,
        registrationStatus,
        marketerAccount,
        marketerCampaigns: campaigns,
        documents: docs,
        subscriptions: recurring,
        attempts: payments,
        openLinks: reusableLinks,
        policy,
        isAdmin: userIsAdmin,
        aiLicense: await aiLicense(user),
        aiAdmin: aiAdminData,
        metrics: {
          paidCount: Number(paymentMetrics.paidCount),
          totalPaid: Number(paymentMetrics.totalPaid),
          pendingCount: Number(documentMetrics.pendingCount),
          customers: Number(documentMetrics.customers),
        },
        daily: daily.map(row => ({ ...row, amount: Number(row.amount) })),
        capabilities: enabledCapabilities(merchant.id, 'paytabs', policy),
        telrCapabilities: enabledCapabilities(merchant.id, 'telr', policy),
        ngeniusCapabilities: enabledCapabilities(merchant.id, 'ngenius', policy),
        tapCapabilities: enabledCapabilities(merchant.id, 'tap', policy),
        credentialPrefix: credentialPrefix(merchant.id),
        telrPrefix: telrPrefix(merchant.id),
        ngeniusPrefix: ngeniusPrefix(merchant.id),
        tapPrefix: tapPrefix(merchant.id),
        gatewayRequests: myGatewayRequests,
        adminGatewayRequests,
        adminMarketers,
      });
    }

    sameOrigin(req);
    await throttle(`owner:${user.id}`, 120);
    const body = await jsonBody(req);

    // ===== تسجيل الحساب (تاجر تلقائي أو مسوّق يتطلب موافقة الإدارة) — منفصل تماماً عن حساب الإدارة =====
    if (body.action === 'register-account') {
      if (userIsAdmin) throw new HttpError(403, 'حساب الإدارة منفصل تماماً عن قسم تسجيل التجار والمسوّقين.');
      const role = ['merchant', 'marketer', 'loader', 'admin', 'customer'].includes(String(body.role)) ? body.role as 'merchant' | 'marketer' | 'loader' | 'admin' | 'customer' : null;
      if (!role) throw new HttpError(400, 'اختر نوع الحساب: تاجر (merchant) أو مسوّق (marketer) أو عميل (customer).');
      const name = typeof body.name === 'string' && body.name.trim() ? text(body.name, 100) : undefined;
      const storeName = typeof body.storeName === 'string' && body.storeName.trim() ? text(body.storeName, 100) : undefined;
      const notes = typeof body.notes === 'string' && body.notes.trim() ? text(body.notes, 400) : null;
      const result = await registerUserAccount(user, { role, name, storeName, notes });
      return reply({ ok: true, ...result }, 201);
    }

    if (body.action === 'onboard') {
      if (userIsAdmin) throw new HttpError(403, 'حساب الإدارة منفصل تماماً عن قسم تسجيل التجار.');
      const name = text(body.name, 100);
      const result = await registerUserAccount(user, { role: 'merchant', name, storeName: name });
      return reply({ ok: true, ...result }, 201);
    }

    // ===== إجراءات الإدارة فقط (منفصلة تماماً عن المسوّقين والتجار، ولا تتطلب مساحة تاجر) =====
    if (body.action === 'grant-tier' || body.action === 'grant-staff' || body.action === 'revoke-staff') {
      if (!userIsAdmin) throw new HttpError(403, 'تراخيص طبقات الذكاء الاصطناعي تُمنح من إدارة المنصة فقط.');
      const targetOwner = text(body.ownerId, 64);
      if (body.action === 'grant-tier') {
        const rawTier = body.tier;
        const tierX = body.tierX === true || rawTier === 'tier-x';
        if (rawTier !== undefined && rawTier !== 'tier-x' && !isStaffTier(rawTier)) throw new HttpError(400, 'طبقة غير صالحة. المتاح: tier-1 أو tier-2 أو tier-3.');
        if (rawTier === undefined && body.tierX === undefined) throw new HttpError(400, 'حدّد الطبقة أو ترخيص المستوى الرابع X.');
        const record = await grantTier({
          ownerId: targetOwner,
          tier: isStaffTier(rawTier) ? rawTier : undefined,
          tierX,
          actor: String(user.email || user.id),
          note: body.note ? text(body.note, 200) : null,
        });
        return reply({ ok: true, entitlement: record }, 201);
      }
      const staffId = text(body.staffId, 40);
      if (body.action === 'grant-staff') {
        const record = await grantStaff({ ownerId: targetOwner, staffId, actor: String(user.email || user.id) });
        return reply({ ok: true, grant: record }, 201);
      }
      await revokeStaff({ ownerId: targetOwner, staffId });
      return reply({ ok: true });
    }

    if (body.action === 'lookup-merchant-gateways') {
      await requireApprovedMarketer(user);
      const lookup = text(body.lookup, 254).trim().toLowerCase();
      const matches = await db.select({ id: merchants.id, name: merchants.name, accountId: merchants.accountId })
        .from(merchants).innerJoin(accountRegistrations, eq(accountRegistrations.ownerId, merchants.ownerId))
        .where(and(eq(accountRegistrations.role, 'merchant'), eq(accountRegistrations.status, 'approved'),
          lookup.includes('@') ? sql`lower(${accountRegistrations.email}) = ${lookup}` : eq(merchants.accountId, lookup))).limit(2);
      if (matches.length !== 1) throw new HttpError(404, 'تعذر العثور على تاجر مطابق. تحقق من البريد أو رقم التاجر.');
      const merchant = matches[0];
      const available = gateways.filter(gateway => policy.paymentsEnabled && policy.gateways[gateway] && enabledCapabilities(merchant.id, gateway, policy).connected);
      const links = await db.select({ id: openLinks.id, title: openLinks.title }).from(openLinks)
        .where(and(eq(openLinks.merchantId, merchant.id), eq(openLinks.enabled, true))).limit(50);
      return reply({ merchant: { name: merchant.name, accountId: merchant.accountId }, gateways: available, links });
    }

    if (body.action === 'review-marketer') {
      if (!userIsAdmin) throw new HttpError(403, 'اعتماد ومراجعة حسابات المسوّقين متاحة لإدارة المنصة فقط.');
      const marketerId = identifier(body.id);
      const nextStatus = text(body.status, 20);
      if (!['approved', 'rejected', 'pending'].includes(nextStatus)) {
        throw new HttpError(400, 'حالة الاعتماد غير صالحة.');
      }
      let commissionRate = 10;
      if (body.commissionRate !== undefined) {
        const parsedRate = Number(body.commissionRate);
        if (!Number.isInteger(parsedRate) || parsedRate < 1 || parsedRate > 80) {
          throw new HttpError(400, 'نسبة العمولة يجب أن تكون رقماً صحيحاً بين 1% و 80%.');
        }
        commissionRate = parsedRate;
      }
      const notes = typeof body.notes === 'string' && body.notes.trim() ? text(body.notes, 300) : null;
      const [updated] = await db
        .update(accountRegistrations)
        .set({
          status: nextStatus,
          commissionRate,
          ...(notes !== null ? { notes } : {}),
          reviewedBy: String(user.email || user.id),
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(accountRegistrations.id, marketerId), eq(accountRegistrations.role, 'marketer')))
        .returning();
      if (!updated) throw new HttpError(404, 'طلب حساب المسوّق غير موجود.');
      return reply({ ok: true, marketer: updated });
    }

    if (body.action === 'update-gateway-request') {
      if (!userIsAdmin) throw new HttpError(403, 'هذا الإجراء لمسؤول المنصة فقط.');
      const requestId = identifier(body.id);
      const newStatus = text(body.status, 20);
      if (!['pending', 'configured', 'rejected'].includes(newStatus)) throw new HttpError(400, 'حالة غير صالحة.');
      const [updated] = await db.update(gatewayRequests).set({
        status: newStatus,
        updatedAt: new Date(),
      }).where(eq(gatewayRequests.id, requestId)).returning();
      if (!updated) throw new HttpError(404, 'طلب الربط غير موجود.');
      return reply({ ok: true });
    }

    if (body.action === 'submit-gateway-request') {
      if (!userIsAdmin) throw new HttpError(403, 'ربط بوابات الدفع يتم من حساب مسؤول المنصة.');
      const targetGateway = text(body.gateway, 30);
      if (!gateways.includes(targetGateway as Gateway) && !targetGateway.startsWith('custom_')) {
        throw new HttpError(400, 'بوابة دفع غير مدعومة.');
      }
      const variables = body.variables;
      if (!variables || typeof variables !== 'object' || Array.isArray(variables)) throw new HttpError(400, 'بيانات الربط غير صحيحة.');

      const sanitizedVariables: Record<string, string> = {};
      for (const [key, value] of Object.entries(variables)) {
        if (typeof key === 'string' && key.length <= 60 && typeof value === 'string' && value.trim().length > 0) {
          sanitizedVariables[key.trim()] = value.trim().slice(0, 500);
        }
      }
      if (Object.keys(sanitizedVariables).length === 0) throw new HttpError(400, 'يرجى إدخال متغير واحد على الأقل للربط.');

      let [adminMerchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
      if (!adminMerchant) {
        [adminMerchant] = await db
          .insert(merchants)
          .values({ ownerId: user.id, name: 'OneShot Platform' })
          .onConflictDoNothing()
          .returning();
        if (!adminMerchant) {
          [adminMerchant] = await db.select().from(merchants).where(eq(merchants.ownerId, user.id));
        }
      }
      const notes = body.notes ? text(body.notes, 500) : null;
      const reqRecord = await db.transaction(async tx => {
        const [created] = await tx.insert(gatewayRequests).values({
          merchantId: adminMerchant.id,
          gateway: targetGateway,
          status: 'pending',
          variables: sanitizedVariables,
          notes,
          submittedBy: user.email || user.id,
        }).returning();
        await captureOperation(tx, { sourceKey: `gateway:${created.id}`, kind: 'gateway_request', subjectId: created.id, merchantId: adminMerchant.id, provider: targetGateway });
        return created;
      });
      return reply({ request: reqRecord }, 201);
    }

    // ===== إجراءات المسوّق المعتمد فقط (منفصلة تماماً عن صلاحيات الإدارة والتاجر) =====
    if (
      body.action === 'create-marketer-campaign' ||
      body.action === 'toggle-marketer-campaign' ||
      body.action === 'delete-marketer-campaign' ||
      body.action === 'update-marketer-profile'
    ) {
      const marketer = await requireApprovedMarketer(user);

      if (body.action === 'create-marketer-campaign') {
        const title = text(body.title, 100);
        const targetProductSku = typeof body.targetProductSku === 'string' && body.targetProductSku.trim()
          ? text(body.targetProductSku, 60)
          : 'ALL';
        const rawUtm = text(body.utmCampaign, 60)
          .replace(/[^a-zA-Z0-9_-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        if (!rawUtm) throw new HttpError(400, 'أدخل معرّف حملة (UTM) صالحاً بالرموز الإنجليزية أو الأرقام.');
        const allowedChannels = ['social', 'google_ads', 'whatsapp', 'content', 'direct'];
        const channel = allowedChannels.includes(String(body.channel)) ? String(body.channel) : 'social';

        const [campaign] = await db
          .insert(marketerCampaigns)
          .values({
            marketerId: marketer.id,
            ownerId: user.id,
            title,
            targetProductSku,
            utmCampaign: rawUtm,
            channel,
          })
          .returning();
        return reply({ campaign }, 201);
      }

      if (body.action === 'toggle-marketer-campaign') {
        if (typeof body.enabled !== 'boolean') throw new HttpError(400, 'إعدادات الحملة غير صالحة.');
        const [updated] = await db
          .update(marketerCampaigns)
          .set({ enabled: body.enabled })
          .where(and(eq(marketerCampaigns.id, identifier(body.id)), eq(marketerCampaigns.ownerId, user.id)))
          .returning();
        if (!updated) throw new HttpError(404, 'الحملة التسويقية غير موجودة.');
        return reply({ ok: true });
      }

      if (body.action === 'delete-marketer-campaign') {
        const [deleted] = await db
          .delete(marketerCampaigns)
          .where(and(eq(marketerCampaigns.id, identifier(body.id)), eq(marketerCampaigns.ownerId, user.id)))
          .returning();
        if (!deleted) throw new HttpError(404, 'الحملة التسويقية غير موجودة.');
        return reply({ ok: true });
      }

      if (body.action === 'update-marketer-profile') {
        const fullName = text(body.fullName, 100);
        const notes = typeof body.notes === 'string' && body.notes.trim() ? text(body.notes, 400) : null;
        const [updated] = await db
          .update(accountRegistrations)
          .set({
            fullName,
            notes,
            updatedAt: new Date(),
          })
          .where(and(eq(accountRegistrations.id, marketer.id), eq(accountRegistrations.ownerId, user.id)))
          .returning();
        return reply({ ok: true, marketerAccount: updated });
      }
    }

    // ===== إجراءات التاجر (يُمنع المسوّقون من تنفيذها) =====
    const [existingReg] = await db
      .select()
      .from(accountRegistrations)
      .where(eq(accountRegistrations.ownerId, user.id));
    if (existingReg && existingReg.role !== 'merchant' && !userIsAdmin) {
      throw new HttpError(403, 'هذا الإجراء مخصص لحسابات التجار فقط ولا يتوفر لحسابات المسوّقين.');
    }

    const merchant = await tenant();
    if (body.action === 'create-open-link') {
      if (!policy.requestsEnabled || !policy.openLinksEnabled || !policy.paymentsEnabled) throw new HttpError(409, 'هذه الميزة متوقفة بواسطة مسؤول المنصة.');
      const minimum = cents(body.minimum);
      const maximum = cents(body.maximum);
      if (maximum < minimum) throw new HttpError(400, 'الحد الأعلى أقل من الحد الأدنى.');
      if (!Array.isArray(body.allowedMethods) || !body.allowedMethods.length || body.allowedMethods.length > 16) throw new HttpError(400, 'اختر طريقة دفع متاحة.');
      const linkAvailable = Object.fromEntries(gateways.map(gateway => [gateway, enabledCapabilities(merchant.id, gateway, policy)])) as Record<Gateway, Record<string, boolean>>;
      const selected = [...new Set(body.allowedMethods)].map(value => {
        if (typeof value !== 'string') throw new HttpError(400, 'اختر طريقة دفع متاحة.');
        const [gateway, method, extra] = value.split(':');
        if (!gateways.includes(gateway as Gateway) || extra || !openLinkMethods.includes(method as typeof openLinkMethods[number]) || !linkAvailable[gateway as Gateway][method]) throw new HttpError(409, 'طريقة الدفع غير مهيأة لهذا التاجر.');
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
      const selectedGateway: Gateway = gateways.includes(body.gateway as Gateway) ? body.gateway as Gateway : 'paytabs';
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
