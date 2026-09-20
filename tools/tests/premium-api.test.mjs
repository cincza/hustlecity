import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";
import { createOperationKey } from "../../shared/transactions.js";

test("signed payment API: SQL rollback, repeated notifications, cosmetic purchase and restart", { timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-premium-api-"));
  const secret = "whsec_local_fixture";
  let server, base, token, logs = "";
  async function start() {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), JWT_SECRET: "isolated-premium-secret", ADMIN_BOOTSTRAP_PASSWORD: "", STRIPE_WEBHOOK_SECRET: secret, STRIPE_SECRET_KEY: "", PREMIUM_RETURN_URL: "", ALPHA_TEST_STARTING_CASH: "5000", ALPHA_TEST_STARTING_RESPECT: "1" } });
    server.stdout.on("data", (data) => { logs += data; const match = String(data).match(/"boundPort":(\d+)/); if (match) port = Number(match[1]); });
    server.stderr.on("data", (data) => { logs += data; });
    for (let i = 0; i < 120 && !port; i++) { if (server.exitCode !== null) throw new Error(logs.slice(-2000)); await new Promise((r) => setTimeout(r, 50)); }
    assert.ok(port); base = `http://127.0.0.1:${port}`;
  }
  async function stop() { if (server && server.exitCode === null && server.signalCode === null) { const exit = once(server, "exit"); server.kill(); await exit; } }
  async function call(route, body, headers = {}) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(5000), method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, ...(await response.json()) };
  }
  async function notify(event, valid = true) {
    const raw = JSON.stringify(event), timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac("sha256", secret).update(`${timestamp}.${raw}`).digest("hex");
    return call("/premium/webhook", event, { "Stripe-Signature": `t=${timestamp},v1=${valid ? signature : "0".repeat(64)}` });
  }
  function editDatabase(edit) {
    assert.ok(server.exitCode !== null || server.signalCode !== null, "Fixture edits require stopped server");
    const db = new DatabaseSync(path.join(directory, "game.sqlite"));
    try { edit(db); } finally { db.close(); }
  }
  try {
    await start();
    const account = await call("/auth/register", { username: "paymentqa", password: "Payment-Local-Test!" });
    assert.equal(account.status, 201); token = account.token;
    const catalog = await call("/premium/catalog"); assert.equal(catalog.enabled, false);
    assert.equal((await call("/premium/checkout", { packId: "pocket" }, { "Idempotency-Key": createOperationKey() })).status, 503);
    const order = { id: "cs_test_fixture", userId: account.user.id, packId: "pocket", amount: 990, currency: "pln", tokens: 10, state: "pending" };
    const event = { id: "evt_fixture", type: "checkout.session.completed", data: { object: { id: order.id, payment_status: "paid", amount_total: 990, currency: "pln", metadata: { playerId: order.userId, packId: order.packId } } } };
    await stop();
    editDatabase((db) => {
      db.prepare("INSERT INTO world_documents (id, revision, document) VALUES (?, 1, ?)").run(`premium-order:${order.id}`, JSON.stringify(order));
      db.exec("CREATE TRIGGER fail_premium BEFORE UPDATE ON world_documents WHEN NEW.id = 'premium-order:cs_test_fixture' BEGIN SELECT RAISE(ABORT, 'premium disk failure'); END;");
    });
    await start();
    assert.equal((await notify(event, false)).status, 400);
    const wrong = structuredClone(event); wrong.data.object.amount_total = 1;
    assert.equal((await notify(wrong)).status, 400);
    assert.equal((await notify(event)).status, 500);
    assert.equal(Number((await call("/me")).user.profile.premiumTokens || 0), 0);
    await stop(); editDatabase((db) => db.exec("DROP TRIGGER fail_premium")); await start();
    const paid = await notify(event); assert.equal(paid.status, 200); assert.equal(paid.credited, true);
    assert.equal((await notify({ ...event, id: "evt_other" })).credited, false);
    assert.equal((await call("/me")).user.profile.premiumTokens, 10);
    const key = createOperationKey();
    const purchased = await call("/contacts/cosmetic", { id: "silver" }, { "Idempotency-Key": key });
    assert.equal(purchased.status, 200); assert.equal(purchased.user.profile.premiumTokens, 8);
    await stop(); await start();
    assert.equal((await notify(event)).credited, false);
    const replay = await call("/contacts/cosmetic", { id: "silver" }, { "Idempotency-Key": key });
    assert.deepEqual(replay.user, purchased.user);
    const restored = (await call("/me")).user;
    assert.equal(restored.profile.premiumTokens, 8); assert.equal(restored.contacts.walletHistory.length, 2);
    assert.deepEqual(restored.contacts.cosmetics, ["silver"]);
  } finally {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
