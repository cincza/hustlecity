import test from "node:test";
import assert from "node:assert/strict";
import { CONTRACT_CATALOG, getActiveContractBoard } from "../../shared/contracts.js";
import { CITY_SITUATIONS, getCitySituationTemplate } from "../../shared/cityStories.js";
import { CITY_DIRECTOR_EPOCH, CITY_EVENT_ARCHETYPES, CITY_EVENT_WINDOW_MS, getCityEventAt } from "../../shared/cityDirector.js";
import {
  OPERATION_CATALOG,
  OPERATION_COMPLICATIONS,
  getOperationById,
  getOperationComplication,
  getOperationComplicationOptions,
} from "../../shared/operations.js";
import { CONTACT_SLOT_MS, executeContactAction, getContactQuote } from "../../shared/contacts.js";
import { createCityState } from "../../shared/districts.js";
import { createGangJobBoard, GANG_JOB_BOARD_TEMPLATES } from "../../shared/gangProjects.js";
import { getSessionPlanProposals } from "../../shared/sessionPlans.js";
import { getRivalView, registerRivalTrigger, RIVAL_ARCHETYPES } from "../../shared/rivals.js";

const DAY = 86400000;
const WEEK = 7 * DAY;
const now = 1789812000000;

function player(classId = "broker") {
  return {
    profile: { cash: 50000, bank: 50000, energy: 30, hp: 100, heat: 10, respect: 30, level: 30, xp: 0, premiumTokens: 0 },
    inventory: { smoke: 100, spirytus: 100 },
    producedDrugInventory: { smokes: 100 },
    contracts: { loadout: {} },
    contacts: { classId, learned: [classId], stories: { relations: { oldtown: { trust: 6 }, neon: { trust: 6 }, harbor: { trust: 6 } } } },
    stats: { contractsCompleted: 3 },
    city: createCityState(),
    rivals: null,
  };
}

test("content pools contain the completed pass without duplicate ids", () => {
  const complicationPool = Object.values(OPERATION_COMPLICATIONS).flat();
  for (const [name, entries, expected] of [
    ["contracts", CONTRACT_CATALOG, 15],
    ["situations", CITY_SITUATIONS, 6],
    ["city events", CITY_EVENT_ARCHETYPES, 6],
    ["operations", OPERATION_CATALOG, 10],
    ["complications", complicationPool, 8],
    ["rivals", Object.values(RIVAL_ARCHETYPES), 3],
    ["gang jobs", GANG_JOB_BOARD_TEMPLATES, 8],
  ]) {
    assert.equal(entries.length, expected, `${name}: unexpected content count`);
    assert.equal(new Set(entries.map((entry) => entry.id)).size, entries.length, `${name}: duplicate id`);
  }
  assert.equal(CITY_SITUATIONS.reduce((sum, entry) => sum + entry.choices.length, 0), 20);
});

test("contract, situation and city event rotation expose the larger pools", () => {
  const contractIds = new Set();
  for (let index = 0; index < CONTRACT_CATALOG.length; index += 1) {
    for (const contract of getActiveContractBoard(index * 4 * 60 * 60 * 1000).active) contractIds.add(contract.id);
  }
  assert.equal(contractIds.size, CONTRACT_CATALOG.length);

  for (const districtId of ["oldtown", "neon", "harbor"]) {
    assert.notEqual(getCitySituationTemplate(districtId, now).id, getCitySituationTemplate(districtId, now + WEEK).id);
  }

  const events = Array.from({ length: 6 }, (_, slot) => getCityEventAt(CITY_DIRECTOR_EPOCH + slot * CITY_EVENT_WINDOW_MS + 1));
  assert.equal(new Set(events.map((event) => event.id)).size, 6);
  assert.deepEqual(events.slice(0, 3).map((event) => event.districtId), events.slice(3).map((event) => event.districtId));
});

