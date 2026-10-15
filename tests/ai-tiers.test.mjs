import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';
// حرس البوابة يعيش في مستودع السيرفر (/root/oneshot-agent-gateway) خارج هذا المستودع،
// لذا تُتخطّى اختباراته في أي بيئة لا يوجد فيها الملف (بناء Netlify مثلاً).
const gateway = await import(pathToFileURL(process.env.ONESHOT_GATEWAY_GUARD || '/root/oneshot-agent-gateway/tier-guard.mjs').href).catch(() => null);
const { allowedModels, checkModel, grantSignature, TIER_X_MODELS } = gateway || {};
const gatewayTest = (name, fn) => test(name, { skip: gateway ? false : 'ملف حرس البوابة غير موجود في هذه البيئة' }, fn);

const root = path.resolve('.');
const token = 'test-gateway-token-value';
process.env.ONESHOT_VPS_AGENT_TOKEN = token;

/** يستورد ملف TS مباشرة (Node يشيل الأنواع تلقائياً) — بلا حزم المشروع. */
const load = (file) => import(pathToFileURL(path.resolve(root, file)).href);

test('كتالوج الطبقات يطابق الموديلات المثبّتة فعلاً على سيرفر Ollama', async () => {
  const tiers = await load('shared/ai-tiers.ts');
  const live = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) })
    .then(response => (response.ok ? response.json() : { models: [] }))
    .catch(() => ({ models: [] }));
  if (!live.models.length) return; // لا Ollama في هذه البيئة
  const installed = new Set(live.models.map(model => model.name));
  for (const model of tiers.allTierModels) {
    assert.ok(installed.has(model.id), `الموديل المذكور في الكتالوج غير مثبّت على السيرفر: ${model.id}`);
  }
});

test('الموجّه لا يتجاوز طبقة ترخيص الحساب أبداً', async () => {
  const { routeTier } = await load('shared/ai-tiers.ts');
  const question = 'حلل لي سبب الرفض ونسبة القبول المتوقعة خطوة بخطوة'; // يطلب Tier 3 فعلاً

  assert.equal(routeTier(question, { licenseTier: 'tier-1', tierX: false }).tier, 'tier-1', 'الحساب بلا ترخيص يبقى على الطبقة الأولى');
  assert.equal(routeTier(question, { licenseTier: 'tier-2', tierX: false }).tier, 'tier-2', 'الترخيص الثاني لا يفتح الثالث');

  const deep = routeTier(question, { licenseTier: 'tier-3', tierX: false });
  assert.equal(deep.tier, 'tier-3');
  assert.equal(deep.modelId, 'deepseek-v4.1-flash:cloud');
});

test('طلب طبقة أعلى صراحةً من المتصفح يُخفض لأعلى طبقة مرخّصة', async () => {
  const { routeTier } = await load('shared/ai-tiers.ts');
  const decision = routeTier('سؤال بسيط', { licenseTier: 'tier-1', tierX: false, requested: 'tier-3' });
  assert.equal(decision.tier, 'tier-1');
  assert.match(decision.reason.ar, /ترخيص/);
});

test('المستوى الرابع X لا يُختار تلقائياً ولا بطلب صريح بلا ترخيص', async () => {
  const { routeTier } = await load('shared/ai-tiers.ts');
  const prompt = 'أريد تحليلاً على موديل abliterated غير مقيّد';

  assert.notEqual(routeTier(prompt, { licenseTier: 'tier-3', tierX: false }).tier, 'tier-x', 'بلا ترخيص يجب ألا يصل للمستوى الرابع');
  assert.notEqual(routeTier(prompt, { licenseTier: 'tier-3', tierX: false, requested: 'tier-x' }).tier, 'tier-x');

  const granted = routeTier(prompt, { licenseTier: 'tier-3', tierX: true, requested: 'tier-x' });
  assert.equal(granted.tier, 'tier-x');
  assert.ok(TIER_X_MODELS.includes(granted.modelId), 'موديل X يجب أن يكون من قائمة abliterated الحقيقية');
});

test('أسماء موديلات Tier X في الكتالوج هي نفسها في البوابة', async () => {
  const tiers = await load('shared/ai-tiers.ts');
  assert.deepEqual([...tiers.abliteratedModels].sort(), [...TIER_X_MODELS].sort());
});

