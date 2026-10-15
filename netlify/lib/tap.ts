import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './platform.js';

// Tap Payments (tap.company) — hosted checkout page, Saudi merchant.
//
// Credentials are read from the environment only, exactly like PayTabs/Telr/N-Genius:
//   TAP_<MERCHANT_ID>_SECRET_KEY[_TEST]   → this merchant's own Tap account
//   TAP_SECRET_KEY[_TEST]                 → platform Tap account fallback
//   TAP_PUBLIC_KEY[_TEST]                 → optional, published to the browser only
//   TAP_MERCHANT_ID                       → the platform account number (e.g. 68045622)
//   TAP_TEST_MODE=true                    → prefer the *_TEST keys
//
// The secret key doubles as the webhook HMAC key: it is never logged, echoed,
// returned to the browser or stored in the database.
//
// Verified live against the platform merchant account (2026-10-15):
//   POST https://api.tap.company/v2/charges → 200 {"id":"chg_…","status":"INITIATED",
//     "transaction":{"created":"1792059130239","url":"https://checkout.tap.company/?…"},
//     "source":{"id":"src_card"},"merchant":{"id":"68045622"}}
//   Sources accepted by this account: src_all, src_card, src_apple_pay,
//     src_google_pay, src_samsung_pay, src_omannet
//   Sources refused (1125 payment method not available): src_mada, src_knet,
//     src_benefit, src_stc_pay

export const tapApiBase = 'https://api.tap.company/v2';
export const tapCheckoutOrigin = 'https://checkout.tap.company';

const secretPattern = /^sk_(test|live)_[A-Za-z0-9]{12,140}$/;
const publicKeyPattern = /^pk_(test|live)_[A-Za-z0-9]{12,140}$/;
const chargeIdPattern = /^chg_[A-Za-z0-9]{6,80}$/;
const referencePattern = /^[A-Za-z0-9._-]{1,64}$/;
const sourcePattern = /^src_[a-z0-9_]{2,24}$/;

// Currencies we settle in and their ISO minor units — Tap hashes the rounded
// amount, so verification has to try the same rounding the gateway used.
const minorUnits: Record<string, number> = {
  BHD: 3, KWD: 3, OMR: 3, JOD: 3,
  SAR: 2, AED: 2, QAR: 2, USD: 2, EUR: 2, GBP: 2, EGP: 2,
};

export type TapConfig = {
  prefix: string;
  platform: boolean;
  test: boolean;
  secret: string;
  publicKey: string | null;
  merchant: string | null;
};

export type TapChargeInput = {
  amount: number;
  currency: string;
  reference: string;
  redirectUrl: string;
  postUrl: string;
  source?: string;
  description?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: { country_code?: string; number?: string };
  };
  saveCard?: boolean;
  threeDSecure?: boolean;
  metadata?: Record<string, string>;
};

export type TapPaymentState = 'paid' | 'authorized' | 'pending' | 'failed';

export function tapPrefix(merchantId: string) {
  return `TAP_${merchantId.replaceAll('-', '').toUpperCase()}`;
}

export function tapTestMode() {
  return process.env.TAP_TEST_MODE === 'true';
}

// Sources this merchant account actually accepted on a live charge (2026-10-15).
// src_mada, src_knet, src_benefit and src_stc_pay answered 1125 "payment method not available".
export const tapSources = ['src_all', 'src_card', 'src_apple_pay', 'src_google_pay', 'src_samsung_pay', 'src_omannet'] as const;

export function tapConfig(merchantId: string): TapConfig {
  const own = tapPrefix(merchantId);
  const suffix = tapTestMode() ? '_TEST' : '';
  return tapResolve(process.env[`${own}_SECRET_KEY${suffix}`] ? own : null);
}

export function tapPlatformConfig(): TapConfig {
  return tapResolve(null);
}

