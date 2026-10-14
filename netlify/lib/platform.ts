import { getUser, type User } from '@netlify/identity';
import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { merchants, rateLimits } from '../../db/schema.js';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

export function failure(error: unknown) {
  return error instanceof HttpError
    ? reply({ error: error.message }, error.status)
    : reply({ error: 'تعذر إتمام الطلب. تحقق من إعدادات المنصة أو حاول لاحقاً.' }, 503);
}

export function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  if (!origin || origin !== new URL(req.url).origin) throw new HttpError(403, 'مصدر الطلب غير مسموح.');
}

export async function jsonBody(req: Request): Promise<Record<string, unknown>> {
  if (!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'صيغة الطلب غير مدعومة.');
  const raw = await req.text();
  if (raw.length > 16000) throw new HttpError(413, 'الطلب أكبر من الحد المسموح.');
  let body: unknown;
  try { body = JSON.parse(raw); } catch { throw new HttpError(400, 'صيغة الطلب غير صالحة.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'بيانات الطلب غير صالحة.');
  return body as Record<string, unknown>;
}

export function text(value: unknown, max = 150) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpError(400, 'أكمل الحقول المطلوبة بالقيم الصحيحة.');
  return value.trim();
}

export function identifier(value: unknown) {
  const result = text(value, 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(result)) throw new HttpError(400, 'معرّف غير صالح.');
  return result;
}

export function cents(value: unknown) {
  if ((typeof value !== 'string' && typeof value !== 'number') || !/^\d{1,7}(\.\d{1,2})?$/.test(String(value))) throw new HttpError(400, 'أدخل مبلغاً صالحاً بمنزلتين عشريتين كحد أقصى.');
  const result = Math.round(Number(value) * 100);
  if (result < 100 || result > 999999999) throw new HttpError(400, 'المبلغ خارج النطاق المسموح.');
  return result;
}

export async function owner() {
  const user = await getUser();
  if (!user) throw new HttpError(401, 'سجّل الدخول للمتابعة.');
  return user;
}

export function isAdmin(user: User) {
  if (Array.isArray(user.appMetadata?.roles) && user.appMetadata.roles.includes('admin')) return true;
  const allowed = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((value: string) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(String(user.email || '').trim().toLowerCase());
}

export function email(value: unknown) {
  const result = text(value, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new HttpError(400, 'البريد الإلكتروني غير صالح.');
  return result;
}

export async function tenant() {
  const user = await owner();
  const [merchant] = await database().select().from(merchants).where(eq(merchants.ownerId, user.id));
  if (!merchant) throw new HttpError(409, 'أنشئ مساحة التاجر أولاً.');
  return merchant;
}

export function credentialPrefix(merchantId: string) {
  return `PAYTABS_${merchantId.replaceAll('-', '').toUpperCase()}`;
}

export function gateway(merchantId: string) {
  const prefix = credentialPrefix(merchantId);
  const key = process.env[`${prefix}_SERVER_KEY`];
  const profile = process.env[`${prefix}_PROFILE_ID`];
  const base = process.env[`${prefix}_API_BASE_URL`];
  const allowedHosts = ['secure.paytabs.sa', 'secure.paytabs.com', 'secure-egypt.paytabs.com', 'secure-oman.paytabs.com', 'secure-jordan.paytabs.com', 'secure-kuwait.paytabs.com', 'secure-iraq.paytabs.com', 'secure-morocco.paytabs.com', 'secure-doha.paytabs.com', 'secure-global.paytabs.com'];
  if (!key || !profile || !/^\d+$/.test(profile) || !Number.isSafeInteger(Number(profile)) || Number(profile) <= 0 || !base) throw new HttpError(409, 'يتطلب حساب هذا التاجر ربط بيانات PayTabs في إعدادات Netlify بواسطة مسؤول المنصة.');
  let url: URL;
  try { url = new URL(base); } catch { throw new HttpError(409, 'عنوان بوابة التاجر غير صالح.'); }
  if (url.protocol !== 'https:' || !allowedHosts.includes(url.hostname) || url.port || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new HttpError(409, 'عنوان بوابة التاجر غير صالح.');
  return { key, profile: Number(profile), base: url.origin, prefix };
}

export function capabilities(merchantId: string) {
  try {
    const { prefix } = gateway(merchantId);
    const managed = process.env[`${prefix}_MANAGED_ENABLED`] === 'true' && !!process.env[`${prefix}_CLIENT_KEY`];
    const own = process.env[`${prefix}_OWN_ENABLED`] === 'true';
    const recurring = process.env[`${prefix}_RECURRING_ENABLED`] === 'true' && /^[a-f0-9]{64}$/i.test(process.env.PAYMENT_TOKEN_ENCRYPTION_KEY || '');
    return { connected: true, hosted: true, framed: true, mobile: true, mada_applepay: true, paylink: true, invoice: true, managed, own, recurring };
  } catch { return { connected: false, hosted: false, framed: false, mobile: false, mada_applepay: false, paylink: false, invoice: false, managed: false, own: false, recurring: false }; }
}

export async function paytabs(merchantId: string, path: string, payload: Record<string, unknown>, timeoutMs = 20000) {
  const config = gateway(merchantId);
  let response: Response;
  try {
    response = await fetch(`${config.base}${path}`, { method: 'POST', headers: { Authorization: config.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, profile_id: config.profile }), redirect: 'error', signal: AbortSignal.timeout(timeoutMs) });
  } catch { throw new HttpError(502, 'تعذر الاتصال ببوابة الدفع. لا تكرر العملية قبل التحقق من حالتها.'); }
  if (!response.ok) throw new HttpError(502, 'رفضت بوابة الدفع الطلب. راجع إعدادات حساب التاجر.');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || Array.isArray(result) || 'error' in result) throw new HttpError(502, 'تعذر تنفيذ الطلب في بوابة الدفع.');
  const serialized = JSON.stringify(result);
  if (serialized.includes(config.key) || serialized.includes(encodeURIComponent(config.key))) throw new HttpError(502, 'استجابة البوابة غير صالحة.');
  return result as Record<string, unknown>;
}

export function safeGatewayUrl(value: unknown, merchantId: string) {
  if (typeof value !== 'string') throw new HttpError(502, 'لم تُرجع البوابة رابطاً صالحاً.');
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(502, 'رابط البوابة غير صالح.'); }
  const config = gateway(merchantId);
  if (url.origin !== config.base || url.username || url.password || value.includes(config.key) || value.includes(encodeURIComponent(config.key))) throw new HttpError(502, 'رابط البوابة غير صالح.');
  return url.href;
}

export async function throttle(identity: string, limit = 25) {
  const bucket = Math.floor(Date.now() / 3600000);
  const key = createHash('sha256').update(`${identity}:${bucket}`).digest('hex');
  const [record] = await database().insert(rateLimits).values({ key, expiresAt: new Date((bucket + 2) * 3600000) }).onConflictDoUpdate({ target: rateLimits.key, set: { count: sql`${rateLimits.count} + 1` } }).returning();
  if (record.count > limit) throw new HttpError(429, 'وصلت إلى الحد المسموح للمحاولات. حاول لاحقاً.');
}

export function encryptToken(token: string) {
  const key = process.env.PAYMENT_TOKEN_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new HttpError(409, 'تشفير الاشتراكات غير مهيأ.');
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), nonce);
  const data = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [nonce, cipher.getAuthTag(), data].map(value => value.toString('base64')).join('.');
}

export function decryptToken(value: string) {
  const key = process.env.PAYMENT_TOKEN_ENCRYPTION_KEY;
  if (!key || !/^[a-f0-9]{64}$/i.test(key)) throw new HttpError(409, 'تشفير الاشتراكات غير مهيأ.');
  const [nonce, tag, data] = value.split('.').map(part => Buffer.from(part, 'base64'));
  const cipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), nonce);
  cipher.setAuthTag(tag);
  return Buffer.concat([cipher.update(data), cipher.final()]).toString('utf8');
}

export function nextDate(from: Date, interval: string) {
  const result = new Date(from);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + (interval === 'yearly' ? 12 : 1));
  const last = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, last));
  return result;
}
