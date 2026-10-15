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
  // All seven of these run on the same N-Genius hosted pay page:
  //   hosted        the page itself, opened at the top level
  //   framed        the same page in slim mode inside our checkout iframe (the pay page
  //                 sends no X-Frame-Options and no CSP frame-ancestors, so it embeds)
  //   mobile        the same page on a phone
  //   mada_applepay the page limited to Mada + Apple Pay (offerOnly on the order)
  //   samsung_pay   the same page limited to Samsung Pay alone
  //   paylink       the pay link is stored on the document and shared with the customer
  //   invoice       that same stored link, titled as an invoice for one customer
  // offerOnly is only ever sent for schemes the outlet confirms on the order it just created,
  // so a method whose account has no such scheme is refused instead of showing an empty page.
  // Not written yet, so never advertised: managed (Web SDK card fields need a Hosted Session
  // SDK session, which the KSA docs we hold do not publish), own (a Direct API card form would
  // put the merchant in PCI SAQ D scope), recurring (no payment:saved-card link comes back on
  // the order, so the outlet has no tokenisation and no merchant-initiated payments enabled).
  try { return { connected: true, hosted: true, framed: true, mobile: true, mada_applepay: true, samsung_pay: true, paylink: true, invoice: true, managed: false, own: false, recurring: false, platform: ngeniusConfig(merchantId).platform }; }
  catch { return { connected: false, hosted: false, framed: false, mobile: false, mada_applepay: false, samsung_pay: false, paylink: false, invoice: false, managed: false, own: false, recurring: false, platform: false }; }
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

// Methods that run on the same hosted page but must be offered on their own: the page then shows
// only these, so a customer sent a Mada/Apple Pay request cannot pay by another scheme.
// Values are the schemes the hosted page accepts in offerOnly (card and wallet names alike).
const methodOffers: Record<string, string[]> = { mada_applepay: ['MADA', 'APPLE_PAY'], samsung_pay: ['SAMSUNG_PAY'] };
const methodOffer = (method?: string) => { const schemes = method ? methodOffers[method] : undefined; return schemes ? schemes.join(',') : undefined; };

// What the account really accepts, read from the order it just created: every order reports the
// card and wallet schemes enabled on the outlet. Naming a scheme the account does not have would
// leave the customer on a pay page that cannot render, so only confirmed schemes are ever sent,
// and a method with none of them is refused instead of advertised.
function honouredOffer(offer: string, order: Record<string, unknown>) {
  const groups = (order.paymentMethods || {}) as { card?: unknown; wallet?: unknown };
  const enabled = [groups.card, groups.wallet].flatMap(group => (Array.isArray(group) ? group : [])).map(scheme => String(scheme).toUpperCase());
  if (!enabled.length) return offer;
  const wanted = offer.split(',').map(scheme => scheme.trim().toUpperCase()).filter(Boolean);
  const kept = wanted.filter(scheme => enabled.includes(scheme));
  if (!kept.length) throw new HttpError(409, 'وسيلة الدفع المطلوبة غير مفعّلة على حساب N-Genius. اختر وسيلة أخرى.');
  return kept.join(',');
}

// The pay page carries no X-Frame-Options and no CSP frame-ancestors, so our checkout can
// embed it; slim=true is the vendor's own bare layout for exactly that (no header, no chrome).
export function ngeniusSlim(url: string) {
  const target = new URL(url);
  target.searchParams.set('slim', 'true');
  return target.href;
}

// Creates a PURCHASE order: a successful authorisation is captured immediately, which is what a
// wallet top-up or a site payment needs. The page can only be limited to schemes the account
// actually has, and the order it just created reports them; when one is missing the order is
// placed once more for the rest, and a method with none of them is refused before the customer
// ever sees a pay page.
export async function ngeniusCreateOrder(merchantId: string, input: { amount: number; description: string; email?: string; origin: string; documentId: string; method?: string }) {
  const config = ngeniusConfig(merchantId);
  const token = await accessToken(config.key);
  const returnUrl = `${input.origin}/.netlify/functions/payment-return?id=${input.documentId}`;
  const offer = methodOffer(input.method);
  const sendOrder = async (only?: string) => {
    const response = await fetch(`${ngeniusIdentity}/transactions/outlets/${config.outlet}/orders`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/vnd.ni-payment.v2+json', Accept: 'application/vnd.ni-payment.v2+json', ...browserHeaders },
      body: JSON.stringify({
        action: 'PURCHASE',
        amount: { currencyCode: 'SAR', value: input.amount },
        merchantOrderReference: orderReference(input.description),
        ...(input.email ? { emailAddress: input.email } : {}),
        merchantAttributes: { redirectUrl: returnUrl, cancelUrl: returnUrl, skipConfirmationPage: true, ...(only ? { offerOnly: only } : {}) },
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      const reason = (() => { try { const parsed = JSON.parse(detail) as { errors?: Array<{ code?: string; message?: string }> }; const first = parsed?.errors?.[0]; return [first?.code, first?.message].filter(Boolean).join(' ').slice(0, 160); } catch { return ''; } })();
      throw new HttpError(502, `تعذر إنشاء جلسة الدفع في N-Genius (رمز ${response.status}${reason ? ` — ${reason}` : ''}).`);
    }
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(502, 'لم تصل بيانات جلسة الدفع.');
    return data as Record<string, unknown>;
  };
  let record = await sendOrder(offer);
  if (offer) {
    const honoured = honouredOffer(offer, record);
    if (honoured !== offer) record = await sendOrder(honoured);
  }
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