test("every complication variant has a persisted seed and a dedicated response", () => {
  const routes = new Set();
  const routeIds = new Set(["burn-ledger", "freeze-alarm", "buy-silence", "split-take", "change-plates", "test-cargo", "seal-sector", "double-agent"]);
  const p = player();
  p.businessesOwned = [{ id: "bar", count: 1 }];
  p.factoriesOwned = { smokeworks: true };
  p.contracts.loadout = { tool: "tool", electronics: "electronics", car: "car" };
  for (const operationId of ["syndicate-ledger", "neon-reserve", "harbor-convoy", "city-vault"]) {
    const operation = getOperationById(operationId);
    const first = getOperationComplication(operation, "run-0");
    const second = getOperationComplication(operation, "run-1");
    assert.notEqual(first.id, second.id);
    for (const complication of [first, second]) {
      const active = { operationId, phase: "complication", classIdSnapshot: "broker", complication };
      const special = getOperationComplicationOptions(active, p).find((option) => routeIds.has(option.id));
      assert.ok(special, `missing route for ${complication.id}`);
      assert.equal(special.reasons.length, 0);
      routes.add(special.id);
    }
  }
  assert.equal(routes.size, 8);
});

test("a contact favor trades trust for flexibility and never touches premium", () => {
  const p = player();
  p.contacts.stories.relations.oldtown.trust = 5;
  const standard = getContactQuote(p, "oldtown", "broker", "rush", now, "market", "standard");
  const favor = getContactQuote(p, "oldtown", "broker", "rush", now, "market", "favor");
  assert.ok(favor.cost < standard.cost);
  assert.ok(favor.reward < standard.reward);
  assert.ok(favor.chance >= standard.chance);
  const tokens = p.profile.premiumTokens;
  executeContactAction(p, "execute", { districtId: "oldtown", methodId: "broker", mode: "rush", approach: "favor", slot: Math.floor(now / CONTACT_SLOT_MS) }, now, () => 1);
  assert.equal(p.contacts.stories.relations.oldtown.trust, 4);
  assert.equal(p.profile.premiumTokens, tokens);
});

test("rivals offer infrastructure counters before and during the finale", () => {
  const p = player();
  registerRivalTrigger(p, { sourceKey: "content-pass", districtId: "oldtown", label: "Test wcześniejszej decyzji" }, now);
  let options = getRivalView(p, now).active.options;
  assert.ok(options.find((option) => option.id === "undercut").reasons.some((reason) => reason.includes("biznesu")));
  assert.ok(options.find((option) => option.id === "burn-route").reasons.some((reason) => reason.includes("fabryki")));
  p.businessesOwned = [{ id: "bar", count: 1 }];
  p.factoriesOwned = { smokeworks: true };
  options = getRivalView(p, now).active.options;
  assert.equal(options.find((option) => option.id === "undercut").reasons.length, 0);
  assert.equal(options.find((option) => option.id === "burn-route").reasons.length, 0);

  options = getRivalView(p, now + 13 * 60 * 60 * 1000).active.options;
  assert.equal(options.find((option) => option.id === "evidence").reasons.length, 0);
  assert.equal(options.find((option) => option.id === "supply-sabotage").reasons.length, 0);
});

test("session plans react to pressure and equipped contract gear", () => {
  const pressured = player();
  pressured.city.districts.neon.pressure = 70;
  pressured.city.districts.neon.lastSyncAt = now;
  assert.ok(getSessionPlanProposals(pressured, now).some((plan) => plan.id === "pressure-relief"));

  const equipped = player(null);
  equipped.contacts = {};
  equipped.contracts.loadout = { tool: "lockpick", car: "sedan" };
  assert.ok(getSessionPlanProposals(equipped, now).some((plan) => plan.id === "contract-field-test"));
});

test("gang board keeps core cooperation and rotates one contextual activity", () => {
  const boards = Array.from({ length: 6 }, (_, index) => createGangJobBoard("neon", now + index * WEEK));
  for (const board of boards) {
    assert.equal(board.length, 5);
    assert.ok(board.some((job) => job.id === "city-response"));
    assert.ok(board.some((job) => job.id === "contact-network"));
  }
  const rotating = new Set(boards.flatMap((board) => board.map((job) => job.id)).filter((id) => ["vault-run", "district-pulse", "crew-specialists"].includes(id)));
  assert.equal(rotating.size, 3);
});
