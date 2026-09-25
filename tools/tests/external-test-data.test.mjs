import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("external-test data tool backs up, replaces accounts and preserves world documents", { timeout: 60000 }, async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "hustle-external-data-"));
  const dataDir = path.join(root, "data");
  const backupDir = path.join(root, "backup");
  let server;
  let logs = "";
  try {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: dataDir, BACKEND_ENV_FILE: path.join(root, "no-env"), NODE_ENV: "test", JWT_SECRET: "isolated-maintenance-secret", ADMIN_BOOTSTRAP_PASSWORD: "Old-Admin-Password!42" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    server.stdout.on("data", (chunk) => { logs += chunk; const match = String(chunk).match(/"boundPort":(\d+)/); if (match) port = Number(match[1]); });
    server.stderr.on("data", (chunk) => { logs += chunk; });
    for (let index = 0; index < 120 && !port; index += 1) { if (server.exitCode !== null) throw new Error(logs); await pause(50); }
    const register = await fetch(`http://127.0.0.1:${port}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "oldtester", password: "Old-Tester-Pass!42" }) });
    assert.equal(register.status, 201);
    const exited = once(server, "exit"); server.kill(); await exited;
    server = null;

    let db = new DatabaseSync(path.join(dataDir, "game.sqlite"), { readOnly: true });
    const oldAdminId = db.prepare("SELECT id FROM users WHERE username_lower = 'czincza11'").get().id;
    const worldBefore = db.prepare("SELECT id, revision, document FROM world_documents ORDER BY id").all();
    db.close();

    const backup = spawnSync(process.execPath, ["tools/external-test-data.mjs", "backup", "--data-dir", dataDir, "--output", backupDir], { encoding: "utf8", windowsHide: true });
    assert.equal(backup.status, 0, backup.stderr);
    const manifest = JSON.parse(await readFile(path.join(backupDir, "manifest.json"), "utf8"));
    assert.equal(manifest.snapshot.users, 2);

    const rejected = spawnSync(process.execPath, ["tools/external-test-data.mjs", "clean", "--data-dir", dataDir, "--backup", backupDir, "--apply", "--password-stdin"], { input: "short\n", encoding: "utf8", windowsHide: true });
    assert.notEqual(rejected.status, 0);
    db = new DatabaseSync(path.join(dataDir, "game.sqlite"), { readOnly: true });
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM users").get().count, 2, "invalid password must not delete accounts");
    db.close();

    const manifestPath = path.join(backupDir, "manifest.json");
    await writeFile(manifestPath, JSON.stringify({ ...manifest, hashes: { ...manifest.hashes, "game.sqlite": "invalid" } }));
    const corrupted = spawnSync(process.execPath, ["tools/external-test-data.mjs", "clean", "--data-dir", dataDir, "--backup", backupDir, "--apply", "--password-stdin"], { input: "New-Admin-Password!84\n", encoding: "utf8", windowsHide: true });
    assert.notEqual(corrupted.status, 0);
    assert.match(corrupted.stderr, /Backup checksum mismatch/);
    db = new DatabaseSync(path.join(dataDir, "game.sqlite"), { readOnly: true });
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM users").get().count, 2);
    db.close();
    await writeFile(manifestPath, JSON.stringify(manifest));

    const clean = spawnSync(process.execPath, ["tools/external-test-data.mjs", "clean", "--data-dir", dataDir, "--backup", backupDir, "--apply", "--password-stdin"], { input: "New-Admin-Password!84\n", encoding: "utf8", windowsHide: true, timeout: 20000 });
    assert.equal(clean.status, 0, clean.stderr || clean.stdout);
    const verify = spawnSync(process.execPath, ["tools/external-test-data.mjs", "verify", "--data-dir", dataDir], { encoding: "utf8", windowsHide: true });
    assert.equal(verify.status, 0, verify.stderr);
    const state = JSON.parse(verify.stdout);
    assert.equal(state.users, 1);
    assert.equal(state.accounts[0].username, "czincza11");

    db = new DatabaseSync(path.join(dataDir, "game.sqlite"), { readOnly: true });
    const newAdminId = db.prepare("SELECT id FROM users WHERE username_lower = 'czincza11'").get().id;
    assert.notEqual(newAdminId, oldAdminId);
    assert.deepEqual(db.prepare("SELECT id, revision, document FROM world_documents ORDER BY id").all(), worldBefore);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM operation_receipts").get().count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM admin_audit").get().count, 0);
    db.close();
  } finally {
    if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; }
    await rm(root, { recursive: true, force: true });
  }
});
