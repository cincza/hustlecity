import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { once } from "node:events";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createOperationKey } from "../../shared/transactions.js";
import { prepareAccountDeletion } from "../../backend/src/services/accountDeletionService.js";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("self deletion verifies credentials, removes social data and invalidates the session", { timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-account-delete-"));
  const password = "Tester-Delete-Pass!42";
  let server;
  let base;
  let logs = "";
  const call = async (route, { method = "GET", body, token, key } = {}) => {
    const response = await fetch(base + route, { method, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, ...(await response.json()) };
  };
  try {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], { env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), NODE_ENV: "test", JWT_SECRET: "isolated-delete-secret", ADMIN_BOOTSTRAP_PASSWORD: "Admin-Delete-Test!42" }, stdio: ["ignore", "pipe", "pipe"], windowsHide: true });
    server.stdout.on("data", (chunk) => { logs += chunk; const match = String(chunk).match(/"boundPort":(\d+)/); if (match) port = Number(match[1]); });
    server.stderr.on("data", (chunk) => { logs += chunk; });
    for (let index = 0; index < 120 && !port; index += 1) { if (server.exitCode !== null) throw new Error(logs); await pause(50); }
    base = `http://127.0.0.1:${port}`;

    const doomed = await call("/auth/register", { method: "POST", body: { username: "doomedplayer", password } });
    await pause(2750);
    const survivor = await call("/auth/register", { method: "POST", body: { username: "survivorplayer", password } });
    assert.equal(doomed.status, 201); assert.equal(survivor.status, 201);
    const catalog = await call("/premium/catalog", { token: doomed.token });
    assert.deepEqual(catalog.packs, []);
    for (const route of ["/premium/checkout", "/premium/webhook", "/contacts/cosmetic", "/gang/identity"]) {
      const blocked = await call(route, { method: "POST", token: doomed.token, key: createOperationKey(), body: { id: "silver", packId: "pocket" } });
      assert.equal(blocked.status, 503, route);
    }
    await call(`/social/friends/${survivor.authUser.id}`, { method: "POST", token: doomed.token, key: createOperationKey() });
    await call(`/social/messages/${survivor.authUser.id}`, { method: "POST", token: doomed.token, key: createOperationKey(), body: { message: "delete-me-message" } });
    await call("/chat/global", { method: "POST", token: doomed.token, key: createOperationKey(), body: { text: "delete-me-chat" } });

    const wrongName = await call("/account/delete", { method: "POST", token: doomed.token, key: createOperationKey(), body: { password, confirmUsername: "wrong" } });
    assert.equal(wrongName.status, 400);
    await pause(1250);
    const wrongPassword = await call("/account/delete", { method: "POST", token: doomed.token, key: createOperationKey(), body: { password: "wrong-password", confirmUsername: "doomedplayer" } });
    assert.equal(wrongPassword.status, 401);
    await pause(1250);
    const deleted = await call("/account/delete", { method: "POST", token: doomed.token, key: createOperationKey(), body: { password, confirmUsername: "doomedplayer", role: "admin", userId: survivor.authUser.id } });
    assert.equal(deleted.status, 200);
    assert.equal((await call("/me", { token: doomed.token })).status, 401);
    const survivorState = await call("/me", { token: survivor.token });
    assert.equal(survivorState.status, 200);
    assert.ok(!(survivorState.user.online?.messages || []).some((entry) => entry.fromUserId === doomed.authUser.id || entry.toUserId === doomed.authUser.id));
    const chat = await call("/chat/global", { token: survivor.token });
    assert.ok(!chat.messages.some((entry) => entry.text === "delete-me-chat"));
    for (let index = 0; index < 40; index += 1) {
      const db = new DatabaseSync(path.join(directory, "game.sqlite"), { readOnly: true });
      const pending = db.prepare("SELECT COUNT(*) AS count FROM account_deletion_cleanup WHERE completed_at IS NULL").get().count;
      db.close();
      if (!pending) break;
      await pause(25);
    }
    const db = new DatabaseSync(path.join(directory, "game.sqlite"), { readOnly: true });
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM users WHERE id = ?").get(doomed.authUser.id).count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM operation_receipts WHERE actor_id = ?").get(doomed.authUser.id).count, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS count FROM account_deletion_cleanup WHERE completed_at IS NULL").get().count, 0);
    db.close();
  } finally {
    if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; }
    await rm(directory, { recursive: true, force: true });
  }
});

test("deleting a member preserves the existing boss and gang assets", () => {
  const records = ["Boss", "Czlonek"].map((role, index) => ({
    _id: `member-${index}`, username: `member${index}`, playerData: {
      profile: { respect: 20 }, gang: { joined: true, name: "Real Crew", role, members: 2, vault: 9000 },
    },
  }));
  prepareAccountDeletion(records, "member-1");
  assert.equal(records[0].playerData.gang.role, "Boss");
  assert.equal(records[0].playerData.gang.members, 1);
  assert.equal(records[0].playerData.gang.vault, 9000);
});

test("deleting a boss promotes the vice boss and removes deleted member ids from shared gang state", () => {
  const gang = { joined: true, name: "Night Test", role: "Boss", members: 3, vault: 9000, activeHeistLobby: { id: "lobby-1", heistId: "corner-store", participantIds: ["boss", "vice", "member"] }, contactNetwork: { members: { boss: ["broker"], vice: ["dealer"] } } };
  const records = [
    { _id: "boss", username: "boss", playerData: { profile: { respect: 50 }, gang: structuredClone(gang), online: { friends: [], messages: [] }, cooldowns: {} } },
    { _id: "vice", username: "vice", playerData: { profile: { respect: 20 }, gang: { ...structuredClone(gang), role: "Vice Boss" }, online: { friends: [{ id: "boss" }], messages: [{ fromUserId: "boss" }] }, cooldowns: { playerAttackTargets: { boss: 99 } } } },
    { _id: "member", username: "member", playerData: { profile: { respect: 40 }, gang: { ...structuredClone(gang), role: "Czlonek" }, online: { friends: [], messages: [] }, cooldowns: {} } },
  ];
  const result = prepareAccountDeletion(records, "boss", 123);
  assert.equal(result.successorId, "vice");
  assert.equal(records[1].playerData.gang.role, "Boss");
  assert.equal(records[1].playerData.gang.vault, 9000);
  assert.deepEqual(records[1].playerData.gang.activeHeistLobby.participantIds.sort(), ["member", "vice"]);
  assert.equal(records[1].playerData.online.friends.length, 0);
  assert.equal(records[1].playerData.online.messages.length, 0);
  assert.equal("boss" in records[1].playerData.cooldowns.playerAttackTargets, false);
});
