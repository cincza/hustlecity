import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import { createOperationKey } from "../../shared/transactions.js";

test("city director is shared, persisted and its response remains idempotent after restart", { timeout: 20000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-city-director-api-"));
  let server, base, token, logs = "";
  async function start() {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), JWT_SECRET: "isolated-city-director-secret", ADMIN_BOOTSTRAP_PASSWORD: "", ALPHA_TEST_STARTING_CASH: "5000", ALPHA_TEST_STARTING_RESPECT: "10" } });
    server.stdout.on("data", (data) => { logs += data; const match = String(data).match(/"boundPort":(\d+)/); if (match) port = Number(match[1]); });
    server.stderr.on("data", (data) => { logs += data; });
    for (let i = 0; i < 120 && !port; i += 1) { if (server.exitCode !== null) throw new Error(logs.slice(-2500)); await new Promise((resolve) => setTimeout(resolve, 50)); }
    assert.ok(port); base = `http://127.0.0.1:${port}`;
  }
  async function stop() { if (server && server.exitCode === null) { const exit = once(server, "exit"); server.kill(); await exit; } }
  async function call(route, body, key, auth = token) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(5000), method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, replayed: response.headers.get("Idempotency-Replayed"), ...(await response.json()) };
  }
  try {
    await start();
    const first = await call("/auth/register", { username: "directorone", password: "Director-Local-Test!" }, null, null);
    token = first.token;
    const eventOne = await call("/city-event");
    assert.equal(eventOne.status, 200);
    await new Promise((resolve) => setTimeout(resolve, 2600));
    const second = await call("/auth/register", { username: "directortwo", password: "Director-Local-Test!" }, null, null);
    const eventTwo = await call("/city-event", null, null, second.token);
    assert.equal(eventTwo.event.key, eventOne.event.key);
    const classResult = await call("/contacts/class", { classId: "broker" }, createOperationKey());
    assert.equal(classResult.status, 200);
    const premiumBefore = classResult.user.profile.premiumTokens;
    const key = createOperationKey();
    const answered = await call("/city-event/respond", { choiceId: "broker" }, key);
    assert.equal(answered.status, 200);
    assert.equal(answered.user.profile.premiumTokens, premiumBefore);
    assert.equal(answered.user.cityDirector.claims[0].key, eventOne.event.key);
    const duplicate = await call("/city-event/respond", { choiceId: "broker" }, key);
    assert.equal(duplicate.replayed, "true");
    assert.deepEqual(duplicate.user, answered.user);
    assert.equal((await call("/city-event/respond", { choiceId: "adapt" }, createOperationKey())).status, 400);
    await stop();
    const db = new DatabaseSync(path.join(directory, "game.sqlite"));
    const director = JSON.parse(db.prepare("SELECT document FROM world_documents WHERE id = 'city-director-state'").get().document);
    assert.equal(director.currentKey, eventOne.event.key);
    db.close();
    await start();
    const restored = await call("/me");
    assert.equal(restored.user.cityEvent.key, eventOne.event.key);
    assert.equal(restored.user.cityDirector.claims.filter((entry) => entry.key === eventOne.event.key).length, 1);
  } finally {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
