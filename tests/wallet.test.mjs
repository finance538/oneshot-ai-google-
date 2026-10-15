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
  const fetchTrace = [];
  const sandbox = vm.createContext({ Request, Response, URL, Buffer, Date, AbortSignal, process: { env }, fetch: async (input, init) => { fetchTrace.push({ url: String(input), init }); return Response.json(fetchResult); } });
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
    const module = new vm.SourceTextModule(stripTypeScriptTypes(source, { mode: 'strip' }), { context: sandbox, identifier });
    cache.set(identifier, module);
    return module;
  }
  async function module(file) {
    const target = await load(path.resolve(file));
    if (target.status === 'unlinked') await target.link((specifier, importer) => load(specifier.startsWith('.') ? path.resolve(path.dirname(importer.identifier), specifier).replace(/\.js$/, '.ts') : specifier));
    if (target.status !== 'evaluated') await target.evaluate();
    return target.namespace;
  }
  return { trace, db, module, fetchTrace };
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

// ---------- N-Genius KSA (hosted page) ----------
const ngeniusKey = 'noncredential-test-fixture-value-1234567890abcd';
const ngeniusOutlet = '50000000-0000-4000-8000-000000000010';
const ngeniusReference = '60000000-0000-4000-8000-000000000011';
const ngeniusEnv = { NG_API_KEY: ngeniusKey, NG_OUTLET: ngeniusOutlet };

test('a connected N-Genius account is offered for site-wide top-ups', async () => {
  const fixture = await harness({ env: ngeniusEnv, selections: { site_payment_gateways: [[{ gateway: 'ngenius', merchantId }]] } });
  const { publicGateways } = await fixture.module('netlify/lib/wallet.ts');
  const { defaultPolicy } = await fixture.module('shared/policy.ts');
  const rows = await publicGateways(defaultPolicy);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].gateway, 'ngenius');
});

test('N-Genius stays out of public gateways when the account or the admin toggle is off', async () => {
  const unconfigured = await harness({ selections: { site_payment_gateways: [[{ gateway: 'ngenius', merchantId }]] } });
  const { publicGateways } = await unconfigured.module('netlify/lib/wallet.ts');
  const { defaultPolicy } = await unconfigured.module('shared/policy.ts');
  assert.equal((await publicGateways(defaultPolicy)).length, 0);

  const paused = await harness({ env: ngeniusEnv, selections: { site_payment_gateways: [[{ gateway: 'ngenius', merchantId }]] } });
  const pausedWallet = await paused.module('netlify/lib/wallet.ts');
  const pausedPolicy = (await paused.module('shared/policy.ts')).defaultPolicy;
  assert.equal((await pausedWallet.publicGateways({ ...pausedPolicy, gateways: { ...pausedPolicy.gateways, ngenius: false } })).length, 0);
});

test('customers can top up through a connected N-Genius account', async () => {
  const fixture = await harness({ env: ngeniusEnv, selections: { site_payment_gateways: [[{ gateway: 'ngenius', merchantId }]] } });
  const endpoint = await fixture.module('netlify/functions/wallet.mts');
  const response = await endpoint.default(post({ action: 'topup', gateway: 'ngenius', amount: '100', requestId }));
  assert.equal(response.status, 201);
  const document = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'payment_documents');
  assert.equal(document.values.gateway, 'ngenius');
  assert.equal(document.values.method, 'hosted');
  assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_entries'), false);
});

