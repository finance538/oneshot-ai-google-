import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const walletId = '10000000-0000-4000-8000-000000000001';
const documentId = '20000000-0000-4000-8000-000000000002';
const requestId = '30000000-0000-4000-8000-000000000003';
const merchantId = '40000000-0000-4000-8000-000000000004';
const customer = { id: 'customer-a', email: 'customer@example.test', name: 'Customer' };
const root = path.resolve('.');
const paytabsPrefix = `PAYTABS_${merchantId.replaceAll('-', '').toUpperCase()}`;
const gatewayFixture = { [`${paytabsPrefix}_PROFILE_ID`]: '1', [`${paytabsPrefix}_SERVER_KEY`]: 'noncredential-test-fixture', [`${paytabsPrefix}_API_BASE_URL`]: 'https://secure.paytabs.sa' };

async function harness({ user = customer, selections = {}, updates = {}, inserts = {}, env = {}, fetchResult } = {}) {
  const trace = [];
  const dialect = new PgDialect();
  const defaultSelections = { customer_wallets: [{ id: walletId, ownerId: customer.id, balance: 500000 }], site_payment_gateways: [] };
  function query(operation, table) {
    const entry = { operation, table: table ? getTableName(table) : undefined };
    trace.push(entry);
    const builder = {
      then(resolve, reject) {
        const source = operation === 'select' ? selections : operation === 'update' ? updates : inserts;
        const queued = source[entry.table];
        const fallback = operation === 'select' ? defaultSelections[entry.table] || [] : [{ id: operation === 'insert' && entry.table === 'payment_documents' ? documentId : requestId, ...entry.values, count: 1 }];
        return Promise.resolve(queued?.length ? queued.shift() : fallback).then(resolve, reject);
      },
    };
    for (const method of ['from', 'innerJoin', 'where', 'orderBy', 'limit', 'for', 'values', 'set', 'returning', 'onConflictDoNothing', 'onConflictDoUpdate']) {
      builder[method] = (...args) => {
        entry[method] = args[0];
        if (method === 'from') entry.table = getTableName(args[0]);
        if (method === 'where') entry.whereSQL = dialect.sqlToQuery(args[0]);
        if (method === 'set' && args[0].balance) entry.balanceSQL = dialect.sqlToQuery(args[0].balance);
        return builder;
      };
    }
    return builder;
  }
  const db = {
    select: () => query('select'),
    insert: table => query('insert', table),
    update: table => query('update', table),
    delete: table => query('delete', table),
    async transaction(callback) {
      trace.push({ operation: 'begin' });
      try { const result = await callback(db); trace.push({ operation: 'commit' }); return result; }
      catch (error) { trace.push({ operation: 'rollback' }); throw error; }
    },
  };
  const sandbox = vm.createContext({ Request, Response, URL, Buffer, Date, AbortSignal, process: { env }, fetch: async () => Response.json(fetchResult) });
  const cache = new Map();
  async function synthetic(identifier, exports) {
    const module = new vm.SyntheticModule(Object.keys(exports), function () { for (const [name, value] of Object.entries(exports)) this.setExport(name, value); }, { context: sandbox, identifier });
    cache.set(identifier, module);
    return module;
  }
  async function load(identifier) {
    if (cache.has(identifier)) return cache.get(identifier);
    if (identifier === path.join(root, 'db/index.ts')) return synthetic(identifier, { database: () => db });
    if (identifier === '@netlify/identity') return synthetic(identifier, { getUser: async () => user });
    if (!path.isAbsolute(identifier)) return synthetic(identifier, await import(identifier));
    const source = await readFile(identifier, 'utf8');
    const module = new vm.SourceTextModule(stripTypeScriptTypes(source, { mode: 'transform' }), { context: sandbox, identifier });
    cache.set(identifier, module);
    return module;
  }
  async function module(file) {
    const target = await load(path.resolve(file));
    if (target.status === 'unlinked') await target.link((specifier, importer) => load(specifier.startsWith('.') ? path.resolve(path.dirname(importer.identifier), specifier).replace(/\.js$/, '.ts') : specifier));
    if (target.status !== 'evaluated') await target.evaluate();
    return target.namespace;
  }
  return { trace, db, module };
}

