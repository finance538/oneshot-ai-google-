import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';

const root = path.resolve('.');

function sqlText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(sqlText).join(' ');
  if (typeof value === 'object') {
    if ('name' in value && typeof value.name === 'string') return value.name;
    if ('value' in value) return sqlText(value.value);
    if ('queryChunks' in value) return sqlText(value.queryChunks);
  }
  return String(value);
}

function createPlatformHarness({ user, env = {} }) {
  const state = {
    merchants: [],
    accountRegistrations: [],
    marketerCampaigns: [],
    gatewayRequests: [],
    openLinks: [],
    documents: [],
    subscriptions: [],
    attempts: [],
  };

  const tableName = table => table?.[Symbol.for('drizzle:Name')] || table?._?.name || 'unknown';

  const makeDatabase = () => {
    const queryBuilder = {
      select: () => {
        let targetTable = '';
        return {
          from(table) {
            targetTable = tableName(table);
            return this;
          },
          innerJoin() {
            this._joined = true;
            return this;
          },
          leftJoin() {
            return this;
          },
          where(condition) {
            this._condition = sqlText(condition);
            return this;
          },
          orderBy() {
            return this;
          },
          groupBy() {
            return this;
          },
          limit() {
            return this;
          },
          then(resolve, reject) {
            try {
              if (targetTable === 'merchants' && this._joined) {
                const rows = state.merchants.filter(m => state.accountRegistrations.some(r =>
                  r.ownerId === m.ownerId && r.role === 'merchant' && r.status === 'approved' &&
                  (this._condition.includes(r.email.toLowerCase()) || this._condition.includes(m.accountId))));
                return Promise.resolve(rows.map(({ id, name, accountId }) => ({ id, name, accountId }))).then(resolve, reject);
              }
              if (targetTable === 'open_payment_links') {
                return Promise.resolve(state.openLinks.filter(l => l.enabled && this._condition.includes(l.merchantId))
                  .map(({ id, title }) => ({ id, title }))).then(resolve, reject);
              }
              if (targetTable === 'merchants') {
                return Promise.resolve(state.merchants.filter(m => m.ownerId === user?.id)).then(resolve, reject);
              }
              if (targetTable === 'account_registrations') {
                if (this._condition && this._condition.includes('marketer') && !this._condition.includes(user?.id || '__none__')) {
                  return Promise.resolve(state.accountRegistrations.filter(r => r.role === 'marketer')).then(resolve, reject);
                }
                return Promise.resolve(state.accountRegistrations.filter(r => r.ownerId === user?.id)).then(resolve, reject);
              }
              if (targetTable === 'marketer_campaigns') {
                return Promise.resolve(state.marketerCampaigns.filter(c => c.ownerId === user?.id)).then(resolve, reject);
              }
              if (targetTable === 'payment_attempts') {
                return Promise.resolve([{ paidCount: 0, totalPaid: 0 }]).then(resolve, reject);
              }
              if (targetTable === 'payment_documents') {
                return Promise.resolve([{ pendingCount: 0, customers: 0 }]).then(resolve, reject);
              }
              return Promise.resolve([]).then(resolve, reject);
            } catch (err) {
              return Promise.reject(err).then(resolve, reject);
            }
          },
        };
      },
      insert: table => {
        const name = tableName(table);
        return {
          values(rawValues) {
            const row = {
              id: rawValues.id || '11111111-2222-4333-8444-555555555555',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              enabled: true,
              clicks: 0,
              conversions: 0,
              earnedCommission: 0,
              ...rawValues,
            };
            const applyInsert = () => {
              if (name === 'merchants') {
                const existing = state.merchants.find(m => m.ownerId === row.ownerId);
                if (existing) return [];
                state.merchants.push(row);
                return [row];
              }
              if (name === 'account_registrations') {
                const existing = state.accountRegistrations.find(r => r.ownerId === row.ownerId);
                if (existing) return [];
                state.accountRegistrations.push(row);
                return [row];
              }
              if (name === 'marketer_campaigns') {
                state.marketerCampaigns.push(row);
                return [row];
              }
              return [row];
            };
            return {
              onConflictDoNothing() {
                return {
                  returning: async () => applyInsert(),
                  then: (resolve, reject) => Promise.resolve(applyInsert()).then(resolve, reject),
                };
              },
              onConflictDoUpdate() {
                return {
                  where() {
                    return {
                      returning: async () => [{ count: 1 }],
                    };
                  },
                  returning: async () => [{ count: 1 }],
                };
              },
              returning: async () => applyInsert(),
              then: (resolve, reject) => Promise.resolve(applyInsert()).then(resolve, reject),
            };
          },
        };
      },
      update: table => {
        const name = tableName(table);
        return {
          set(patch) {
            return {
              where() {
                const applyUpdate = () => {
                  if (name === 'account_registrations') {
                    const target = state.accountRegistrations[0];
                    if (!target) return [];
                    Object.assign(target, patch);
                    return [target];
                  }
                  if (name === 'marketer_campaigns') {
                    const target = state.marketerCampaigns.find(c => c.ownerId === user?.id);
                    if (!target) return [];
                    Object.assign(target, patch);
                    return [target];
                  }
                  return [];
                };
                return {
                  returning: async () => applyUpdate(),
                  then: (resolve, reject) => Promise.resolve(applyUpdate()).then(resolve, reject),
                };
              },
            };
          },
        };
      },
      delete: table => {
        const name = tableName(table);
        return {
          where() {
            return {
              returning: async () => {
                if (name === 'marketer_campaigns') {
                  const idx = state.marketerCampaigns.findIndex(c => c.ownerId === user?.id);
                  if (idx === -1) return [];
                  return state.marketerCampaigns.splice(idx, 1);
                }
                return [];
              },
            };
          },
        };
      },
      transaction: async callback => callback(queryBuilder),
    };
    return queryBuilder;
  };

  const context = vm.createContext({
    console: { error() {}, warn() {}, log() {} },
    process: { env: { URL: 'https://www.1shotcam.com', ...env } },
    Request,
    Response,
    Headers,
    URL,
    Buffer,
    TextEncoder,
    TextDecoder,
    AbortSignal,
    crypto,
    setTimeout,
    clearTimeout,
  });

  const cache = new Map();
  const namespaces = new Map();

  function synthetic(identifier, exportsObject) {
    const names = Object.keys(exportsObject);
    const mod = new vm.SyntheticModule(
      names,
      function () {
        for (const name of names) this.setExport(name, exportsObject[name]);
      },
      { context, identifier },
    );
    return mod;
  }

  function load(identifier) {
    const cached = cache.get(identifier);
    if (cached) return cached;
    const pending = (async () => {
      if (identifier === '@netlify/identity') {
        return synthetic(identifier, { getUser: async () => user });
      }
      if (identifier === path.join(root, 'db/index.ts')) {
        return synthetic(identifier, { database: () => makeDatabase() });
      }
      if (identifier === path.join(root, 'netlify/lib/wallet.ts')) {
        return synthetic(identifier, {
          ensureWallet: async () => ({ id: 'w-1' }),
          syncAdminGateways: async () => {},
          creditTopup: async () => {},
        });
      }
      if (identifier === path.join(root, 'netlify/lib/policy.ts')) {
        const { defaultPolicy } = await import(path.join(root, 'shared/policy.ts'));
        return synthetic(identifier, {
          settings: async () => ({ policy: defaultPolicy, version: 1 }),
          enabledCapabilities: () => ({ connected: false }),
        });
      }
      if (identifier === path.join(root, 'netlify/lib/ai-license.ts')) {
        return synthetic(identifier, {
          aiLicense: async () => ({ tier: 'tier-1', tierX: false, staff: [], admin: false, tiers: ['tier-1'], source: 'default' }),
          grantTier: async () => ({}),
          grantStaff: async () => ({}),
          revokeStaff: async () => ({}),
        });
      }
      if (identifier === path.join(root, 'netlify/lib/operations.ts')) {
        return synthetic(identifier, {
          captureOperation: async () => {},
          captureVerifiedIdentity: async () => {},
        });
      }
      if (!path.isAbsolute(identifier)) {
        return synthetic(identifier, await import(identifier));
      }
      const raw = await readFile(identifier, 'utf8');
      const code = stripTypeScriptTypes(raw, { mode: 'strip', sourceUrl: identifier });
      return new vm.SourceTextModule(code, { context, identifier });
    })();
    cache.set(identifier, pending);
    return pending;
  }

  function module(rel) {
    const absolute = path.resolve(root, rel);
    const cached = namespaces.get(absolute);
    if (cached) return cached;
    const pending = (async () => {
      const target = await load(absolute);
      if (target.status === 'unlinked') {
        await target.link((specifier, importer) => {
          if (!specifier.startsWith('.')) return load(specifier);
          const resolved = path.resolve(path.dirname(importer.identifier), specifier).replace(/\.js$/, '.ts');
          return load(resolved);
        });
      }
      if (target.status !== 'evaluated') await target.evaluate();
      return target.namespace;
    })();
    namespaces.set(absolute, pending);
    return pending;
  }

  return {
    state,
    module,
  };
}

