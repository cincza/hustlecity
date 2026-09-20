import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import { createOperationKey } from "../../shared/transactions.js";

test("rival API persists a finale through restart and replays the same response without a second cost", { timeout: 25000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-rival-api-"));
  let server, base, token, userId, logs = "";
  async function start() {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), NODE_ENV: "test", JWT_SECRET: "isolated-rival-secret", ADMIN_BOOTSTRAP_PASSWORD: "", ALPHA_TEST_STARTING_CASH: "100000", ALPHA_TEST_STARTING_BANK: "100000", ALPHA_TEST_STARTING_RESPECT: "30" } });
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
  try {
    await start();
    const registered = await call("/auth/register", { username: "rivalrunner", password: "Rival-Runner-Test!" }, null, null);
    assert.equal(registered.status, 201); token = registered.token; userId = registered.user.id;
    await stop();
    const db = new DatabaseSync(path.join(directory, "game.sqlite"));
    const row = db.prepare("SELECT revision, document FROM users WHERE id = ?").get(userId);
    const document = JSON.parse(row.document); const nextRevision = Number(row.revision) + 1;
    document.playerData.rivals = { active: { id: "rival-api-case", rivalId: "varga-ledger", districtId: "oldtown", stage: "final", escalation: 2, cause: { kind: "operation", label: "Testowy ślad po operacji", sourceKey: "api-seed" }, createdAt: Date.now(), updatedAt: Date.now(), responseDueAt: Date.now() + 3600000, classIdSnapshot: null, gangSnapshot: null, ignored: false, prepared: false }, history: [], seenTriggers: ["api-seed"] };
    document.playerData.stateRevision = nextRevision;
    db.prepare("UPDATE users SET revision = ?, document = ? WHERE id = ?").run(nextRevision, JSON.stringify(document), userId); db.close();
    await start();
    const before = await call("/me"); assert.equal(before.status, 200, JSON.stringify(before)); const cashBefore = before.user.profile.cash;
    assert.equal(before.user.rivalView.active.id, "rival-api-case");
    const key = createOperationKey();
    const settled = await call("/rivals/respond", { choiceId: "concede" }, key);
    assert.equal(settled.status, 200); assert.equal(settled.result.resolved, true); assert.equal(settled.user.profile.cash, cashBefore - 3200);
    await stop(); await start();
    const replay = await call("/rivals/respond", { choiceId: "concede" }, key);
    assert.equal(replay.replayed, "true"); assert.equal(replay.user.profile.cash, settled.user.profile.cash);
    const restored = await call("/me");
    assert.equal(restored.user.rivalView.active, null); assert.equal(restored.user.rivals.history.filter((entry) => entry.id === "rival-api-case").length, 1);
    assert.equal((await call("/rivals/respond", { choiceId: "concede" }, createOperationKey())).status, 400);
  } finally {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