function tapResolve(own: string | null): TapConfig {
  const test = tapTestMode();
  const suffix = test ? '_TEST' : '';
  const prefix = own ?? 'TAP';
  const secret = process.env[`${prefix}_SECRET_KEY${suffix}`];
  if (!secret) {
    throw new HttpError(
      409,
      test
        ? 'حساب Tap غير مهيأ لهذا التاجر (وضع الاختبار).'
        : 'حساب Tap غير مهيأ لهذا التاجر.',
    );
  }
  if (!secretPattern.test(secret)) throw new HttpError(409, 'مفتاح Tap المخزّن غير صالح.');
  const publicKey = process.env[`${prefix}_PUBLIC_KEY${suffix}`] || null;
  if (publicKey && !publicKeyPattern.test(publicKey)) throw new HttpError(409, 'المفتاح العام لـTap المخزّن غير صالح.');
  const merchant = process.env[`${prefix}_MERCHANT_ID`] || (prefix === 'TAP' ? process.env.TAP_MERCHANT_ID : null) || null;
  if (merchant && !/^\d{6,12}$/.test(merchant)) throw new HttpError(409, 'رقم حساب Tap المخزّن غير صالح.');
  return { prefix, platform: !own, test, secret, publicKey, merchant };
}

export function tapChargePayload(input: TapChargeInput) {
  const currency = String(input.currency || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new HttpError(400, 'العملة غير صالحة.');
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'المبلغ غير صالح.');
  if (!referencePattern.test(input.reference)) throw new HttpError(400, 'مرجع الدفع غير صالح.');
  const source = input.source || 'src_all';
  if (!sourcePattern.test(source)) throw new HttpError(400, 'طريقة الدفع غير صالحة.');
  if (input.saveCard) {
    const phone = input.customer?.phone;
    // Tap only saves a card when the customer carries a phone number.
    if (!phone?.country_code || !phone?.number) throw new HttpError(400, 'رقم جوال العميل مطلوب لحفظ البطاقة.');
  }
  const payload: Record<string, unknown> = {
    amount,
    currency,
    threeDSecure: input.threeDSecure !== false,
    save_card: input.saveCard === true,
    description: input.description || '1shotcam',
    statement_descriptor: '1shotcam',
    reference: { order: input.reference, transaction: input.reference, idempotent: input.reference },
    source: { id: source },
    redirect: { url: input.redirectUrl },
    post: { url: input.postUrl },
  };
  if (input.customer) payload.customer = input.customer;
  if (input.metadata) payload.metadata = input.metadata;
  return payload;
}

export async function tapRequest(
  config: TapConfig,
  path: string,
  payload: Record<string, unknown> | null,
  timeoutMs = 20000,
): Promise<{ status: number; body: Record<string, unknown> | null }> {
  let response: Response;
  try {
    response = await fetch(`${tapApiBase}${path}`, {
      method: payload ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${config.secret}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: payload ? JSON.stringify(payload) : undefined,
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new HttpError(502, 'تعذّر الوصول إلى Tap. أعد المحاولة.');
  }
  const raw = await response.text();
  let body: Record<string, unknown> | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
    } catch {
      body = null;
    }
  }
  if (body && config.merchant) {
    const merchant = body.merchant;
    const id = merchant && typeof merchant === 'object' ? (merchant as Record<string, unknown>).id : null;
    if (id && String(id) !== config.merchant) throw new HttpError(502, 'استجابة Tap صادرة من حساب آخر.');
  }
  return { status: response.status, body };
}

export function tapChargeId(body: Record<string, unknown> | null | undefined) {
  const id = body?.id;
  return typeof id === 'string' && chargeIdPattern.test(id) ? id : null;
}

export function tapChargeReference(body: Record<string, unknown> | null | undefined) {
  const reference = body?.reference;
  if (!reference || typeof reference !== 'object') return null;
  const values = reference as Record<string, unknown>;
  for (const key of ['gateway', 'payment', 'order', 'transaction']) {
    const value = values[key];
    if (typeof value === 'string' && value) return value;
  }
  return null;
}

