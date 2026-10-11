import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import { stripTypeScriptTypes } from 'node:module';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const tenantId = '10000000-0000-4000-8000-000000000001';
const eventId = '20000000-0000-4000-8000-000000000002';
const requestId = '30000000-0000-4000-8000-000000000003';
const administrator = { id: 'administrator', appMetadata: { roles: ['admin'] } };
const root = path.resolve('.');

async function harness({ user = administrator, context = 'deploy-preview', selections = [], failAudit = false, failCapture = false, env = {}, fetchResponses = [] } = {}) {
  const trace = [];
  const logs = [];
  const network = [];
  async function mockFetch(url, options = {}) {
    network.push({ url, method: options.method, body: options.body, redirect: options.redirect, authorized: Boolean(options.headers?.Authorization) });
    const response = fetchResponses.shift();
    if (response instanceof Error) throw response;
    if (response) return response;
    if (url === 'https://ollama.com/api/tags') return Response.json({ models: [{ name: 'fixture-cloud' }] });
    throw new Error('unexpected network request');
  }
  const dialect = new PgDialect();
  function chain(entry, result) {
    const builder = {
      then(resolve, reject) { return Promise.resolve(result).then(resolve, reject); },
    };
    for (const method of ['from', 'leftJoin', 'orderBy', 'limit', 'offset', 'for', 'values', 'onConflictDoNothing', 'onConflictDoUpdate', 'returning', 'where']) {
      builder[method] = (...args) => {
        entry[method] = args;
        if (method === 'where' && args[0]) entry.whereSQL = dialect.sqlToQuery(args[0]);
        if (method === 'leftJoin' && args[1]) entry.joinSQL = dialect.sqlToQuery(args[1]);
        return builder;
      };
    }
    return builder;
  }
  const db = {
    select(fields) {
      const entry = { operation: 'select', fields };
      trace.push(entry);
      return chain(entry, selections.shift() ?? []);
    },
    insert(table) {
      const name = getTableName(table);
      if (name === 'operations_audit' && failAudit) throw new Error('test audit failure');
      if (name === 'operations_events' && failCapture) throw new Error('untrusted provider diagnostic');
      const entry = { operation: 'insert', table: name };
      trace.push(entry);
      return chain(entry, name === 'payment_rate_limits' ? [{ count: 1 }] : [{ id: requestId }]);
    },
    delete(table) {
      const entry = { operation: 'delete', table: getTableName(table) };
      trace.push(entry);
      return chain(entry, []);
    },
    async transaction(callback) {
      trace.push({ operation: 'begin' });
      try { const result = await callback(db); trace.push({ operation: 'commit' }); return result; }
      catch (error) { trace.push({ operation: 'rollback' }); throw error; }
    },
  };
  const sandbox = vm.createContext({ Request, Response, URL, Buffer, AbortSignal, fetch: mockFetch, console: { error: message => logs.push(message) }, process: { env: { CONTEXT: context, ...env } } });
  const cache = new Map();
  async function synthetic(key, exports) {
    if (!cache.has(key)) cache.set(key, new vm.SyntheticModule(Object.keys(exports), function () { for (const [name, value] of Object.entries(exports)) this.setExport(name, value); }, { context: sandbox, identifier: key }));
    return cache.get(key);
  }
  async function load(identifier) {
    if (cache.has(identifier)) return cache.get(identifier);
    if (identifier === path.join(root, 'db/index.ts')) return synthetic(identifier, { database: () => db });
    if (identifier === '@netlify/identity') return synthetic(identifier, { getUser: async () => user });
    if (!path.isAbsolute(identifier)) return synthetic(identifier, await import(identifier));
    const source = await readFile(identifier, 'utf8');
    const code = stripTypeScriptTypes(source, { mode: 'transform' });
    const module = new vm.SourceTextModule(code, { context: sandbox, identifier });
    cache.set(identifier, module);
    return module;
  }
  async function module(file) {
    const target = await load(path.resolve(file));
    if (target.status === 'unlinked') await target.link((specifier, importer) => {
      if (!specifier.startsWith('.')) return load(specifier);
      const resolved = path.resolve(path.dirname(importer.identifier), specifier).replace(/\.js$/, '.ts');
      return load(resolved);
    });
    if (target.status !== 'evaluated') await target.evaluate();
    return target.namespace;
  }
  return { module, trace, db, logs, network };
}

