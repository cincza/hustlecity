import test from "node:test";
import assert from "node:assert/strict";
import { createCityState } from "../../shared/districts.js";
import { createEmpireProjects, finalizeEmpireProject, getEmpireProjectsView, normalizeEmpireProjects, runEmpireDirective, startEmpireProject } from "../../shared/empireProjects.js";
import { createRivalState } from "../../shared/rivals.js";
import { createSessionPlanState, getSessionPlanProposals } from "../../shared/sessionPlans.js";
import { isTransactionalAction } from "../../shared/transactions.js";

const now = 1789840000000;
function player(overrides = {}) {
  const city = createCityState();
  for (const district of Object.values(city.districts)) district.influence = 20;
  return {
    profile: { cash: 3000000, bank: 3000000, energy: 20, heat: 30, hp: 100, respect: 50, xp: 0 },
    stats: { businessCollections: 10, marketGoodsSold: 50, bankDepositedTotal: 200000, drugBatches: 10, producedDrugSalesValue: 100000, operationsCompleted: 10, rivalsResolved: 3, clubStashMoves: 4, gangVaultContributed: 0 },
    businessesOwned: ["bar", "club", "laundry", "cleaning", "travel", "school"].map((id) => ({ id, count: 1 })),
    factoriesOwned: { smokeworks: 1, distillery: 1 }, producedDrugInventory: { smokes: 50 },
    contacts: { completed: 60, stories: { relations: { oldtown: { trust: 8 }, neon: { trust: 8 }, harbor: { trust: 8 } } } },
    club: { owned: true }, gang: { joined: false }, city, rivals: createRivalState(),
    operations: { progress: { "city-vault": { wins: 1 } }, history: [] }, empireProjects: createEmpireProjects(), sessionPlans: createSessionPlanState(),
    ...overrides,
  };
}

test("project funding snapshots activity and prevents retroactive click-through", () => {
  const p = player(); const cash = p.profile.cash;
  startEmpireProject(p, "city-holding", now);
  assert.equal(p.profile.cash, cash - 280000);
  assert.equal(getEmpireProjectsView(p, now).active.proof.ready, false);
  assert.throws(() => finalizeEmpireProject(p, "charter", now + 1), /dowody aktywności/);
  p.stats.businessCollections += 4; p.stats.marketGoodsSold += 20; p.stats.bankDepositedTotal += 100000;
  assert.equal(getEmpireProjectsView(p, now + 2).active.proof.ready, true);
});

test("two distinct finale routes spend normal resources and completion survives normalization", () => {
  const p = player(); startEmpireProject(p, "city-holding", now);
  p.stats.businessCollections += 4; p.stats.marketGoodsSold += 20; p.stats.bankDepositedTotal += 100000;
  const bank = p.profile.bank; const result = finalizeEmpireProject(p, "charter", now + 2);
  assert.equal(p.profile.bank, bank - 350000); assert.equal(result.completion.choiceId, "charter");
  const restored = normalizeEmpireProjects(JSON.parse(JSON.stringify(p.empireProjects)));
  assert.equal(restored.completed["city-holding"].choiceName, "Karta legalnego holdingu");
  assert.equal(restored.active, null);
});

test("gang route is optional and validates the current focused crew", () => {
  const p = player(); startEmpireProject(p, "night-council", now);
  p.stats.operationsCompleted += 0; p.contacts.completed += 6; p.stats.businessCollections += 3;
  let route = getEmpireProjectsView(p, now + 1).active.choices.find((entry) => entry.id === "gang-table");
  assert.match(route.reasons.join(" "), /Gang/);
  p.gang = { joined: true, name: "Neonowi", focusDistrictId: "neon" };
  route = getEmpireProjectsView(p, now + 2).active.choices.find((entry) => entry.id === "gang-table");
  assert.equal(route.reasons.length, 0);
});

test("capstone cannot be bought without projects, vault and city presence", () => {
  const p = player({ empireProjects: createEmpireProjects(), operations: {} });
  for (const district of Object.values(p.city.districts)) district.influence = 0;
  const capstone = getEmpireProjectsView(p, now).projects.find((entry) => entry.id === "city-headquarters");
  assert.ok(capstone.startReasons.some((reason) => /2 wcześniejsze/.test(reason)));
  assert.ok(capstone.startReasons.some((reason) => /Skarbiec/.test(reason)));
  assert.ok(capstone.startReasons.some((reason) => /wpływu/.test(reason)));
});

test("directive is a costly lateral tool with a shared cooldown and no income multiplier", () => {
  const p = player(); p.empireProjects.completed["city-holding"] = { completedAt: now - 1, choiceId: "charter" };
  p.profile.heat = 40; p.city.districts.oldtown.pressure = 40; const bank = p.profile.bank;
  runEmpireDirective(p, "city-holding", "harbor", now);
  assert.equal(p.profile.bank, bank - 75000); assert.equal(p.profile.heat, 32); assert.ok(p.city.districts.oldtown.pressure < 40);
  assert.equal("incomeMultiplier" in p.empireProjects, false);
  assert.throws(() => runEmpireDirective(p, "city-holding", "oldtown", now + 1), /poprzednią dyrektywę/);
});

test("active project appears on the plan board and all endpoints require idempotency", () => {
  const p = player(); startEmpireProject(p, "supply-corridor", now);
  assert.ok(getSessionPlanProposals(p, now + 1).some((entry) => entry.id === "empire-project"));
  assert.equal(isTransactionalAction("/empire-projects/start"), true);
  assert.equal(isTransactionalAction("/empire-projects/finalize"), true);
  assert.equal(isTransactionalAction("/empire-projects/directive"), true);
});

test("solo player can complete the headquarters through contacts", () => {
  const p = player();
  p.empireProjects.completed = {
    "city-holding": { completedAt: now - 2, choiceId: "charter" },
    "supply-corridor": { completedAt: now - 1, choiceId: "own-stock" },
  };
  startEmpireProject(p, "city-headquarters", now);
  p.stats.operationsCompleted += 3;
  p.stats.rivalsResolved += 1;
  p.contacts.completed += 6;
  const result = finalizeEmpireProject(p, "civic-pact", now + 1);
  assert.equal(result.completion.projectId, "city-headquarters");
  assert.equal(p.gang.joined, false);
});

test("gang contribution is an optional headquarters proof and does not change its reward", () => {
  const p = player();
  p.profile.cash = 5000000;
  p.gang = { joined: true, name: "Neonowi", focusDistrictId: "neon" };
  p.empireProjects.completed = {
    "city-holding": { completedAt: now - 2, choiceId: "charter" },
    "night-council": { completedAt: now - 1, choiceId: "gang-table" },
  };
  startEmpireProject(p, "city-headquarters", now);
  p.stats.operationsCompleted += 3;
  p.stats.rivalsResolved += 1;
  p.stats.gangVaultContributed += 50000;
  const result = finalizeEmpireProject(p, "street-crown", now + 1);
  assert.equal(result.completion.projectId, "city-headquarters");
  assert.equal(result.completion.choiceId, "street-crown");
});