export function tapChargeStatus(body: Record<string, unknown> | null | undefined) {
  const status = body?.status;
  return typeof status === 'string' ? status.toUpperCase() : '';
}

export function tapChargeAmount(body: Record<string, unknown> | null | undefined) {
  const amount = body?.amount;
  const value = typeof amount === 'number' ? amount : Number(amount);
  return Number.isFinite(value) ? value : null;
}

export function tapChargeCurrency(body: Record<string, unknown> | null | undefined) {
  const currency = body?.currency;
  return typeof currency === 'string' ? currency.toUpperCase() : '';
}

// What this merchant's Tap account can actually do — same shape the other gateways return,
// so the admin panel and the public page treat it identically. Tap is hosted-checkout only:
// card / Apple Pay / Samsung Pay ride the one page, and paylink+invoice reuse the same link.
export function tapCapabilities(merchantId: string) {
  let connected = false;
  let platform = false;
  try {
    const config = tapConfig(merchantId);
    connected = true;
    platform = config.platform;
  } catch {
    connected = false;
  }
  return {
    connected,
    platform,
    hosted: connected,
    framed: connected,
    mobile: connected,
    mada_applepay: connected,
    samsung_pay: connected,
    paylink: connected,
    invoice: connected,
    // The direct-card, saved-card and recurring flows are not built for Tap, so never advertised.
    managed: false,
    own: false,
    recurring: false,
  };
}

// Every card-shaped method goes through src_all, which is the one source this KSA account
// accepted for all of them; the wallet the customer picks is narrowed when we know it.
export function tapSource(method: string) {
  return method === 'samsung_pay' ? 'src_samsung_pay' : 'src_all';
}

// Tap status vocabulary (docs/payment-status) → the states the checkout uses.
export function tapState(status: string): TapPaymentState {
  switch (String(status || '').toUpperCase()) {
    case 'CAPTURED':
      return 'paid';
    case 'AUTHORIZED':
      return 'authorized';
    case 'INITIATED':
    case 'IN_PROGRESS':
    case 'PENDING':
      return 'pending';
    default:
      // DECLINED, FAILED, CANCELLED, VOID, TIMEDOUT, ABANDONED, RESTRICTED, UNKNOWN
      return 'failed';
  }
}

export function tapCheckoutUrl(value: unknown) {
  if (typeof value !== 'string' || !value) throw new HttpError(502, 'لم تُرجع Tap رابط دفع صالح.');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new HttpError(502, 'رابط دفع Tap غير صالح.');
  }
  if (url.origin !== tapCheckoutOrigin || url.username || url.password) {
    throw new HttpError(502, 'رابط دفع Tap غير صالح.');
  }
  return url.href;
}

export function tapChargeUrl(body: Record<string, unknown> | null | undefined) {
  const transaction = body?.transaction;
  const url = transaction && typeof transaction === 'object' ? (transaction as Record<string, unknown>).url : null;
  return tapCheckoutUrl(url);
}

function tapError(body: Record<string, unknown> | null, status: number) {
  const errors = body?.errors;
  if (Array.isArray(errors) && errors.length) {
    const first = errors[0] as Record<string, unknown>;
    const code = first?.code ? `${first.code} ` : '';
    const message = typeof first?.description === 'string' ? first.description : typeof first?.message === 'string' ? first.message : '';
    if (message) return `${code}${message}`.slice(0, 160);
  }
  const response = body?.response as Record<string, unknown> | undefined;
  const message = response && typeof response.message === 'string' ? response.message : '';
  return message ? `${status} ${message}`.slice(0, 160) : `رمز ${status}`;
}

export async function tapCreateCharge(config: TapConfig, input: TapChargeInput) {
  const result = await tapRequest(config, '/charges', tapChargePayload(input));
  if (result.status >= 400 || !result.body) {
    throw new HttpError(502, `تعذر إنشاء عملية Tap (${tapError(result.body, result.status)}). تحقق من حالة الدفع قبل التكرار.`);
  }
  return result.body;
}

