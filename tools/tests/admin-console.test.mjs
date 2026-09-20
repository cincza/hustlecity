import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import { createOperationKey } from "../../shared/transactions.js";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("admin console enforces roles, persists idempotent mutations and audits every change", { timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-admin-console-"));
  let server;
  let base;
  let logs = "";
  const password = "External-Admin-Test!42";

  async function start() {
    let actualPort;
    server = spawn(process.execPath, ["backend/src/server.js"], {
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: "0",
        DATA_DIR: directory,
        BACKEND_ENV_FILE: path.join(directory, "no-env"),
        NODE_ENV: "test",
        JWT_SECRET: "isolated-admin-console-secret",
        ADMIN_BOOTSTRAP_PASSWORD: password,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    server.stdout.on("data", (chunk) => {
      logs += chunk;
      const match = String(chunk).match(/"boundPort":(\d+)/);
      if (match) actualPort = Number(match[1]);
    });
    server.stderr.on("data", (chunk) => { logs += chunk; });
    for (let index = 0; index < 120 && !actualPort; index += 1) {
      if (server.exitCode !== null) throw new Error(logs.slice(-4000));
      await pause(50);
    }
    assert.ok(actualPort, "Backend must report its bound port");
    base = `http://127.0.0.1:${actualPort}`;
  }

  async function call(route, { method = "GET", body, token, key } = {}) {
    const response = await fetch(base + route, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(key ? { "Idempotency-Key": key } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return {
      status: response.status,
      replayed: response.headers.get("Idempotency-Replayed"),
      ...(await response.json()),
    };
  }

  try {
    await start();
    const tester = await call("/auth/register", { method: "POST", body: { username: "externaltester", password: "Tester-Pass!42" } });
    assert.equal(tester.status, 201);
    const testerToken = tester.token;
    const testerId = tester.authUser.id;

    const deniedList = await call("/admin/players", { token: testerToken });
    assert.equal(deniedList.status, 403);
    const deniedMutation = await call(`/admin/players/${testerId}/adjust`, {
      method: "POST",
      token: testerToken,
      key: createOperationKey(),
      body: { field: "cash", value: 999999, role: "admin", isAdmin: true },
    });
    assert.equal(deniedMutation.status, 403);

    const adminLogin = await call("/auth/login", { method: "POST", body: { login: "czincza11", password } });
    assert.equal(adminLogin.status, 200);
    const adminToken = adminLogin.token;
    const listing = await call("/admin/players?q=external", { token: adminToken });
    assert.equal(listing.status, 200);
    assert.equal(listing.players.length, 1);
    assert.equal(listing.players[0].id, testerId);

    const detail = await call(`/admin/players/${testerId}`, { token: adminToken });
    assert.equal(detail.status, 200);
    assert.equal(detail.player.classId, null);
    assert.equal("passwordHash" in detail.player, false);

    const adjustKey = createOperationKey();
    const adjusted = await call(`/admin/players/${testerId}/adjust`, { method: "POST", token: adminToken, key: adjustKey, body: { field: "cash", value: 4321, reason: "test korekty" } });
    assert.equal(adjusted.status, 200);
    assert.equal(adjusted.player.cash, 4321);
    const adjustedReplay = await call(`/admin/players/${testerId}/adjust`, { method: "POST", token: adminToken, key: adjustKey, body: { field: "cash", value: 4321, reason: "test korekty" } });
    assert.equal(adjustedReplay.replayed, "true");

    const missing = await call("/admin/players/missing-id/reset", { method: "POST", token: adminToken, key: createOperationKey(), body: {} });
    assert.equal(missing.status, 404);

    const banned = await call(`/admin/players/${testerId}/ban`, { method: "POST", token: adminToken, key: createOperationKey(), body: { banned: true, reason: "test blokady" } });
    assert.equal(banned.status, 200);
    assert.equal(banned.player.authDisabled, true);
    assert.equal((await call("/me", { token: testerToken })).status, 401);
    const unbanned = await call(`/admin/players/${testerId}/ban`, { method: "POST", token: adminToken, key: createOperationKey(), body: { banned: false } });
    assert.equal(unbanned.status, 200);

    const resetKey = createOperationKey();
    const reset = await call(`/admin/players/${testerId}/reset`, { method: "POST", token: adminToken, key: resetKey, body: { reason: "powrot do nowego konta" } });
    assert.equal(reset.status, 200);
    assert.equal(reset.player.cash, 5000);
    assert.equal(reset.player.classId, null);
    const resetReplay = await call(`/admin/players/${testerId}/reset`, { method: "POST", token: adminToken, key: resetKey, body: { reason: "powrot do nowego konta" } });
    assert.equal(resetReplay.replayed, "true");

    const audit = await call(`/admin/audit?targetId=${testerId}`, { token: adminToken });
    assert.equal(audit.status, 200);
    assert.deepEqual(audit.entries.map((entry) => entry.operation).sort(), ["player.adjust.cash", "player.ban", "player.reset", "player.unban"].sort());
    assert.equal(audit.entries.filter((entry) => entry.operation === "player.adjust.cash").length, 1);

    const cannotResetAdmin = await call(`/admin/players/${adminLogin.authUser.id}/reset`, { method: "POST", token: adminToken, key: createOperationKey(), body: {} });
    assert.equal(cannotResetAdmin.status, 400);

    const deleteKey = createOperationKey();
    const deleted = await call("/admin/players/delete-account", { method: "POST", token: adminToken, key: deleteKey, body: { login: "externaltester", reason: "koniec testu" } });
    assert.equal(deleted.status, 200);
    const deletedReplay = await call("/admin/players/delete-account", { method: "POST", token: adminToken, key: deleteKey, body: { login: "externaltester", reason: "koniec testu" } });
    assert.equal(deletedReplay.replayed, "true");
    const finalPlayers = await call("/admin/players", { token: adminToken });
    assert.equal(finalPlayers.players.length, 1);
    assert.equal(finalPlayers.players[0].isAdmin, true);
    const finalAudit = await call(`/admin/audit?targetId=${testerId}`, { token: adminToken });
    assert.ok(finalAudit.entries.some((entry) => entry.operation === "player.delete"));
  } finally {
    if (server && server.exitCode === null) {
      const exited = once(server, "exit");
      server.kill();
      await exited;
    }
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
