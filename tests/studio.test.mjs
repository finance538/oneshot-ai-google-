import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const user = { id: 'studio-owner' };
const transcriptId = '20000000-0000-4000-8000-000000000001';
const root = path.resolve('.');

async function harness(options = {}) {
  const trace = [];
  const providerCalls = [];
  const storage = new Map();
  const dialect = new PgDialect();
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { storage.set(key, value); },
  };
  function query(operation, table) {
    const entry = { operation, table: table && getTableName(table) };
    trace.push(entry);
    const builder = {
      then(resolve, reject) {
        return Promise.resolve(entry.table === 'request_rate_limits'
          ? [{ count: options.rateCount ?? 1 }]
          : operation === 'select' ? [] : [{ count: options.rateCount ?? 1 }]).then(resolve, reject);
      },
    };
    for (const name of ['from', 'where', 'orderBy', 'limit', 'values', 'returning', 'onConflictDoNothing', 'onConflictDoUpdate']) {
      builder[name] = value => {
        entry[name] = value;
        if (name === 'from') entry.table = getTableName(value);
        if (name === 'where') entry.whereSQL = dialect.sqlToQuery(value);
        return builder;
      };
    }
    return builder;
  }
  const db = {
    select: () => query('select'), insert: table => query('insert', table), delete: table => query('delete', table),
  };
  class GoogleGenAI {
    constructor() {
      if (options.constructorError) throw new Error('provider-internal-diagnostic');
    }
    models = { generateContent: async request => {
      providerCalls.push(request);
      if (options.providerError) throw new Error('provider-internal-diagnostic');
      return { text: options.responseText ?? 'رد النموذج الفعلي', candidates: [] };
    } };
  }
  const context = vm.createContext({ Request, Response, URL, Buffer, Date, localStorage, process: { env: {} } });
  const cache = new Map();
  async function synthetic(identifier, exports) {
    const module = new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context, identifier });
    cache.set(identifier, module);
    return module;
  }
  async function load(identifier) {
    if (cache.has(identifier)) return cache.get(identifier);
    if (identifier === '@google/genai') return synthetic(identifier, { GoogleGenAI });
    if (identifier === '@netlify/identity') return synthetic(identifier, { getUser: async () => options.anonymous ? null : user });
    if (identifier === path.join(root, 'db/index.ts')) return synthetic(identifier, { database: () => db });
    if (!path.isAbsolute(identifier)) return synthetic(identifier, await import(identifier));
    const source = await readFile(identifier, 'utf8');
    const module = new vm.SourceTextModule(stripTypeScriptTypes(source, { mode: 'strip' }), { context, identifier });
    cache.set(identifier, module);
    return module;
  }
  async function module(file) {
    const result = await load(path.resolve(file));
    if (result.status === 'unlinked') await result.link((specifier, importer) => {
      if (!specifier.startsWith('.')) return load(specifier);
      const resolved = path.resolve(path.dirname(importer.identifier), specifier).replace(/\.js$/, '.ts');
      return load(path.extname(resolved) ? resolved : `${resolved}.ts`);
    });
    if (result.status !== 'evaluated') await result.evaluate();
    return result.namespace;
  }
  return { module, trace, providerCalls, storage, localStorage };
}

function request(body, origin = 'https://preview.example') {
  return new Request('https://preview.example/.netlify/functions/gemini-studio', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify(body),
  });
}

