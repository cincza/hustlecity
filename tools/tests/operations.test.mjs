import test from "node:test";
import assert from "node:assert/strict";
import { OPERATION_CATALOG, OPERATION_STAGE_ORDER, getOperationById, getOperationCondition, getOperationOutcomePreview, getOperationUnlockReasons, getOperationComplicationOptions, normalizeOperationsState, createActiveOperation, advanceActiveOperation, canExecuteOperation } from "../../shared/operations.js";
import { startOperationForPlayer, advanceOperationForPlayer, executeOperationForPlayer, resolveOperationComplicationForPlayer, cancelOperationForPlayer } from "../../backend/src/services/operationService.js";
import { claimTaskForPlayer } from "../../backend/src/services/empireActionService.js";
import { getTaskStateById } from "../../shared/tasks.js";
import { isTransactionalAction } from "../../shared/transactions.js";
const now = 1789480000000;
const player = () => ({ profile: { cash: 1000000, bank: 1000000, respect: 50, xp: 0, energy: 20, maxEnergy: 20, hp: 100, maxHp: 100, attack: 20, defense: 20, dexterity: 20, charisma: 20, heat: 0 }, stats: {}, city: {}, gang: {}, contacts: { classId: "broker", stories: { relations: { oldtown: { trust: 5 }, neon: { trust: 5 }, harbor: { trust: 5 } } } }, inventory: { spirytus: 20 }, producedDrugInventory: { smokes: 20 }, operations: {}, businessesOwned: [], factoriesOwned: {}, contracts: { loadout: {} } });
const choices = ["inside-tip", "quiet-entry", "burner-kit", "tight-crew", "burner-sedan"];
function prepare(p, id = "ledger-pull", at = now) { startOperationForPlayer(p, id, at); choices.forEach((choice) => advanceOperationForPlayer(p, choice, at + 1)); }
function prepareMajor(p, at = now) { p.operations = { progress: { "ledger-pull": { wins: 1 } } }; p.businessesOwned = [{ id: "front", count: 1 }]; prepare(p, "syndicate-ledger", at); }

test("preparations charge each step once and preview net equals settlement; first clear XP is one-time", () => {
  const p = player(); const initial = p.profile.cash; prepare(p);
  const active = p.operations.active;
  assert.equal(active.prepSpent, initial - p.profile.cash);
  const result = executeOperationForPlayer(p, now + 2, () => 0);
  assert.equal(result.net, p.profile.cash - initial);
  assert.equal(result.xpGain, getOperationById("ledger-pull").xpGain * 3);
  assert.equal(p.operations.progress["ledger-pull"].wins, 1);
  assert.throws(() => startOperationForPlayer(p, "ledger-pull", now + 3), /Ochrona/);
  prepare(p, "ledger-pull", now + 31 * 60000);
  assert.equal(executeOperationForPlayer(p, now + 31 * 60000 + 2, () => 0).firstClear, false);
});

test("infrastructure and victories gate elite targets without charging rejected starts", () => {
  const p = player(); const cash = p.profile.cash;
  assert.throws(() => startOperationForPlayer(p, "syndicate-ledger", now), /Ukończ/);
  assert.equal(p.profile.cash, cash);
  p.operations = { progress: { "ledger-pull": { wins: 1 } } };
  assert.throws(() => startOperationForPlayer(p, "syndicate-ledger", now), /biznesu/);
  p.businessesOwned = [{ id: "test", count: 1 }];
  assert.equal(getOperationUnlockReasons(getOperationById("syndicate-ledger"), p, now).length, 0);
  startOperationForPlayer(p, "syndicate-ledger", now);
});

test("asset preparations reject missing assets, then consume only advertised cash", () => {
  const p = player(); startOperationForPlayer(p, "ledger-pull", now);
  const cash = p.profile.cash;
  assert.throws(() => advanceOperationForPlayer(p, "business-cover", now), /biznesu/);
  assert.equal(p.profile.cash, cash); assert.equal(p.operations.active.stageIndex, 0);
  p.businessesOwned = [{ id: "test", count: 1 }];
  advanceOperationForPlayer(p, "business-cover", now);
  assert.equal(p.profile.cash, cash - 80);
  assert.equal(p.businessesOwned[0].count, 1);
});

