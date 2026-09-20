import test from "node:test";
import assert from "node:assert/strict";
import { createTransactionClient } from "../../shared/transactionClient.js";
import { isTransactionalAction } from "../../shared/transactions.js";
import { ApiError, requestJson } from "../../shared/http.js";

function memory() {
  const values = new Map();
  return { values, get: async (key) => values.get(key), set: async (key, value) => values.set(key, value), remove: async (key) => values.delete(key) };
}
const options = { token: "test-session", method: "POST", body: { amount: 100 } };
const instant = async () => {};

test("lost response retries the same persisted key and concurrent taps share one operation", async () => {
  const storage = memory(), keys = [];
  const perform = createTransactionClient({ storage, wait: instant, send: async (_path, request) => {
    assert.equal(storage.values.size, 1, "persist before sending");
    keys.push(request.idempotencyKey);
    if (keys.length === 1) throw new ApiError("Connection lost");
    return { balance: 900 };
  } });
  const first = perform("/bank/deposit", options);
  const second = perform("/bank/deposit", options);
  assert.equal(first, second);
  assert.deepEqual(await first, { balance: 900 });
  assert.equal(keys.length, 2);
  assert.equal(keys[0], keys[1]);
  assert.equal(storage.values.size, 0);
});

test("an unknown outcome survives client recreation and token renewal for the same player", async () => {
  const storage = memory(), keys = [];
  const token = (nonce) => `header.${Buffer.from(JSON.stringify({ sub: "player-one", nonce })).toString("base64url")}.signature`;
  const failed = createTransactionClient({ storage, wait: instant, send: async (_path, request) => {
    keys.push(request.idempotencyKey); throw new ApiError("offline");
  } });
  await assert.rejects(failed("/bank/deposit", { ...options, token: token(1) }));
  const restarted = createTransactionClient({ storage, send: async (_path, request) => {
    keys.push(request.idempotencyKey); return { replayed: true };
  } });
  await restarted("/bank/deposit", { ...options, token: token(2) });
  assert.equal(keys.length, 3);
  assert.equal(new Set(keys).size, 1);
  assert.equal(storage.values.size, 0);
});

test("different players and amounts cannot accidentally reuse a pending payment", async () => {
  const storage = memory(), keys = [];
  const perform = createTransactionClient({ storage, wait: instant, send: async (_path, request) => {
    keys.push(request.idempotencyKey); throw new ApiError("unknown", 503);
  } });
  await assert.rejects(perform("/bank/deposit", options));
  await assert.rejects(perform("/bank/deposit", { ...options, token: "another-session" }));
  await assert.rejects(perform("/bank/deposit", { ...options, body: { amount: 200 } }));
  assert.equal(new Set(keys).size, 3);
  assert.equal(storage.values.size, 3);
});

test("storage failure prevents sending; rejected actions clear their key but pending actions retain it", async () => {
  const broken = createTransactionClient({ storage: { get: async () => null, set: async () => { throw Error("full"); } }, send: () => assert.fail("sent without durable key") });
  await assert.rejects(broken("/bank/deposit", options), /Nie można zapisać/);
  const storage = memory();
  const rejected = createTransactionClient({ storage, wait: instant, send: async () => { throw new ApiError("insufficient funds", 400); } });
  await assert.rejects(rejected("/bank/deposit", options));
  assert.equal(storage.values.size, 0);
  const pending = createTransactionClient({ storage, wait: instant, send: async () => { throw new ApiError("pending", 409, "operation_in_progress"); } });
  await assert.rejects(pending("/bank/deposit", options));
  assert.equal(storage.values.size, 1);
});

test("HTTP transports the key and machine-readable error; only supported mutations use retries", async () => {
  await assert.rejects(requestJson("https://example.test", "/bank/deposit", { ...options, idempotencyKey: "test-key" }, async (_url, init) => {
    assert.equal(init.headers["Idempotency-Key"], "test-key");
    return new Response(JSON.stringify({ error: "pending", code: "operation_in_progress" }), { status: 409 });
  }), (error) => error.status === 409 && error.code === "operation_in_progress");
  for (const route of [
    "/bank/deposit", "/gang/contribute", "/clubs/visit", "/social/players/a/attack", "/admin/players/a/grant-cash",
    "/escorts/buy", "/factories/produce", "/fightclub/run/start", "/fightclub/run/fight", "/fightclub/boosts/buy",
    "/contracts/execute", "/heists/pickpocket/execute", "/player/gym/train", "/player/restaurant/eat",
    "/player/hospital/heal", "/player/hospital/critical-care/public", "/player/jail/bribe", "/chat/global", "/chat/prison",
    "/casino/slot", "/casino/roulette", "/casino/high-risk", "/casino/blackjack/start", "/casino/blackjack/hit", "/casino/blackjack/stand",
  ]) assert.equal(isTransactionalAction(route), true, route);
  assert.equal(isTransactionalAction("/dealer/sell"), true);
  for (const route of ["/market/buy", "/market/sell"]) assert.equal(isTransactionalAction(route), true);
  for (const route of ["/casino/slots", "/auth/login"]) assert.equal(isTransactionalAction(route), false);
  assert.equal(isTransactionalAction("/bank/deposit", "GET"), false);
});