function post(body, origin = 'https://preview.example') {
  return new Request('https://preview.example/.netlify/functions/wallet', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('wallet API requires authentication and same-origin money mutations', async () => {
  const anonymous = await harness({ user: null });
  const unauthenticated = await anonymous.module('netlify/functions/wallet.mts');
  assert.equal((await unauthenticated.default(post({ action: 'purchase', sku: 'AUT-01', requestId }))).status, 401);
  const customerFixture = await harness();
  const endpoint = await customerFixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'purchase', sku: 'AUT-01', requestId }, 'https://untrusted.example'))).status, 403);
  assert.equal(customerFixture.trace.some(entry => entry.operation === 'update'), false);
});

test('wallet creation is idempotent and scoped to the verified account', async () => {
  const fixture = await harness();
  const { ensureWallet } = await fixture.module('netlify/lib/wallet.ts');
  await ensureWallet(customer.id);
  const insertion = fixture.trace.find(entry => entry.operation === 'insert');
  assert.equal(insertion.values.ownerId, customer.id);
  assert.ok('onConflictDoNothing' in insertion);
  const selection = fixture.trace.find(entry => entry.operation === 'select');
  assert.deepEqual(selection.whereSQL.params, [customer.id]);
});

test('signup hook provisions a wallet in every deploy context', async () => {
  const fixture = await harness({ env: { CONTEXT: 'production' } });
  const hook = await fixture.module('netlify/functions/wallet-identity.mts');
  await hook.default.userSignup({ user: customer });
  assert.equal(fixture.trace.find(entry => entry.operation === 'insert').values.ownerId, customer.id);
});

test('wallet purchase ignores client prices, locks balance, and atomically records the debit', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  const response = await endpoint.default(post({ action: 'purchase', sku: 'AUT-01', amount: 1, ownerId: 'other-customer', requestId }));
  assert.equal(response.status, 201);
  const order = fixture.trace.find(entry => entry.table === 'wallet_service_orders' && entry.operation === 'insert');
  assert.equal(order.values.amount, 120000);
  assert.equal(order.values.walletId, walletId);
  const debit = fixture.trace.find(entry => entry.table === 'customer_wallets' && entry.operation === 'update');
  assert.match(debit.whereSQL.sql, />=/);
  assert.deepEqual(debit.whereSQL.params, [walletId, 120000]);
  assert.deepEqual(debit.balanceSQL.params, [120000]);
  assert.equal(fixture.trace.filter(entry => entry.for === 'update').length, 1);
  const ledger = fixture.trace.find(entry => entry.table === 'wallet_entries' && entry.operation === 'insert');
  assert.equal(ledger.values.amount, -120000);
  assert.equal(ledger.values.orderId, requestId);
  assert.equal(fixture.trace.at(-1).operation, 'commit');
});

test('insufficient funds roll back without creating orders or ledger entries', async () => {
  const fixture = await harness({ updates: { customer_wallets: [[]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'purchase', sku: 'AUT-01', requestId }))).status, 409);
  assert.equal(fixture.trace.at(-1).operation, 'rollback');
  assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_service_orders'), false);
});

test('repeating a purchase request returns the existing order without another debit', async () => {
  const fixture = await harness({ selections: { wallet_service_orders: [[{ id: requestId, sku: 'AUT-01', amount: 120000 }]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'purchase', sku: 'AUT-01', requestId }))).status, 201);
  assert.equal(fixture.trace.some(entry => entry.operation === 'update'), false);
});

test('a purchase idempotency key cannot be reused for another service', async () => {
  const fixture = await harness({ selections: { wallet_service_orders: [[{ id: requestId, sku: 'AUT-02' }]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'purchase', sku: 'AUT-01', requestId }))).status, 409);
});

test('unsupported services and missing request IDs are rejected before debiting', async () => {
  for (const body of [{ action: 'purchase', sku: 'not-a-service', requestId }, { action: 'purchase', sku: 'AUT-01' }]) {
    const fixture = await harness();
    const endpoint = await fixture.module('netlify/functions/wallet.mts');
    const response = await endpoint.default(post(body));
    assert.ok([400, 409].includes(response.status));
    assert.equal(fixture.trace.some(entry => entry.operation === 'update'), false);
  }
});

