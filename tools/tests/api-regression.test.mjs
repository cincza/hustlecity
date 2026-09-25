import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { once } from "node:events";
import { getSoloHeistOdds } from "../../shared/heists.js";
import { HEIST_DEFINITIONS } from "../../shared/economy.js";
import { createOperationKey } from "../../shared/transactions.js";
import { CONTACT_SLOT_MS } from "../../shared/contacts.js";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test("live API: market rollback, odds, dealer inventory, hidden cards and restart persistence", { timeout: 30000 }, async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "hustle-repair-api-"));
  let server;
  let base;
  let token;
  let logs = "";
  async function start() {
    let actualPort;
    server = spawn(process.execPath, ["backend/src/server.js"], {
      env: { ...process.env, HOST: "127.0.0.1", PORT: "0", DATA_DIR: directory, BACKEND_ENV_FILE: path.join(directory, "no-env"), NODE_ENV: "test", JWT_SECRET: "isolated-api-test-secret", ADMIN_BOOTSTRAP_PASSWORD: "", ALPHA_TEST_STARTING_CASH: "5000", ALPHA_TEST_STARTING_BANK: "0", ALPHA_TEST_STARTING_RESPECT: "0" },
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    // The server reports its bound port so parallel test runs cannot collide.
    server.stdout.on("data", (chunk) => { logs += chunk; const match = String(chunk).match(/"boundPort":(\d+)/); if (match) actualPort = Number(match[1]); });
    server.stderr.on("data", (chunk) => { logs += chunk; });
    for (let i = 0; i < 100 && !actualPort; i++) {
      if (server.exitCode !== null) throw new Error(logs.slice(-3000));
      await pause(50);
    }
    assert.ok(actualPort, "Backend must report its listening port");
    base = `http://127.0.0.1:${actualPort}`;
  }
  async function stop() {
    if (server && server.exitCode === null) { const exited = once(server, "exit"); server.kill(); await exited; }
  }
  async function call(route, body, key) {
    const response = await fetch(base + route, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, replayed: response.headers.get("Idempotency-Replayed"), ...(await response.json()) };
  }
  try {
    await start();
    const deniedAdmin = await call("/auth/register", { username: "czincza11", password: "Regression-Test!" });
    assert.equal(deniedAdmin.status, 409);
    const limited = await call("/auth/register", { username: "another", password: "Regression-Test!" });
    assert.equal(limited.status, 429);
    assert.equal(limited.code, "rate_limited");
    assert.ok(limited.retryAfterSeconds > 0);
    assert.match(limited.error, /Spróbuj ponownie za/);
    const defaultLogin = await call("/auth/login", { login: "czincza11", password: "1234" });
    assert.equal(defaultLogin.status, 401);
    await pause(2600);
    const registered = await call("/auth/register", { username: "boss", password: "Regression-Test!" });
    assert.equal(registered.status, 201);
    assert.equal(registered.user.id, registered.authUser.id);
    assert.equal(registered.user.username, "boss");
    token = registered.token;
    const me = await call("/me");
    assert.equal(me.status, 200);
    assert.equal(me.user.id, registered.authUser.id);
    assert.ok(Object.values(me.user.dealerInventory).some((count) => count > 0));
    const odds = await call(`/heists/${HEIST_DEFINITIONS[0].id}`);
    assert.equal(odds.status, 200);
    assert.deepEqual(odds.heist, HEIST_DEFINITIONS[0]);
    const depositKey = createOperationKey();
    const depositBody = { amount: me.user.profile.cash };
    const deposit = await call("/bank/deposit", depositBody, depositKey);
    assert.equal(deposit.status, 200);
    const duplicate = await call("/bank/deposit", depositBody, depositKey);
    assert.equal(duplicate.replayed, "true");
    assert.deepEqual(duplicate.user, deposit.user);
    const changedPayment = await call("/bank/deposit", { amount: 1 }, depositKey);
    assert.equal(changedPayment.status, 409);
    assert.equal(changedPayment.code, "operation_key_reused");
    const before = await call("/market");
    const denied = await call("/market/buy", { productId: "smoke", quantity: 1 });
    assert.equal(denied.status, 400);
    assert.match(denied.error, /cash/);
    const after = await call("/market");
    assert.deepEqual(after.supply, before.supply);
    assert.equal((await call("/me")).user.profile.cash, 0);
    await pause(1200);
    const withdraw = await call("/bank/withdraw", { amount: 1000 });
    assert.equal(withdraw.status, 200);
    const buyKey = createOperationKey(), sellKey = createOperationKey();
    const tradeBody = { productId: "smoke", quantity: 3 };
    const bought = await call("/market/buy", tradeBody, buyKey);
    assert.equal(bought.status, 200);
    assert.equal(bought.user.profile.cash, 1000 - bought.total);
    assert.equal(bought.user.inventory.smoke, 3);
    const buyReplay = await call("/market/buy", tradeBody, buyKey);
    assert.equal(buyReplay.replayed, "true");
    assert.deepEqual(buyReplay.user, bought.user);
    const sold = await call("/market/sell", tradeBody, sellKey);
    assert.equal(sold.status, 200);
    assert.equal(sold.user.inventory.smoke, 0);
    assert.equal(sold.user.profile.cash, bought.user.profile.cash + sold.total);
    const blackjack = await call("/casino/blackjack/start", { bet: 100 });
    assert.equal(blackjack.status, 200);
    if (blackjack.session.stage === "player") {
      assert.equal(blackjack.session.dealerCards.length, 1);
      assert.equal(blackjack.session.dealerHasHiddenCard, true);
    }
    assert.equal("deck" in blackjack.session, false);
    const classKey = createOperationKey();
    const chosen = await call("/contacts/class", { classId: "broker" }, classKey);
    assert.equal(chosen.status, 200);
    assert.equal(chosen.user.contacts.classId, "broker");
    const contactKey = createOperationKey();
    const contactBody = { districtId: "oldtown", methodId: "broker", mode: "quiet", slot: Math.floor(Date.now() / CONTACT_SLOT_MS) };
    const contact = await call("/contacts/execute", contactBody, contactKey);
    assert.equal(contact.status, 200);
    assert.equal(contact.user.contacts.completed, 1);
    const contactReplay = await call("/contacts/execute", contactBody, contactKey);
    assert.equal(contactReplay.replayed, "true");
    assert.deepEqual(contactReplay.user, contact.user);
    const repeatContact = await call("/contacts/execute", contactBody, createOperationKey());
    assert.equal(repeatContact.status, 400);
    const lockedClass = await call("/contacts/class", { classId: "enforcer", cost: 0 }, createOperationKey());
    assert.equal(lockedClass.status, 503);
    assert.equal((await call("/me")).user.profile.cash, contact.user.profile.cash);
    const beforeHeist = (await call("/me")).user;
    const heistKey = createOperationKey();
    const executed = await call(`/heists/${HEIST_DEFINITIONS[0].id}/execute`, {}, heistKey);
    assert.equal(executed.status, 200);
    assert.equal(executed.chance, getSoloHeistOdds(beforeHeist.profile, HEIST_DEFINITIONS[0], beforeHeist.activeBoosts).chance);
    const replayedHeist = await call(`/heists/${HEIST_DEFINITIONS[0].id}/execute`, {}, heistKey);
    assert.equal(replayedHeist.replayed, "true");
    assert.deepEqual(replayedHeist, { ...executed, replayed: "true" });
    assert.equal((await call("/me")).user.stats.heistsDone, executed.user.stats.heistsDone);
    const rewardKey = createOperationKey();
    const reward = await call("/tasks/claim", { taskId: "pierwszy-skok" }, rewardKey);
    assert.equal(reward.status, 200);
    assert.equal(reward.user.profile.cash, executed.user.profile.cash + 1500);
    assert.equal(reward.user.tasksClaimed.filter((id) => id === "pierwszy-skok").length, 1);
    const duplicateReward = await call("/tasks/claim", { taskId: "pierwszy-skok" }, rewardKey);
    assert.equal(duplicateReward.replayed, "true");
    assert.deepEqual(duplicateReward.user, reward.user);
    const dealerBefore = (await call("/me")).user.dealerInventory;
    const dealerBuy = await call("/dealer/buy", { drugId: "smokes", quantity: 3 });
    assert.equal(dealerBuy.status, 200);
    assert.equal(dealerBuy.user.dealerInventory.smokes, dealerBefore.smokes - 3);
    const dealerSell = await call("/dealer/sell", { drugId: "smokes", quantity: 1 });
    assert.equal(dealerSell.status, 200);
    assert.equal(dealerSell.user.dealerInventory.smokes, dealerBefore.smokes - 2);
    await pause(4100);
    const rouletteKey = createOperationKey();
    const roulette = await call("/casino/roulette", { bet: 100, choice: "red" }, rouletteKey);
    assert.equal(roulette.status, 200);
    assert.ok(Number.isInteger(roulette.number) && roulette.number >= 0 && roulette.number <= 36);
    assert.equal(roulette.win, roulette.color === "red");
    assert.equal(roulette.totalReturn, roulette.win ? 200 : 0);
    const rouletteReplay = await call("/casino/roulette", { bet: 100, choice: "red" }, rouletteKey);
    assert.equal(rouletteReplay.replayed, "true");
    assert.equal(rouletteReplay.number, roulette.number);
    assert.equal(rouletteReplay.user.profile.cash, roulette.user.profile.cash);
    const badChoice = await call("/casino/roulette", { bet: 100, choice: "blue" }, createOperationKey());
    assert.equal(badChoice.status, 400);
    await pause(4100);
    const slotKey = createOperationKey();
    const slot = await call("/casino/slot", { bet: 100 }, slotKey);
    assert.equal(slot.status, 200);
    assert.equal(slot.net, slot.totalReturn - slot.stake);
    assert.equal(slot.outcome.symbols.length, 3);
    const slotReplay = await call("/casino/slot", { bet: 100 }, slotKey);
    assert.equal(slotReplay.replayed, "true");
    assert.deepEqual(slotReplay.outcome, slot.outcome);
    const saved = (await call("/me")).user;
    const savedMarketSupply = (await call("/market")).supply;
    await stop();
    assert.ok((await stat(path.join(directory, "game.sqlite"))).size > 0);
    await start();
    const rewardAfterRestart = await call("/tasks/claim", { taskId: "pierwszy-skok" }, rewardKey);
    assert.equal(rewardAfterRestart.replayed, "true");
    const replayAfterRestart = await call("/bank/deposit", depositBody, depositKey);
    assert.equal(replayAfterRestart.replayed, "true");
    assert.deepEqual(replayAfterRestart.user, deposit.user);
    const restored = await call("/me");
    assert.deepEqual(restored.user.contacts, saved.contacts);
    assert.equal((await call("/contacts/execute", contactBody, contactKey)).replayed, "true");
    assert.equal((await call("/contacts/class", { classId: "broker" }, classKey)).replayed, "true");
    assert.deepEqual((await call("/market")).supply, savedMarketSupply);
    const replayedBuy = await call("/market/buy", tradeBody, buyKey);
    const replayedSale = await call("/market/sell", tradeBody, sellKey);
    assert.equal(replayedBuy.replayed, "true");
    assert.equal(replayedSale.replayed, "true");
    assert.deepEqual(replayedSale.user, sold.user);
    assert.equal((await call("/me")).user.profile.cash, saved.profile.cash);
    assert.equal(restored.status, 200);
    assert.equal(restored.user.profile.cash, saved.profile.cash);
    assert.equal(restored.user.profile.bank, saved.profile.bank);
    assert.deepEqual(restored.user.inventory, saved.inventory);
    assert.deepEqual(restored.user.drugInventory, saved.drugInventory);
    assert.deepEqual(restored.user.dealerInventory, saved.dealerInventory);
    assert.doesNotMatch(logs, /persist-shared-inventory-failed/);
  } finally {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await rm(directory, { recursive: true, force: true });
  }
});