function post(body, origin = 'https://preview.example') {
  return new Request('https://preview.example/.netlify/functions/operations', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('preview guard denies production, branch deploys, dev and absent context', async () => {
  const fixture = await harness();
  const { previewOnly } = await fixture.module('shared/operations.ts');
  for (const context of ['production', 'branch-deploy', 'dev', undefined]) assert.equal(previewOnly(context), false);
  assert.equal(previewOnly('deploy-preview'), true);
  const production = await harness({ context: 'production' });
  const endpoint = await production.module('netlify/functions/operations.mts');
  assert.equal((await endpoint.default(post({ action: 'set-read', id: eventId, read: true, confirmation: true }))).status, 403);
  assert.equal(production.trace.length, 0);
});

test('monitoring endpoint requires server verified admin role', async () => {
  for (const [user, status] of [[null, 401], [{ id: 'merchant', appMetadata: { roles: ['merchant'] } }, 403], [{ id: 'spoofed', userMetadata: { roles: ['admin'] } }, 403]]) {
    const fixture = await harness({ user });
    const endpoint = await fixture.module('netlify/functions/operations.mts');
    assert.equal((await endpoint.default(new Request('https://preview.example/.netlify/functions/operations'))).status, status);
    assert.equal((await endpoint.default(post({ action: 'request-api-setup', merchantId: tenantId, confirmation: true }))).status, status);
    assert.equal(fixture.trace.length, 0);
  }
});

test('same origin, strict body fields, explicit confirmation and methods are enforced', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/operations.mts');
  assert.equal((await endpoint.default(post({}, 'https://untrusted.example'))).status, 403);
  assert.equal((await endpoint.default(post({ action: 'request-api-setup', merchantId: tenantId, confirmation: true, credentials: 'forbidden' }))).status, 400);
  assert.equal((await endpoint.default(post({ action: 'set-read', id: eventId, read: true }))).status, 400);
  assert.equal((await endpoint.default(post({ action: 'set-read', id: eventId, read: true, confirmation: 'true' }))).status, 400);
  assert.equal((await endpoint.default(new Request('https://preview.example/.netlify/functions/operations', { method: 'DELETE' }))).status, 405);
  assert.equal(fixture.trace.some(entry => entry.operation === 'begin'), false);
});

test('search rejects PII, SQL wildcard/injection, unknown kinds and unbounded offsets', async () => {
  const fixture = await harness();
  const { parseOperationsQuery } = await fixture.module('shared/operations.ts');
  for (const input of [{ query: 'contact@example.test' }, { query: "' OR 1=1" }, { query: '%' }, { query: 'x'.repeat(101) }, { kind: 'credentials' }, { offset: -1 }, { offset: 10001 }, { offset: 0.5 }, { unread: 'true' }, { actorId: 'other-admin' }]) assert.throws(() => parseOperationsQuery(input));
  assert.equal(parseOperationsQuery({ query: 'GATEWAY_REQUEST', offset: '50', unread: true }).query, 'gateway_request');
});

test('provider boundaries remain disabled and forged execution is refused', async () => {
  const fixture = await harness();
  const shared = await fixture.module('shared/operations.ts');
  assert.equal(shared.providerBoundaries().length, 6);
  assert.equal(shared.providerBoundaries().every(provider => provider.available === false), true);
  const library = await fixture.module('netlify/lib/operations.ts');
  for (const action of ['send-email', 'sign-contract', 'research', 'run-browser', 'connect-api']) await assert.rejects(library.mutateOperations(administrator.id, { action, confirmation: true }), error => error.status === 409);
  assert.equal(fixture.trace.length, 0);
});

test('read state is scoped to the verified actor and audited in the same transaction', async () => {
  const fixture = await harness({ selections: [[{ merchantId: tenantId }]] });
  const library = await fixture.module('netlify/lib/operations.ts');
  await library.mutateOperations(administrator.id, { action: 'set-read', id: eventId, read: true, confirmation: true });
  const receipt = fixture.trace.find(entry => entry.table === 'operations_receipts');
  assert.equal(receipt.values[0].actorId, administrator.id);
  assert.equal(receipt.values[0].eventId, eventId);
  assert.ok(receipt.onConflictDoNothing);
  const audit = fixture.trace.find(entry => entry.table === 'operations_audit');
  assert.equal(audit.values[0].action, 'alert_read');
  assert.equal(audit.values[0].merchantId, tenantId);
  assert.equal(fixture.trace.at(-1).operation, 'commit');
});

test('unread mutation never removes another administrator receipt', async () => {
  const fixture = await harness({ selections: [[{ merchantId: tenantId }]] });
  const library = await fixture.module('netlify/lib/operations.ts');
  await library.mutateOperations('second-admin', { action: 'set-read', id: eventId, read: false, confirmation: true });
  const deletion = fixture.trace.find(entry => entry.operation === 'delete');
  assert.deepEqual(deletion.whereSQL.params, [eventId, 'second-admin']);
  assert.equal(fixture.trace.find(entry => entry.table === 'operations_audit').values[0].action, 'alert_unread');
});

test('missing event or audit failure rolls back the reviewed change', async () => {
  const missing = await harness({ selections: [[]] });
  const missingLibrary = await missing.module('netlify/lib/operations.ts');
  await assert.rejects(missingLibrary.mutateOperations(administrator.id, { action: 'set-read', id: eventId, read: true, confirmation: true }), error => error.status === 404);
  assert.equal(missing.trace.at(-1).operation, 'rollback');
  const failure = await harness({ selections: [[{ merchantId: tenantId }]], failAudit: true });
  const failingLibrary = await failure.module('netlify/lib/operations.ts');
  await assert.rejects(failingLibrary.mutateOperations(administrator.id, { action: 'set-read', id: eventId, read: true, confirmation: true }));
  assert.equal(failure.trace.at(-1).operation, 'rollback');
  assert.equal(failure.trace.some(entry => entry.operation === 'commit'), false);
});

test('API setup requests validate tenant, reject duplicates and never connect or store secrets', async () => {
  const fixture = await harness({ selections: [[{ id: tenantId }], []] });
  const library = await fixture.module('netlify/lib/operations.ts');
  const result = await library.mutateOperations(administrator.id, { action: 'request-api-setup', merchantId: tenantId, confirmation: true });
  assert.equal(result.connected, false);
  assert.equal(result.status, 'pending_setup');
  const request = fixture.trace.find(entry => entry.table === 'operations_connection_requests');
  assert.deepEqual(Object.keys(request.values[0]).sort(), ['actorId', 'merchantId']);
  assert.equal(request.values[0].merchantId, tenantId);
  assert.equal(fixture.trace.find(entry => entry.table === 'operations_events').values[0].kind, 'api_request');
  assert.equal(fixture.trace.find(entry => entry.table === 'operations_audit').values[0].action, 'api_setup_requested');
  assert.equal(fixture.trace.at(-1).operation, 'commit');
  for (const [selections, status] of [[[[]], 404], [[[{ id: tenantId }], [{ id: requestId }]], 409]]) {
    const rejected = await harness({ selections });
    const rejectedLibrary = await rejected.module('netlify/lib/operations.ts');
    await assert.rejects(rejectedLibrary.mutateOperations(administrator.id, { action: 'request-api-setup', merchantId: tenantId, confirmation: true }), error => error.status === status);
    assert.equal(rejected.trace.some(entry => entry.operation === 'insert'), false);
  }
});

test('search paginates redacted fields, filters tenant, and binds receipts to actor', async () => {
  const records = Array.from({ length: 51 }, (_, position) => ({ id: `${position}`, kind: 'gateway_request', subjectId: requestId, merchantId: tenantId, provider: 'telr', createdAt: new Date(), read: false }));
  const fixture = await harness({ selections: [records, [{ unread: 7 }], [], [{ policy: { aiEnabled: false } }]] });
  const library = await fixture.module('netlify/lib/operations.ts');
  const result = await library.readOperations('admin-reader', { merchantId: tenantId, kind: 'gateway_request', query: 'gateway_request', unread: true, offset: 50 });
  assert.equal(result.records.length, 50);
  assert.equal(result.hasMore, true);
  assert.equal(result.unread, 7);
  assert.equal(result.aiAvailable, false);
  const selection = fixture.trace[0];
  assert.deepEqual(Object.keys(selection.fields).sort(), ['createdAt', 'id', 'kind', 'merchantId', 'provider', 'read', 'subjectId']);
  assert.ok(selection.joinSQL.params.includes('admin-reader'));
  assert.ok(selection.whereSQL.params.includes(tenantId));
  assert.ok(selection.whereSQL.params.includes('%gateway\\_request%'));
  assert.equal(selection.limit[0], 51);
  assert.equal(selection.offset[0], 50);
});

test('Identity hooks persist only identifiers, deduplicate events and leave auth unchanged', async () => {
  const fixture = await harness({ selections: [[{ id: tenantId }], [{ id: tenantId }]] });
  const hooks = await fixture.module('netlify/functions/operations-identity.mts');
  const user = { id: 'identity-user', email: 'private@example.test', userMetadata: { full_name: 'Private Name' }, lastSignInAt: '2026-10-04T15:00:00Z' };
  const event = { user, deny() { throw new Error('authentication must not be modified'); } };
  assert.equal(await hooks.default.userSignup(event), undefined);
  assert.equal(await hooks.default.userLogin(event), undefined);
  for (const entry of fixture.trace.filter(entry => entry.table === 'operations_events')) {
    assert.equal(entry.values[0].subjectId, user.id);
    assert.equal(entry.values[0].merchantId, tenantId);
    assert.ok(entry.onConflictDoNothing);
    assert.equal(JSON.stringify(entry.values).includes(user.email), false);
    assert.equal(JSON.stringify(entry.values).includes('Private Name'), false);
  }
  assert.equal(hooks.config.background, true);
  const production = await harness({ context: 'production' });
  const productionHooks = await production.module('netlify/functions/operations-identity.mts');
  await productionHooks.default.userLogin(event);
  assert.equal(production.trace.length, 0);
});

test('session capture uses only server verified timestamps, deduplicates and never invents sign-ins', async () => {
  const fixture = await harness();
  const library = await fixture.module('netlify/lib/operations.ts');
  const user = { id: 'verified-session', createdAt: '2026-10-01T09:00:00Z', lastSignInAt: '2026-10-04T12:00:00Z', email: 'private@example.test' };
  await library.captureVerifiedIdentity(fixture.db, user, tenantId);
  const events = fixture.trace.filter(entry => entry.table === 'operations_events');
  assert.equal(events.length, 2);
  assert.equal(events[0].values[0].kind, 'customer_registration');
  assert.equal(events[1].values[0].kind, 'sign_in');
  assert.equal(events[1].values[0].sourceKey, 'identity-login:verified-session:2026-10-04T12:00:00.000Z');
  assert.equal(events[1].values[0].createdAt.toISOString(), '2026-10-04T12:00:00.000Z');
  for (const event of events) { assert.ok(event.onConflictDoNothing); assert.equal(JSON.stringify(event.values).includes(user.email), false); }
  const noTimestamp = await harness();
  const noTimestampLibrary = await noTimestamp.module('netlify/lib/operations.ts');
  await noTimestampLibrary.captureVerifiedIdentity(noTimestamp.db, { id: user.id, lastSignInAt: 'invalid' }, tenantId);
  await noTimestampLibrary.captureVerifiedIdentity(noTimestamp.db, { id: user.id, lastSignInAt: '2999-01-01T00:00:00Z' }, tenantId);
  assert.equal(noTimestamp.trace.length, 0);
  const production = await harness({ context: 'production' });
  const productionLibrary = await production.module('netlify/lib/operations.ts');
  await productionLibrary.captureVerifiedIdentity(production.db, user, tenantId);
  assert.equal(production.trace.length, 0);
});

test('Identity observer failures do not deny authentication or expose diagnostics', async () => {
  const fixture = await harness({ selections: [[]], failCapture: true });
  const hooks = await fixture.module('netlify/functions/operations-identity.mts');
  assert.equal(await hooks.default.userLogin({ user: { id: 'observed-account' }, deny() { throw new Error('denial is forbidden'); } }), undefined);
  assert.equal(fixture.logs.length, 1);
  assert.equal(fixture.logs[0].includes('untrusted provider diagnostic'), false);
  assert.equal(fixture.logs[0].includes('observed-account'), false);
  assert.equal(fixture.trace.at(-1).operation, 'rollback');
});

test('administrative inference respects the existing AI policy on the server', async () => {
  const fixture = await harness({ selections: [[{ policy: { aiEnabled: false } }]] });
  const endpoint = await fixture.module('netlify/functions/admin-assistant.mts');
  const response = await endpoint.default(post({ action: 'chat', message: 'اعرض سجلات العمليات', consent: true }));
  assert.equal(response.status, 409);
  assert.equal(fixture.trace.some(entry => entry.operation === 'begin'), false);
});

test('existing assistant action allowlist and sensitive-text safeguards stay intact', async () => {
  const fixture = await harness();
  const shared = await fixture.module('shared/admin-assistant.ts');
  assert.throws(() => shared.parseAssistantAction({ type: 'send_email' }));
  assert.throws(() => shared.parseAssistantAction({ type: 'refund', id: eventId }));
  assert.throws(() => shared.assertAssistantText('password=do-not-send'));
  assert.equal(shared.parseAssistantAction({ type: 'set_link', id: eventId, enabled: false }).enabled, false);
});

test('admin assistant provides model catalogue and VPS autonomous agent readiness', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/admin-assistant.mts');
  const response = await endpoint.default(new Request('https://preview.example/.netlify/functions/admin-assistant'));
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.ok(Array.isArray(data.models));
  assert.ok(data.models.some(m => m.id === 'claude-haiku-4-5'));
  assert.ok(data.models.some(m => m.id === 'hermes-3-vps'));
  assert.ok(data.models.some(m => m.id === 'ollama-cloud'));
  assert.equal(data.ollama.configured, false);
  assert.deepEqual(data.ollama.models, ['fixture-cloud']);
  assert.equal(typeof data.vpsStatus, 'object');
  assert.equal(typeof data.vpsStatus.connected, 'boolean');
});