test("expired plans and jail cannot advance or execute; cancellation unblocks without refund", () => {
  for (const mode of ["expired", "jail"]) {
    const p = player(); prepare(p);
    if (mode === "jail") p.profile.jailUntil = now + 10000;
    const at = mode === "expired" ? now + 91 * 60000 : now + 2;
    const cash = p.profile.cash;
    assert.throws(() => executeOperationForPlayer(p, at));
    assert.throws(() => advanceOperationForPlayer(p, "inside-tip", at));
    assert.equal(p.profile.cash, cash);
    cancelOperationForPlayer(p, at);
    assert.equal(p.profile.cash, cash); assert.equal(p.operations.active, null);
    assert.equal(p.operations.history[0].cancelled, true);
  }
});

test("permanent progress survives rolling history and migrates retained legacy victories", () => {
  const legacy = normalizeOperationsState({ history: [{ operationId: "dock-run", success: true }] });
  assert.equal(legacy.progress["dock-run"].wins, 1);
  const saved = normalizeOperationsState({ ...legacy, history: [] });
  assert.equal(saved.progress["dock-run"].wins, 1);
  const p = player(); prepare(p); executeOperationForPlayer(p, now + 2, () => 0);
  for (let i = 0; i < 8; i++) { startOperationForPlayer(p, "vip-lift", now + 3 + i); cancelOperationForPlayer(p, now + 3 + i); }
  assert.equal(p.operations.history.length, 6);
  assert.equal(normalizeOperationsState(p.operations).progress["ledger-pull"].wins, 1);
});

test("conditions rotate by district, snapshot per plan and preserve meaningful tactics at max stats", () => {
  assert.notEqual(getOperationCondition("oldtown", now).id, getOperationCondition("neon", now).id);
  assert.notEqual(getOperationCondition("oldtown", now).id, getOperationCondition("oldtown", now + 6 * 3600000).id);
  const op = getOperationById("harbor-convoy"); let active = createActiveOperation(op, now);
  active.condition = { id: "patrol", endsAt: now + 1 };
  active = advanceActiveOperation(active, "inside-tip", now + 6 * 3600000);
  assert.equal(active.condition.id, "patrol");
  const stats = { attack: 9999, defense: 9999, dexterity: 9999, charisma: 9999 };
  const quiet = getOperationOutcomePreview({ operation: op, player: stats, activeOperation: advanceActiveOperation(active, "quiet-entry") });
  const loud = getOperationOutcomePreview({ operation: op, player: stats, activeOperation: advanceActiveOperation(active, "hard-push") });
  assert.ok(quiet.successChance > loud.successChance);
  assert.ok(quiet.heatGain < loud.heatGain);
  assert.equal(canExecuteOperation({ stageIndex: 5, choiceIds: {} }), false);
  assert.equal(OPERATION_STAGE_ORDER.length, 5);
});

test("failure consumes energy but grants no mastery and history records the actual total loss", () => {
  const p = player(); prepare(p); const initial = p.profile.cash;
  const result = executeOperationForPlayer(p, now + 2, () => 0.99);
  assert.equal(result.success, false);
  assert.equal(p.operations.progress["ledger-pull"].wins, 0);
  assert.equal(p.profile.energy, 18);
  assert.equal(initial - p.profile.cash, result.loss);
  assert.equal(p.operations.history[0].net, -result.loss - p.operations.history[0].prepSpent);
});

