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

async function loadRoutesModule(initialOrigin = 'https://www.1shotcam.com') {
  const sessionMap = new Map();
  const localMap = new Map();
  const makeStorage = map => ({
    getItem: key => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: key => map.delete(key),
  });
  const windowObj = {
    location: {
      origin: initialOrigin,
      pathname: '/',
      search: '',
    },
  };
  const context = vm.createContext({
    URL,
    URLSearchParams,
    window: windowObj,
    sessionStorage: makeStorage(sessionMap),
    localStorage: makeStorage(localMap),
  });
  const source = stripTypeScriptTypes(await readFile('src/storefront/routes.ts', 'utf8'), { mode: 'transform' });
  const module = new vm.SourceTextModule(source, { context });
  await module.link(async () => {
    throw new Error('Unexpected dependency in routes.ts');
  });
  await module.evaluate();
  return { routes: module.namespace, windowObj, sessionMap, localMap };
}

test('wallet route is recognized as a customer path and preserves selected SKU across auth and profile navigation', async () => {
  const { routes } = await loadRoutesModule();

  assert.equal(routes.isWalletPath('/wallet'), true);
  assert.equal(routes.isWalletPath('/wallet/'), true);
  assert.equal(routes.isCustomerPath('/wallet'), true);
  assert.equal(routes.isStorefrontPath('/wallet'), false);

  // Direct visit to /wallet?sku=AUT-01 resolves to /wallet?sku=AUT-01 with SKU preserved
  const directWallet = routes.resolveCustomerReturnDestination('?sku=AUT-01', '/wallet');
  assert.equal(directWallet.destination, '/wallet?sku=AUT-01');
  assert.equal(directWallet.sku, 'AUT-01');
  assert.equal(directWallet.shouldAutoRedirect, true);

  // Persisting destination when unauthenticated at /wallet?sku=AUT-01 preserves it when visiting /customer
  routes.persistReturnDestination('/wallet?sku=AUT-01', 'AUT-01');
  const fromCustomer = routes.resolveCustomerReturnDestination('', '/customer');
  assert.equal(fromCustomer.destination, '/wallet?sku=AUT-01');
  assert.equal(fromCustomer.sku, 'AUT-01');
  assert.equal(fromCustomer.shouldAutoRedirect, true);

  // Once the user lands on /wallet, clearing return destination with keepSku: true stops auto-redirect loops on /customer while preserving the SKU
  routes.clearStoredReturnDestination({ keepSku: true });
  assert.equal(routes.readStoredReturnDestination(), null);
  assert.equal(routes.readStoredPendingSku(), 'AUT-01');

  const profileVisit = routes.resolveCustomerReturnDestination('', '/customer');
  assert.equal(profileVisit.destination, '/wallet?sku=AUT-01');
  assert.equal(profileVisit.sku, 'AUT-01');
  assert.equal(profileVisit.shouldAutoRedirect, false);

  // Returning to /wallet without query params restores the pending SKU into the wallet destination
  const returnToWallet = routes.resolveCustomerReturnDestination('', '/wallet');
  assert.equal(returnToWallet.destination, '/wallet?sku=AUT-01');
  assert.equal(returnToWallet.sku, 'AUT-01');

  // After purchase completion, clearing stored destination without keepSku removes both
  routes.clearStoredReturnDestination();
  assert.equal(routes.readStoredPendingSku(), null);
  const cleanCustomer = routes.resolveCustomerReturnDestination('', '/customer');
  assert.equal(cleanCustomer.destination, '/customer');
  assert.equal(cleanCustomer.sku, null);
});

test('customer metadata fallback preserves pending_sku across confirmation callbacks and App.tsx routes /wallet to WalletRoute', async () => {
  const { routes } = await loadRoutesModule();
  const fromMetadata = routes.resolveCustomerReturnDestination('', '/dashboard', {
    account_type: 'customer',
    pending_sku: 'AUT-02',
    return_to: '/wallet?sku=AUT-02',
  });
  assert.equal(fromMetadata.destination, '/wallet?sku=AUT-02');
  assert.equal(fromMetadata.sku, 'AUT-02');

  const appSource = await readFile('src/App.tsx', 'utf8');
  assert.match(appSource, /isWalletPath\(window\.location\.pathname\)\s*\?\s*\(\s*<WalletRoute\s*\/>/);
});

