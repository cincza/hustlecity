import test from "node:test";
import assert from "node:assert/strict";
import { CONTACT_SLOT_MS, executeContactAction, getContactQuote, normalizeContacts } from "../../shared/contacts.js";
import { getCitySituation } from "../../shared/cityStories.js";
import { createCityState } from "../../shared/districts.js";
import { createGangState, ensureGangWeeklyGoal, recordGangJobProgress } from "../../shared/gangProjects.js";
import { recordGangCityResponse } from "../../shared/gangIdentity.js";

const now = 1789812000000;
const player = () => ({ profile: { cash: 5000, bank: 5000, energy: 100, hp: 100, heat: 10, respect: 5, xp: 0, premiumTokens: 0 }, inventory: { smoke: 100, spirytus: 100 }, stats: {}, city: createCityState() });
const execute = (p, districtId, at, mode = "quiet", random = () => 0) => executeContactAction(p, "execute", { districtId, methodId: p.contacts.classId, mode, slot: Math.floor(at / CONTACT_SLOT_MS) }, at, random);

test("districts change contact economics and high pressure creates a risky premium instead of only a penalty", () => {
  const p = player(); executeContactAction(p, "class", { classId: "broker" }, now);
  const old = getContactQuote(p, "oldtown", "broker", "rush", now);
  const neon = getContactQuote(p, "neon", "broker", "rush", now);
  const harbor = getContactQuote(p, "harbor", "broker", "rush", now);
  assert.ok(old.reward < neon.reward);
  assert.ok(old.heat < neon.heat);
  assert.ok(harbor.chance > neon.chance);
  p.city.districts.neon.pressure = 60; p.city.districts.neon.lastSyncAt = now;
  const crackdown = getContactQuote(p, "neon", "broker", "rush", now);
  assert.ok(crackdown.reward > neon.reward);
  assert.ok(crackdown.chance < neon.chance);
  assert.equal(crackdown.pressureOpportunity, 1.12);
});

test("a remembered choice changes a later contract, is consumed once and cannot be rerolled that week", () => {
  const p = player(); executeContactAction(p, "class", { classId: "broker" }, now);
  execute(p, "oldtown", now); execute(p, "oldtown", now + CONTACT_SLOT_MS);
  const actionAt = now + 2 * CONTACT_SLOT_MS;
  const base = getContactQuote(p, "oldtown", "broker", "rush", actionAt);
  assert.equal(getCitySituation(p, "oldtown", actionAt).unlocked, true);
  const result = executeContactAction(p, "situation", { districtId: "oldtown", choiceId: "sell" }, actionAt);
  assert.equal(result.citySituationResolved, true);
  const changed = getContactQuote(p, "oldtown", "broker", "rush", actionAt);
  assert.equal(changed.reward, Math.round(base.reward * 1.2));
  assert.equal(changed.heat, base.heat + 4);
  assert.equal(changed.consequence.label, "Gorący trop");
  const saved = JSON.parse(JSON.stringify(p.contacts));
  assert.equal(normalizeContacts(saved, actionAt).stories.relations.oldtown.lastChoiceId, "sell");
  execute(p, "oldtown", actionAt, "rush");
  assert.equal(getContactQuote(p, "oldtown", "broker", "rush", actionAt + CONTACT_SLOT_MS).consequence, null);
  assert.throws(() => executeContactAction(p, "situation", { districtId: "oldtown", choiceId: "protect" }, actionAt), /tygodniu/);
});

test("class routes are alternatives earned by identity and mastery, never by premium balance", () => {
  const p = player(); executeContactAction(p, "class", { classId: "host" }, now);
  p.contacts.stories.relations.neon.trust = 2;
  let view = getCitySituation(p, "neon", now);
  assert.equal(view.choices.find((c) => c.id === "guest-list").cost, 250);
  p.profile.premiumTokens = 1000000;
  assert.equal(getCitySituation(p, "oldtown", now).choices.find((c) => c.id === "front").reasons[0].includes("Tylko"), true);
  p.contacts.methods.host = 6;
  view = getCitySituation(p, "neon", now);
  assert.equal(view.choices.find((c) => c.id === "guest-list").cost, 150);
  executeContactAction(p, "situation", { districtId: "neon", choiceId: "guest-list" }, now);
  assert.equal(p.profile.premiumTokens, 1000000);
});

test("gang city response counts distinct members, follows the focus district and rewards once", () => {
  let gang = ensureGangWeeklyGoal(createGangState({ joined: true, name: "Crew", focusDistrictId: "neon" }), now);
  let response = recordGangCityResponse(gang, "a");
  gang = recordGangJobProgress(gang, "cityResponses", response.delta, now).gang;
  assert.equal(recordGangCityResponse(gang, "a").delta, 0);
  response = recordGangCityResponse(gang, "b");
  assert.equal(response.progress, 2);
  gang = recordGangJobProgress(gang, "cityResponses", response.delta, now).gang;
  const third = recordGangCityResponse(gang, "c");
  assert.equal(third.progress, 3);
  const reward = recordGangJobProgress(gang, "cityResponses", third.delta, now);
  assert.equal(reward.completedJobs[0].id, "city-response");
  reward.gang.cityResponse.rewardedAt = now;
  assert.equal(recordGangJobProgress(reward.gang, "cityResponses", 1, now).completedJobs.length, 0);
  const nextWeek = ensureGangWeeklyGoal(reward.gang, now + 7 * 86400000);
  assert.equal(nextWeek.cityResponse.memberIds.length, 0);
  assert.equal(nextWeek.cityResponse.rewardedAt, null);
});