test('only a captured N-Genius PURCHASE credits the wallet', async () => {
  const base = () => ({ payment_attempts: [[{ id: requestId, merchantId, documentId, amount: 25025, status: 'pending', reference: ngeniusReference, period: 'initial:fixture' }]], payment_documents: [[{ id: documentId, gateway: 'ngenius' }], [{ id: documentId, method: 'hosted' }]], wallet_topups: [[{ documentId, walletId }], [{ documentId, walletId }]] });
  const order = (state) => ({ access_token: 'fixture-token', reference: ngeniusReference, amount: { currencyCode: 'SAR', value: 25025 }, _embedded: { payment: [{ state }] } });

  const paid = await harness({ env: ngeniusEnv, selections: base(), fetchResult: order('PURCHASED') });
  const { confirmPayment } = await paid.module('netlify/lib/payments.ts');
  assert.equal(await confirmPayment(requestId, ngeniusReference), 'paid');
  assert.equal(paid.trace.find(entry => entry.operation === 'insert' && entry.table === 'wallet_entries').values.amount, 25025);

  const authorised = await harness({ env: ngeniusEnv, selections: base(), fetchResult: order('AUTHORISED') });
  const authorisedPayment = (await authorised.module('netlify/lib/payments.ts')).confirmPayment;
  assert.equal(await authorisedPayment(requestId, ngeniusReference), 'pending');
  assert.equal(authorised.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_entries'), false);

  const declined = await harness({ env: ngeniusEnv, selections: base(), fetchResult: order('DECLINED') });
  const declinedPayment = (await declined.module('netlify/lib/payments.ts')).confirmPayment;
  assert.equal(await declinedPayment(requestId, ngeniusReference), 'failed');
  assert.equal(declined.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_entries'), false);
});

test('an N-Genius amount mismatch can never settle the order', async () => {
  const fixture = await harness({ env: ngeniusEnv, selections: { payment_attempts: [[{ id: requestId, merchantId, documentId, amount: 25025, status: 'pending', reference: ngeniusReference, period: 'initial:fixture' }]], payment_documents: [[{ id: documentId, gateway: 'ngenius' }]] }, fetchResult: { access_token: 'fixture-token', reference: ngeniusReference, amount: { currencyCode: 'SAR', value: 100 }, _embedded: { payment: [{ state: 'PURCHASED' }] } } });
  const { confirmPayment } = await fixture.module('netlify/lib/payments.ts');
  const failure = await confirmPayment(requestId, ngeniusReference).then(() => null, error => error);
  assert.equal(failure?.status, 409);
  assert.equal(fixture.trace.some(entry => entry.operation === 'insert' && entry.table === 'wallet_entries'), false);
});

test('the N-Genius hosted page is created with a PURCHASE action and a same-origin return', async () => {
  const fixture = await harness({ env: ngeniusEnv, selections: { payment_documents: [[{ payment_documents: { id: documentId, merchantId, title: 'طلب دفع', customerEmail: customer.email, amount: 10000, method: 'hosted', gateway: 'ngenius', expiresAt: new Date(Date.now() + 3600000), status: 'pending' }, merchants: { id: merchantId, name: 'Store' } }]] }, fetchResult: { access_token: 'fixture-token', reference: ngeniusReference, _links: { payment: { href: 'https://paypage.ksa.ngenius-payments.com/checkout/fixture' } } } });
  const endpoint = await fixture.module('netlify/functions/checkout.mts');
  const response = await endpoint.default(new Request(`https://preview.example/.netlify/functions/checkout?id=${documentId}`, { method: 'POST', headers: { Origin: 'https://preview.example', 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), { ip: 'fixture' });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.url, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture');
  const attempt = fixture.trace.find(entry => entry.operation === 'update' && entry.table === 'payment_attempts');
  assert.equal(attempt.set.reference, ngeniusReference);
  // The money-critical payload: a PURCHASE order (authorise + capture) whose return
  // URL points back at our own payment-return endpoint, never at the gateway page.
  const order = fixture.fetchTrace.find(call => call.url.endsWith('/orders'));
  const sent = JSON.parse(order.init.body);
  assert.equal(sent.action, 'PURCHASE');
  assert.equal(sent.amount.value, 10000);
  assert.equal(sent.amount.currencyCode, 'SAR');
  assert.ok(sent.merchantAttributes.redirectUrl.startsWith('https://preview.example/.netlify/functions/payment-return?id='));
  assert.equal(sent.merchantAttributes.redirectUrl, sent.merchantAttributes.cancelUrl);
  assert.ok(fixture.fetchTrace.every(call => call.url.startsWith('https://api-gateway.ksa.ngenius-payments.com/') || call.url.startsWith('https://paypage.ksa.ngenius-payments.com/')));
});

test('loading the admin dashboard registers a connected N-Genius account for site payments', async () => {
  const fixture = await harness({ env: ngeniusEnv });
  const { syncAdminGateways } = await fixture.module('netlify/lib/wallet.ts');
  await syncAdminGateways(customer.id, merchantId);
  const upsert = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'site_payment_gateways');
  assert.equal(upsert.values.gateway, 'ngenius');
  assert.equal(upsert.values.merchantId, merchantId);
  assert.equal(fixture.trace.some(entry => entry.operation === 'delete' && entry.table === 'site_payment_gateways'), true);
});

test('a connected N-Genius account offers every method that runs on its hosted page', async () => {
  const fixture = await harness({ env: ngeniusEnv });
  const { enabledCapabilities } = await fixture.module('netlify/lib/policy.ts');
  const { defaultPolicy } = await fixture.module('shared/policy.ts');
  const caps = enabledCapabilities(merchantId, 'ngenius', defaultPolicy);
  const offered = Object.entries(caps).filter(([key, value]) => !['connected', 'platform'].includes(key) && value).map(([key]) => key).sort();
  assert.deepEqual(offered, ['framed', 'hosted', 'invoice', 'mada_applepay', 'mobile', 'paylink', 'samsung_pay']);
});

test('N-Genius never advertises a card form or stored-credential method it does not run', async () => {
  for (const method of ['own', 'managed', 'recurring']) {
    const fixture = await harness({ env: ngeniusEnv, selections: { payment_documents: [[{ payment_documents: { id: documentId, merchantId, title: 'طلب دفع', customerEmail: customer.email, amount: 10000, method, gateway: 'ngenius', expiresAt: new Date(Date.now() + 3600000), status: 'pending' }, merchants: { id: merchantId, name: 'Store' } }]] } });
    const endpoint = await fixture.module('netlify/functions/checkout.mts');
    const response = await endpoint.default(new Request(`https://preview.example/.netlify/functions/checkout?id=${documentId}`, { method: 'POST', headers: { Origin: 'https://preview.example', 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), { ip: 'fixture' });
    assert.equal(response.status, 409, `${method} must be refused`);
    assert.equal(fixture.fetchTrace.length, 0, `${method} must never reach the gateway`);
  }
});

const ngeniusDocument = (method) => ({
  payment_documents: [[{ payment_documents: { id: documentId, merchantId, title: 'طلب دفع', customerEmail: customer.email, amount: 10000, method, gateway: 'ngenius', expiresAt: new Date(Date.now() + 3600000), status: 'pending' }, merchants: { id: merchantId, name: 'Store' } }]],
});
const ngeniusOrderResult = { access_token: 'fixture-token', reference: ngeniusReference, _links: { payment: { href: 'https://paypage.ksa.ngenius-payments.com/checkout/fixture' } } };
const ngeniusPayWith = async (fetchResult, method) => {
  const fixture = await harness({ env: ngeniusEnv, selections: ngeniusDocument(method), fetchResult });
  const endpoint = await fixture.module('netlify/functions/checkout.mts');
  const response = await endpoint.default(new Request(`https://preview.example/.netlify/functions/checkout?id=${documentId}`, { method: 'POST', headers: { Origin: 'https://preview.example', 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), { ip: 'fixture' });
  return { fixture, response, data: await response.json() };
};
const ngeniusPay = async (method) => {
  const fixture = await harness({ env: ngeniusEnv, selections: ngeniusDocument(method), fetchResult: ngeniusOrderResult });
  const endpoint = await fixture.module('netlify/functions/checkout.mts');
  const response = await endpoint.default(new Request(`https://preview.example/.netlify/functions/checkout?id=${documentId}`, { method: 'POST', headers: { Origin: 'https://preview.example', 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), { ip: 'fixture' });
  return { fixture, response, data: await response.json() };
};

test('an N-Genius framed request opens the same page in slim mode for our own checkout iframe', async () => {
  const { fixture, response, data } = await ngeniusPay('framed');
  assert.equal(response.status, 200);
  assert.equal(data.url, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture?slim=true');
  assert.equal(data.status, 'pending');
  const attempt = fixture.trace.find(entry => entry.operation === 'update' && entry.table === 'payment_attempts');
  assert.equal(attempt.set.gatewayUrl, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture?slim=true');
  const sent = JSON.parse(fixture.fetchTrace.find(call => call.url.endsWith('/orders')).init.body);
  assert.equal(sent.merchantAttributes.offerOnly, undefined);
});

test('an N-Genius Mada/Apple Pay request limits the hosted page to exactly those schemes', async () => {
  const { fixture, response, data } = await ngeniusPay('mada_applepay');
  assert.equal(response.status, 200);
  assert.equal(data.url, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture');
  assert.equal(data.status, 'pending');
  const sent = JSON.parse(fixture.fetchTrace.find(call => call.url.endsWith('/orders')).init.body);
  assert.equal(sent.merchantAttributes.offerOnly, 'MADA,APPLE_PAY');
});

test('an N-Genius Samsung Pay request limits the hosted page to the wallet alone', async () => {
  const { fixture, response, data } = await ngeniusPay('samsung_pay');
  assert.equal(response.status, 200);
  assert.equal(data.url, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture');
  const sent = JSON.parse(fixture.fetchTrace.find(call => call.url.endsWith('/orders')).init.body);
  assert.equal(sent.merchantAttributes.offerOnly, 'SAMSUNG_PAY');
});

test('N-Genius only offers schemes the outlet reports back on the order it created', async () => {
  const outlet = { ...ngeniusOrderResult, paymentMethods: { card: ['MADA', 'VISA'], wallet: [] } };
  const { fixture, response, data } = await ngeniusPayWith(outlet, 'mada_applepay');
  assert.equal(response.status, 200, 'the method still runs on the scheme the outlet does have');
  const orders = fixture.fetchTrace.filter(call => call.url.endsWith('/orders')).map(call => JSON.parse(call.init.body).merchantAttributes.offerOnly);
  assert.deepEqual(orders, ['MADA,APPLE_PAY', 'MADA'], 'Apple Pay is dropped because this outlet does not report it');
  assert.equal(data.status, 'pending');
});

test('N-Genius refuses a method whose schemes the outlet does not report at all', async () => {
  const outlet = { ...ngeniusOrderResult, paymentMethods: { card: ['MADA'], wallet: [] } };
  const { response, data } = await ngeniusPayWith(outlet, 'samsung_pay');
  assert.equal(response.status, 409);
  assert.match(data.error, /غير مفعّلة/);
});

test('an N-Genius pay link or invoice stores a reusable payment link on the document', async () => {
  for (const method of ['paylink', 'invoice']) {
    const { fixture, response, data } = await ngeniusPay(method);
    assert.equal(response.status, 200, `${method} must be accepted`);
    assert.equal(data.url, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture', `${method} keeps the shareable top-level link`);
    assert.equal(data.status, 'published', `${method} must publish the link`);
    const document = fixture.trace.find(entry => entry.operation === 'update' && entry.table === 'payment_documents');
    assert.equal(document.set.gatewayUrl, 'https://paypage.ksa.ngenius-payments.com/checkout/fixture');
    assert.equal(document.set.gatewayId, ngeniusReference);
    assert.equal(document.set.status, 'published');
  }
});

const savedCardKey = 'b7'.repeat(32);
const savedToken = 'CARD-TOKEN-FIXTURE-1234';
const savedCardEnv = { ...ngeniusEnv, PAYMENT_TOKEN_ENCRYPTION_KEY: savedCardKey };
// What the gateway hands back for a card it tokenised: the token, who holds it, when it expires
// and a masked tail of the number — never the number and never the CSC.
const fixtureCard = { cardToken: savedToken, cardholderName: 'Test Customer', expiry: '2029-04', maskedPan: '401200******1112', scheme: 'VISA' };
const rememberFixtureCard = async () => {
  const fixture = await harness({ env: savedCardEnv });
  const { rememberSavedCard } = await fixture.module('netlify/lib/saved-cards.ts');
  assert.equal(await rememberSavedCard({ merchantId, email: '  Customer@Example.Test ', gateway: 'ngenius', card: fixtureCard }), true);
  return fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'saved_cards');
};
// The same order fixture, but settled with a card the gateway tokenised — the read-back finds the
// card inside the order's payment block.
const savedCardOrderResult = { ...ngeniusOrderResult, amount: { currencyCode: 'SAR', value: 25025 }, _embedded: { payment: [{ state: 'PURCHASED', savedCard: fixtureCard }] } };
const savedCardCheckout = async (method, encryptedToken, fetchResult = ngeniusOrderResult) => {
  const fixture = await harness({ env: savedCardEnv, selections: { ...ngeniusDocument(method), saved_cards: [[{ id: walletId, encryptedToken }]] }, fetchResult });
  const endpoint = await fixture.module('netlify/functions/checkout.mts');
  const response = await endpoint.default(new Request(`https://preview.example/.netlify/functions/checkout?id=${documentId}`, { method: 'POST', headers: { Origin: 'https://preview.example', 'Content-Type': 'application/json' }, body: JSON.stringify({}) }), { ip: 'fixture' });
  return { fixture, response, data: await response.json() };
};

test('a remembered card is stored encrypted, keyed to the merchant and the paying email', async () => {
  const insert = await rememberFixtureCard();
  assert.equal(insert.values.email, 'customer@example.test', 'the email is normalised so the card comes back to the same payer');
  assert.equal(insert.values.gateway, 'ngenius');
  assert.equal(insert.values.merchantId, merchantId);
  assert.ok(!String(insert.values.encryptedToken).includes(savedToken), 'the card token is never written in the clear');
  assert.equal(insert.onConflictDoUpdate.target.length, 3, 'one card per merchant, email and gateway');

  const reader = await harness({ env: savedCardEnv, selections: { saved_cards: [[{ id: walletId, encryptedToken: insert.values.encryptedToken }]] } });
  const { savedCardFor } = await reader.module('netlify/lib/saved-cards.ts');
  assert.deepEqual({ ...await savedCardFor(merchantId, 'ngenius', 'CUSTOMER@example.test') }, fixtureCard, 'the same payer gets the same card back, tail and all');

  const rotated = await harness({ env: { ...ngeniusEnv, PAYMENT_TOKEN_ENCRYPTION_KEY: 'c0'.repeat(32) }, selections: { saved_cards: [[{ id: walletId, encryptedToken: insert.values.encryptedToken }]] } });
  const { savedCardFor: afterRotation } = await rotated.module('netlify/lib/saved-cards.ts');
  assert.equal(await afterRotation(merchantId, 'ngenius', customer.email), undefined, 'a token we cannot decrypt falls back to a card form, it never fails the sale');

  const anonymous = await harness({ env: savedCardEnv });
  const { rememberSavedCard } = await anonymous.module('netlify/lib/saved-cards.ts');
  assert.equal(await rememberSavedCard({ merchantId, gateway: 'ngenius', card: fixtureCard }), false);
  assert.equal(await rememberSavedCard({ merchantId, email: customer.email, gateway: 'ngenius', card: { ...fixtureCard, cardToken: '' } }), false, 'a block without a usable token is not a card');
  assert.equal(anonymous.trace.length, 0, 'an unkeyed or empty card is never written anywhere');
});

test('an N-Genius hosted checkout replays the remembered card and re-asks for the CSC', async () => {
  const insert = await rememberFixtureCard();
  const { fixture, response } = await savedCardCheckout('hosted', insert.values.encryptedToken);
  assert.equal(response.status, 200);
  const sent = JSON.parse(fixture.fetchTrace.find(call => call.url.endsWith('/orders')).init.body);
  assert.equal(sent.merchantAttributes.offerOnly, undefined, 'a stored card is never narrowed to a scheme list it may not carry');
  assert.deepEqual(sent.savedCard, fixtureCard, 'the card the payer stored is the card that is charged');
  assert.equal(sent.recaptureCsc, true, 'the CSC is always re-asked — the token alone must not be enough to charge');
  assert.equal(fixture.trace.some(entry => entry.operation === 'select' && entry.table === 'saved_cards'), true);
});

test('a settled N-Genius order hands the tokenised card back, and only a settled one does', async () => {
  const row = { id: documentId, gateway: 'ngenius', customerEmail: customer.email, amount: 25025, method: 'hosted' };
  const attemptRow = { id: requestId, merchantId, documentId, amount: 25025, status: 'pending', reference: ngeniusReference, period: 'initial:fixture' };
  const selections = { payment_attempts: Array.from({ length: 4 }, () => [attemptRow]), payment_documents: Array.from({ length: 4 }, () => [row]) };
  const fixture = await harness({ env: savedCardEnv, selections, fetchResult: savedCardOrderResult });
  const { confirmPayment } = await fixture.module('netlify/lib/payments.ts');
  assert.equal(await confirmPayment(requestId, ngeniusReference), 'paid');
  const stored = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'saved_cards');
  assert.equal(stored.values.email, customer.email, 'the card is remembered for the payer the document was made out to');
  assert.ok(!String(stored.values.encryptedToken).includes(savedToken), 'the card is only ever written encrypted');

  const unsettled = await harness({ env: savedCardEnv, selections, fetchResult: { ...ngeniusOrderResult, amount: { currencyCode: 'SAR', value: 25025 } } });
  const { confirmPayment: confirmAgain } = await unsettled.module('netlify/lib/payments.ts');
  assert.equal(await confirmAgain(requestId, ngeniusReference), 'pending');
  assert.equal(unsettled.trace.some(entry => entry.operation === 'insert' && entry.table === 'saved_cards'), false, 'an order with no payment block stores no card');
});

test('a shareable N-Genius pay link never carries somebody else card', async () => {
  const insert = await rememberFixtureCard();
  const { fixture, data } = await savedCardCheckout('paylink', insert.values.encryptedToken);
  assert.equal(data.status, 'published');
  const sent = JSON.parse(fixture.fetchTrace.find(call => call.url.endsWith('/orders')).init.body);
  assert.equal(sent.savedCard, undefined, 'a forwarded link must never charge a card it did not collect');
  assert.equal(fixture.trace.some(entry => entry.operation === 'select' && entry.table === 'saved_cards'), false, 'the stored token is not even read for a link');
});

test('the N-Genius webhook receiver ignores unsigned callers and never trusts the payload', async () => {
  const url = 'https://preview.example/.netlify/functions/ngenius-webhook';
  const body = JSON.stringify({ event: 'CAPTURED', order: { reference: ngeniusReference } });
  const fixture = await harness({ env: { ...ngeniusEnv, NG_WEBHOOK_SECRET: 'fixture-secret' }, inserts: { gateway_events: [[{ id: requestId }]] }, selections: { payment_attempts: [] }, fetchResult: ngeniusOrderResult });
  const hook = await fixture.module('netlify/functions/ngenius-webhook.mts');

  const unconfigured = await (await harness({ env: ngeniusEnv })).module('netlify/functions/ngenius-webhook.mts');
  assert.equal((await unconfigured.default(new Request(url, { method: 'POST', body }))).status, 503, 'no shared secret means the door stays shut');

  assert.equal((await hook.default(new Request(url, { method: 'GET' }))).status, 405);
  assert.equal((await hook.default(new Request(url, { method: 'POST', body }))).status, 401, 'an unsigned notification is refused');
  assert.equal((await hook.default(new Request(url, { method: 'POST', headers: { 'x-webhook-token': 'guess' }, body }))).status, 401);
  assert.equal(fixture.trace.length, 0, 'an unauthenticated caller never reaches the database');

  const accepted = await hook.default(new Request(url, { method: 'POST', headers: { 'x-webhook-token': 'fixture-secret', 'Content-Type': 'application/json' }, body }));
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { received: true, event: 'CAPTURED', stored: true });
  const logged = fixture.trace.find(entry => entry.operation === 'insert' && entry.table === 'gateway_events');
  assert.equal(logged.values.event, 'CAPTURED');
  assert.equal(logged.values.reference, ngeniusReference);
  assert.equal(fixture.fetchTrace.length, 0, 'the payload alone never triggers a gateway call for a reference we do not know');

  assert.equal((await hook.default(new Request(url, { method: 'POST', headers: { 'x-webhook-token': 'fixture-secret' }, body: 'not json' }))).status, 400);
});
