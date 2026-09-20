import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { bootstrapAdmin, validateAdminPassword } from "../../backend/src/services/adminBootstrap.js";

const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-repair-store-"));
process.env.DATA_DIR = directory;
process.env.BACKEND_ENV_FILE = path.join(directory, "no-env");
process.env.JWT_SECRET = "isolated-regression-test-secret";
delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
const store = await import("../../backend/src/lib/userStore.js");
const auth = await import("../../backend/src/middleware/auth.js");
const bcrypt = createRequire(new URL("../../backend/package.json", import.meta.url))("bcryptjs");
after(async () => {
  store.closeUserStore();
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  await rm(directory, { recursive: true, force: true });
});

test("stale profile writes fail without overwriting cash or progress; legacy profiles migrate", async () => {
  const record = await store.createUserRecord({ username: "revision", passwordHash: "unused", playerData: { profile: { cash: 100 }, stats: { wins: 7 } } });
  const first = (await store.findUserById(record._id)).playerData;
  const stale = (await store.findUserById(record._id)).playerData;
  first.profile.cash = 80;
  await store.saveUserPlayerData(record._id, first);
  assert.equal(first.stateRevision, 1);
  stale.profile.cash = 150;
  await assert.rejects(store.saveUserPlayerData(record._id, stale), (error) => error.statusCode === 409);
  const saved = (await store.findUserById(record._id)).playerData;
  assert.equal(saved.profile.cash, 80);
  assert.equal(saved.stats.wins, 7);
  assert.equal(saved.stateRevision, 1);
});

test("concurrent saves accept exactly one snapshot", async () => {
  const record = await store.createUserRecord({ username: "concurrent", passwordHash: "unused", playerData: { profile: { cash: 100 } } });
  const results = await Promise.allSettled([80, 60, 40].map((cash) => store.saveUserPlayerData(record._id, { ...structuredClone(record.playerData), profile: { cash } })));
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected" && r.reason.statusCode === 409).length, 2);
});

test("admin bootstrap is opt-in; weak legacy credentials and tokens are revoked without deleting progress", async () => {
  const account = { username: "testadmin", email: "admin@example.test" };
  const options = { account, adminUsernames: [account.username], findUser: store.findUserByLogin, createUser: store.createUserRecord, updateAuthentication: store.updateUserAuthentication, createPlayer: () => ({ profile: { cash: 0 } }), logWarning: () => {} };
  await bootstrapAdmin(options);
  assert.equal(await store.findUserByLogin(account.username), null);
  const legacy = await store.createUserRecord({ ...account, passwordHash: await bcrypt.hash("1234", 4), playerData: { profile: { cash: 4200 } } });
  const oldToken = auth.verifyAuthToken(auth.signAuthToken(legacy));
  await bootstrapAdmin(options);
  let user = await store.findUserById(legacy._id);
  assert.equal(user.authDisabled, true);
  assert.equal(user.playerData.profile.cash, 4200);
  assert.equal(auth.isSessionCurrent(oldToken, user), false);
  process.env.ADMIN_BOOTSTRAP_PASSWORD = "Strong-Regression-Pass!";
  try { await bootstrapAdmin(options); } finally { delete process.env.ADMIN_BOOTSTRAP_PASSWORD; }
  user = await store.findUserById(legacy._id);
  assert.equal(user.authDisabled, false);
  assert.equal(await bcrypt.compare("Strong-Regression-Pass!", user.passwordHash), true);
  assert.equal(auth.isSessionCurrent(oldToken, user), false);
  assert.equal(auth.isSessionCurrent(auth.verifyAuthToken(auth.signAuthToken(user)), user), true);
  assert.equal(user.playerData.profile.cash, 4200);
  process.env.ADMIN_BOOTSTRAP_PASSWORD = "Rotated-Regression-Pass!";
  process.env.ADMIN_BOOTSTRAP_ROTATE_PASSWORD = "1";
  const tokenBeforeRotation = auth.verifyAuthToken(auth.signAuthToken(user));
  try { await bootstrapAdmin(options); } finally {
    delete process.env.ADMIN_BOOTSTRAP_PASSWORD;
    delete process.env.ADMIN_BOOTSTRAP_ROTATE_PASSWORD;
  }
  user = await store.findUserById(legacy._id);
  assert.equal(await bcrypt.compare("Rotated-Regression-Pass!", user.passwordHash), true);
  assert.equal(auth.isSessionCurrent(tokenBeforeRotation, user), false);
  assert.equal(user.playerData.profile.cash, 4200);
  assert.throws(() => validateAdminPassword("1234"));
  assert.throws(() => validateAdminPassword("ą".repeat(37)));
});

for (const [filename, moduleName, initialize] of [["users.db", "userStore", "initUserStore"], ["world-state.db", "worldStateStore", "initWorldStateStore"]]) {
  test(`corrupted ${filename} stops startup and preserves the original bytes`, async () => {
    const corruptDirectory = await mkdtemp(path.join(directory, "corrupt-"));
    const original = "not-json\n{broken-record\n";
    await writeFile(path.join(corruptDirectory, filename), original);
    const moduleUrl = new URL(`../../backend/src/lib/${moduleName}.js`, import.meta.url).href;
    const result = spawnSync(process.execPath, ["--input-type=module", "-e", `const store = await import(${JSON.stringify(moduleUrl)}); await store.${initialize}();`], { env: { ...process.env, DATA_DIR: corruptDirectory }, encoding: "utf8", windowsHide: true });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Original file preserved/);
    assert.equal(await readFile(path.join(corruptDirectory, filename), "utf8"), original);
  });
}
