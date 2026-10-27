// netlify/functions/super-admin.mts
// لوحة التحكم المركزية (Super-Admin Command Center) — مسار واحد للقراءة والكتابة.
// الحماية: صلاحية المالك فقط (isAdmin) + أصل الطلب + حد معدل الطلبات + تحقق النسخة.

import { and, desc, eq, sql } from 'drizzle-orm';
import { getUser, type User } from '@netlify/identity';
import { database } from '../../db/index.js';
import {
  adminConfig, aiEntitlements, aiStaffGrants, aiUsage, betaFeedback, clientContexts, merchants,
} from '../../db/schema.js';
import { failure, HttpError, isAdmin, jsonBody, owner, reply, sameOrigin, throttle } from '../lib/platform.js';
import { grantStaff, grantTier, revokeStaff } from '../lib/ai-license.js';
import {
  defaultSuperAdminConfig, SUBDOMAINS, APP_STATUSES, type AdminUserRow, type ClientContext,
  type FeedbackRow, type ProviderHealth, type SuperAdminConfig, type SubdomainId, type AppStatus,
} from '../../shared/superadmin.js';
import { isStaffTier } from '../../shared/ai-tiers.js';

type AdminConfigRow = typeof adminConfig.$inferSelect;

const CONFIG_ID = 'global';
const TIERS = ['tier-1', 'tier-2', 'tier-3', 'tier-x'] as const;

function normalizeConfig(input: unknown): SuperAdminConfig {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'إعدادات غير صالحة.');
  const src = input as Partial<SuperAdminConfig>;
  const base = defaultSuperAdminConfig;
  const out: SuperAdminConfig = {
    commercial: typeof src.commercial === 'boolean' ? src.commercial : base.commercial,
    subdomains: { ...base.subdomains },
    banner: { ...base.banner },
    tools: { ...base.tools },
    providers: { ...base.providers },
    modelRouting: {
      autoRouter: typeof src.modelRouting?.autoRouter === 'boolean' ? src.modelRouting.autoRouter : base.modelRouting.autoRouter,
      bindings: { ...base.modelRouting.bindings },
    },
    fairUse: { ...base.fairUse },
    plans: Array.isArray(src.plans) ? src.plans : base.plans,
    coupons: Array.isArray(src.coupons) ? src.coupons : base.coupons,
  };
  if (src.subdomains && typeof src.subdomains === 'object') {
    for (const sub of SUBDOMAINS) {
      const value = (src.subdomains as Record<string, unknown>)[sub.id];
      if (value && typeof value === 'object' && APP_STATUSES.some(s => s.id === (value as { status?: unknown }).status)) {
        out.subdomains[sub.id] = { status: (value as { status: AppStatus }).status };
      }
    }
  }
  if (src.banner && typeof src.banner === 'object') {
    const b = src.banner as Partial<SuperAdminConfig['banner']>;
    out.banner = {
      enabled: typeof b.enabled === 'boolean' ? b.enabled : base.banner.enabled,
      textAr: typeof b.textAr === 'string' ? b.textAr : base.banner.textAr,
      textEn: typeof b.textEn === 'string' ? b.textEn : base.banner.textEn,
      background: typeof b.background === 'string' ? b.background : base.banner.background,
      foreground: typeof b.foreground === 'string' ? b.foreground : base.banner.foreground,
      badges: Array.isArray(b.badges) ? b.badges.filter((x): x is string => typeof x === 'string') : base.banner.badges,
    };
  }
  if (src.tools && typeof src.tools === 'object') {
    for (const key of Object.keys(base.tools) as (keyof SuperAdminConfig['tools'])[]) {
      const v = (src.tools as unknown as Record<string, unknown>)[key];
      if (typeof v === 'boolean') out.tools[key] = v;
    }
  }
  if (src.providers && typeof src.providers === 'object') {
    for (const key of Object.keys(base.providers) as (keyof SuperAdminConfig['providers'])[]) {
      const v = (src.providers as Record<string, unknown>)[key];
      if (v && typeof v === 'object') {
        const p = v as { enabled?: unknown; endpoint?: unknown; envKey?: unknown };
        out.providers[key] = {
          enabled: typeof p.enabled === 'boolean' ? p.enabled : base.providers[key].enabled,
          endpoint: typeof p.endpoint === 'string' ? p.endpoint : base.providers[key].endpoint,
          envKey: typeof p.envKey === 'string' ? p.envKey : base.providers[key].envKey,
        };
      }
    }
  }
  if (src.modelRouting?.bindings && typeof src.modelRouting.bindings === 'object') {
    for (const tier of TIERS) {
      const v = (src.modelRouting.bindings as Record<string, unknown>)[tier];
      if (v && typeof v === 'object') {
        const m = v as { provider?: unknown; model?: unknown };
        const provider = m.provider;
        const model = m.model;
        if ((provider === 'auto' || ['gemini', 'vps', 'ollama-cloud', 'openai', 'nous'].includes(provider as string)) && typeof model === 'string') {
          out.modelRouting.bindings[tier] = { provider: provider as SuperAdminConfig['modelRouting']['bindings'][typeof tier]['provider'], model };
        }
      }
    }
  }
  if (src.fairUse && typeof src.fairUse === 'object') {
    const f = src.fairUse as { enabled?: unknown; dailyQuestions?: unknown };
    if (typeof f.enabled === 'boolean') out.fairUse.enabled = f.enabled;
    if (typeof f.dailyQuestions === 'number' && Number.isInteger(f.dailyQuestions) && f.dailyQuestions > 0 && f.dailyQuestions <= 100000) out.fairUse.dailyQuestions = f.dailyQuestions;
  }
  return out;
}

