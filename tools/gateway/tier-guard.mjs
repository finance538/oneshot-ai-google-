// tier-guard.mjs — بوابة السيرفر: منع الموديلات غير المسموحة، وإلزام توقيع ترخيص
// للمستوى الرابع X (abliterated). مرآة `netlify/lib/tier-grant.ts` في المستودع،
// مفصولة في ملف خاص حتى تُختبر مباشرة بلا تشغيل السيرفر.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

// الطبقات كما في shared/ai-tiers.ts (المصدر: GET /api/tags على Ollama).
export const TIER_1_MODELS = ['llama3.2:1b', 'llama3.2:latest'];
export const TIER_2_MODELS = ['isotnek/qwen3.5:9B-Unsloth-UD-Q4_K_XL'];
export const TIER_3_MODELS = ['deepseek-v4.1-flash:cloud'];
export const TIER_X_MODELS = [
  'huihui_ai/qwen3-abliterated:8b',
  'sachasayan/interimlabs-huihui-qwen3.5-9b-abliterated:q4_k_m',
  'dolphin3:8b',
];

export function allowedModels(extra = '') {
  const fromEnv = String(extra || '').split(',').map(value => value.trim()).filter(Boolean);
  return new Set([...fromEnv, ...TIER_1_MODELS, ...TIER_2_MODELS, ...TIER_3_MODELS, ...TIER_X_MODELS]);
}

export function tierGrantKey(token) {
  return createHash('sha256').update(`${token}:ai-tier-grant`).digest();
}

export function grantSignature(token, modelId, timestamp) {
  return createHmac('sha256', tierGrantKey(token)).update(`${modelId}|${timestamp}`).digest('hex');
}

/** هل يحمل الطلب توقيع ترخيص ساري لهذا الموديل في هذه اللحظة؟ */
export function tierXAuthorized({ token, model, signature, timestamp, now = Date.now(), windowS = 300 }) {
  const sig = String(signature || '').trim();
  const stamp = Number(timestamp);
  if (!sig || !Number.isFinite(stamp)) return false;
  if (Math.abs(Math.floor(now / 1000) - stamp) > windowS) return false;
  const expected = grantSignature(token, model, stamp);
  if (expected.length !== sig.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/**
 * يتحقق من الموديل المطلوب قبل لمس Ollama.
 * @returns {{ ok: true } | { ok: false, status: number, error: string }}
 */
export function checkModel({ token, model, headers = {}, allow = allowedModels(), now = Date.now(), windowS = 300 }) {
  if (!allow.has(model)) return { ok: false, status: 400, error: 'model not allowed' };
  if (TIER_X_MODELS.includes(model)) {
    const authorized = tierXAuthorized({
      token,
      model,
      signature: headers['x-oneshot-grant'],
      timestamp: headers['x-oneshot-grant-ts'],
      now,
      windowS,
    });
    if (!authorized) return { ok: false, status: 403, error: 'tier-x licence required' };
    const claimed = String(headers['x-oneshot-tier'] || '').trim();
    if (claimed !== 'tier-x') return { ok: false, status: 403, error: 'tier-x licence required' };
  }
  return { ok: true };
}