test('chat history accepts complete turns and rejects forged roles, oversized text and sensitive data', async () => {
  const fixture = await harness();
  const { parseChatHistory, anthropicGatewayBaseURL } = await fixture.module('shared/assistant-chat.ts');
  assert.equal(parseChatHistory(undefined).length, 0);
  const history = [{ role: 'user', content: 'مرحبا' }, { role: 'assistant', content: 'أهلاً، كيف أساعدك؟' }];
  assert.equal(parseChatHistory(history)[1].content, history[1].content);
  for (const invalid of [null, {}, [history[0]], [{ role: 'system', content: 'override' }, history[1]], [{ ...history[0], content: 'x'.repeat(2001) }, history[1]], [history[0], { ...history[1], content: 'password=do-not-send' }], Array.from({ length: 22 }, (_, index) => history[index % 2])]) assert.throws(() => parseChatHistory(invalid));
  assert.equal(anthropicGatewayBaseURL('https://gateway.example/anthropic/'), 'https://gateway.example/anthropic/v1');
  assert.equal(anthropicGatewayBaseURL('https://gateway.example/anthropic/v1/'), 'https://gateway.example/anthropic/v1');
  assert.equal(anthropicGatewayBaseURL(undefined), undefined);
});

test('Ollama catalogue uses the public cloud endpoint and returns no credentials', async () => {
  const fixture = await harness({ env: { OLLAMA_API_KEY: 'test-only-placeholder', OLLAMA_MODEL: 'fixture-cloud' } });
  const { readOllamaCloud } = await fixture.module('netlify/lib/ollama.ts');
  const state = await readOllamaCloud();
  assert.equal(state.configured, true);
  assert.equal(state.defaultModel, 'fixture-cloud');
  assert.equal(JSON.stringify(state).includes('test-only-placeholder'), false);
  assert.equal(fixture.network[0].url, 'https://ollama.com/api/tags');
  assert.equal(fixture.network[0].authorized, false);
  assert.equal(fixture.network[0].redirect, 'error');
});