async function readConfig(): Promise<{ config: SuperAdminConfig; version: number }> {
  const [row] = await database().select().from(adminConfig).where(eq(adminConfig.id, CONFIG_ID)).limit(1);
  if (!row) return { config: defaultSuperAdminConfig, version: 0 };
  let parsed: SuperAdminConfig;
  try { parsed = normalizeConfig(row.config); } catch { parsed = defaultSuperAdminConfig; }
  return { config: parsed, version: row.version };
}

async function writeConfig(actor: User, config: SuperAdminConfig, version: number): Promise<number> {
  const db = database();
  const result = await db.transaction(async (tx: any) => {
    const values = { config, updatedBy: actor.id, updatedAt: new Date(), version: version + 1 };
    let updated: AdminConfigRow[];
    if (version === 0) {
      updated = await tx.insert(adminConfig).values({ id: CONFIG_ID, ...values }).onConflictDoNothing().returning();
      if (!updated.length) {
        const [existing] = await tx.select().from(adminConfig).where(eq(adminConfig.id, CONFIG_ID));
        return existing.version;
      }
    } else {
      updated = await tx.update(adminConfig).set(values).where(and(eq(adminConfig.id, CONFIG_ID), eq(adminConfig.version, version))).returning();
      if (!updated.length) throw new HttpError(409, 'تغيرت الإعدادات. حدّث الصفحة قبل الحفظ.');
    }
    return updated[0].version;
  });
  return result;
}

