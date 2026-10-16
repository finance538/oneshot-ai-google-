import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';

async function harness(user) {
  const rows = new Map();
  const context = vm.createContext({ Request, Response, URL, Date });
  const schema = { ownerId: 'owner_id' };
  const db = {
    insert() { return { values(value) { return { onConflictDoUpdate({ set }) {
      rows.set(value.ownerId, rows.has(value.ownerId) ? { ...rows.get(value.ownerId), ...set } : value);
      return { returning: async () => [rows.get(value.ownerId)] };
    } }; } }; },
    select() { return { from() { return { where: async condition => rows.has(condition.value) ? [rows.get(condition.value)] : [] }; } }; },
  };
  class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
  const dependencies = {
    'drizzle-orm': { eq: (column, value) => ({ column, value }) },
    'drizzle-orm/netlify-db': { drizzle: () => db },
    '../../db/schema.js': { customerProfiles: schema },
    '../lib/platform.js': {
      HttpError,
      owner: async () => { if (!user) throw new HttpError(401, 'Unauthorized'); return user; },
      reply: (data, status = 200) => Response.json(data, { status }),
      failure: error => Response.json({ error: error.message }, { status: error.status || 503 }),
      sameOrigin: req => { if (req.headers.get('origin') !== new URL(req.url).origin) throw new HttpError(403, 'Origin'); },
      jsonBody: req => req.json(),
      text: (value, max) => { if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw new HttpError(400, 'Invalid'); return value.trim(); },
    },
  };
  const source = stripTypeScriptTypes(await readFile('netlify/functions/customer-profile.mts', 'utf8'), { mode: 'transform' });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(async name => {
    const exports = dependencies[name];
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
  });
  await module.evaluate();
  return { handler: module.namespace.default, rows };
}
const user = { id: 'customer-a', email: 'customer@example.test', confirmedAt: '2026-10-01', userMetadata: { full_name: 'Customer' } };
const request = body => new Request('https://example.test/.netlify/functions/customer-profile', body ? { method: 'POST', headers: { origin: 'https://example.test', 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});

test('profile requires an authenticated, confirmed customer', async () => {
  for (const [identity, status] of [[null, 401], [{ ...user, confirmedAt: undefined }, 403]]) {
    const { handler, rows } = await harness(identity);
    assert.equal((await handler(request())).status, status);
    assert.equal(rows.size, 0);
  }
});
test('profile creation is idempotent and does not overwrite edited details', async () => {
  const { handler, rows } = await harness(user);
  await handler(request());
  await handler(request({ fullName: 'Updated name', phone: '+966 555 123456' }));
  const result = await (await handler(request())).json();
  assert.equal(rows.size, 1);
  assert.equal(result.profile.fullName, 'Updated name');
  assert.equal(result.profile.phone, '+966 555 123456');
});
test('submitted owner and email cannot target another customer', async () => {
  const { handler, rows } = await harness(user);
  const response = await handler(request({ fullName: 'My name', phone: '', ownerId: 'customer-b', email: 'other@example.test' }));
  assert.equal(response.status, 200);
  assert.equal(rows.has('customer-b'), false);
  assert.equal(rows.get(user.id).email, user.email);
});
test('invalid profile fields and cross-origin changes are rejected', async () => {
  const { handler, rows } = await harness(user);
  for (const body of [{ fullName: ' ' }, { fullName: 'a'.repeat(101) }, { fullName: 'Customer', phone: '<script>' }]) {
    assert.equal((await handler(request(body))).status, 400);
  }
  assert.equal((await handler(new Request('https://example.test/profile', { method: 'POST', headers: { origin: 'https://other.test' } }))).status, 403);
  assert.equal(rows.size, 0);
});
test('unsupported methods cannot modify profiles', async () => {
  const { handler } = await harness(user);
  assert.equal((await handler(new Request('https://example.test/profile', { method: 'DELETE' }))).status, 405);
});