test('crediting a verified top-up uses a unique document ledger entry', async () => {
  const fixture = await harness({ selections: { wallet_topups: [[{ documentId, walletId }], [{ documentId, walletId }]] }, inserts: { wallet_entries: [[{ id: requestId }], []] } });
  const { creditTopup } = await fixture.module('netlify/lib/wallet.ts');
  await creditTopup(fixture.db, documentId, 25000);
  await creditTopup(fixture.db, documentId, 25000);
  assert.equal(fixture.trace.filter(entry => entry.operation === 'update').length, 1);
  const entry = fixture.trace.find(item => item.table === 'wallet_entries' && item.operation === 'insert');
  assert.equal(entry.values.documentId, documentId);
  assert.ok('onConflictDoNothing' in entry);
});

test('normal merchant documents never credit customer wallets', async () => {
  const fixture = await harness();
  const { creditTopup } = await fixture.module('netlify/lib/wallet.ts');
  await creditTopup(fixture.db, documentId, 25000);
  assert.equal(fixture.trace.some(entry => entry.operation === 'insert'), false);
});

test('verification cannot inspect another customer top-up', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'verify', id: documentId }))).status, 404);
  const lookup = fixture.trace.find(entry => entry.table === 'wallet_topups');
  assert.deepEqual(lookup.whereSQL.params, [documentId, walletId]);
});

test('customers cannot fulfill service orders or access the admin order list', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'fulfill', id: requestId }))).status, 403);
  const response = await endpoint.default(new Request('https://preview.example/.netlify/functions/wallet'));
  const data = await response.json();
  assert.equal(data.adminOrders, undefined);
  assert.equal(data.gateways.length, 0);
});

test('disconnected or paused site gateways cannot be used for top-ups', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'topup', gateway: 'paytabs', amount: 50, requestId }))).status, 409);
  assert.equal(fixture.trace.some(entry => entry.table === 'payment_documents' && entry.operation === 'insert'), false);
});

test('test-mode Telr connections are excluded from public wallet gateways', async () => {
  const prefix = `TELR_${merchantId.replaceAll('-', '').toUpperCase()}`;
  const fixture = await harness({ env: { [`${prefix}_STORE_ID`]: '1', [`${prefix}_SERVICE_API_KEY`]: 'test-fixture-key', [`${prefix}_TEST_MODE`]: 'true' }, selections: { site_payment_gateways: [[{ gateway: 'telr', merchantId }]] } });
  const { publicGateways } = await fixture.module('netlify/lib/wallet.ts');
  const { defaultPolicy } = await fixture.module('shared/policy.ts');
  assert.equal((await publicGateways(defaultPolicy)).length, 0);
});

test('payment redirects return wallet top-ups to the wallet without changing balance', async () => {
  const fixture = await harness({ selections: { wallet_topups: [[{ documentId, walletId }]] } });
  const endpoint = await fixture.module('netlify/functions/payment-return.mts');
  const response = await endpoint.default(new Request(`https://preview.example/.netlify/functions/payment-return?id=${documentId}`));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), `https://preview.example/wallet?topup=${documentId}`);
  assert.equal(fixture.trace.some(entry => entry.operation === 'update' || entry.operation === 'insert'), false);
});

test('site-wide top-ups use administrator credentials and never credit before payment', async () => {
  const fixture = await harness({ env: gatewayFixture, selections: { site_payment_gateways: [[{ gateway: 'paytabs', merchantId }]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  const response = await endpoint.default(post({ action: 'topup', gateway: 'paytabs', amount: '250.25', requestId }));
  assert.equal(response.status, 201);
  assert.equal((await response.json()).documentId, documentId);
  const document = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'payment_documents');
  assert.equal(document.values.merchantId, merchantId);
  assert.equal(document.values.amount, 25025);
  assert.equal(document.values.method, 'hosted');
  assert.equal(document.values.customerEmail, customer.email);
  const topup = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'wallet_topups');
  assert.equal(topup.values.walletId, walletId);
  assert.equal(fixture.trace.some(entry => entry.operation === 'update'), false);
  assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_entries'), false);
});

test('duplicate top-up requests reuse the document and reject changes to the amount', async () => {
  for (const amount of ['250.25', '100']) {
    const fixture = await harness({ env: gatewayFixture, selections: { site_payment_gateways: [[{ gateway: 'paytabs', merchantId }]], wallet_topups: [[{ walletId, documentId }]], payment_documents: [[{ id: documentId, gateway: 'paytabs', amount: 25025 }]] } });
    const endpoint = await fixture.module('netlify/functions/wallet.mts');
    const response = await endpoint.default(post({ action: 'topup', gateway: 'paytabs', amount, requestId }));
    assert.equal(response.status, amount === '250.25' ? 201 : 409);
    assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'payment_documents'), false);
  }
});

