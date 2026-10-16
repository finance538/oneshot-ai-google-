import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';
import * as workspace from '../shared/testing-workspace.ts';

async function harness() {
  const rows = new Map();
  const registrations = new Map();
  let user = { id: 'loader-a', admin: false };
  registrations.set(user.id, { ownerId: user.id, role: 'loader', status: 'approved' });
  const schemas = { accountRegistrations: { ownerId: 'ownerId' }, testingWorkspaces: { ownerId: 'ownerId', version: 'version' } };
  const matches = (row, condition) => Array.isArray(condition) ? condition.every(part => matches(row, part)) : row[condition.column] === condition.value;
  const db = {
    select() { return { from(table) { return { where: async condition => [...(table === schemas.accountRegistrations ? registrations : rows).values()].filter(row => matches(row, condition)) }; } }; },
    insert() { return { values(row) { return { onConflictDoNothing() { return { returning: async () => {
      if (rows.has(row.ownerId)) return [];
      rows.set(row.ownerId, row); return [row];
    } }; } }; } }; },
    update() { return { set(patch) { return { where(condition) { return { returning: async () => {
      const row = [...rows.values()].find(item => matches(item, condition));
      if (!row) return [];
      const updated = { ...row, ...patch }; rows.set(row.ownerId, updated); return [updated];
    } }; } }; } }; },
  };
  class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const context = vm.createContext({ Request, Response, URL, Date });
  const dependencies = {
    'drizzle-orm': { eq: (column, value) => ({ column, value }), and: (...conditions) => conditions },
    '../../db/index.js': { database: () => db },
    '../../db/schema.js': schemas,
    '../../shared/testing-workspace.js': workspace,
    '../lib/platform.js': {
      HttpError,
      owner: async () => { if (!user) throw new HttpError(401, 'Unauthorized'); return user; },
      isAdmin: identity => identity.admin === true,
      sameOrigin: req => { if (req.headers.get('origin') !== new URL(req.url).origin) throw new HttpError(403, 'Origin'); },
      reply: (body, status = 200) => Response.json(body, { status }),
      failure: error => Response.json({ error: error.message }, { status: error.status || 503 }),
      throttle: async () => {},
      jsonBody: async (req, max) => {
        if (!req.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Content type');
        const raw = await req.text(); if (raw.length > max) throw new HttpError(413, 'Size');
        try { return JSON.parse(raw); } catch { throw new HttpError(400, 'JSON'); }
      },
    },
  };
  const source = stripTypeScriptTypes(await readFile('netlify/functions/testing-workspace.mts', 'utf8'), { mode: 'transform' });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(name => {
    const exports = dependencies[name];
    assert.ok(exports, `Unexpected dependency: ${name}`);
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return { handler: module.namespace.default, rows, registrations, signIn: identity => { user = identity; } };
}
const url = 'https://example.test/.netlify/functions/testing-workspace';
const request = body => new Request(url, body === undefined ? {} : { method: 'POST', headers: { origin: 'https://example.test', 'content-type': 'application/json' }, body: JSON.stringify(body) });
const save = (settings = workspace.defaultTestingSettings(), version = 0) => request({ settings, version });

test('tool permissions keep admin requests, suspended accounts, customers, and marketers out', async () => {
  const h = await harness();
  h.signIn(null);
  assert.equal((await h.handler(request())).status, 401);
  for (const [role, status] of [['admin', 'pending'], ['merchant', 'rejected'], ['loader', 'pending'], ['loader', 'rejected'], ['marketer', 'approved'], ['customer', 'approved']]) {
    h.signIn({ id: 'restricted' });
    h.registrations.set('restricted', { ownerId: 'restricted', role, status });
    assert.equal((await h.handler(request())).status, 403);
    assert.equal((await h.handler(save())).status, 403);
  }
  assert.equal(h.rows.size, 0);
});

test('existing approved merchants, loaders, and actual administrators retain access', async () => {
  const h = await harness();
  for (const role of ['merchant', 'loader']) {
    h.signIn({ id: role });
    h.registrations.set(role, { ownerId: role, role, status: 'approved' });
    const response = await h.handler(request());
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).settings, workspace.defaultTestingSettings());
  }
  h.signIn({ id: 'admin', admin: true });
  assert.equal((await h.handler(request())).status, 200);
  assert.equal(h.rows.size, 0, 'reading defaults does not write or replace a profile');
});

test('saved settings survive reload and are scoped to the authenticated account', async () => {
  const h = await harness();
  const settings = workspace.defaultTestingSettings();
  settings.simulator.gatewayId = 'telr';
  settings.securityRules.geo_ip_mismatch = false;
  const response = await h.handler(request({ settings, version: 0, ownerId: 'loader-b' }));
  assert.equal(response.status, 200);
  assert.equal(h.rows.has('loader-b'), false);
  assert.deepEqual((await (await h.handler(request())).json()).settings, settings);
  h.registrations.set('loader-b', { ownerId: 'loader-b', role: 'loader', status: 'approved' });
  h.signIn({ id: 'loader-b' });
  assert.equal((await (await h.handler(new Request(`${url}?ownerId=loader-a`))).json()).version, 0);
  assert.equal((await h.handler(save(settings, 1))).status, 409, 'a version from another account cannot update that account');
  assert.equal((await h.handler(save())).status, 200);
  assert.equal(h.rows.size, 2);
  assert.equal(h.rows.get('loader-a').settings.simulator.gatewayId, 'telr');
  assert.equal(h.rows.get('loader-b').settings.simulator.gatewayId, 'paytabs');
});

test('first-save races and stale updates cannot overwrite saved settings', async () => {
  const h = await harness();
  assert.equal((await h.handler(save())).status, 200);
  const revised = workspace.defaultTestingSettings(); revised.simulator.gatewayId = 'tap';
  assert.equal((await h.handler(save(revised))).status, 409);
  assert.equal((await h.handler(save(revised, 1))).status, 200);
  assert.equal((await h.handler(save(workspace.defaultTestingSettings(), 1))).status, 409);
  const record = await (await h.handler(request())).json();
  assert.equal(record.version, 2); assert.equal(record.settings.simulator.gatewayId, 'tap');
});

test('malformed settings, credentials, unsupported gateways, and invalid versions are rejected', async () => {
  const h = await harness();
  const defaults = workspace.defaultTestingSettings();
  for (const settings of [
    {}, { ...defaults, apiKey: 'unrecognized-field' },
    { ...defaults, simulator: { ...defaults.simulator, cardNumber: 'not-accepted' } },
    { ...defaults, simulator: { ...defaults.simulator, activeIp: '999.999.999.999' } },
    { ...defaults, simulator: { ...defaults.simulator, gatewayId: 'unknown' } },
    { ...defaults, securityRules: { ...defaults.securityRules, geo_ip_mismatch: 'false' } },
  ]) assert.equal((await h.handler(save(settings))).status, 400);
  for (const version of [-1, 1.5, '1', 2147483647, null]) assert.equal((await h.handler(save(defaults, version))).status, 400);
  assert.equal(h.rows.size, 0);
});

test('cross-origin requests, unsupported methods, and oversized requests cannot save', async () => {
  const h = await harness();
  assert.equal((await h.handler(new Request(url, { method: 'POST', headers: { origin: 'https://foreign.test' } }))).status, 403);
  assert.equal((await h.handler(new Request(url, { method: 'DELETE' }))).status, 405);
  assert.equal((await h.handler(request({ settings: 'x'.repeat(17000), version: 0 }))).status, 413);
  assert.equal(h.rows.size, 0);
});

test('legacy recovery imports only supported settings and does not mutate or delete the original', () => {
  const defaults = workspace.defaultTestingSettings();
  const storage = new Map([
    ['oneshot_security_systems', JSON.stringify([{ id: 'geo_ip_mismatch', enabled: false, name: 'old label' }, { id: 'unknown', enabled: false }])],
    ['oneshot_test_active_proxy', JSON.stringify({ code: 'GB', name: 'London', ip: '192.0.2.12', isp: 'Example', ping: '95ms' })],
    ['identity-session', 'must not be read'],
  ]);
  const reads = [];
  const imported = workspace.importLegacyTestingSettings(defaults, key => { reads.push(key); return storage.get(key) ?? null; });
  assert.equal(imported.securityRules.geo_ip_mismatch, false);
  assert.equal(imported.simulator.activeIp, '192.0.2.12');
  assert.equal(defaults.securityRules.geo_ip_mismatch, true);
  assert.equal(reads.includes('identity-session'), false);
  assert.equal(storage.size, 3);
  assert.equal(workspace.importLegacyTestingSettings(defaults, () => null), null);
  assert.throws(() => workspace.importLegacyTestingSettings(defaults, () => '{invalid'));
});

test('restored navigation exposes tools without granting administrator access', () => {
  assert.equal(workspace.requestedWorkspaceView('/tester/'), 'loader');
  assert.equal(workspace.requestedWorkspaceView('/loader'), 'loader');
  assert.equal(workspace.requestedWorkspaceView('/merchant'), 'overview');
  assert.ok(workspace.merchantViews.includes('security'));
  assert.ok(workspace.merchantViews.includes('loader'));
  assert.equal(workspace.merchantViews.includes('admin'), false);
  assert.equal(workspace.merchantViews.includes('assistant'), false);
  assert.ok(workspace.adminViews.includes('assistant'));
  assert.equal(workspace.canUseTestingTools({ accountRole: 'admin', registrationStatus: 'approved' }), false);
});
