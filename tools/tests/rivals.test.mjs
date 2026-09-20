import test from "node:test";
import assert from "node:assert/strict";
import { createCityState } from "../../shared/districts.js";
import { createRivalState, getRivalOperationModifier, getRivalView, maybeCreateRivalFromContact, maybeCreateRivalFromOperation, normalizeRivalState, registerRivalTrigger, resolveRivalChoice } from "../../shared/rivals.js";
import { getOperationById } from "../../shared/operations.js";
import { getSessionPlanProposals, acceptSessionPlan, getSessionPlanBoard, claimSessionPlan, createSessionPlanState } from "../../shared/sessionPlans.js";
import { isTransactionalAction } from "../../shared/transactions.js";

const now = 1789840000000;
const player = (overrides = {}) => ({
  profile: { cash: 100000, bank: 100000, energy: 20, hp: 100, maxHp: 100, heat: 48, respect: 30, level: 30, xp: 0, premiumTokens: 7 },
  stats: {}, city: createCityState(), rivals: createRivalState(), sessionPlans: createSessionPlanState(), operations: {},
  contacts: { classId: "broker", stories: { relations: { oldtown: { trust: 6 }, neon: { trust: 6 }, harbor: { trust: 6 } } } },
  gang: { joined: false }, inventory: { spirytus: 20 }, producedDrugInventory: { smokes: 20 },
  ...overrides,
});

test("a rival is created from a concrete operation once and preserves its cause", () => {
  const p = player();
  const active = { id: "op-major-1", districtId: "oldtown" };
  const rival = maybeCreateRivalFromOperation(p, { active, operation: getOperationById("syndicate-ledger"), responseId: "push", outcome: "partial", eventKey: "event-1" }, now);
  assert.equal(rival.rivalId, "varga-ledger");
  assert.match(rival.cause.label, /Częściowy wynik/);
  assert.equal(rival.classIdSnapshot, "broker");
  assert.equal(rival.eventKeySnapshot, "event-1");
  p.rivals.active = null;
  assert.equal(maybeCreateRivalFromOperation(p, { active, operation: getOperationById("syndicate-ledger"), responseId: "push", outcome: "failure" }, now + 1), null);
});

test("class route is frozen at creation and revalidates its normal resource cost", () => {
  const p = player(); registerRivalTrigger(p, { sourceKey: "class-case", districtId: "oldtown", label: "Testowy rachunek" }, now);
  p.contacts.classId = "enforcer";
  let view = getRivalView(p, now + 1).active;
  assert.equal(view.options.find((entry) => entry.id === "class").classId, "broker");
  p.profile.bank = 0;
  view = getRivalView(p, now + 1).active;
  assert.match(view.options.find((entry) => entry.id === "class").reasons[0], /banku/);
  assert.throws(() => resolveRivalChoice(p, "class", now + 2), /banku/);
  assert.ok(p.rivals.active);
});

test("ignoring the warning advances to a remembered finale without creating another rival", () => {
  const p = player(); registerRivalTrigger(p, { sourceKey: "ignored-case", districtId: "neon", label: "Głośny ruch w klubie" }, now);
  const view = getRivalView(p, now + 13 * 3600000).active;
  assert.equal(view.stage, "final"); assert.equal(view.ignored, true); assert.equal(view.escalation, 2);
  const result = resolveRivalChoice(p, "concede", now + 13 * 3600000, () => 0);
  assert.equal(result.resolved, true); assert.equal(p.rivals.active, null);
  assert.equal(p.rivals.history[0].ignored, true);
});

test("confrontation creates a second step and the finale settles once", () => {
  const p = player(); registerRivalTrigger(p, { sourceKey: "chain-case", districtId: "harbor", label: "Przejęty ładunek" }, now);
  const energy = p.profile.energy;
  const first = resolveRivalChoice(p, "confront", now + 1);
  assert.equal(first.escalated, true); assert.equal(p.rivals.active.stage, "final"); assert.equal(p.profile.energy, energy - 2);
  const finale = resolveRivalChoice(p, "counter", now + 2, () => 0);
  assert.equal(finale.success, true); assert.equal(p.rivals.history.length, 1); assert.equal(p.stats.rivalsResolved, 1);
  assert.throws(() => resolveRivalChoice(p, "counter", now + 3), /aktywnego konfliktu/);
});

test("gang help belongs to the snapshotted crew and is never a free resolution", () => {
  const p = player({ gang: { joined: true, name: "Portowi", focusDistrictId: "harbor" } });
  registerRivalTrigger(p, { sourceKey: "gang-case", districtId: "harbor", label: "Nacisk gangu" }, now);
  let option = getRivalView(p, now).active.options.find((entry) => entry.id === "gang");
  assert.ok(option.cashCost > 0);
  p.gang.name = "Nowa Ekipa";
  option = getRivalView(p, now).active.options.find((entry) => entry.id === "gang");
  assert.ok(option.reasons.length > 0);
});

test("contact aggression can create a district rival and active conflict affects operations", () => {
  const p = player();
  const rival = maybeCreateRivalFromContact(p, { districtId: "neon", sourceKey: "week-1-hype", choiceId: "hype", success: true }, now);
  assert.equal(rival.rivalId, "mara-voss");
  const modifier = getRivalOperationModifier(p, "neon", now);
  assert.ok(modifier.prepMultiplier > 1); assert.ok(modifier.successDelta < 0); assert.equal(getRivalOperationModifier(p, "harbor", now).prepMultiplier, 1);
});

test("rival response appears on the plan board and can only be claimed after the matching finale", () => {
  const p = player(); registerRivalTrigger(p, { sourceKey: "plan-case", districtId: "oldtown", label: "Planowy konflikt" }, now);
  const proposal = getSessionPlanProposals(p, now).find((entry) => entry.id === "rival-response");
  assert.ok(proposal); acceptSessionPlan(p, proposal.key, "respond", now);
  assert.equal(getSessionPlanBoard(p, now + 1).active.ready, false);
  resolveRivalChoice(p, "tribute", now + 2);
  assert.equal(getSessionPlanBoard(p, now + 3).active.ready, true);
  const before = p.profile.premiumTokens; const result = claimSessionPlan(p, now + 4);
  assert.equal(result.reward.cash, 0); assert.equal(p.profile.premiumTokens, before);
  assert.equal(isTransactionalAction("/rivals/respond"), true);
});

test("normalization survives serialization and bounds retained personal history", () => {
  const state = normalizeRivalState({ active: { id: "x", rivalId: "iron-dogs", districtId: "harbor", escalation: 99 }, history: Array.from({ length: 14 }, (_, i) => ({ id: `h-${i}` })), seenTriggers: ["a", "a", "b"] });
  assert.equal(state.active.escalation, 3); assert.equal(state.history.length, 10); assert.deepEqual(state.seenTriggers, ["a", "b"]);
  assert.deepEqual(normalizeRivalState(JSON.parse(JSON.stringify(state))), state);
});
