import test from "node:test";
import assert from "node:assert/strict";
import { rouletteOutcome } from "../../shared/roulette.js";
import { getCasinoGameConfig } from "../../src/game/selectors/authorityFeedback.js";
test("roulette settles all 37 numbers consistently with displayed colors and payouts", () => {
  for (const choice of ["red", "black", "green"]) {
    const outcomes = Array.from({ length: 37 }, (_, n) => rouletteOutcome(n, choice, 100));
    assert.equal(outcomes.filter(o => o.win).length, choice === "green" ? 1 : 18);
    assert.equal(outcomes.reduce((sum, o) => sum + o.totalReturn, 0), 3600);
    assert.ok(outcomes.every(o => o.net === o.totalReturn - 100));
  }
  assert.equal(rouletteOutcome(12, "red", 100).win, true);
  assert.equal(rouletteOutcome(11, "black", 100).win, true);
  assert.throws(() => rouletteOutcome(37, "red", 100));
  assert.throws(() => rouletteOutcome(0, "blue", 100));
});
test("expired casino cooldown unlocks without fetching metadata again", () => {
  assert.equal(getCasinoGameConfig({ cooldownUntil: Date.now() - 1, cooldownRemainingSeconds: 4 }, "slot").cooldownRemainingMs, 0);
});
