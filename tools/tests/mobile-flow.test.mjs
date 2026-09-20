import test from "node:test";
import assert from "node:assert/strict";
import { getContextActions } from "../../shared/contextActions.js";
import { getRestaurantAllowance } from "../../shared/restaurant.js";
import { buyRestaurantItemForPlayer } from "../../backend/src/services/playerActionService.js";
const now = 1789490000000;
const player = { hp: 100, maxHp: 100, energy: 20, maxEnergy: 20, cash: 0 };

test("context actions remove irrelevant menu items and prioritize recovery", () => {
  assert.deepEqual(getContextActions({ player }, { now }).map(a => a.id), ["heist"]);
  const game = { player: { ...player, hp: 20, energy: 2, cash: 5000 }, collections: { businessCash: 200 } };
  assert.deepEqual(getContextActions(game, { now }).map(a => a.id), ["hospital", "food", "collect"]);
  assert.deepEqual(getContextActions(game, { now, criticalCare: true }).map(a => a.id), ["hospital", "bank"]);
  game.player.jailUntil = now + 1000;
  assert.deepEqual(getContextActions(game, { now }).map(a => a.id), ["prison"]);
});

test("no food recommendation during cooldown or when unaffordable", () => {
  const game = { player: { ...player, energy: 0, cash: 0 } };
  assert.ok(!getContextActions(game, { now }).some(a => a.id === "food"));
  game.player.cash = 1000;
  game.player.restaurant = { windowStartedAt: now, energyUsed: 15 };
  assert.ok(!getContextActions(game, { now }).some(a => a.id === "food"));
  assert.ok(getContextActions(game, { now: now + 3600000 }).some(a => a.id === "food"));
});

test("15 EN cap allows a full box, preserves old usage and renews exactly at one hour", () => {
  const p = { profile: { ...player, cash: 1000, energy: 0 }, stats: {} };
  assert.equal(buyRestaurantItemForPlayer(p, "energybox", now).energyGain, 12);
  assert.equal(buyRestaurantItemForPlayer(p, "burger", now).energyGain, 3);
  assert.equal(p.profile.cash, 260);
  assert.throws(() => buyRestaurantItemForPlayer(p, "burger", now), /Limit/);
  assert.equal(getRestaurantAllowance(p.profile, now + 3599999).remaining, 0);
  assert.equal(getRestaurantAllowance(p.profile, now + 3600000).remaining, 15);
  assert.equal(getRestaurantAllowance({ restaurant: { windowStartedAt: now, energyUsed: 10 } }, now).remaining, 5);
});