function postRequest(body) {
  return new Request('https://www.1shotcam.com/.netlify/functions/platform', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      origin: 'https://www.1shotcam.com',
    },
    body: JSON.stringify(body),
  });
}

test('Admin account is strictly separated from the merchant/marketer registration section', async () => {
  const adminUser = {
    id: 'admin-user-1',
    email: 'admin@1shotcam.com',
    appMetadata: { roles: ['admin'] },
  };
  const harness = createPlatformHarness({ user: adminUser });
  const endpoint = await harness.module('netlify/functions/platform.mts');

  // 1) Admin GET platform works without any merchant record and returns accountRole: 'admin'
  const getRes = await endpoint.default(new Request('https://www.1shotcam.com/.netlify/functions/platform'));
  assert.equal(getRes.status, 200);
  const getBody = await getRes.json();
  assert.equal(getBody.isAdmin, true);
  assert.equal(getBody.accountRole, 'admin');
  assert.equal(getBody.merchant, null);
  assert.equal(Array.isArray(getBody.adminMarketers), true);

  // 2) Admin cannot register via merchant/marketer registration ('register-account' or 'onboard')
  const regRes = await endpoint.default(postRequest({ action: 'register-account', role: 'merchant', name: 'Admin Store' }));
  assert.equal(regRes.status, 403);

  const onboardRes = await endpoint.default(postRequest({ action: 'onboard', name: 'Admin Store' }));
  assert.equal(onboardRes.status, 403);

  // 3) Admin cannot execute marketer campaign actions (admin & marketer permissions are strictly separate)
  const campRes = await endpoint.default(
    postRequest({ action: 'create-marketer-campaign', title: 'Test', utmCampaign: 'test-1', channel: 'social' }),
  );
  assert.equal(campRes.status, 403);
});

