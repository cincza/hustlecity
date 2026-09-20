import test from "node:test";
import assert from "node:assert/strict";
import { CONTACT_CLASSES, CONTACT_SLOT_MS, executeContactAction, getContactQuote, normalizeContacts, contactMilestones } from "../../shared/contacts.js";
import { createGangState, ensureGangWeeklyGoal, recordGangJobProgress } from "../../shared/gangProjects.js";
import { syncPlayerHeat } from "../../shared/resources.js";
import { BUSINESSES, getBusinessPurchaseCost, getBusinessUpgradeCost, getBusinessIncomePerMinute } from "../../shared/empire.js";
import { buyBusinessForPlayer } from "../../backend/src/services/empireActionService.js";
import { simulateProgression } from "../simulate-progression.mjs";
import { getContextActions } from "../../shared/contextActions.js";
import { createCityState } from "../../shared/districts.js";
const now = 1789812000000;
const player = () => ({ profile: { cash: 2000, energy: 20, hp: 100, heat: 6, respect: 1, xp: 0, premiumTokens: 10 }, stats: {}, inventory: { smoke: 30, spirytus: 30 } });
const execute = (p, extra = {}, at = now, random = () => 0) => executeContactAction(p, "execute", { districtId: "oldtown", methodId: p.contacts.classId, mode: "quiet", slot: Math.floor(at / CONTACT_SLOT_MS), ...extra }, at, random);
test("late-game patrons require a varied empire, debit funds once and grant prestige without power", () => {
  const p = player(); executeContactAction(p, "class", { classId: "broker" }, now);
  p.profile.cash = 11100000; p.profile.premiumTokens = 0;
  p.contacts.completed = 150; p.contacts.learned = CONTACT_CLASSES.map((c) => c.id);
  p.contacts.districts = { oldtown: 50, neon: 50, harbor: 50 };
  p.businessesOwned = BUSINESSES.slice(0, 5).map((b) => ({ id: b.id, count: 1 }));
  p.factoriesOwned = { smokeworks: true, distillery: true }; p.stats.operationsCompleted = 10;
  const before = structuredClone(p);
  assert.throws(() => executeContactAction(p, "milestone", { id: "city-legend" }, now));
  assert.deepEqual(p, before);
  p.factoriesOwned.wetlab = true;
  const originalProfile = { ...p.profile };
  for (const m of contactMilestones(p, now)) executeContactAction(p, "milestone", { id: m.id }, now);
  assert.deepEqual(p.profile, { ...originalProfile, cash: 0, premiumTokens: 23 });
  assert.equal(p.contacts.milestones.length, 4);
  assert.throws(() => executeContactAction(p, "milestone", { id: "city-legend" }, now));
  assert.equal(normalizeContacts(null, now).classId, null);
});
test("district lockdown changes available methods and rush risk without inventing another police system", () => {
  const p = player(); executeContactAction(p, "class", { classId: "dealer" }, now);
  const before = getContactQuote(p, "oldtown", "dealer", "rush", now).chance;
  p.city = createCityState(); p.city.districts.oldtown.pressure = 90; p.city.districts.oldtown.lastSyncAt = now;
  assert.ok(getContactQuote(p, "oldtown", "dealer", "quiet", now).reasons.some((r) => r.includes("Blokada")));
  assert.ok(getContactQuote(p, "oldtown", "dealer", "rush", now).chance < before);
  p.contacts.completed = 6; executeContactAction(p, "learn", { classId: "broker" }, now);
  assert.deepEqual(getContactQuote(p, "oldtown", "broker", "quiet", now).reasons, []);
  execute(p, { methodId: "broker" });
  assert.ok(p.city.districts.oldtown.pressure < 90);
});
test("the hub points to available contacts and stops recommending a spent window", () => {
  const p = player(); executeContactAction(p, "class", { classId: "broker" }, now);
  const game = () => ({ ...p, player: p.profile });
  assert.equal(getContextActions(game(), { now })[0].id, "contacts");
  for (const districtId of ["oldtown", "neon", "harbor"]) execute(p, { districtId });
  assert.ok(!getContextActions(game(), { now }).some((a) => a.id === "contacts"));
});
test("week sensitivity model exposes old exponential bars and keeps every profession progressing", () => {
  const before = simulateProgression(null, 42, 7, true), after = simulateProgression(null);
  assert.ok(before.last.bars > after.last.bars * 4);
  for (const c of CONTACT_CLASSES) {
    const result = simulateProgression(c.id);
    assert.ok(result.last.respect >= 8 && result.last.respect <= 10);
    assert.equal(result.last.contacts, 63); assert.ok(result.last.cash >= 0);
  }
});
test("personal Heat decays with elapsed time, not number of requests; old profiles receive no retroactive reset", () => {
  const p = player(); p.profile.heat = 80;
  syncPlayerHeat(p, now); assert.equal(p.profile.heat, 80);
  syncPlayerHeat(p, now + 3600000); assert.equal(p.profile.heat, 76);
  syncPlayerHeat(p, now + 3600000); assert.equal(p.profile.heat, 76);
  syncPlayerHeat(p, now + 30 * 3600000); assert.equal(p.profile.heat, 0);
});
test("duplicate purchase and network upgrades scale their cost without cutting existing income", () => {
  const p = player(); p.profile.respect = 15; p.profile.cash = 100000;
  const bar = BUSINESSES.find((b) => b.id === "bar");
  assert.equal(getBusinessPurchaseCost(p, bar), 12000);
  buyBusinessForPlayer(p, "bar", now); buyBusinessForPlayer(p, "bar", now);
  assert.equal(p.profile.cash, 70000);
  assert.equal(getBusinessPurchaseCost(p, bar), 24000);
  assert.equal(getBusinessUpgradeCost(p, bar, "cash"), 10800);
  assert.equal(getBusinessIncomePerMinute(p), bar.incomePerMinute * 2);
  p.profile.cash = 23999; const before = structuredClone(p);
  assert.throws(() => buyBusinessForPlayer(p, "bar", now), /gotowki/);
  assert.equal(p.profile.cash, before.profile.cash); assert.deepEqual(p.businessesOwned, before.businessesOwned);
});
test("dealer chooses factory stock explicitly; delivery cannot consume another inventory", () => {
  const p = player(); executeContactAction(p, "class", { classId: "dealer" }, now);
  p.producedDrugInventory = { smokes: 3 }; p.drugInventory = { smokes: 100 };
  execute(p, { source: "production" });
  assert.equal(p.producedDrugInventory.smokes, 0);
  assert.equal(p.drugInventory.smokes, 100); assert.equal(p.inventory.smoke, 30);
  assert.equal(getContactQuote(p, "neon", "dealer", "quiet", now, "forged"), null);
});
test("each initial profession has a complete resource-priced route and preserves existing progress", () => {
  for (const c of CONTACT_CLASSES) {
    const p = player(); p.businessesOwned = [{ id: "bar", count: 2 }];
    executeContactAction(p, "class", { classId: c.id }, now);
    assert.equal(p.profile.cash, 2000); assert.equal(p.profile.premiumTokens, 10);
    const q = getContactQuote(p, "oldtown", c.id, "quiet", now);
    const before = structuredClone(p);
    execute(p);
    assert.equal(p.profile.cash, before.profile.cash - q.cost + q.reward);
    assert.equal(p.profile.energy, 20 - c.energy);
    assert.equal(p.profile.hp, 100 - (c.damage || 0));
    assert.equal(p.contacts.completed, 1);
    if (q.quantity) assert.equal(p.inventory[q.goods], before.inventory[q.goods] - q.quantity);
    assert.deepEqual(p.businessesOwned, before.businessesOwned);
    const saved = structuredClone(p);
    assert.throws(() => execute(p), /już obsłużony/);
    assert.deepEqual(p, saved);
  }
});
test("premium cannot unlock unearned methods, reset opportunities or grant stats", () => {
  const p = player(); executeContactAction(p, "class", { classId: "broker" }, now); execute(p);
  assert.throws(() => executeContactAction(p, "class", { classId: "enforcer" }, now), /praktykę/);
  assert.throws(() => executeContactAction(p, "learn", { classId: "enforcer" }, now), /6/);
  p.contacts.completed = 6;
  executeContactAction(p, "learn", { classId: "enforcer" }, now);
  const before = structuredClone(p);
  executeContactAction(p, "class", { classId: "enforcer" }, now);
  assert.deepEqual(p.profile, { ...before.profile, premiumTokens: 7 });
  assert.deepEqual(p.contacts.used, before.contacts.used);
  assert.throws(() => execute(p), /już obsłużony/);
  executeContactAction(p, "cosmetic", { id: "silver", price: -1000 }, now);
  assert.equal(p.profile.premiumTokens, 5);
  executeContactAction(p, "cosmetic", { id: "silver" }, now);
  assert.equal(p.profile.premiumTokens, 5);
});
test("server quote rejects stale windows, bogus modes and insufficient goods without mutations", () => {
  const p = player(); executeContactAction(p, "class", { classId: "dealer" }, now);
  p.inventory.smoke = 0;
  const before = structuredClone(p);
  assert.throws(() => execute(p), /Fajki/);
  assert.throws(() => execute(p, { mode: "god" }), /Nieznane/);
  assert.throws(() => execute(p, { slot: 0 }), /Odśwież/);
  assert.deepEqual(p, before);
});
test("rush failure spends resources, creates Heat, awards no cash and cannot reroll", () => {
  const p = player(); executeContactAction(p, "class", { classId: "dealer" }, now);
  const q = getContactQuote(p, "oldtown", "dealer", "rush", now);
  execute(p, { mode: "rush", reward: 1000000, chance: 1 }, now, () => 0.999);
  assert.equal(p.profile.cash, 2000); assert.equal(p.inventory.smoke, 30 - q.quantity);
  assert.equal(p.profile.heat, 6 + q.heat); assert.equal(p.contacts.completed, 0);
  assert.throws(() => execute(p), /już obsłużony/);
});
test("weekly and milestone currency are earned once; rolling the week preserves lifetime goals", () => {
  const p = player(); executeContactAction(p, "class", { classId: "broker" }, now);
  for (let i = 0; i < 9; i++) { p.profile.energy = 20; execute(p, { districtId: ["oldtown", "neon", "harbor"][i % 3] }, now + Math.floor(i / 3) * CONTACT_SLOT_MS); }
  const at = now + 2 * CONTACT_SLOT_MS;
  assert.ok(contactMilestones(p, at)[0].ready);
  executeContactAction(p, "weekly", {}, at); executeContactAction(p, "milestone", { id: "first-network" }, at);
  assert.equal(p.profile.premiumTokens, 15);
  assert.throws(() => executeContactAction(p, "weekly", {}, at));
  assert.throws(() => executeContactAction(p, "milestone", { id: "first-network" }, at));
  const next = normalizeContacts(p.contacts, at + 7 * 86400000);
  assert.equal(next.weekCount, 0); assert.equal(next.completed, 9); assert.equal(next.milestones.length, 1);
});
test("existing gang boards gain contact cooperation without resetting completed jobs", () => {
  let gang = ensureGangWeeklyGoal(createGangState({ joined: true }), now);
  gang.jobBoard = gang.jobBoard.filter((j) => j.id !== "contact-network");
  gang.jobProgress.vaultContributed = 5000; gang.jobRewardedAt["open-heist"] = now;
  gang = ensureGangWeeklyGoal(gang, now);
  assert.ok(gang.jobBoard.some((j) => j.id === "contact-network"));
  assert.equal(gang.jobProgress.vaultContributed, 5000);
  assert.equal(gang.jobRewardedAt["open-heist"], now);
  const done = recordGangJobProgress(gang, "contactOrders", 9, now);
  assert.equal(done.completedJobs.length, 1);
  assert.equal(recordGangJobProgress(done.gang, "contactOrders", 1, now).completedJobs.length, 0);
});