test('Ollama catalogue failures are redacted and malformed model names are discarded', async () => {
  const failed = await harness({ fetchResponses: [new Error('untrusted provider diagnostic')] });
  const failedLibrary = await failed.module('netlify/lib/ollama.ts');
  const failedState = await failedLibrary.readOllamaCloud();
  assert.ok(failedState.error);
  assert.equal(failedState.error.includes('untrusted provider diagnostic'), false);
  const valid = await harness({ fetchResponses: [Response.json({ models: [{ name: 'fixture-cloud' }, { name: 'fixture-cloud' }, { name: '<script>' }, null] })] });
  const { readOllamaCloud } = await valid.module('netlify/lib/ollama.ts');
  const state = await readOllamaCloud();
  assert.equal(state.models.length, 1);
  assert.equal(state.models[0], 'fixture-cloud');
});

test('Ollama chat requires server credentials and an allowlisted cloud model', async () => {
  const missing = await harness();
  const missingLibrary = await missing.module('netlify/lib/ollama.ts');
  await assert.rejects(missingLibrary.chatWithOllama('fixture-cloud', [], 'مرحبا'), error => error.status === 503);
  assert.equal(missing.network.length, 0);
  const fixture = await harness({ env: { OLLAMA_API_KEY: 'test-only-placeholder' } });
  const { chatWithOllama } = await fixture.module('netlify/lib/ollama.ts');
  await assert.rejects(chatWithOllama('unlisted-model', [], 'مرحبا'), error => error.status === 400);
  assert.equal(fixture.network.some(call => call.url.endsWith('/chat')), false);
});

