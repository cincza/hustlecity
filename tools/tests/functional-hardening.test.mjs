import test from "node:test";
import assert from "node:assert/strict";
import { analyzeFunctionalHardening } from "../analyze-functional-hardening.mjs";

test("modeled progression reaches every major stage without an extreme class outlier", () => {
  const report = analyzeFunctionalHardening();
  for (const profile of report.progression) {
    assert.ok(profile.days[15] && profile.days[15] <= 90, `${profile.id} reaches gang progression`);
    assert.ok(profile.days[45] && profile.days[45] <= 365, `${profile.id} reaches the solo finale respect gate`);
  }
  const classDays = report.classComparison.map((entry) => entry.days[45]);
  assert.ok(Math.max(...classDays) / Math.min(...classDays) <= 1.3, `class spread ${classDays.join(",")}`);
});

test("passive assets share a sane payback band and production is energy bounded", () => {
  const report = analyzeFunctionalHardening();
  for (const entry of report.passiveRoiHours.businesses) assert.equal(entry.hours, 40, entry.id);
  for (const entry of report.passiveRoiHours.escorts) assert.ok(entry.hours >= 38 && entry.hours <= 41, entry.id);
  assert.ok(report.production.every((entry) => entry.energy >= 1 && entry.energy <= 3));
  assert.equal(report.production.find((entry) => entry.id === "mescaline").energy, 3);
});