test('top-up limits reject excess amounts without creating a payment', async () => {
  const fixture = await harness();
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'topup', gateway: 'paytabs', amount: 10000.01, requestId }))).status, 400);
  assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'payment_documents'), false);
});

test('verified PayTabs payments credit the wallet inside the confirmation transaction', async () => {
  const fixture = await harness({ env: gatewayFixture, selections: { payment_attempts: [[{ id: requestId, merchantId, documentId, amount: 25025, status: 'pending', reference: 'fixture-reference', period: 'initial:fixture' }]], payment_documents: [[{ id: documentId, gateway: 'paytabs' }], [{ id: documentId, method: 'hosted' }]], wallet_topups: [[{ documentId, walletId }]] }, fetchResult: { tran_ref: 'fixture-reference', cart_id: requestId, cart_currency: 'SAR', cart_amount: 250.25, tran_type: 'sale', payment_result: { response_status: 'A' } } });
  const { confirmPayment } = await fixture.module('netlify/lib/payments.ts');
  assert.equal(await confirmPayment(requestId, 'fixture-reference'), 'paid');
  const ledger = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'wallet_entries');
  assert.equal(ledger.values.amount, 25025);
  assert.equal(ledger.values.documentId, documentId);
  assert.equal(fixture.trace.at(-1).operation, 'commit');
});

test('declined or mismatched gateway confirmations cannot credit a wallet', async () => {
  for (const mismatch of [false, true]) {
    const fixture = await harness({ env: gatewayFixture, selections: { payment_attempts: [[{ id: requestId, merchantId, documentId, amount: 25025, status: 'pending', reference: 'fixture-reference' }]], payment_documents: [[{ id: documentId, gateway: 'paytabs' }]] }, fetchResult: { tran_ref: 'fixture-reference', cart_id: requestId, cart_currency: mismatch ? 'USD' : 'SAR', cart_amount: 250.25, tran_type: 'sale', payment_result: { response_status: mismatch ? 'A' : 'D' } } });
    const { confirmPayment } = await fixture.module('netlify/lib/payments.ts');
    if (mismatch) await assert.rejects(confirmPayment(requestId, 'fixture-reference'), error => error.status === 409);
    else assert.equal(await confirmPayment(requestId, 'fixture-reference'), 'failed');
    assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_entries'), false);
    assert.equal(fixture.trace.some(entry => entry.operation === 'update' && entry.table === 'customer_wallets'), false);
  }
});

test('site payment controls block wallet debits and keep verification available', async () => {
  const policyModule = await (await harness()).module('shared/policy.ts');
  const fixture = await harness({ selections: { platform_settings: [[{ policy: { ...policyModule.defaultPolicy, paymentsEnabled: false } }]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  assert.equal((await endpoint.default(post({ action: 'purchase', sku: 'AUT-01', requestId }))).status, 409);
  assert.equal(fixture.trace.some(entry => entry.operation === 'update'), false);
});

test('media and Google Ads services share server-owned wallet prices', async () => {
  for (const [sku, amount] of [['PROD-SHOOT-01', 185000], ['GOOGLE-ADS-DIAMOND', 420000]]) {
    const fixture = await harness();
    const endpoint = await fixture.module('netlify/functions/wallet.mts');
    assert.equal((await endpoint.default(post({ action: 'purchase', sku, requestId, amount: 1 }))).status, 201);
    const order = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'wallet_service_orders');
    assert.equal(order.values.amount, amount);
    assert.equal(order.values.customerEmail, customer.email);
  }
});

test('administrators can see fulfillment contacts and complete paid wallet orders', async () => {
  const fixture = await harness({ user: { ...customer, appMetadata: { roles: ['admin'] } }, selections: { wallet_service_orders: [[], [{ id: requestId, customerName: customer.name, customerEmail: customer.email }]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  const response = await endpoint.default(new Request('https://preview.example/.netlify/functions/wallet'));
  const data = await response.json();
  assert.equal(data.adminOrders[0].customerEmail, customer.email);
  assert.equal((await endpoint.default(post({ action: 'fulfill', id: requestId }))).status, 200);
  const update = fixture.trace.find(entry => entry.operation === 'update');
  assert.equal(update.set.status, 'fulfilled');
});