test('Ollama chat forwards bounded history and uses authenticated cloud chat without redirects', async () => {
  const fixture = await harness({ env: { OLLAMA_API_KEY: 'test-only-placeholder' }, fetchResponses: [Response.json({ models: [{ name: 'fixture-cloud' }] }), Response.json({ done: true, message: { role: 'assistant', content: 'أهلاً، هذه إجابتك.' } })] });
  const { chatWithOllama } = await fixture.module('netlify/lib/ollama.ts');
  const history = [{ role: 'user', content: 'اكتب لي رسالة' }, { role: 'assistant', content: 'ما موضوعها؟' }];
  const result = await chatWithOllama('fixture-cloud', history, 'رسالة شكر');
  assert.equal(result.answer, 'أهلاً، هذه إجابتك.');
  assert.equal(result.routedTo, 'Ollama · fixture-cloud');
  const call = fixture.network[1];
  assert.equal(call.url, 'https://ollama.com/api/chat');
  assert.equal(call.authorized, true);
  assert.equal(call.redirect, 'error');
  const payload = JSON.parse(call.body);
  assert.equal(payload.stream, false);
  assert.equal(payload.messages[0].role, 'system');
  assert.deepEqual(payload.messages.slice(1, 3), history);
  assert.equal(payload.messages[3].content, 'رسالة شكر');
  assert.equal(call.body.includes('test-only-placeholder'), false);
});