test('Merchant account registration automatically provisions the merchant workspace', async () => {
  const merchantUser = {
    id: 'merchant-user-1',
    email: 'merchant@example.sa',
    name: 'متجر الأفق الذكي',
    userMetadata: { full_name: 'متجر الأفق الذكي', account_type: 'merchant' },
    appMetadata: { roles: [] },
  };
  const harness = createPlatformHarness({ user: merchantUser });
  const endpoint = await harness.module('netlify/functions/platform.mts');

  // GET automatically provisions both account_registrations (approved) and merchants row
  const res = await endpoint.default(new Request('https://www.1shotcam.com/.netlify/functions/platform'));
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.accountRole, 'merchant');
  assert.equal(data.registrationStatus, 'approved');
  assert.ok(data.merchant);
  assert.equal(data.merchant.name, 'متجر الأفق الذكي');
  assert.equal(harness.state.merchants.length, 1);
  assert.equal(harness.state.accountRegistrations[0].role, 'merchant');
  assert.equal(harness.state.accountRegistrations[0].status, 'approved');
});

test('Marketer registration activates automatically and isolates permissions from Admin and Merchant', async () => {
  const marketerUser = {
    id: 'marketer-user-1',
    email: 'marketer@example.sa',
    name: 'خالد المسوّق',
    userMetadata: { full_name: 'خالد المسوّق', account_type: 'marketer', marketing_notes: 'سناب شات وجوجل آدز' },
    appMetadata: { roles: [] },
  };
  const harness = createPlatformHarness({ user: marketerUser });
  const endpoint = await harness.module('netlify/functions/platform.mts');

  // 1) Marketer registers -> status is 'approved' and NO merchant workspace is created
  const regRes = await endpoint.default(
    postRequest({ action: 'register-account', role: 'marketer', name: 'خالد المسوّق', notes: 'سناب شات وجوجل آدز' }),
  );
  assert.equal(regRes.status, 201);
  const regData = await regRes.json();
  assert.equal(regData.accountRole, 'marketer');
  assert.equal(regData.registrationStatus, 'approved');
  assert.equal(regData.merchant, null);
  assert.equal(harness.state.merchants.length, 0);
  assert.ok(regData.marketerAccount.referralCode.startsWith('MKT-'));

  // 3) Marketer cannot approve themselves or perform Admin actions
  const selfApproveRes = await endpoint.default(
    postRequest({
      action: 'review-marketer',
      id: regData.marketerAccount.id,
      status: 'approved',
      commissionRate: 25,
    }),
  );
  assert.equal(selfApproveRes.status, 403);

  const tierGrantRes = await endpoint.default(
    postRequest({ action: 'grant-tier', ownerId: marketerUser.id, tier: 'tier-3' }),
  );
  assert.equal(tierGrantRes.status, 403);

  // 4) Marketer cannot perform Merchant actions
  const merchantActionRes = await endpoint.default(
    postRequest({ action: 'rename', name: 'Fake Merchant' }),
  );
  assert.equal(merchantActionRes.status, 403);

  // No administrator approval is needed.

  // 6) Now approved marketer can create, toggle, and delete their marketing campaigns
  const createCampRes = await endpoint.default(
    postRequest({
      action: 'create-marketer-campaign',
      title: 'حملة إعلانات جوجل الماسية',
      targetProductSku: 'GOOGLE-ADS-DIAMOND',
      utmCampaign: 'gads-q4',
      channel: 'google_ads',
    }),
  );
  assert.equal(createCampRes.status, 201);
  const createdCamp = await createCampRes.json();
  assert.equal(createdCamp.campaign.title, 'حملة إعلانات جوجل الماسية');
  assert.equal(createdCamp.campaign.utmCampaign, 'gads-q4');
  assert.equal(harness.state.marketerCampaigns.length, 1);
});