test("campaign mission requires distinct successes and server claim uses permanent progress", () => {
  const p = player(); p.operations = { progress: Object.fromEntries(OPERATION_CATALOG.map((op) => [op.id, { wins: 1 }])) };
  assert.equal(getTaskStateById("trzy-fronty", { operations: { progress: { "ledger-pull": { wins: 9 } } } }).completed, false);
  assert.equal(getTaskStateById("skarb-miasta", { operations: p.operations }).completed, true);
  claimTaskForPlayer(p, "skarb-miasta", now);
  assert.ok(p.tasksClaimed.includes("skarb-miasta"));
  assert.throws(() => claimTaskForPlayer(p, "skarb-miasta", now), /odebrana/);
  for (const action of ["start", "advance", "execute", "resolve", "cancel"]) assert.equal(isTransactionalAction(`/operations/${action}`), true);
});

test("major operation persists a complication, spends energy once and cannot reroll the finale", () => {
  const p = player(); prepareMajor(p); const energy = p.profile.energy;
  const opened = executeOperationForPlayer(p, now + 2, () => 0.99);
  assert.equal(opened.pendingComplication, true);
  assert.equal(p.profile.energy, energy - getOperationById("syndicate-ledger").energyCost);
  assert.equal(p.operations.active.phase, "complication");
  const saved = JSON.parse(JSON.stringify(p.operations));
  p.operations = normalizeOperationsState(saved);
  assert.equal(p.operations.active.complication.id, "paper-trail");
  assert.throws(() => executeOperationForPlayer(p, now + 3, () => 0), /Komplikacja/);
  assert.equal(p.profile.energy, energy - getOperationById("syndicate-ledger").energyCost);
});

test("class and gang routes use the start snapshot while costs are revalidated at resolution", () => {
  const p = player(); p.gang = { joined: true, name: "Test Crew", focusDistrictId: "oldtown" }; prepareMajor(p);
  executeOperationForPlayer(p, now + 2);
  p.contacts.classId = "enforcer";
  let options = getOperationComplicationOptions(p.operations.active, p);
  assert.equal(options.find((entry) => entry.id === "class").classId, "broker");
  assert.ok(options.some((entry) => entry.id === "gang"));
  p.gang.name = "Inny Gang";
  options = getOperationComplicationOptions(p.operations.active, p);
  assert.ok(options.find((entry) => entry.id === "gang").reasons.length > 0);
  p.profile.bank = 0;
  assert.throws(() => resolveOperationComplicationForPlayer(p, "class", now + 3, () => 0), /banku/);
  assert.ok(p.operations.active);
});

test("major finale supports full and partial outcomes without double claim", () => {
  const winner = player(); prepareMajor(winner); executeOperationForPlayer(winner, now + 2);
  const result = resolveOperationComplicationForPlayer(winner, "payoff", now + 3, () => 0);
  assert.equal(result.success, true); assert.equal(winner.operations.progress["syndicate-ledger"].wins, 1);
  assert.throws(() => resolveOperationComplicationForPlayer(winner, "payoff", now + 4, () => 0), /aktywnej komplikacji/);

  const partial = player(); prepareMajor(partial, now + 1000); executeOperationForPlayer(partial, now + 1002);
  const chance = partial.operations.active.complication.preview.successChance + 0.05;
  const partialResult = resolveOperationComplicationForPlayer(partial, "push", now + 1003, () => chance);
  assert.equal(partialResult.partial, true); assert.equal(partial.operations.progress["syndicate-ledger"].wins, 0);
  assert.ok(partialResult.reward > 0); assert.equal(partial.stats.operationsPartial, 1);
});

test("tactical retreat closes the operation without mastery and refunds only a small base share", () => {
  const p = player(); prepareMajor(p); executeOperationForPlayer(p, now + 2); const cash = p.profile.cash;
  const result = resolveOperationComplicationForPlayer(p, "retreat", now + 3);
  assert.equal(result.outcome, "retreat"); assert.equal(p.operations.active, null);
  assert.equal(p.operations.progress["syndicate-ledger"].wins, 0);
  assert.equal(p.profile.cash - cash, Math.floor(getOperationById("syndicate-ledger").prepCost * 0.12));
});