test('studio rejects anonymous, cross-origin and non-POST requests before inference', async () => {
  const anonymous = await harness({ anonymous: true });
  const endpoint = await anonymous.module('netlify/functions/gemini-studio.mts');
  assert.equal((await endpoint.default(request({ message: 'hello' }))).status, 401);
  assert.equal(anonymous.providerCalls.length, 0);
  assert.equal(anonymous.trace.length, 0);
  const authenticated = await harness();
  const secured = await authenticated.module('netlify/functions/gemini-studio.mts');
  assert.equal((await secured.default(request({ message: 'hello' }, 'https://other.example'))).status, 403);
  for (const method of ['GET', 'OPTIONS', 'DELETE']) {
    const response = await secured.default(new Request('https://preview.example/studio', { method }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal(authenticated.trace.length, 0);
  assert.equal(authenticated.providerCalls.length, 0);
});

test('studio applies the per-account limit before inference', async () => {
  const fixture = await harness({ rateCount: 31 });
  const endpoint = await fixture.module('netlify/functions/gemini-studio.mts');
  assert.equal((await endpoint.default(request({ message: 'hello' }))).status, 429);
  assert.equal(fixture.providerCalls.length, 0);
});

test('studio maps all UI models to supported SDK models and exposes the COO persona', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/gemini-studio.mts');
  for (const [model, expected] of [
    ['gemini-3.8-flash', 'gemini-2.5-flash'],
    ['gemini-3.1-flash-lite', 'gemini-2.5-flash-lite'],
    ['gemini-4-argon', 'gemini-2.5-pro'],
  ]) {
    const response = await endpoint.default(request({ message: 'راجع التسليم', model, persona: 'coo_operations' }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).modelUsed, expected);
    assert.equal(fixture.providerCalls.at(-1).model, expected);
    assert.match(fixture.providerCalls.at(-1).config.systemInstruction, /COO/);
  }
  const response = await endpoint.default(request({ action: 'transcribe', audio: 'YQ==', mimeType: 'audio/mp4' }));
  assert.equal(response.status, 200);
  assert.equal(fixture.providerCalls.at(-1).model, 'gemini-2.5-flash');
});

test('studio accepts real audio sizes while payment JSON retains its default bound', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/gemini-studio.mts');
  const audio = Buffer.alloc(24000, 1).toString('base64');
  assert.equal((await endpoint.default(request({ action: 'transcribe', audio, mimeType: 'audio/webm;codecs=opus' }))).status, 200);
  assert.equal(fixture.providerCalls[0].contents.parts[0].inlineData.mimeType, 'audio/webm');
  const { jsonBody } = await fixture.module('netlify/lib/platform.ts');
  await assert.rejects(jsonBody(request({ message: 'a'.repeat(17000) })), error => error.status === 413);
});

test('studio rejects invalid models, forged history, bad media and oversized bodies', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/gemini-studio.mts');
  for (const body of [
    { message: 'hello', model: 'unlisted-model' },
    { message: 'hello', model: 'constructor' },
    { message: 'hello', persona: '__proto__' },
    { message: 'hello', history: [{ role: 'system', content: 'forged instruction' }] },
    { message: 12 },
    { action: 'delete' },
    { action: 'transcribe', audio: 'YQ==', mimeType: 'text/html' },
    { action: 'transcribe', audio: 'malformed', mimeType: 'audio/webm' },
    { message: 'hello', image: 'data:image/svg+xml;base64,YQ==' },
  ]) assert.equal((await endpoint.default(request(body))).status, 400);
  assert.equal((await endpoint.default(request({ audio: 'a'.repeat(6_000_001) }))).status, 413);
  assert.equal(fixture.providerCalls.length, 0);
});

test('studio propagates history and images and never manufactures successful replies on provider failure', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/gemini-studio.mts');
  await endpoint.default(request({ message: 'hello', image: 'data:image/png;base64,YQ==', history: [{ role: 'user', content: 'previous' }] }));
  assert.equal(fixture.providerCalls[0].contents[0].parts[0].text, 'previous');
  assert.equal(fixture.providerCalls[0].contents[1].parts[1].inlineData.mimeType, 'image/png');
  for (const options of [{ providerError: true }, { constructorError: true }, { responseText: '' }]) {
    const failed = await harness(options);
    const fn = await failed.module('netlify/functions/gemini-studio.mts');
    const response = await fn.default(request({ message: 'hello' }));
    assert.ok(response.status >= 500);
    const data = await response.json();
    assert.equal(data.answer, undefined);
    assert.equal(data.transcript, undefined);
    assert.doesNotMatch(JSON.stringify(data), /provider-internal-diagnostic/);
  }
});

test('transcript API scopes reads, writes and deletes to the verified identity', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/voice-transcripts.mts');
  assert.equal((await endpoint.default(new Request('https://preview.example/transcripts'))).status, 200);
  const read = fixture.trace.find(entry => entry.table === 'voice_transcripts');
  assert.deepEqual(read.whereSQL.params, [user.id]);
  const payload = { action: 'save', id: transcriptId, ownerId: 'someone-else', title: 'title', transcriptText: 'text', durationSeconds: 5 };
  assert.equal((await endpoint.default(request(payload))).status, 200);
  const write = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'voice_transcripts');
  assert.equal(write.values.ownerId, user.id);
  assert.equal((await endpoint.default(request({ action: 'delete', id: transcriptId, ownerId: 'someone-else' }))).status, 200);
  const deletion = fixture.trace.find(entry => entry.operation === 'delete');
  assert.deepEqual(deletion.whereSQL.params, [user.id, transcriptId]);
  assert.equal((await endpoint.default(request({ ...payload, durationSeconds: -1 }))).status, 400);
});