test('Ollama failures never expose raw provider bodies or invalid assistant responses', async () => {
  for (const [response, status] of [[new Response('untrusted provider diagnostic', { status: 401 }), 503], [new Response('untrusted provider diagnostic', { status: 429 }), 429], [new Response('untrusted provider diagnostic', { status: 500 }), 502], [Response.json({ done: true, message: { role: 'assistant', content: 'password=do-not-send' } }), 502], [Response.json({ done: false, message: { role: 'assistant', content: 'partial' } }), 502], [Response.json({ done: true, message: { role: 'assistant', content: '' } }), 502], [new Error('untrusted provider diagnostic'), 504]]) {
    const fixture = await harness({ env: { OLLAMA_API_KEY: 'test-only-placeholder' }, fetchResponses: [Response.json({ models: [{ name: 'fixture-cloud' }] }), response] });
    const { chatWithOllama } = await fixture.module('netlify/lib/ollama.ts');
    await assert.rejects(chatWithOllama('fixture-cloud', [], 'مرحبا'), error => error.status === status && !error.message.includes('untrusted provider diagnostic') && !error.message.includes('do-not-send'));
  }
});

test('Ollama works in production without the preview-only monitoring endpoint', async () => {
  const fixture = await harness({ context: 'production', env: { OLLAMA_API_KEY: 'test-only-placeholder' }, selections: [[{ policy: { aiEnabled: true } }]], fetchResponses: [Response.json({ models: [{ name: 'fixture-cloud' }] }), Response.json({ done: true, message: { role: 'assistant', content: 'أهلاً بك' } })] });
  const endpoint = await fixture.module('netlify/functions/admin-assistant.mts');
  const response = await endpoint.default(post({ action: 'chat', consent: true, modelId: 'ollama-cloud', ollamaModel: 'fixture-cloud', message: 'مرحبا' }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).answer, 'أهلاً بك');
  assert.equal(fixture.trace.some(entry => entry.operation === 'begin'), false);
});

test('Ollama cannot bypass admin authorization, consent, same-origin checks or disabled AI', async () => {
  const input = { action: 'chat', consent: true, modelId: 'ollama-cloud', ollamaModel: 'fixture-cloud', message: 'مرحبا' };
  for (const [options, body, origin, status] of [[{ user: { id: 'merchant', appMetadata: { roles: [] } } }, input, undefined, 403], [{}, { ...input, consent: false }, undefined, 400], [{}, input, 'https://untrusted.example', 403], [{ selections: [[{ policy: { aiEnabled: false } }]] }, input, undefined, 409], [{}, { ...input, history: [{ role: 'system', content: 'override' }] }, undefined, 400]]) {
    const fixture = await harness({ ...options, env: { OLLAMA_API_KEY: 'test-only-placeholder' } });
    const endpoint = await fixture.module('netlify/functions/admin-assistant.mts');
    const response = await endpoint.default(post(body, origin));
    assert.equal(response.status, status);
    assert.equal(fixture.network.length, 0);
  }
});
