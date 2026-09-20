import test from "node:test";
import assert from "node:assert/strict";
import { ECONOMY_RULES, HEIST_DEFINITIONS } from "../../shared/economy.js";
import { getSoloHeistOdds } from "../../shared/heists.js";
import { syncPlayerEnergy } from "../../shared/resources.js";
import { normalizeMarketPayload, advanceOnlineDisplay } from "../../shared/clientSnapshots.js";
import { getRestaurantAllowance, getRestaurantQuote } from "../../shared/restaurant.js";
import { RESTAURANT_ITEMS } from "../../shared/playerActions.js";
import { ESCORTS, findDrugById } from "../../shared/socialGameplay.js";
import { createCityState } from "../../shared/districts.js";
import { BUSINESS_UPGRADE_MAX_LEVEL, createSupplyCounterMap, getBusinessEffectiveIncomePerMinute, getBusinessUpgradePreview, getBusinessUpgradeState, getDrugProductionEnergyCost, getDrugProductionRespectRequirement, normalizeBusinessUpgrades } from "../../shared/empire.js";
import { buyGymPassForPlayer, buyRestaurantItemForPlayer, healPlayer, trainPlayerAtGym } from "../../backend/src/services/playerActionService.js";
import { produceDrugForPlayer, upgradeBusinessForPlayer } from "../../backend/src/services/empireActionService.js";
import { buildBlackjackPublicSession } from "../../backend/src/services/blackjackView.js";

const now = 1788890000000;
const profile = () => ({ attack: 11, defense: 8, dexterity: 7, stamina: 7, hp: 100, maxHp: 100, heat: 6, cash: 1000, energy: 0, maxEnergy: 20 });

test("heist preview uses the server odds and unconditional arrest probability", () => {
  const odds = getSoloHeistOdds(profile(), HEIST_DEFINITIONS[0], [], now);
  assert.equal(odds.chance, 0.95);
  assert.equal(odds.arrestChance, (1 - odds.chance) * odds.jailChance);
  assert.ok(getSoloHeistOdds({ ...profile(), heat: 100 }, HEIST_DEFINITIONS[0], [], now).chance < odds.chance);
});

test("partial market responses preserve dealer stock already supplied by the profile", () => {
  const game = { dealerInventory: { weed: 90 }, market: { smoke: 40 }, marketState: { smoke: { stock: 70 } }, marketMeta: { refreshedAt: 123 } };
  const merged = { ...game, ...normalizeMarketPayload({ prices: { smoke: 42 } }, game.market, game.marketState, game.marketMeta) };
  assert.deepEqual(merged.dealerInventory, game.dealerInventory);
  assert.equal(merged.market.smoke, 42);
  assert.equal(merged.marketMeta.refreshedAt, 123);
  assert.deepEqual(normalizeMarketPayload({ dealerInventory: { weed: 0 } }).dealerInventory, { weed: 0 });
});

test("online display ticks cannot change authoritative resources or erase collected income", () => {
  const game = { player: profile(), collections: { cash: 850 }, market: { smoke: 40 }, activeBoosts: [{ expiresAt: now - 1 }, { expiresAt: now + 1000 }], lastTick: now - 5000 };
  const after = advanceOnlineDisplay(game, now);
  assert.deepEqual(after.player, game.player);
  assert.deepEqual(after.collections, game.collections);
  assert.deepEqual(after.market, game.market);
  assert.equal(after.activeBoosts.length, 1);
});

test("spending energy preserves fractional regeneration, while reaching the cap discards overflow", () => {
  const period = ECONOMY_RULES.energy.regenSeconds * 1000;
  const player = { profile: { ...profile(), energy: 10, gymPassTier: "perm" }, timers: { energyUpdatedAt: now }, stats: {} };
  syncPlayerEnergy(player, now + period - 1000);
  trainPlayerAtGym(player, "power", 1, now + period - 1000);
  syncPlayerEnergy(player, now + period);
  assert.equal(player.profile.energy, 9);
  assert.equal(player.timers.energyUpdatedAt, now + period);
  player.profile.energy = 19;
  syncPlayerEnergy(player, now + 10 * period);
  assert.equal(player.profile.energy, 20);
  assert.equal(player.timers.energyUpdatedAt, now + 10 * period);
  player.profile.energy -= 2;
  syncPlayerEnergy(player, now + 10 * period + 1000);
  assert.equal(player.profile.energy, 18);
});

test("restaurant enforces the hourly cap, prorates the last portion and never charges rejected meals", () => {
  const player = { profile: profile(), stats: {} };
  player.profile.restaurant = { windowStartedAt: now, energyUsed: 5 };
  for (let i = 0; i < 3; i++) assert.equal(buyRestaurantItemForPlayer(player, "burger", now).energyGain, 3);
  const partial = buyRestaurantItemForPlayer(player, "burger", now);
  assert.equal(partial.energyGain, 1);
  assert.equal(partial.cost, 30);
  assert.equal(player.profile.cash, 700);
  const before = structuredClone(player);
  assert.throws(() => buyRestaurantItemForPlayer(player, "burger", now), /Limit/);
  assert.deepEqual(player, before);
  assert.equal(getRestaurantAllowance(player.profile, now + 3600000).remaining, 15);
  assert.equal(buyRestaurantItemForPlayer(player, "burger", now + 3600000).energyGain, 3);
});

