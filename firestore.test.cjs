const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_123";
const BOB_UID = "bob_456";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

// 1. Unauthenticated rejects
test("Unauthenticated user: cannot read payment documents", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("payment_documents").get());
});

test("Unauthenticated user: cannot read user profiles", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
});

// 2. Cross-user isolation
test("Cross-user isolation: Alice cannot read Bob's payment document", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("payment_documents").doc("bob_doc").set({
      id: "bob_doc",
      userId: BOB_UID,
      title: "Bob Invoice",
      customerName: "Client A",
      customerEmail: "client@test.com",
      amount: 1500,
      method: "hosted",
      gateway: "paytabs",
      status: "paid",
      createdAt: new Date(),
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(aliceDb.collection("payment_documents").doc("bob_doc").get());
});

// 3. User can create their own valid payment document
test("Authenticated user: Alice can create her own payment document", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(
    aliceDb.collection("payment_documents").doc("alice_doc").set({
      id: "alice_doc",
      userId: ALICE_UID,
      title: "Alice Design Invoice",
      customerName: "Design Client",
      customerEmail: "design@client.sa",
      amount: 2500,
      method: "hosted",
      gateway: "telr",
      status: "pending",
      createdAt: new Date(),
    })
  );
});

// 4. Identity spoofing rejection: Alice cannot create doc claiming Bob is owner
test("Identity spoofing: Alice cannot create a doc with Bob as userId", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(
    aliceDb.collection("payment_documents").doc("fake_doc").set({
      id: "fake_doc",
      userId: BOB_UID,
      title: "Malicious Invoice",
      customerName: "Client",
      customerEmail: "c@test.com",
      amount: 100,
      method: "hosted",
      gateway: "telr",
      status: "pending",
      createdAt: new Date(),
    })
  );
});

// 5. Query alignment: Alice can query her own payment documents
test("Query alignment: Alice can list her own payment documents", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("payment_documents").doc("alice_d1").set({
      id: "alice_d1",
      userId: ALICE_UID,
      title: "Alice Order",
      customerName: "Customer X",
      customerEmail: "x@test.com",
      amount: 450,
      method: "hosted",
      gateway: "paytabs",
      status: "paid",
      createdAt: new Date(),
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(
    aliceDb.collection("payment_documents").where("userId", "==", ALICE_UID).get()
  );
});