async function listUsers(): Promise<AdminUserRow[]> {
  const db = database();
  const merchantsRows = (await db.select().from(merchants)) as unknown as (typeof merchants.$inferSelect)[];
  const entitlements = (await db.select().from(aiEntitlements)) as unknown as (typeof aiEntitlements.$inferSelect)[];
  const grants = (await db.select().from(aiStaffGrants)) as unknown as (typeof aiStaffGrants.$inferSelect)[];
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const usage = (await db.select({
    ownerId: aiUsage.ownerId,
    today: sql<number>`count(*) filter (where ${aiUsage.createdAt} >= ${dayStart})`.mapWith(Number),
    total: sql<number>`count(*)`.mapWith(Number),
  }).from(aiUsage).groupBy(aiUsage.ownerId)) as unknown as { ownerId: string; today: number; total: number }[];

  const byOwner = new Map(merchantsRows.map(m => [m.ownerId, m]));
  const entMap = new Map(entitlements.map(e => [e.ownerId, e]));
  const staffMap = new Map<string, string[]>();
  for (const g of grants) staffMap.set(g.ownerId, [...(staffMap.get(g.ownerId) ?? []), g.staffId]);
  const usageMap = new Map(usage.map(u => [u.ownerId, u]));

  // كل معرف هوية Netlify ظهر في أي سجل (تجار + تراخيص + كوادر).
  const ownerIds = new Set<string>([...byOwner.keys(), ...entMap.keys(), ...staffMap.keys()]);
  const rows: AdminUserRow[] = [];
  for (const id of ownerIds) {
    const merchant = byOwner.get(id);
    const ent = entMap.get(id);
    const staff = staffMap.get(id) ?? [];
    const u = usageMap.get(id);
    rows.push({
      id,
      email: '',
      name: merchant?.name ?? id.slice(0, 8),
      merchantId: merchant?.id ?? null,
      tier: ent?.tier ?? 'tier-1',
      tierX: ent?.tierX === true,
      staff,
      banned: ent?.bannedAt != null,
      createdAt: merchant?.createdAt?.toISOString?.() ?? '',
      usageToday: u?.today ?? 0,
      usageTotal: u?.total ?? 0,
    });
  }
  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return rows;
}

async function listFeedback(): Promise<FeedbackRow[]> {
  const rows = (await database().select().from(betaFeedback).orderBy(desc(betaFeedback.createdAt)).limit(200)) as unknown as (typeof betaFeedback.$inferSelect)[];
  return rows.map(r => ({
    id: r.id,
    userId: r.userId,
    category: r.category as FeedbackRow['category'],
    page: r.page,
    modelId: r.modelId,
    message: r.message,
    rewarded: r.rewarded,
    createdAt: r.createdAt.toISOString(),
  }));
}

