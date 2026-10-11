import { HttpError } from './platform.js';

export function telrPrefix(merchantId: string) {
  return `TELR_${merchantId.replaceAll('-', '').toUpperCase()}`;
}

export function telrConfig(merchantId: string) {
  const prefix = telrPrefix(merchantId);
  const store = process.env[`${prefix}_STORE_ID`];
  const key = process.env[`${prefix}_SERVICE_API_KEY`];
  if (!key || !store || !/^\d+$/.test(store) || !Number.isSafeInteger(Number(store)) || Number(store) <= 0) throw new HttpError(409, 'حساب Telr الخاص بهذا التاجر غير مهيأ.');
  return { store: Number(store), key, test: process.env[`${prefix}_TEST_MODE`] === 'true' ? 1 : 0 };
}

export function telrCapabilities(merchantId: string) {
  try { telrConfig(merchantId); return { connected: true, hosted: true, framed: true, mobile: true }; }
  catch { return { connected: false, hosted: false, framed: false, mobile: false }; }
}

export async function telrRequest(merchantId: string, payload: Record<string, unknown>) {
  const config = telrConfig(merchantId);
  try {
    const response = await fetch('https://secure.telr.com/gateway/order.json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...payload, store: config.store, authkey: config.key }), redirect: 'error', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Gateway failure');
    const result: unknown = await response.json();
    if (!result || typeof result !== 'object' || Array.isArray(result) || 'error' in result) throw new Error('Gateway failure');
    const serialized = JSON.stringify(result);
    if (serialized.includes(config.key) || serialized.includes(encodeURIComponent(config.key))) throw new Error('Gateway failure');
    return result as Record<string, unknown>;
  } catch { throw new HttpError(502, 'تعذر إتمام طلب Telr. تحقق من حالة الدفع قبل تكرار المحاولة.'); }
}

export function telrUrl(value: unknown, merchantId: string) {
  if (typeof value !== 'string') throw new HttpError(502, 'لم يصل رابط الدفع من Telr.');
  const config = telrConfig(merchantId);
  let url: URL;
  try { url = new URL(value); } catch { throw new HttpError(502, 'رابط Telr غير صالح.'); }
  if (url.origin !== 'https://secure.telr.com' || url.username || url.password || value.includes(config.key) || value.includes(encodeURIComponent(config.key))) throw new HttpError(502, 'رابط Telr غير صالح.');
  return url.href;
}
