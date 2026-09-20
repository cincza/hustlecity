import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { createOperationKey, OPERATION_RETENTION_MS } from "../../shared/transactions.js";
import { executeContactAction } from "../../shared/contacts.js";

const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-transactions-"));
process.env.DATA_DIR = directory;
process.env.BACKEND_ENV_FILE = path.join(directory, "no-env");
const store = await import("../../backend/src/lib/userStore.js");
const database = await import("../../backend/src/lib/gameDatabase.js");
const { runTransactionalAction } = await import("../../backend/src/services/transactionService.js");
const { afterCommit, afterTransaction, currentTransaction } = await import("../../backend/src/lib/transactionContext.js");
let sequence = 0;

test("premium rewards and purchased cosmetics roll back with the receipt on storage failure", async () => {
  const actor = await account();
  let user = await store.findUserById(actor._id);
  executeContactAction(user.playerData, "class", { classId: "broker" });
  user.playerData.contacts.weekCount = 9;
  await store.saveUserPlayerData(actor._id, user.playerData);
  const req = request(actor._id, createOperationKey(), {}, "/contacts/weekly");
  const db = await database.getGameDatabase();
  db.exec("CREATE TEMP TRIGGER fail_contact BEFORE INSERT ON operation_receipts BEGIN SELECT RAISE(ABORT, 'contact disk failure'); END;");
  const handler = async (_req, res) => {
    const current = await store.findUserById(actor._id);
    executeContactAction(current.playerData, "weekly");
    await store.saveUserPlayerData(actor._id, current.playerData);
    res.json({ user: current.playerData });
  };
  try { await assert.rejects(runTransactionalAction(req, response(), handler), /contact disk failure/); }
  finally { db.exec("DROP TRIGGER fail_contact"); }
  user = await store.findUserById(actor._id);
  assert.equal(user.playerData.profile.premiumTokens, undefined);
  assert.equal(user.playerData.contacts.weekClaimed, false);
  assert.equal(await database.readOperationReceipt(actor._id, req.get("Idempotency-Key")), null);
  await runTransactionalAction(req, response(), handler);
  await runTransactionalAction(req, response(), () => assert.fail("premium reward repeated"));
  const purchase = request(actor._id, createOperationKey(), { id: "silver" }, "/contacts/cosmetic");
  await runTransactionalAction(purchase, response(), async (_req, res) => {
    const current = await store.findUserById(actor._id);
    executeContactAction(current.playerData, "cosmetic", { id: "silver" });
    await store.saveUserPlayerData(actor._id, current.playerData);
    res.json({ user: current.playerData });
  });
  await runTransactionalAction(purchase, response(), () => assert.fail("cosmetic paid twice"));
  user = await store.findUserById(actor._id);
  assert.equal(user.playerData.profile.premiumTokens, 0);
  assert.deepEqual(user.playerData.contacts.cosmetics, ["silver"]);
});

test("market storage failure rolls back cash, inventory and receipt without publishing stock", async () => {
  const actor = await account();
  await database.saveWorldDocument("market-failure-test", { stock: 5 });
  const db = await database.getGameDatabase();
  db.exec("CREATE TEMP TRIGGER fail_market BEFORE UPDATE ON world_documents WHEN NEW.id = 'market-failure-test' BEGIN SELECT RAISE(ABORT, 'market disk failure'); END;");
  const req = request(actor._id, createOperationKey(), { productId: "smoke", quantity: 1 }, "/market/buy");
  let published = false;
  try {
    await assert.rejects(runTransactionalAction(req, response(), async (_req, res) => {
      const user = await store.findUserById(actor._id);
      user.playerData.profile.cash -= 20;
      user.playerData.inventory = { smoke: 1 };
      await store.saveUserPlayerData(actor._id, user.playerData);
      const world = await database.readWorldDocument("market-failure-test");
      await database.saveWorldDocument("market-failure-test", { stock: 4 }, world.revision);
      afterCommit(() => { published = true; });
      res.json({ paid: 20 });
    }), /market disk failure/);
    const saved = await store.findUserById(actor._id);
    assert.equal(saved.playerData.profile.cash, 100);
    assert.equal(saved.playerData.inventory, undefined);
    assert.equal((await database.readWorldDocument("market-failure-test")).value.stock, 5);
    assert.equal(await database.readOperationReceipt(actor._id, req.get("Idempotency-Key")), null);
    assert.equal(published, false);
  } finally { db.exec("DROP TRIGGER fail_market"); }
});

after(async () => {
  store.closeUserStore();
  assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
  await rm(directory, { recursive: true, force: true });
});

async function account(cash = 100) {
  return store.createUserRecord({ username: `account${++sequence}`, passwordHash: "test-hash", playerData: { profile: { cash }, gang: { vault: 0 } } });
}

function request(actorId, key = createOperationKey(), body = { amount: 30 }, route = "/bank/deposit") {
  return { user: { id: actorId }, method: "POST", path: route, originalUrl: route, body, get: (name) => name === "Idempotency-Key" ? key : undefined };
}

