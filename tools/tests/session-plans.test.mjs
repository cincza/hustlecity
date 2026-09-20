import test from "node:test";
import assert from "node:assert/strict";
import { CITY_DIRECTOR_EPOCH, CITY_EVENT_WINDOW_MS, getCityEventAt, respondToCityEvent } from "../../shared/cityDirector.js";
import { createCityState } from "../../shared/districts.js";
import { abandonSessionPlan, acceptSessionPlan, claimSessionPlan, createSessionPlanState, getSessionPlanBoard, getSessionPlanProposals } from "../../shared/sessionPlans.js";

const now = CITY_DIRECTOR_EPOCH + 10 * CITY_EVENT_WINDOW_MS + 1000;
const player = (overrides = {}) => ({
  profile: { cash: 5000, bank: 1000, energy: 20, hp: 100, maxHp: 100, heat: 12, respect: 5, level: 5, xp: 0, premiumTokens: 9 },
  stats: { heistsDone: 0, heistsWon: 0, bankDepositedTotal: 0, businessCollections: 0, marketGoodsSold: 0, drugBatches: 0, producedDrugSalesValue: 0, clubStashMoves: 0 },
  contacts: { classId: null, learned: [], methods: {}, history: [] },
  cityDirector: { claims: [] }, city: createCityState(), sessionPlans: createSessionPlanState(),
  gang: { joined: false }, businessesOwned: [], factoriesOwned: {}, club: { owned: false },
  ...overrides,
});

test("board offers at most three eligible directions and never invents locked empire routes", () => {
  const beginner = player();
  const proposals = getSessionPlanProposals(beginner, now);
  assert.equal(proposals.length, 1);
  assert.equal(proposals[0].id, "street-bank");
  assert.equal(proposals.some((entry) => entry.id === "factory-chain" || entry.id === "business-turn" || entry.id === "contact-window"), false);

  const developed = player({ contacts: { classId: "dealer", learned: ["dealer"], methods: { dealer: 2 }, history: [] }, factoriesOwned: { smokeworks: 1 }, businessesOwned: [{ id: "bar", count: 1 }] });
  const developedPlans = getSessionPlanProposals(developed, now);
  assert.equal(developedPlans.length, 3);
  assert.ok(developedPlans.some((entry) => entry.id === "factory-chain"));
  assert.ok(developedPlans.some((entry) => entry.id === "event-pivot"));
  const entrepreneur = player({ contacts: { classId: "broker", learned: ["broker"], methods: {}, history: [] }, businessesOwned: [{ id: "bar", count: 1 }] });
  assert.ok(getSessionPlanProposals(entrepreneur, now).some((entry) => entry.id === "business-turn"));
});

test("gang alignment changes the contextual story without locking solo players out", () => {
  const event = getCityEventAt(now);
  const solo = player({ contacts: { classId: "broker", learned: ["broker"], methods: {}, history: [] } });
  assert.equal(getSessionPlanProposals(solo, now)[0].id, "event-pivot");
  const aligned = player({ contacts: solo.contacts, gang: { joined: true, focusDistrictId: event.districtId } });
  const gangPlan = getSessionPlanProposals(aligned, now)[0];
  assert.equal(gangPlan.id, "gang-event");
  assert.match(gangPlan.reason, /gangu/);
});

test("an active major operation becomes the top session plan and resolves from persisted history", () => {
  const runId = `op-syndicate-ledger-${now}`;
  const p = player({ operations: { active: { id: runId, operationId: "syndicate-ledger", districtId: "oldtown", stageIndex: 5, choiceIds: { intel: "inside-tip", approach: "quiet-entry", loadout: "burner-kit", crew: "tight-crew", escape: "burner-sedan" }, prepSpent: 10000, createdAt: now, updatedAt: now, expiresAt: now + 3600000, phase: "complication", complication: { id: "paper-trail", preview: {} } }, history: [], progress: { "ledger-pull": { wins: 1 } } } });
  const proposal = getSessionPlanProposals(p, now)[0];
  assert.equal(proposal.id, "major-operation");
  acceptSessionPlan(p, proposal.key, "finish", now);
  assert.equal(getSessionPlanBoard(p, now + 1).active.ready, false);
  p.operations.active = null;
  p.operations.history = [{ id: runId, operationId: "syndicate-ledger", outcome: "partial", success: false, time: now + 2 }];
  const board = getSessionPlanBoard(p, now + 3);
  assert.equal(board.active.ready, true); assert.equal(board.active.outcome, "partial");
  const result = claimSessionPlan(p, now + 4);
  assert.equal(result.reward.xp, 5); assert.equal(result.reward.cash, 0);
});