// The truth about a charge is only ever read back from Tap, never taken from a webhook body.
export async function tapRetrieveCharge(merchantId: string, reference: string) {
  if (!chargeIdPattern.test(reference)) throw new HttpError(400, 'مرجع Tap غير صالح.');
  const config = tapConfig(merchantId);
  const result = await tapRequest(config, `/charges/${encodeURIComponent(reference)}`, null);
  if (result.status === 404) throw new HttpError(404, 'عملية Tap غير موجودة.');
  if (result.status >= 400 || !result.body) throw new HttpError(502, `تعذّر التحقق من Tap (${tapError(result.body, result.status)}).`);
  return result.body;
}

// Tap posts a wrapper object: { id, method, url, headers: [{name,value}], body: "<charge json>" }.
export function tapWebhookPayload(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object') return null;
  const outer = payload as Record<string, unknown>;
  if (typeof outer.body === 'string') {
    try {
      const inner = JSON.parse(outer.body);
      if (inner && typeof inner === 'object') return inner as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return outer;
}

export function tapWebhookHeader(payload: unknown, name: string): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const headers = (payload as Record<string, unknown>).headers;
  if (!Array.isArray(headers)) return null;
  for (const entry of headers) {
    if (!entry || typeof entry !== 'object') continue;
    const header = entry as Record<string, unknown>;
    if (typeof header.name === 'string' && header.name.toLowerCase() === name.toLowerCase()) {
      return typeof header.value === 'string' ? header.value : null;
    }
  }
  return null;
}

function amountVariants(amount: unknown, currency: string) {
  const digits = minorUnits[String(currency).toUpperCase()] ?? 2;
  const values = new Set<string>();
  if (typeof amount === 'string') {
    if (amount) values.add(amount);
  } else if (typeof amount === 'number' && Number.isFinite(amount)) {
    values.add(String(amount));
    values.add(amount.toFixed(digits));
  }
  return [...values];
}

export function tapSignatureValues(body: Record<string, unknown> | null | undefined) {
  const transaction = body?.transaction && typeof body.transaction === 'object' ? (body.transaction as Record<string, unknown>) : {};
  const reference = body?.reference && typeof body.reference === 'object' ? (body.reference as Record<string, unknown>) : {};
  const text = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : '');
  return {
    id: text(body?.id),
    currency: text(body?.currency),
    gatewayReference: text(reference.gateway),
    paymentReference: text(reference.payment),
    status: text(body?.status),
    created: text(transaction.created),
    updated: text(body?.updated),
    amount: body?.amount,
  };
}

// Documented scheme (developers.tap.company/docs/webhook): the values are
// concatenated in a fixed order, each prefixed by its field name, and signed
// with HMAC-SHA256 using the secret API key.
export function tapSignatures(secret: string, values: ReturnType<typeof tapSignatureValues>) {
  const base = `x_id${values.id}x_amount`;
  const tail = `x_currency${values.currency}x_gateway_reference${values.gatewayReference}x_payment_reference${values.paymentReference}x_status${values.status}x_created${values.created}`;
  return amountVariants(values.amount, values.currency).map((amount) =>
    createHmac('sha256', secret).update(`${base}${amount}${tail}`).digest('hex'),
  );
}

export function tapVerifySignature(
  secret: string,
  body: Record<string, unknown> | null | undefined,
  provided: string | null | undefined,
) {
  if (!provided || !body) return false;
  const given = String(provided).trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(given)) return false;
  const expected = Buffer.from(given, 'hex');
  for (const candidate of tapSignatures(secret, tapSignatureValues(body))) {
    const digest = Buffer.from(candidate, 'hex');
    if (digest.length === expected.length && timingSafeEqual(digest, expected)) return true;
  }
  return false;
}
