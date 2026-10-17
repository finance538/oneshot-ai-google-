import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import vm from 'node:vm';
import { test } from 'node:test';

const root = path.resolve('.');

async function loadModule(relative, links = {}) {
  const source = stripTypeScriptTypes(await readFile(path.join(root, relative), 'utf8'), { mode: 'strip' });
  const mod = new vm.SourceTextModule(source, { identifier: relative, context: vm.createContext({ console, process }) });
  await mod.link(async specifier => {
    const exports = links[specifier];
    if (!exports) throw new Error(`Unexpected import ${specifier} from ${relative}`);
    const stub = new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context: mod.context });
    return stub;
  });
  await mod.evaluate();
  return mod.namespace;
}

test('brand@1shotcam.com is recognised as the platform owner regardless of casing or whitespace', async () => {
  const owner = await loadModule('shared/platform-owner.ts');
  assert.equal(owner.PLATFORM_OWNER_EMAIL, 'brand@1shotcam.com');
  assert.equal(owner.isPlatformOwnerEmail('brand@1shotcam.com'), true);
  assert.equal(owner.isPlatformOwnerEmail('  Brand@1ShotCam.com '), true);
  assert.equal(owner.isPlatformOwnerEmail('someone@1shotcam.com'), false);
  assert.equal(owner.isPlatformOwnerEmail(''), false);
  assert.equal(owner.isPlatformOwnerEmail(undefined), false);
});

test('the Identity event function grants the admin role only to the platform owner', async () => {
  const owner = await loadModule('shared/platform-owner.ts');
  const identity = await loadModule('netlify/functions/platform-owner-identity.mts', {
    '@netlify/functions': {},
    '../../shared/platform-owner.js': { ...owner },
  });
  const handlers = identity.default;

  const ownerSignup = handlers.userSignup({ user: { id: 'u1', email: 'brand@1shotcam.com', appMetadata: { provider: 'email' } }, deny: () => undefined });
  assert.equal(JSON.stringify(ownerSignup.user.appMetadata), JSON.stringify({ provider: 'email', roles: ['admin'] }));

  const ownerLogin = handlers.userLogin({ user: { id: 'u1', email: 'Brand@1shotcam.com', appMetadata: { roles: ['member'] } }, deny: () => undefined });
  assert.equal(JSON.stringify(ownerLogin.user.appMetadata.roles), JSON.stringify(['member', 'admin']));

  const alreadyAdmin = handlers.userLogin({ user: { id: 'u1', email: 'brand@1shotcam.com', appMetadata: { roles: ['admin'] } }, deny: () => undefined });
  assert.equal(alreadyAdmin, undefined);

  const stranger = handlers.userSignup({ user: { id: 'u2', email: 'merchant@example.com', appMetadata: {} }, deny: () => undefined });
  assert.equal(stranger, undefined);
});
