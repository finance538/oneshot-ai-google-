import { HttpError } from './platform.js';

// N-Genius KSA (Network International) — hosted payment page.
//
// Credentials are read from the environment only, exactly like PayTabs/Telr:
//   NGENIUS_<MERCHANT_ID>_API_KEY / _OUTLET   → this merchant's own account
//   NG_API_KEY / NG_OUTLET                    → the platform account fallback
// Never log, echo or return a key: the access token is derived from it and only
// the temporary bearer token travels onward.

export const ngeniusIdentity = 'https://api-gateway.ksa.ngenius-payments.com';
export const ngeniusPaypage = 'https://paypage.ksa.ngenius-payments.com';

// The gateway rejects requests that do not look like a browser.
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
  'Accept-Language': 'ar-SA,ar;q=0.9,en;q=0.8',
};

const keyPattern = /^[A-Za-z0-9+/=_-]{40,200}$/;
const outletPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export function ngeniusPrefix(merchantId: string) {
  return `NGENIUS_${merchantId.replaceAll('-', '').toUpperCase()}`;
}

export function ngeniusConfig(merchantId: string) {
  const own = ngeniusPrefix(merchantId);
  const useOwn = !!(process.env[`${own}_API_KEY`] && process.env[`${own}_OUTLET`]);
  const prefix = useOwn ? own : 'NG';
  const key = process.env[`${prefix}_API_KEY`];
  const outlet = process.env[`${prefix}_OUTLET`];
  if (!key || !outlet) throw new HttpError(409, 'حساب N-Genius غير مهيأ لهذا التاجر.');
  if (!keyPattern.test(key)) throw new HttpError(409, 'مفتاح بوابة N-Genius غير صالح.');
  if (!outletPattern.test(outlet)) throw new HttpError(409, 'معرّف منفذ N-Genius غير صالح.');
  return { key, outlet, test: process.env[`${prefix}_TEST_MODE`] === 'true', platform: !useOwn };
}

export function ngeniusCapabilities(merchantId: string) {
  // The hosted payment page is the only server-side integration we run, and it is the
  // same page for desktop and mobile. The KSA outlet takes Mada + Apple Pay on that page.
  // Every other method (embedded iframe, direct API, tokenisation, Pay by Link, invoices,
  // store plugins) is catalog-only until its code is actually written.
  try { return { connected: true, hosted: true, framed: false, mobile: true, mada_applepay: true, paylink: false, invoice: false, managed: false, own: false, recurring: false, platform: ngeniusConfig(merchantId).platform }; }
  catch { return { connected: false, hosted: false, framed: false, mobile: false, mada_applepay: false, paylink: false, invoice: false, managed: false, own: false, recurring: false, platform: false }; }
}

async function accessToken(key: string) {
  const response = await fetch(`${ngeniusIdentity}/identity/auth/access-token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${key}`, 'Content-Type': 'application/vnd.ni-identity.v1+json', Accept: 'application/vnd.ni-identity.v1+json', ...browserHeaders },
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new HttpError(502, `تعذر الاتصال ببوابة N-Genius (رمز ${response.status}). تحقق من حالة الدفع قبل التكرار.`);
  const result: unknown = await response.json();
  const token = result && typeof result === 'object' && !Array.isArray(result) ? (result as Record<string, unknown>).access_token : undefined;
  if (typeof token !== 'string') throw new HttpError(502, 'لم يصل رمز الوصول من N-Genius.');
  return token;
}

export function ngeniusUrl(value: unknown, merchantId: string) {
  const { key } = ngeniusConfig(merchantId);
  if (typeof value !== 'string') throw new HttpError(502, 'لم يصل رابط الدفع من N-Genius.');
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(502, 'رابط N-Genius غير صالح.'); }
  if (url.protocol !== 'https:' || url.hostname !== new URL(ngeniusPaypage).hostname || url.username || url.password) throw new HttpError(502, 'رابط N-Genius غير صالح.');
  if (value.includes(key) || value.includes(encodeURIComponent(key))) throw new HttpError(502, 'رابط N-Genius غير صالح.');
  return url.href;
}

