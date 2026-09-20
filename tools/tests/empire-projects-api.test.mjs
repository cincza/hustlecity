import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import { createOperationKey } from "../../shared/transactions.js";

test("empire project funding and finale persist and replay without double spending", { timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-empire-api-"));
  let server, base, token, userId, logs = "";
  async function start() {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), NODE_ENV: "test", JWT_SECRET: "isolated-empire-secret", ADMIN_BOOTSTRAP_PASSWORD: "", ALPHA_TEST_STARTING_CASH: "3000000", ALPHA_TEST_STARTING_BANK: "3000000", ALPHA_TEST_STARTING_RESPECT: "50" } });
    server.stdout.on("data", (data) => { logs += data; const match = String(data).match(/"boundPort":(\d+)/); if (match) port = Number(match[1]); });
    server.stderr.on("data", (data) => { logs += data; });
    for (let i = 0; i < 120 && !port; i += 1) { if (server.exitCode !== null) throw new Error(logs.slice(-2500)); await new Promise((resolve) => setTimeout(resolve, 50)); }
    assert.ok(port, logs.slice(-2500)); base = `http://127.0.0.1:${port}`;
  }
  async function stop() { if (server && server.exitCode === null) { const exit = once(server, "exit"); server.kill(); await exit; } }
  async function call(route, body, key, auth = token) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(5000), method: body === undefined ? "GET" : "POST", headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, replayed: response.headers.get("Idempotency-Replayed"), ...(await response.json()) };
  }
  function mutate(mutator) {
    const db = new DatabaseSync(path.join(directory, "game.sqlite"));
    const row = db.prepare("SELECT revision, document FROM users WHERE id = ?").get(userId);
    const document = JSON.parse(row.document); mutator(document.playerData); const revision = Number(row.revision) + 1;
    document.playerData.stateRevision = revision;
    db.prepare("UPDATE users SET revision = ?, document = ? WHERE id = ?").run(revision, JSON.stringify(document), userId); db.close();
  }
  try {
    await start();
    const registered = await call("/auth/register", { username: "empirerunner", password: "Empire-Runner-Test!" }, null, null);
    assert.equal(registered.status, 201); token = registered.token; userId = registered.user.id;
    await stop();
    mutate((p) => { p.profile.cash = 3000000; p.profile.bank = 3000000; p.profile.respect = 50; p.businessesOwned = ["bar", "club", "laundry", "cleaning"].map((id) => ({ id, count: 1 })); p.contacts = { completed: 24, stories: { relations: { oldtown: { trust: 6 }, neon: { trust: 6 }, harbor: { trust: 6 } } } }; });
    await start();
    const startKey = createOperationKey();
    const funded = await call("/empire-projects/start", { projectId: "city-holding" }, startKey);
    assert.equal(funded.status, 200, JSON.stringify(funded)); assert.equal(funded.user.profile.cash, 2720000);
    const replayStart = await call("/empire-projects/start", { projectId: "city-holding" }, startKey);
    assert.equal(replayStart.replayed, "true"); assert.equal(replayStart.user.profile.cash, funded.user.profile.cash);
    await stop();
    mutate((p) => { p.stats.businessCollections += 4; p.stats.marketGoodsSold += 20; p.stats.bankDepositedTotal += 100000; });
    await start();
    const restored = await call("/me"); assert.equal(restored.user.empireProjectsView.active.proof.ready, true);
    const finishKey = createOperationKey(); const bankBefore = restored.user.profile.bank;
    const finished = await call("/empire-projects/finalize", { choiceId: "charter" }, finishKey);
    assert.equal(finished.status, 200, JSON.stringify(finished)); assert.equal(finished.user.profile.bank, bankBefore - 350000);
    await stop(); await start();
    const replayFinish = await call("/empire-projects/finalize", { choiceId: "charter" }, finishKey);
    assert.equal(replayFinish.replayed, "true"); assert.equal(replayFinish.user.profile.bank, finished.user.profile.bank);
    const final = await call("/me"); assert.equal(final.user.empireProjects.active, null); assert.equal(final.user.empireProjects.completed["city-holding"].choiceId, "charter"); assert.equal(final.user.empireProjects.history.length, 1);
  } finally {
    await stop(); assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir())); await rm(directory, { recursive: true, force: true });
  }
});