test('تراخيص الطبقات: الأدنى مسموح والأعلى لا، و X بمنحة فقط', async () => {
  const { licensedTiers, tierIsLicensed } = await load('shared/ai-tiers.ts');
  assert.deepEqual([...licensedTiers('tier-2', false)], ['tier-1', 'tier-2']);
  assert.equal(tierIsLicensed('tier-3', 'tier-2', false), false);
  assert.equal(tierIsLicensed('tier-x', 'tier-3', false), false);
  assert.equal(tierIsLicensed('tier-x', 'tier-3', true), true);
});

gatewayTest('البوابة ترفض أي موديل خارج القائمة المسموحة', () => {
  const allow = allowedModels('');
  const verdict = checkModel({ token, model: 'some-random:70b', headers: {}, allow });
  assert.equal(verdict.ok, false);
  assert.equal(verdict.status, 400);
});

gatewayTest('البوابة ترفض نماذج Tier X بلا توقيع أو بتوقيع منتهٍ أو مغشوش', () => {
  const allow = allowedModels('');
  const model = TIER_X_MODELS[0];
  const now = Date.now();

  assert.equal(checkModel({ token, model, headers: {}, allow, now }).status, 403);

  const stale = Math.floor(now / 1000) - 3600;
  assert.equal(
    checkModel({ token, model, headers: { 'x-oneshot-grant': grantSignature(token, model, stale), 'x-oneshot-grant-ts': String(stale), 'x-oneshot-tier': 'tier-x' }, allow, now }).status,
    403,
    'توقيع قديم يجب أن يُرفض',
  );

  const ts = Math.floor(now / 1000);
  const forged = grantSignature('another-token', model, ts);
  assert.equal(
    checkModel({ token, model, headers: { 'x-oneshot-grant': forged, 'x-oneshot-grant-ts': String(ts), 'x-oneshot-tier': 'tier-x' }, allow, now }).status,
    403,
    'توقيع بمفتاح آخر يجب أن يُرفض',
  );

  // التوقيع الصحيح لكن بلا ترويسة الطبقة المعلنة → رفض أيضاً.
  assert.equal(
    checkModel({ token, model, headers: { 'x-oneshot-grant': grantSignature(token, model, ts), 'x-oneshot-grant-ts': String(ts) }, allow, now }).status,
    403,
  );
});

gatewayTest('توقيع Netlify وتوقيع البوابة معادلتان متطابقتان', async () => {
  const allow = allowedModels('');
  const model = TIER_X_MODELS[0];
  const ts = Math.floor(Date.now() / 1000);

  const { tierGrantSignature } = await load('netlify/lib/tier-grant.ts');
  assert.equal(tierGrantSignature(model, ts), grantSignature(token, model, ts));

  assert.deepEqual(
    checkModel({ token, model, headers: { 'x-oneshot-grant': tierGrantSignature(model, ts), 'x-oneshot-grant-ts': String(ts), 'x-oneshot-tier': 'tier-x' }, allow }),
    { ok: true },
  );
});

gatewayTest('موديلات الطبقات المدفوعة تمر بلا توقيع', () => {
  const allow = allowedModels('');
  for (const model of ['llama3.2:1b', 'llama3.2:latest', 'isotnek/qwen3.5:9B-Unsloth-UD-Q4_K_XL', 'deepseek-v4.1-flash:cloud']) {
    assert.deepEqual(checkModel({ token, model, headers: {}, allow }), { ok: true }, model);
  }
});

gatewayTest('نسخة الحرس في المستودع مطابقة تماماً للمركّبة على بوابة السيرفر', async () => {
  const { readFile } = await import('node:fs/promises');
  const repoCopy = await readFile(path.resolve(root, 'tools/gateway/tier-guard.mjs'), 'utf8');
  const liveCopy = await readFile('/root/oneshot-agent-gateway/tier-guard.mjs', 'utf8').catch(() => null);
  if (liveCopy === null) return; // لسنا على السيرفر
  assert.equal(repoCopy, liveCopy, 'قوائم الموديلات انحرفت بين المستودع والبوابة — زامن tools/gateway/tier-guard.mjs');
});