function response() {
  return { statusCode: 200, body: null, headers: {}, sent: false,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(body) { this.body = body; this.sent = true; return this; },
  };
}

async function transfer(first, second, res) {
  const a = await store.findUserById(first._id);
  const b = await store.findUserById(second._id);
  a.playerData.profile.cash -= 30;
  b.playerData.profile.cash += 30;
  await Promise.all([store.saveUserPlayerData(a._id, a.playerData), store.saveUserPlayerData(b._id, b.playerData)]);
  res.json({ result: { amount: 30 }, user: { id: a._id, profile: a.playerData.profile } });
}

test("both balances and the receipt commit together; a retry never runs the action again", async () => {
  const a = await account(), b = await account();
  const req = request(a._id), first = response();
  await runTransactionalAction(req, first, async (_req, res) => transfer(a, b, res));
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 70);
  assert.equal((await store.findUserById(b._id)).playerData.profile.cash, 130);
  const replay = response();
  await runTransactionalAction(req, replay, () => assert.fail("replay executed the mutation"));
  assert.deepEqual(replay.body, first.body);
  assert.equal(replay.headers["Idempotency-Replayed"], "true");
  const changed = { ...req, body: { amount: 31 } };
  await assert.rejects(runTransactionalAction(changed, response(), () => assert.fail()), (error) => error.code === "operation_key_reused");
});

test("dealer stock and player balance roll back together on a world revision conflict", async () => {
  const a = await account();
  await database.saveWorldDocument("test-dealer", { stock: 10 });
  const req = request(a._id, createOperationKey(), {}, "/dealer/buy");
  await assert.rejects(runTransactionalAction(req, response(), async (_req, res) => {
    const user = await store.findUserById(a._id);
    user.playerData.profile.cash -= 20;
    await store.saveUserPlayerData(a._id, user.playerData);
    await database.saveWorldDocument("test-dealer", { stock: 9 }, 0);
    res.json({ ok: true });
  }), /Stan gracza/);
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
  assert.equal((await database.readWorldDocument("test-dealer")).value.stock, 10);
  assert.equal(await database.readOperationReceipt(a._id, req.get("Idempotency-Key")), null);
  await runTransactionalAction(req, response(), async (_req, res) => {
    const user = await store.findUserById(a._id);
    user.playerData.profile.cash -= 20;
    await store.saveUserPlayerData(a._id, user.playerData);
    await database.saveWorldDocument("test-dealer", { stock: 9 }, 1);
    res.json({ ok: true });
  });
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 80);
  assert.equal((await database.readWorldDocument("test-dealer")).value.stock, 9);
  await runTransactionalAction(req, response(), () => assert.fail("Duplicate dealer payment"));
});

test("two buyers cannot acquire the same club even when both observed it as available", async () => {
  const a = await account(), b = await account();
  let resume, ready;
  const paused = new Promise((resolve) => { ready = resolve; });
  const continueFirst = new Promise((resolve) => { resume = resolve; });
  async function claim(actor, res) {
    const user = await store.findUserById(actor._id);
    user.playerData.profile.cash -= 50;
    user.playerData.club = { owned: true, sourceId: "race-test-club" };
    await store.saveUserPlayerData(actor._id, user.playerData);
    res.json({ bought: true });
  }
  const firstReq = request(a._id, createOperationKey(), {}, "/clubs/claim");
  const first = runTransactionalAction(firstReq, response(), async (_req, res) => {
    await claim(a, res); ready(); await continueFirst;
  });
  const rejected = assert.rejects(first, (error) => error.statusCode === 409);
  await paused;
  await runTransactionalAction(request(b._id, createOperationKey(), {}, "/clubs/claim"), response(), async (_req, res) => claim(b, res));
  resume(); await rejected;
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
  assert.equal((await store.findUserById(a._id)).playerData.club, undefined);
  assert.equal((await store.findUserById(b._id)).playerData.profile.cash, 50);
  assert.equal(await database.readOperationReceipt(a._id, firstReq.get("Idempotency-Key")), null);
});

test("a SQL failure after the first row update rolls back every balance and the receipt", async () => {
  const a = await account(), b = await account();
  const db = await database.getGameDatabase();
  // Force the exact failure window: the first account UPDATE succeeds, the second fails.
  db.exec(`CREATE TEMP TRIGGER fail_second_update BEFORE UPDATE ON users WHEN NEW.id = '${b._id}' BEGIN SELECT RAISE(ABORT, 'injected storage failure'); END;`);
  const req = request(a._id), res = response();
  let published = false, released = false;
  try {
    await assert.rejects(runTransactionalAction(req, res, async (_req, captured) => {
      afterCommit(() => { published = true; });
      afterTransaction(() => { released = true; });
      await transfer(a, b, captured);
    }), /injected storage failure/);
  } finally { db.exec("DROP TRIGGER fail_second_update"); }
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
  assert.equal((await store.findUserById(b._id)).playerData.profile.cash, 100);
  assert.equal(await database.readOperationReceipt(a._id, req.get("Idempotency-Key")), null);
  assert.equal(res.sent, false);
  assert.equal(published, false);
  assert.equal(released, true);
});