async function listClients(): Promise<ClientContext[]> {
  const rows = (await database().select().from(clientContexts).orderBy(desc(clientContexts.createdAt))) as unknown as (typeof clientContexts.$inferSelect)[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    nameEn: r.nameEn,
    title: r.title,
    guardrails: r.guardrails ?? [],
    projects: r.projects ?? [],
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

async function probe(url: string, headers: Record<string, string> = {}, timeoutMs = 4000): Promise<{ ok: boolean; latency: number; status: number }> {
  const start = Date.now();
  try {
    const res = await fetch(url, { method: 'GET', headers, signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
    return { ok: res.ok, latency: Date.now() - start, status: res.status };
  } catch {
    return { ok: false, latency: Date.now() - start, status: 0 };
  }
}

async function providersHealth(config: SuperAdminConfig): Promise<ProviderHealth[]> {
  const labels: Record<string, string> = { gemini: 'Google Gemini', vps: 'سيرفر VPS الخاص', 'ollama-cloud': 'Ollama Cloud', openai: 'OpenAI', nous: 'Nous Portal' };
  const results: ProviderHealth[] = [];
  for (const id of Object.keys(config.providers) as (keyof SuperAdminConfig['providers'])[]) {
    const p = config.providers[id];
    const keySet = Boolean(p.envKey && process.env[p.envKey]);
    if (!p.enabled) {
      results.push({ id, label: labels[id], configured: keySet, status: 'disabled', latencyMs: null, detail: 'معطّل من اللوحة.' });
      continue;
    }
    if (id === 'vps') {
      const base = (process.env.ONESHOT_VPS_AGENT_URL_TLS || process.env.ONESHOT_VPS_AGENT_URL || p.endpoint || '').trim().replace(/\/$/, '');
      if (!/^https:\/\//.test(base)) {
        results.push({ id, label: labels[id], configured: keySet, status: 'error', latencyMs: null, detail: 'لا يوجد رابط https للبوابة.' });
        continue;
      }
      const r = await probe(`${base}/health`);
      results.push({ id, label: labels[id], configured: keySet, status: r.ok ? 'ok' : 'error', latencyMs: r.latency, detail: r.ok ? `مستجيب (HTTP ${r.status})` : `تعذر الوصول (HTTP ${r.status || 'لا استجابة'})` });
    } else if (id === 'ollama-cloud') {
      const r = await probe('https://ollama.com/api/tags');
      results.push({ id, label: labels[id], configured: keySet, status: r.ok ? 'ok' : 'error', latencyMs: r.latency, detail: r.ok ? `الكتالوج متاح (HTTP ${r.status})` : `تعذر الوصول (HTTP ${r.status || 'لا استجابة'})` });
    } else {
      // Gemini/OpenAI/Nous: لا نستدعي المفتاح من السيرفر — نُبلغ بحالة التهيئة فقط.
      results.push({ id, label: labels[id], configured: keySet, status: keySet ? 'ok' : 'error', latencyMs: null, detail: keySet ? 'المفتاح مُهيّأ في متغيرات البيئة.' : 'المفتاح غير مُهيّأ (مفقود من متغيرات البيئة).' });
    }
  }
  return results;
}

export default async (req: Request) => {
  try {
    const user = await owner();
    if (!isAdmin(user)) throw new HttpError(403, 'هذه اللوحة لمالك المنصة فقط.');

    if (req.method === 'GET') {
      const { config, version } = await readConfig();
      const [users, feedback, clients, providers] = await Promise.all([listUsers(), listFeedback(), listClients(), providersHealth(config)]);
      return reply({ config, version, users, feedback, clients, providers });
    }

    if (req.method !== 'POST') return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    sameOrigin(req);
    await throttle(`super-admin:${user.id}`, 120);

    const body = await jsonBody(req);
    const action = typeof body.action === 'string' ? body.action : '';

    // ===== إجراءات لا تعدّل الإعدادات (مباشرة على الجداول) =====
    if (action === 'grant-tier') {
      const userId = typeof body.userId === 'string' ? body.userId : '';
      const tier = body.tier;
      if (!userId || !isStaffTier(tier)) throw new HttpError(400, 'بيانات المنحة غير صالحة.');
      await grantTier({ ownerId: userId, tier, tierX: body.tierX === true, actor: user.id, note: typeof body.note === 'string' ? body.note : 'منحة إدارية من اللوحة المركزية' });
      return reply({ ok: true });
    }
    if (action === 'grant-staff') {
      const userId = typeof body.userId === 'string' ? body.userId : '';
      const staffId = typeof body.staffId === 'string' ? body.staffId : '';
      if (!userId || !staffId) throw new HttpError(400, 'بيانات الكادر غير صالحة.');
      await grantStaff({ ownerId: userId, staffId, actor: user.id });
      return reply({ ok: true });
    }
    if (action === 'revoke-staff') {
      const userId = typeof body.userId === 'string' ? body.userId : '';
      const staffId = typeof body.staffId === 'string' ? body.staffId : '';
      if (!userId || !staffId) throw new HttpError(400, 'بيانات الكادر غير صالحة.');
      await revokeStaff({ ownerId: userId, staffId });
      return reply({ ok: true });
    }
    if (action === 'ban-user' || action === 'unban-user') {
      const userId = typeof body.userId === 'string' ? body.userId : '';
      if (!userId) throw new HttpError(400, 'بيانات المستخدم غير صالحة.');
      await database().insert(aiEntitlements).values({
        ownerId: userId,
        tier: 'tier-1',
        tierX: false,
        grantedBy: user.id,
        note: action === 'ban-user' ? 'محظور من اللوحة المركزية' : 'أُعيد التفعيل',
        bannedAt: action === 'ban-user' ? new Date() : null,
        updatedAt: new Date(),
      }).onConflictDoUpdate({ target: aiEntitlements.ownerId, set: { tier: 'tier-1', tierX: false, grantedBy: user.id, note: action === 'ban-user' ? 'محظور من اللوحة المركزية' : 'أُعيد التفعيل', bannedAt: action === 'ban-user' ? new Date() : null, updatedAt: new Date() } });
      return reply({ ok: true });
    }
    if (action === 'feedback-reward') {
      const feedbackId = typeof body.feedbackId === 'string' ? body.feedbackId : '';
      if (!feedbackId) throw new HttpError(400, 'بيانات البلاغ غير صالحة.');
      const [fb] = await database().update(betaFeedback).set({ rewarded: true }).where(eq(betaFeedback.id, feedbackId)).returning();
      if (!fb) throw new HttpError(404, 'البلاغ غير موجود.');
      // المكافأة: منحة طبقة ثانية مجانية للمتعاون (ترقى لاحقاً لإرسال إيميل شكر).
      await grantTier({ ownerId: fb.userId, tier: 'tier-2', actor: user.id, note: 'مكافأة تعاون (بلاغ/اقتراح)' });
      return reply({ ok: true, email: fb.userId });
    }
    if (action === 'save-client') {
      const client = body.client;
      if (!client || typeof client !== 'object') throw new HttpError(400, 'بيانات العميل غير صالحة.');
      const c = client as Partial<ClientContext>;
      const name = typeof c.name === 'string' ? c.name.trim() : '';
      if (!name) throw new HttpError(400, 'اسم العميل مطلوب.');
      const values = {
        name,
        nameEn: typeof c.nameEn === 'string' ? c.nameEn : '',
        title: typeof c.title === 'string' ? c.title : '',
        guardrails: Array.isArray(c.guardrails) ? c.guardrails.filter((x): x is string => typeof x === 'string') : [],
        projects: Array.isArray(c.projects) ? c.projects.filter((x): x is string => typeof x === 'string') : [],
        updatedAt: new Date(),
      };
      if (typeof c.id === 'string' && c.id) {
        await database().update(clientContexts).set(values).where(eq(clientContexts.id, c.id));
      } else {
        await database().insert(clientContexts).values(values);
      }
      return reply({ ok: true });
    }
    if (action === 'delete-client') {
      const id = typeof body.id === 'string' ? body.id : '';
      if (!id) throw new HttpError(400, 'معرّف العميل غير صالح.');
      await database().delete(clientContexts).where(eq(clientContexts.id, id));
      return reply({ ok: true });
    }

    // ===== الإجراءات التي تعدّل الإعدادات =====
    const { config, version } = await readConfig();
    const saveVersion = Number.isInteger(body.version) ? Number(body.version) : version;
    if (saveVersion !== version) throw new HttpError(409, 'تغيرت الإعدادات. حدّث الصفحة قبل الحفظ.');

    let next = config;
    if (action === 'save-config') {
      next = normalizeConfig(body.config);
    } else if (action === 'set-subdomain') {
      const id = body.id as SubdomainId;
      const status = body.status;
      if (!SUBDOMAINS.some(s => s.id === id) || !APP_STATUSES.some(s => s.id === status)) throw new HttpError(400, 'حالة التطبيق غير صالحة.');
      next = { ...config, subdomains: { ...config.subdomains, [id]: { status } } };
    } else if (action === 'toggle-banner') {
      const enabled = body.enabled === true;
      const banner = typeof body.banner === 'object' && body.banner ? normalizeConfig({ ...defaultSuperAdminConfig, banner: body.banner }).banner : config.banner;
      next = { ...config, banner: { ...banner, enabled } };
    } else if (action === 'toggle-tool') {
      const tool = body.tool as keyof SuperAdminConfig['tools'];
      if (!(tool in config.tools)) throw new HttpError(400, 'الأداة غير معروفة.');
      next = { ...config, tools: { ...config.tools, [tool]: body.enabled === true } };
    } else if (action === 'set-binding') {
      const tier = body.tier as keyof SuperAdminConfig['modelRouting']['bindings'];
      const provider = typeof body.provider === 'string' ? body.provider : '';
      const model = body.model;
      if (!TIERS.includes(tier) || (provider !== 'auto' && !['gemini', 'vps', 'ollama-cloud', 'openai', 'nous'].includes(provider)) || typeof model !== 'string' || !model.trim()) throw new HttpError(400, 'ربط النموذج غير صالح.');
      next = { ...config, modelRouting: { ...config.modelRouting, bindings: { ...config.modelRouting.bindings, [tier]: { provider, model } } } };
    } else if (action === 'set-auto-router') {
      next = { ...config, modelRouting: { ...config.modelRouting, autoRouter: body.enabled === true } };
    } else if (action === 'set-commercial') {
      next = { ...config, commercial: body.enabled === true };
    } else if (action === 'set-fair-use') {
      const dailyQuestions = Number(body.dailyQuestions);
      if (typeof body.enabled !== 'boolean' || !Number.isInteger(dailyQuestions) || dailyQuestions < 1 || dailyQuestions > 100000) throw new HttpError(400, 'حد الاستخدام غير صالح.');
      next = { ...config, fairUse: { enabled: body.enabled, dailyQuestions } };
    } else if (action === 'set-provider') {
      const id = body.id as keyof SuperAdminConfig['providers'];
      if (!(id in config.providers)) throw new HttpError(400, 'المزوّد غير معروف.');
      next = { ...config, providers: { ...config.providers, [id]: { ...config.providers[id], enabled: body.enabled === true } } };
    } else if (action === 'save-plan') {
      const plan = body.plan;
      if (!plan || typeof plan !== 'object') throw new HttpError(400, 'بيانات الباقة غير صالحة.');
      const p = plan as { id?: unknown; nameAr?: unknown; nameEn?: unknown; priceSar?: unknown; features?: unknown };
      const id = typeof p.id === 'string' ? p.id.trim() : '';
      const nameAr = typeof p.nameAr === 'string' ? p.nameAr.trim() : '';
      const priceSar = Number(p.priceSar);
      if (!id || !nameAr || !Number.isFinite(priceSar) || priceSar < 0) throw new HttpError(400, 'بيانات الباقة غير صالحة.');
      const features = Array.isArray(p.features) ? p.features.filter((x): x is string => typeof x === 'string') : [];
      const plans = config.plans.filter(pl => pl.id !== id);
      next = { ...config, plans: [...plans, { id, nameAr, nameEn: typeof p.nameEn === 'string' ? p.nameEn : '', priceSar, features }] };
    } else if (action === 'delete-plan') {
      const id = typeof body.id === 'string' ? body.id : '';
      next = { ...config, plans: config.plans.filter(pl => pl.id !== id) };
    } else if (action === 'save-coupon') {
      const coupon = body.coupon;
      if (!coupon || typeof coupon !== 'object') throw new HttpError(400, 'بيانات الكوبون غير صالحة.');
      const c = coupon as { code?: unknown; percent?: unknown; active?: unknown };
      const code = typeof c.code === 'string' ? c.code.trim().toUpperCase() : '';
      const percent = Number(c.percent);
      if (!code || !Number.isFinite(percent) || percent <= 0 || percent > 100) throw new HttpError(400, 'بيانات الكوبون غير صالحة.');
      const coupons = config.coupons.filter(x => x.code !== code);
      next = { ...config, coupons: [...coupons, { code, percent, active: c.active !== false }] };
    } else if (action === 'delete-coupon') {
      const code = typeof body.code === 'string' ? body.code : '';
      next = { ...config, coupons: config.coupons.filter(x => x.code !== code) };
    } else {
      throw new HttpError(400, 'إجراء غير معروف.');
    }

    const newVersion = await writeConfig(user, next, version);
    return reply({ ok: true, version: newVersion, config: next });
  } catch (error) {
    return failure(error);
  }
};
