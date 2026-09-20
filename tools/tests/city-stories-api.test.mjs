import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import os from "node:os";
import { createOperationKey } from "../../shared/transactions.js";

test("city decision persists through restart and its idempotent replay cannot duplicate cash or pressure", { timeout: 20000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-city-story-api-"));
  let server, base, token, accountId, logs = "";
  async function start() {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), JWT_SECRET: "isolated-city-story-secret", ADMIN_BOOTSTRAP_PASSWORD: "", ALPHA_TEST_STARTING_CASH: "5000", ALPHA_TEST_STARTING_RESPECT: "5" } });
    server.stdout.on("data", (data) => { logs += data; const match = String(data).match(/"boundPort":(\d+)/); if (match) port = Number(match[1]); });
    server.stderr.on("data", (data) => { logs += data; });
    for (let i = 0; i < 120 && !port; i++) { if (server.exitCode !== null) throw new Error(logs.slice(-2000)); await new Promise((resolve) => setTimeout(resolve, 50)); }
    assert.ok(port); base = `http://127.0.0.1:${port}`;
  }
  async function stop() { if (server && server.exitCode === null && server.signalCode === null) { const exit = once(server, "exit"); server.kill(); await exit; } }
  async function call(route, body, key) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(5000), method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, ...(await response.json()) };
  }
  try {
    await start();
    const account = await call("/auth/register", { username: "citystoryqa", password: "City-Story-Local-Test!" });
    token = account.token; accountId = account.user.id;
    await call("/contacts/class", { classId: "broker" }, createOperationKey());
    await stop();
    const db = new DatabaseSync(path.join(directory, "game.sqlite"));
    const row = db.prepare("SELECT document FROM users WHERE id = ?").get(accountId);
    const record = JSON.parse(row.document);
    record.playerData.contacts.stories = { relations: { oldtown: { trust: 2, resolved: [] } }, consequences: [] };
    db.prepare("UPDATE users SET document = ? WHERE id = ?").run(JSON.stringify(record), accountId);
    db.close();
    await start();
    const key = createOperationKey();
    const resolved = await call("/contacts/situation", { districtId: "oldtown", choiceId: "sell" }, key);
    assert.equal(resolved.status, 200);
    assert.equal(resolved.user.contacts.stories.relations.oldtown.lastChoiceId, "sell");
    const savedCash = resolved.user.profile.cash, savedPressure = resolved.user.city.districts.oldtown.pressure;
    await stop(); await start();
    const restored = (await call("/me")).user;
    assert.equal(restored.profile.cash, savedCash);
    assert.ok(restored.city.districts.oldtown.pressure <= savedPressure && restored.city.districts.oldtown.pressure > savedPressure - 0.1);
    assert.equal(restored.contacts.stories.consequences[0].kind, "hot-lead");
    const replay = await call("/contacts/situation", { districtId: "oldtown", choiceId: "sell" }, key);
    assert.deepEqual(replay.user, resolved.user);
    assert.equal((await call("/contacts/situation", { districtId: "oldtown", choiceId: "protect" }, createOperationKey())).status, 400);
  } finally {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