test("restaurant quotes match purchases, including full energy, jail and insufficient cash", () => {
  const player = { profile: { ...profile(), energy: 19 }, stats: {} };
  const quote = getRestaurantQuote(player.profile, RESTAURANT_ITEMS[0], now);
  const bought = buyRestaurantItemForPlayer(player, "burger", now);
  assert.equal(bought.energyGain, quote.energyGain);
  assert.equal(bought.cost, quote.cost);
  for (const blocked of [{ energy: 20 }, { energy: 0, cash: 1 }, { energy: 0, jailUntil: now + 10000 }]) {
    const p = { profile: { ...profile(), ...blocked }, stats: {} };
    const before = structuredClone(p);
    assert.throws(() => buyRestaurantItemForPlayer(p, "burger", now));
    assert.deepEqual(p, before);
  }
});

test("blackjack never exposes the hidden card or deck before the dealer turn", () => {
  const cards = [{ rank: "5", value: 5 }, { rank: "K", value: 10 }];
  const session = { stage: "player", bet: 100, playerCards: [{ value: 9 }], dealerCards: cards, deck: [{ rank: "A", value: 11 }] };
  const sum = (hand) => hand.reduce((value, card) => value + card.value, 0);
  const view = buildBlackjackPublicSession(session, sum);
  assert.equal(view.dealerCards.length, 1);
  assert.equal(view.dealerHasHiddenCard, true);
  assert.equal(view.dealerValue, 5);
  assert.equal("deck" in view, false);
  assert.equal(JSON.stringify(view).includes('"K"'), false);
  assert.equal(session.dealerCards.length, 2);
  assert.deepEqual(buildBlackjackPublicSession({ ...session, stage: "done" }, sum).dealerCards, cards);
});

test("street routes have the same long-term capital scale as ordinary businesses", () => {
  for (const escort of ESCORTS) {
    const hoursToRepay = escort.cost / (escort.cashPerMinute * 60);
    assert.ok(hoursToRepay >= 38 && hoursToRepay <= 41, `${escort.id} repays in ${hoursToRepay}h`);
  }
});

test("production respects recipe progression and spends energy on an attempted batch", () => {
  const mescaline = findDrugById("mescaline");
  assert.equal(getDrugProductionRespectRequirement(mescaline), 56);
  assert.equal(getDrugProductionEnergyCost(mescaline), 3);

  const smokes = findDrugById("smokes");
  const supplies = createSupplyCounterMap();
  supplies.tobacco = 2;
  supplies.packaging = 1;
  const player = {
    profile: { ...profile(), respect: 8, energy: 0 },
    factoriesOwned: { smokeworks: 1 },
    supplies,
    stats: {},
    city: createCityState(),
  };
  const before = structuredClone(player);
  assert.throws(() => produceDrugForPlayer(player, "smokes", now), /1 EN/);
  assert.deepEqual(player.supplies, before.supplies);
  player.profile.energy = 1;
  const originalRandom = Math.random;
  Math.random = () => 0.99;
  try {
    const result = produceDrugForPlayer(player, "smokes", now);
    assert.equal(result.energyCost, 1);
    assert.equal(player.profile.energy, 0);
    assert.equal(player.supplies.tobacco, 0);
    assert.equal(player.drugInventory.smokes, smokes.batchSize);
  } finally {
    Math.random = originalRandom;
  }
});

test("players cannot pay for healing or a gym pass that gives no benefit", () => {
  const healthy = { profile: profile(), stats: {} };
  const healthyCash = healthy.profile.cash;
  assert.throws(() => healPlayer(healthy, now), /pełne zdrowie/);
  assert.equal(healthy.profile.cash, healthyCash);
  assert.equal(healthy.stats.hospitalHeals, undefined);

  const member = { profile: { ...profile(), cash: 20000, gymPassTier: "perm", gymPassUntil: null }, stats: {} };
  const memberBefore = structuredClone(member);
  assert.throws(() => buyGymPassForPlayer(member, "day", now), /stały karnet/);
  assert.deepEqual(member, memberBefore);

  const renewing = { profile: { ...profile(), cash: 20000, gymPassTier: "week", gymPassUntil: now + 86400000 }, stats: {} };
  buyGymPassForPlayer(renewing, "day", now);
  assert.equal(renewing.profile.gymPassUntil, now + 2 * 86400000);
});

test("business upgrade income has a finite server-enforced ceiling", () => {
  const business = { id: "bar", name: "Bar", cost: 12000, incomePerMinute: 5 };
  const player = {
    profile: { ...profile(), cash: 1000000 },
    businessesOwned: [{ id: "bar", count: 1 }],
    businessUpgrades: { bar: { speedLevel: BUSINESS_UPGRADE_MAX_LEVEL, cashLevel: BUSINESS_UPGRADE_MAX_LEVEL } },
    stats: {},
  };
  const preview = getBusinessUpgradePreview(player, business, 1);
  assert.equal(preview.speedMaxed, true);
  assert.equal(preview.cashMaxed, true);
  assert.ok(Number.isFinite(getBusinessEffectiveIncomePerMinute(player, business, 1)));
  const cash = player.profile.cash;
  assert.throws(() => upgradeBusinessForPlayer(player, "bar", "cash", now), /maksymalny poziom/);
  assert.equal(player.profile.cash, cash);
  assert.deepEqual(normalizeBusinessUpgrades({ bar: { speedLevel: 999, cashLevel: 999 } }).bar, {
    speedLevel: BUSINESS_UPGRADE_MAX_LEVEL,
    cashLevel: BUSINESS_UPGRADE_MAX_LEVEL,
  });
  assert.equal(getBusinessUpgradeState({ businessUpgrades: { bar: { speedLevel: 999, cashLevel: 999 } } }, "bar").totalLevel, BUSINESS_UPGRADE_MAX_LEVEL * 2);
});