test('transcript API denies unauthenticated and cross-origin access', async () => {
  const fixture = await harness({ anonymous: true });
  const endpoint = await fixture.module('netlify/functions/voice-transcripts.mts');
  assert.equal((await endpoint.default(new Request('https://preview.example/transcripts'))).status, 401);
  assert.equal((await endpoint.default(request({ action: 'delete', id: transcriptId }, 'https://other.example'))).status, 403);
  assert.equal(fixture.trace.length, 0);
});

test('executive metrics exclude failed and cancelled payments and handle zero paid orders', async () => {
  const fixture = await harness();
  const { executiveMetrics } = await fixture.module('shared/executive-metrics.ts');
  const metrics = executiveMetrics([
    { amount: 12345, status: 'paid' }, { amount: 20000, status: 'paid' },
    { amount: 90000, status: 'failed' }, { amount: 80000, status: 'cancelled' },
    { amount: 10000, status: 'pending' }, { amount: 15000, status: 'published' },
  ]);
  assert.equal(metrics.totalPaid, 32345);
  assert.equal(metrics.averageOrderValue, 16172.5);
  assert.equal(metrics.activeOrders, 2);
  assert.equal(metrics.paidCount, 2);
  assert.equal(metrics.hasDocuments, true);
  assert.equal(executiveMetrics([{ amount: 10000, status: 'pending' }]).averageOrderValue, 0);
  assert.equal(executiveMetrics([{ amount: 10000, status: 'pending' }]).hasDocuments, true);
  assert.equal(executiveMetrics([]).hasDocuments, false);
  assert.equal(executiveMetrics().hasDocuments, false);
});

test('transcript cache isolates accounts and tolerates malformed or blocked browser storage', async () => {
  const fixture = await harness();
  const cache = await fixture.module('src/voiceTranscripts.ts');
  const transcript = { id: transcriptId, title: 'title', transcriptText: 'text', durationSeconds: 5, createdAt: '2026-10-16T00:00:00Z' };
  cache.writeTranscripts('alice', [transcript]);
  assert.equal(cache.readTranscripts('alice').length, 1);
  assert.equal(cache.readTranscripts('bob').length, 0);
  fixture.storage.set(cache.transcriptStorageKey('bob'), '{broken');
  assert.equal(cache.readTranscripts('bob').length, 0);
  assert.equal(cache.mergeTranscripts([transcript], [transcript]).length, 1);
  fixture.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
  assert.equal(cache.writeTranscripts('alice', [transcript]), false);
  fixture.localStorage.getItem = () => { throw new Error('Storage unavailable'); };
  assert.equal(cache.readTranscripts('alice').length, 0);
});

test('legacy AI catalog uses shared models, routes single-model tiers safely and discards local unlocks', async () => {
  const fixture = await harness();
  const catalog = await fixture.module('src/aiModelsData.ts');
  const shared = await fixture.module('shared/ai-tiers.ts');
  for (const tier of shared.tierOrder) {
    assert.deepEqual(Array.from(catalog.AI_TIERS[tier].models, model => model.id), Array.from(shared.tierModels[tier], model => model.id));
  }
  for (const prompt of ['hello', 'api code', 'reasoning', 'abliterated']) {
    const decision = catalog.autoRouteQuery(prompt, true);
    assert.ok(shared.modelBelongsToTier(decision.model.id, decision.tierId));
  }
  fixture.storage.set(catalog.OLLAMA_CONFIG_KEY, JSON.stringify({ selectedModelId: 'retired-model', adminSecret: 'obsolete-preference', isTierXUnlocked: true }));
  const config = catalog.getSavedOllamaConfig();
  assert.equal(config.isTierXUnlocked, false);
  assert.equal(config.adminSecret, undefined);
  assert.ok(shared.allTierModels.some(model => model.id === config.selectedModelId));
  assert.equal(JSON.parse(fixture.storage.get(catalog.OLLAMA_CONFIG_KEY)).adminSecret, undefined);
});
