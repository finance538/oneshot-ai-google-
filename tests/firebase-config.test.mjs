import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import vm from 'node:vm';
import { test } from 'node:test';

async function harness(fetchConfig) {
  const calls = [];
  const auth = { currentUser: null };
  const db = {};
  const context = vm.createContext({ fetch: fetchConfig });
  const source = await readFile(new URL('../src/firebase.ts', import.meta.url), 'utf8');
  const module = new vm.SourceTextModule(stripTypeScriptTypes(source), { context });
  await module.link(specifier => {
    const exports = {
      'firebase/app': { initializeApp: config => { calls.push(['app']); return config; } },
      'firebase/auth': { getAuth: () => auth },
      'firebase/firestore': { getFirestore: (_app, databaseId) => { calls.push(['database', databaseId]); return db; } },
      '../firebase-applet-config.json?url&no-inline': { default: '/assets/firebase-applet-config-example.json' },
    }[specifier];
    if (!exports) throw new Error('Unexpected Firebase module dependency.');
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return { getLegacyFirebase: module.namespace.getLegacyFirebase, calls, auth, db };
}

test('legacy Firebase loads public configuration lazily and shares initialization', async () => {
  const requests = [];
  const fixture = await harness(async url => {
    requests.push(url);
    return Response.json({ projectId: 'example', firestoreDatabaseId: 'legacy-archive' });
  });
  assert.equal(requests.length, 0);
  assert.equal(fixture.calls.length, 0);
  const first = fixture.getLegacyFirebase();
  assert.equal(fixture.getLegacyFirebase(), first);
  const result = await first;
  assert.equal(result.auth, fixture.auth);
  assert.equal(result.db, fixture.db);
  assert.deepEqual(requests, ['/assets/firebase-applet-config-example.json']);
  assert.deepEqual(fixture.calls, [['app'], ['database', 'legacy-archive']]);
  assert.equal(await fixture.getLegacyFirebase(), result);
  assert.equal(requests.length, 1);
});

test('legacy Firebase retries after a failed configuration request', async () => {
  let attempts = 0;
  const fixture = await harness(async () => ++attempts === 1
    ? new Response(null, { status: 503 })
    : Response.json({ projectId: 'example', firestoreDatabaseId: 'legacy-archive' }));
  await assert.rejects(fixture.getLegacyFirebase(), /configuration is unavailable/);
  assert.equal(fixture.calls.length, 0);
  assert.equal((await fixture.getLegacyFirebase()).db, fixture.db);
  assert.equal(attempts, 2);
});

test('the scan-exempt configuration contains only public Firebase web options', async () => {
  const config = JSON.parse(await readFile(new URL('../firebase-applet-config.json', import.meta.url), 'utf8'));
  const publicFields = new Set([
    'projectId', 'appId', 'apiKey', 'authDomain', 'firestoreDatabaseId', 'storageBucket',
    'messagingSenderId', 'measurementId', 'oAuthClientId', 'recaptchaSiteKey',
  ]);
  assert.ok(Object.keys(config).every(key => publicFields.has(key)), 'Only browser SDK options belong in the public configuration.');
  assert.ok(Object.values(config).every(value => typeof value === 'string'), 'Public configuration options must be strings.');
});
