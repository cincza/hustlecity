import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { HEIST_DEFINITIONS } from "../../shared/economy.js";
import { createOperationKey } from "../../shared/transactions.js";

test("session plan API persists through restart and replays mutations without duplicate rewards", { timeout: 25000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-session-plan-api-"));
  let server, base, token, logs = "";
  async function start() {
    let port;
    server = spawn(process.execPath, ["backend/src/server.js"], {
      windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), NODE_ENV: "test", JWT_SECRET: "isolated-session-plan-secret", ADMIN_BOOTSTRAP_PASSWORD: "", ALPHA_TEST_STARTING_CASH: "5000", ALPHA_TEST_STARTING_BANK: "0", ALPHA_TEST_STARTING_RESPECT: "5" },
    });
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
    const registered = await call("/auth/register", { username: "planrunner", password: "Plan-Runner-Test!" }, null, null);
    assert.equal(registered.status, 201); token = registered.token;
    const board = await call("/plans");
    assert.equal(board.status, 200);
    const street = board.board.proposals.find((entry) => entry.id === "street-bank");
    assert.ok(street);
    const acceptKey = createOperationKey();
    const accepted = await call("/plans/accept", { planKey: street.key, approachId: "secure" }, acceptKey);
    assert.equal(accepted.status, 200);
    assert.equal(accepted.user.planBoard.active.planId, "street-bank");
    const premiumBefore = accepted.user.profile.premiumTokens;

    await stop(); await start();
    const replayedAccept = await call("/plans/accept", { planKey: street.key, approachId: "secure" }, acceptKey);
    assert.equal(replayedAccept.replayed, "true");
    const restored = await call("/me");
    assert.equal(restored.user.planBoard.active.planId, "street-bank");

    const deposit = await call("/bank/deposit", { amount: 500 }, createOperationKey());
    assert.equal(deposit.status, 200);
    const heist = await call(`/heists/${HEIST_DEFINITIONS[0].id}/execute`, {}, createOperationKey());
    assert.equal(heist.status, 200);
    const ready = await call("/plans");
    assert.equal(ready.board.active.ready, true);
    const cashBeforeClaim = ready.board.active ? heist.user.profile.cash : 0;
    const claimKey = createOperationKey();
    const claimed = await call("/plans/claim", {}, claimKey);
    assert.equal(claimed.status, 200);
    assert.equal(claimed.result.reward.cash, 450);
    assert.equal(claimed.user.profile.cash, cashBeforeClaim + 450);
    assert.equal(claimed.user.profile.premiumTokens, premiumBefore);
    const replayedClaim = await call("/plans/claim", {}, claimKey);
    assert.equal(replayedClaim.replayed, "true");
    assert.equal(replayedClaim.user.profile.cash, claimed.user.profile.cash);
    assert.equal((await call("/plans/claim", {}, createOperationKey())).status, 400);

    await stop(); await start();
    const final = await call("/me");
    assert.equal(final.user.profile.cash, claimed.user.profile.cash);
    assert.equal(final.user.sessionPlans.claims.filter((entry) => entry.key === street.key).length, 1);
  } finally {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