test("acceptance snapshots progress, survives serialization and blocks a second active plan", () => {
  const p = player();
  p.stats.heistsDone = 8; p.stats.bankDepositedTotal = 9000;
  const street = getSessionPlanProposals(p, now).find((entry) => entry.id === "street-bank");
  acceptSessionPlan(p, street.key, "secure", now);
  let board = getSessionPlanBoard(p, now + 1);
  assert.equal(board.active.ready, false);
  assert.equal(board.active.steps.every((entry) => !entry.done), true);
  assert.throws(() => acceptSessionPlan(p, street.key, "bold", now + 2), /aktywny plan/);
  const restored = structuredClone(p);
  restored.stats.heistsDone += 1; restored.stats.bankDepositedTotal += 500;
  board = getSessionPlanBoard(restored, now + 3);
  assert.equal(board.active.ready, true);
});

test("street finale pays once, leaves premium untouched and claimed plan cannot be farmed", () => {
  const p = player();
  const street = getSessionPlanProposals(p, now).find((entry) => entry.id === "street-bank");
  acceptSessionPlan(p, street.key, "secure", now);
  p.stats.heistsDone += 1; p.stats.bankDepositedTotal += 500;
  const cash = p.profile.cash, premium = p.profile.premiumTokens, heat = p.profile.heat;
  const result = claimSessionPlan(p, now + 1000);
  assert.equal(result.reward.cash, 450);
  assert.equal(p.profile.cash, cash + 450);
  assert.equal(p.profile.heat, heat - 4);
  assert.equal(p.profile.premiumTokens, premium);
  assert.throws(() => claimSessionPlan(p, now + 1001), /aktywnego planu/);
  assert.equal(getSessionPlanProposals(p, now + 1002).some((entry) => entry.key === street.key), false);
});

test("contact setback is a valid consequence with a smaller reward and no paid escape", () => {
  const event = getCityEventAt(now);
  const p = player({ contacts: { classId: "host", learned: ["host"], methods: {}, history: [] } });
  const contact = getSessionPlanProposals(p, now).find((entry) => entry.id === "contact-window");
  assert.ok(contact);
  acceptSessionPlan(p, contact.key, "rush", now);
  p.contacts.history.unshift({ at: now + 1, districtId: event.districtId, methodId: "host", mode: "rush", success: false, gain: 0 });
  const before = p.profile.premiumTokens;
  const board = getSessionPlanBoard(p, now + 2);
  assert.equal(board.active.ready, true);
  assert.equal(board.active.outcome, "setback");
  const result = claimSessionPlan(p, now + 3);
  assert.equal(result.reward.cash, 0);
  assert.equal(result.reward.xp, 3);
  assert.equal(p.profile.premiumTokens, before);
});

test("event plan requires the chosen response and a later local contact", () => {
  const p = player({ contacts: { classId: "broker", learned: ["broker"], methods: {}, history: [] } });
  const eventPlan = getSessionPlanProposals(p, now).find((entry) => entry.id === "event-pivot");
  acceptSessionPlan(p, eventPlan.key, "cautious", now);
  respondToCityEvent(p, "adapt", now + 1);
  let board = getSessionPlanBoard(p, now + 2);
  assert.equal(board.active.steps[0].done, true);
  assert.equal(board.active.ready, false);
  p.contacts.history.unshift({ at: now + 3, districtId: eventPlan.districtId, methodId: "broker", mode: "quiet", success: true, gain: 400 });
  board = getSessionPlanBoard(p, now + 4);
  assert.equal(board.active.ready, true);
});

test("abandon and expiry cannot be used to reroll the same plan or claim late", () => {
  const p = player();
  const plan = getSessionPlanProposals(p, now)[0];
  acceptSessionPlan(p, plan.key, "secure", now);
  abandonSessionPlan(p, now + 1);
  assert.equal(getSessionPlanProposals(p, now + 2).some((entry) => entry.key === plan.key), false);

  const late = player();
  acceptSessionPlan(late, plan.key, "secure", now);
  late.stats.heistsDone += 1; late.stats.bankDepositedTotal += 500;
  assert.throws(() => claimSessionPlan(late, late.sessionPlans.active.expiresAt + 1), /zamknęło/);
});