function orderReference(description: string) {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  const slug = description.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 20);
  return `OS-${stamp}${slug ? `-${slug}` : ''}`.slice(0, 37);
}

// Creates a PURCHASE order: a successful authorisation is captured immediately,
// which is what a wallet top-up or a site payment needs.
export async function ngeniusCreateOrder(merchantId: string, input: { amount: number; description: string; email?: string; origin: string; documentId: string }) {
  const config = ngeniusConfig(merchantId);
  const token = await accessToken(config.key);
  const returnUrl = `${input.origin}/.netlify/functions/payment-return?id=${input.documentId}`;
  const response = await fetch(`${ngeniusIdentity}/transactions/outlets/${config.outlet}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/vnd.ni-payment.v2+json', Accept: 'application/vnd.ni-payment.v2+json', ...browserHeaders },
    body: JSON.stringify({
      action: 'PURCHASE',
      amount: { currencyCode: 'SAR', value: input.amount },
      merchantOrderReference: orderReference(input.description),
      ...(input.email ? { emailAddress: input.email } : {}),
      merchantAttributes: { redirectUrl: returnUrl, cancelUrl: returnUrl, skipConfirmationPage: true },
    }),
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    const reason = (() => { try { const parsed = JSON.parse(detail) as { errors?: Array<{ code?: string; message?: string }> }; const first = parsed?.errors?.[0]; return [first?.code, first?.message].filter(Boolean).join(' ').slice(0, 160); } catch { return ''; } })();
    throw new HttpError(502, `تعذر إنشاء جلسة الدفع في N-Genius (رمز ${response.status}${reason ? ` — ${reason}` : ''}).`);
  }
  const order: unknown = await response.json();
  if (!order || typeof order !== 'object' || Array.isArray(order)) throw new HttpError(502, 'لم تصل بيانات جلسة الدفع.');
  const record = order as Record<string, unknown>;
  const links = (record._links || {}) as Record<string, { href?: string }>;
  const reference = typeof record.reference === 'string' ? record.reference : null;
  if (!reference) throw new HttpError(502, 'لم يصل مرجع العملية من N-Genius.');
  return { reference, url: ngeniusUrl(links.payment?.href, merchantId) };
}

// Reads the order back from the gateway. The order reference is the only input,
// so a browser return can never be trusted on its own.
export async function ngeniusOrder(merchantId: string, reference: string) {
  if (!outletPattern.test(reference)) throw new HttpError(409, 'مرجع N-Genius غير صالح.');
  const config = ngeniusConfig(merchantId);
  const token = await accessToken(config.key);
  const response = await fetch(`${ngeniusIdentity}/transactions/outlets/${config.outlet}/orders/${reference}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.ni-payment.v2+json', ...browserHeaders },
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new HttpError(502, `تعذر التحقق من عملية N-Genius (رمز ${response.status}). لا تكرر الدفع قبل مراجعة حالته.`);
  const order: unknown = await response.json();
  if (!order || typeof order !== 'object' || Array.isArray(order)) throw new HttpError(502, 'لم تصل بيانات العملية من N-Genius.');
  const record = order as Record<string, unknown>;
  const payments = ((record._embedded || {}) as Record<string, unknown>).payment;
  const first = Array.isArray(payments) ? (payments[0] as Record<string, unknown> | undefined) : undefined;
  const state = typeof first?.state === 'string' ? first.state : 'STARTED';
  const amount = ((record.amount || {}) as Record<string, unknown>);
  return { reference: typeof record.reference === 'string' ? record.reference : undefined, state, currency: typeof amount.currencyCode === 'string' ? amount.currencyCode : undefined, value: typeof amount.value === 'number' ? amount.value : undefined };
}

// AUTHORISED is an authorisation without capture: never credited on its own.
export function ngeniusStatus(state: string): 'paid' | 'pending' | 'failed' {
  if (['PURCHASED', 'CAPTURED'].includes(state)) return 'paid';
  if (['DECLINED', 'FAILED', 'CANCELLED', 'EXPIRED', 'REVERSED'].includes(state)) return 'failed';
  return 'pending';
}