test('Admin can review and approve or reject marketer registrations via review-marketer action', async () => {
  const adminUser = {
    id: 'admin-user-99',
    email: 'admin@1shotcam.com',
    appMetadata: { roles: ['admin'] },
  };
  const harness = createPlatformHarness({ user: adminUser });
  const marketerId = '11111111-2222-4333-8444-555555555555';
  harness.state.accountRegistrations.push({
    id: marketerId,
    ownerId: 'marketer-user-55',
    email: 'm55@example.sa',
    fullName: 'سارة المسوّقة',
    role: 'marketer',
    status: 'pending',
    referralCode: 'MKT-555555',
    commissionRate: 10,
    notes: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const endpoint = await harness.module('netlify/functions/platform.mts');
  const approveRes = await endpoint.default(
    postRequest({
      action: 'review-marketer',
      id: marketerId,
      status: 'approved',
      commissionRate: 20,
      notes: 'تم اعتماد حساب المسوّق من الإدارة',
    }),
  );
  assert.equal(approveRes.status, 200);
  const body = await approveRes.json();
  assert.equal(body.ok, true);
  assert.equal(body.marketer.status, 'approved');
  assert.equal(body.marketer.commissionRate, 20);
  assert.equal(body.marketer.reviewedBy, 'admin@1shotcam.com');
});

for (const role of ['loader', 'admin']) {
  test(`${role} selection does not provision a merchant or grant administrator permissions`, async () => {
    const user = { id: `${role}-user`, email: `${role}@example.sa`, userMetadata: { account_type: role }, appMetadata: { roles: [] } };
    const harness = createPlatformHarness({ user });
    const endpoint = await harness.module('netlify/functions/platform.mts');
    const response = await endpoint.default(postRequest({ action: 'register-account', role, name: 'New account' }));
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.accountRole, role);
    assert.equal(result.registrationStatus, role === 'admin' ? 'pending' : 'approved');
    assert.equal(harness.state.merchants.length, 0);
    assert.equal((await endpoint.default(postRequest({ action: 'rename', name: 'Not allowed' }))).status, 403);
    assert.equal((await endpoint.default(postRequest({ action: 'lookup-merchant-gateways', lookup: 'merchant@example.sa' }))).status, 403);
    assert.equal((await endpoint.default(postRequest({ action: 'grant-tier', ownerId: user.id, tier: 'tier-3' }))).status, 403);
  });
}

test('Rejected marketer cannot reactivate through registration or retrieve gateways', async () => {
  const user = { id: 'rejected-marketer', email: 'blocked@example.sa', appMetadata: { roles: [] } };
  const harness = createPlatformHarness({ user });
  harness.state.accountRegistrations.push({ id: 'registration', ownerId: user.id, role: 'marketer', status: 'rejected' });
  const endpoint = await harness.module('netlify/functions/platform.mts');
  const response = await endpoint.default(postRequest({ action: 'register-account', role: 'marketer' }));
  assert.equal((await response.json()).registrationStatus, 'rejected');
  assert.equal((await endpoint.default(postRequest({ action: 'lookup-merchant-gateways', lookup: 'merchant@example.sa' }))).status, 403);
});

test('Marketer retrieves the same merchant by normalized email and account number without credentials', async () => {
  const user = { id: 'lookup-marketer', email: 'marketer@example.sa', appMetadata: { roles: [] } };
  const harness = createPlatformHarness({ user });
  harness.state.accountRegistrations.push(
    { ownerId: user.id, role: 'marketer', status: 'approved' },
    { ownerId: 'merchant-owner', email: 'Merchant@Example.sa', role: 'merchant', status: 'approved' },
  );
  harness.state.merchants.push({ id: 'merchant-id', ownerId: 'merchant-owner', name: 'Merchant store', accountId: '1234567' });
  const endpoint = await harness.module('netlify/functions/platform.mts');
  for (const lookup of [' MERCHANT@example.sa ', '1234567']) {
    const response = await endpoint.default(postRequest({ action: 'lookup-merchant-gateways', lookup }));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.merchant, { name: 'Merchant store', accountId: '1234567' });
    assert.deepEqual(Object.keys(result).sort(), ['gateways', 'links', 'merchant']);
  }
  assert.equal((await endpoint.default(postRequest({ action: 'lookup-merchant-gateways', lookup: 'missing@example.sa' }))).status, 404);
});
