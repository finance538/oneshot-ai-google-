import type { Context } from '@netlify/functions';
import { cents, failure, HttpError, jsonBody, reply, sameOrigin, text, throttle } from '../lib/platform.js';

// N-Genius KSA (Network International) — hosted payment page.
// Credentials live only in Netlify environment variables: NG_API_KEY, NG_OUTLET.
const identity = 'https://api-gateway.ksa.ngenius-payments.com';
const paypage = 'https://paypage.ksa.ngenius-payments.com';
const minimum = Number(process.env.NG_PAY_MINIMUM || 100);
const maximum = Number(process.env.NG_PAY_MAXIMUM || 500000);

function config() {
  const key = process.env.NG_API_KEY;
  const outlet = process.env.NG_OUTLET;
  if (!key || !outlet) throw new HttpError(409, 'بوابة N-Genius غير مهيأة على المنصة.');
  if (!/^[A-Za-z0-9+/=_-]{40,200}$/.test(key)) throw new HttpError(409, 'مفتاح بوابة N-Genius غير صالح.');
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(outlet)) throw new HttpError(409, 'معرّف منفذ N-Genius غير صالح.');
  return { key, outlet };
}

async function accessToken(key: string) {
  const response = await fetch(`${identity}/identity/auth/access-token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${key}`,
      'Content-Type': 'application/vnd.ni-identity.v1+json',
      Accept: 'application/vnd.ni-identity.v1+json',
    },
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new HttpError(502, 'تعذر الاتصال ببوابة N-Genius. تحقق من حالة الدفع قبل التكرار.');
  const result: unknown = await response.json();
  if (!result || typeof result !== 'object' || Array.isArray(result) || typeof (result as Record<string, unknown>).access_token !== 'string') {
    throw new HttpError(502, 'لم يصل رمز الوصول من N-Genius.');
  }
  return (result as { access_token: string }).access_token;
}

function hostedUrl(value: unknown, key: string) {
  if (typeof value !== 'string') throw new HttpError(502, 'لم يصل رابط الدفع من N-Genius.');
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(502, 'رابط N-Genius غير صالح.'); }
  if (url.protocol !== 'https:' || url.hostname !== new URL(paypage).hostname || url.username || url.password) {
    throw new HttpError(502, 'رابط N-Genius غير صالح.');
  }
  if (value.includes(key) || value.includes(encodeURIComponent(key))) throw new HttpError(502, 'رابط N-Genius غير صالح.');
  return url.href;
}

export default async (req: Request, context: Context) => {
  try {
    if (!['GET', 'POST'].includes(req.method)) return reply({ error: 'طريقة الطلب غير مسموحة.' }, 405);
    const { key, outlet } = config();
    const origin = new URL(req.url).origin;
    if (req.method === 'GET') return reply({ merchantName: 'OneShot', currency: 'SAR', minimum, maximum, configured: true });
    sameOrigin(req);
    await throttle(`ng-pay:${context.ip || 'unknown'}`, 15);
    const body = await jsonBody(req);
    const amount = cents(body.amount);
    if (amount < minimum || amount > maximum) throw new HttpError(400, 'المبلغ خارج النطاق المسموح.');
    const description = text(body.description || 'OneShot', 120);
    const email = typeof body.email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email.trim()) ? body.email.trim() : undefined;
    const token = await accessToken(key);
    const response = await fetch(`${identity}/transactions/outlets/${outlet}/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.ni-payment.v2+json',
        Accept: 'application/vnd.ni-payment.v2+json',
      },
      body: JSON.stringify({
        action: 'AUTH',
        amount: { currencyCode: 'SAR', value: amount },
        ...(email ? { emailAddress: email } : {}),
        merchantAttributes: {
          redirectUrl: `${origin}/.netlify/functions/ng-pay-return`,
          cancelUrl: `${origin}/.netlify/functions/ng-pay-return`,
          skipConfirmationPage: true,
        },
        merchantOrderReference: description.slice(0, 40),
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new HttpError(502, 'تعذر إنشاء جلسة الدفع في N-Genius.');
    const order: unknown = await response.json();
    if (!order || typeof order !== 'object' || Array.isArray(order)) throw new HttpError(502, 'لم تصل بيانات جلسة الدفع.');
    const record = order as Record<string, unknown>;
    const links = (record._links || {}) as Record<string, { href?: string }>;
    const url = hostedUrl(links.payment?.href, key);
    return reply({ url, reference: typeof record.reference === 'string' ? record.reference : null, amount, currency: 'SAR', status: 'pending' });
  } catch (error) { return failure(error); }
};