test("staged writes stay invisible and a concurrent revision conflict rolls back the entire action", async () => {
  const a = await account(), b = await account();
  let resume, ready;
  const waiting = new Promise((resolve) => { resume = resolve; });
  const staged = new Promise((resolve) => { ready = resolve; });
  const req = request(a._id);
  const running = runTransactionalAction(req, response(), async (_req, res) => {
    await transfer(a, b, res);
    ready();
    await waiting;
  });
  await staged;
  assert.equal(currentTransaction(), null);
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
  const newer = (await store.findUserById(b._id)).playerData;
  newer.profile.cash = 120;
  await store.saveUserPlayerData(b._id, newer);
  resume();
  await assert.rejects(running, (error) => error.statusCode === 409);
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
  assert.equal((await store.findUserById(b._id)).playerData.profile.cash, 120);
  assert.equal(await database.readOperationReceipt(a._id, req.get("Idempotency-Key")), null);
});

test("overlapping identical requests are held; receipts are scoped to the authenticated account", async () => {
  const a = await account(), b = await account();
  let resume, ready;
  const waiting = new Promise((resolve) => { resume = resolve; });
  const entered = new Promise((resolve) => { ready = resolve; });
  const req = request(a._id);
  const running = runTransactionalAction(req, response(), async (_req, res) => { ready(); await waiting; await transfer(a, b, res); });
  await entered;
  await assert.rejects(runTransactionalAction(req, response(), () => assert.fail()), (error) => error.code === "operation_in_progress");
  resume(); await running;
  let called = false;
  await runTransactionalAction({ ...req, user: { id: b._id } }, response(), (_req, res) => { called = true; res.json({ ok: true }); });
  assert.equal(called, true);
});

test("rejected actions and expired keys cannot commit or publish side effects", async () => {
  const a = await account(), b = await account();
  let published = false;
  const req = request(a._id), res = response();
  await runTransactionalAction(req, res, async (_req, captured) => {
    afterCommit(() => { published = true; });
    const player = (await store.findUserById(a._id)).playerData;
    player.profile.cash = 0;
    await store.saveUserPlayerData(a._id, player);
    captured.status(400).json({ error: "Rejected" });
  });
  assert.equal(res.statusCode, 400);
  assert.equal(published, false);
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
  const expired = `${Date.now() - OPERATION_RETENTION_MS - 1000}-abcdefghijklmnop`;
  await assert.rejects(runTransactionalAction(request(b._id, expired), response(), () => assert.fail()), (error) => error.code === "operation_expired");
});

test("process exit after a partial SQL write recovers the complete pre-transaction state", async () => {
  const a = await account();
  const script = `import { DatabaseSync } from 'node:sqlite';
    const db=new DatabaseSync(${JSON.stringify(database.gameDatabasePath)});
    db.exec('BEGIN IMMEDIATE');
    db.prepare("UPDATE users SET document=json_set(document, '$.playerData.profile.cash', 0) WHERE id=?").run(${JSON.stringify(a._id)});
    process.exit(77);`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8", windowsHide: true });
  assert.equal(child.status, 77);
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 100);
});

test("a committed payment is replayable after process exit before HTTP delivery", async () => {
  const a = await account(), b = await account();
  const key = createOperationKey();
  const serviceUrl = new URL("../../backend/src/services/transactionService.js", import.meta.url).href;
  const storeUrl = new URL("../../backend/src/lib/userStore.js", import.meta.url).href;
  const script = `import { runTransactionalAction } from ${JSON.stringify(serviceUrl)};
    import { findUserById, saveUserPlayerData } from ${JSON.stringify(storeUrl)};
    const req={user:{id:${JSON.stringify(a._id)}},method:'POST',path:'/bank/deposit',originalUrl:'/bank/deposit',body:{amount:30},get:()=>${JSON.stringify(key)}};
    const res={statusCode:200,json(){process.exit(78)},setHeader(){},status(n){this.statusCode=n;return this}};
    await runTransactionalAction(req,res,async (_req,res)=>{
      const a=await findUserById(${JSON.stringify(a._id)}),b=await findUserById(${JSON.stringify(b._id)});
      a.playerData.profile.cash-=30;b.playerData.profile.cash+=30;
      await saveUserPlayerData(a._id,a.playerData);await saveUserPlayerData(b._id,b.playerData);
      res.json({result:{amount:30}});
    });`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], { env: process.env, encoding: "utf8", windowsHide: true });
  assert.equal(child.status, 78, child.stderr);
  const replay = response();
  await runTransactionalAction(request(a._id, key), replay, () => assert.fail("payment repeated after restart"));
  assert.deepEqual(replay.body, { result: { amount: 30 } });
  assert.equal((await store.findUserById(a._id)).playerData.profile.cash, 70);
  assert.equal((await store.findUserById(b._id)).playerData.profile.cash, 130);
});
