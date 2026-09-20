import test from "node:test";
import assert from "node:assert/strict";
import {
  CITY_DIRECTOR_EPOCH,
  CITY_EVENT_WINDOW_MS,
  advanceCityDirectorState,
  applyCityEventMarketQuote,
  applyCityEventToMarketView,
  createCityDirectorState,
  getCityEventAt,
  getCityEventEffects,
  getCityEventResponse,
  getDealerCityEventPricing,
  respondToCityEvent,
} from "../../shared/cityDirector.js";
import { createCityState } from "../../shared/districts.js";
import { createGangState } from "../../shared/gangProjects.js";
import { recordGangDirectorResponse } from "../../shared/gangIdentity.js";

const player = (classId = "broker") => ({
  profile: { cash: 5000, energy: 20, hp: 100, respect: 10, level: 10, xp: 0, premiumTokens: 7 },
  inventory: { smoke: 20, spirytus: 20 },
  contacts: { classId, methods: { [classId]: 0 } },
  city: createCityState(),
  cityDirector: { claims: [] },
});

test("one deterministic event is shared for a complete window and advances exactly at expiry", () => {
  const start = CITY_DIRECTOR_EPOCH + 18 * CITY_EVENT_WINDOW_MS;
  const first = getCityEventAt(start + 1);
  assert.deepEqual(getCityEventAt(start + CITY_EVENT_WINDOW_MS - 1), first);
  const next = getCityEventAt(start + CITY_EVENT_WINDOW_MS);
  assert.notEqual(next.key, first.key);
  assert.equal(first.endsAt, next.startsAt);
  assert.deepEqual(
    [0, 1, 2].map((slot) => getCityEventAt(CITY_DIRECTOR_EPOCH + slot * CITY_EVENT_WINDOW_MS + 1).id),
    ["neon-festival", "harbor-blockade", "oldtown-sweep"]
  );
  const persisted = createCityDirectorState(start + 1);
  assert.equal(advanceCityDirectorState(persisted, start + 1000).changed, false);
  const advanced = advanceCityDirectorState(persisted, next.startsAt);
  assert.equal(advanced.changed, true);
  assert.equal(advanced.state.history[1].key, first.key);
});

test("market and dealer event pricing preserve the base snapshot and never create instant arbitrage", () => {
  for (let slot = 0; slot < 12; slot += 1) {
    const event = getCityEventAt(CITY_DIRECTOR_EPOCH + slot * CITY_EVENT_WINDOW_MS + 1);
    const view = { prices: { [event.productId]: 100 }, products: { [event.productId]: { streetPrice: 100, fallbackPrice: 116, sellPrice: 82 } } };
    const adjusted = applyCityEventToMarketView(view, event);
    assert.equal(view.products[event.productId].streetPrice, 100);
    assert.ok(adjusted.products[event.productId].streetPrice > adjusted.products[event.productId].sellPrice);
    const buy = applyCityEventMarketQuote({ total: 100 }, event, "buy", event.productId);
    const sell = applyCityEventMarketQuote({ total: 82, payoutPerUnit: 82 }, event, "sell", event.productId);
    assert.ok(buy.total > sell.total);
    const dealer = getDealerCityEventPricing(event, event.drugId);
    assert.ok(Math.ceil(100 * dealer.buyMultiplier) > Math.floor(72 * dealer.sellMultiplier));
  }
});

test("event response is a class alternative, spends normal resources once and never touches premium", () => {
  const now = CITY_DIRECTOR_EPOCH + 1;
  const p = player("broker");
  const before = structuredClone(p);
  const view = getCityEventResponse(p, now);
  assert.equal(view.responded, false);
  assert.equal(view.choices.find((choice) => choice.id === "dealer").reasons[0], "Wymaga tej aktualnej klasy");
  const result = respondToCityEvent(p, "broker", now);
  assert.equal(result.eventKey, view.event.key);
  assert.equal(p.profile.cash, before.profile.cash - 500);
  assert.equal(p.profile.premiumTokens, before.profile.premiumTokens);
  assert.equal(p.cityDirector.claims.length, 1);
  assert.throws(() => respondToCityEvent(p, "adapt", now), /już zareagowałeś/);
  const mastered = player("broker"); mastered.contacts.methods.broker = 6;
  respondToCityEvent(mastered, "broker", now);
  assert.equal(mastered.profile.cash, before.profile.cash - 350);
});

test("class effects only alter the active district and gang progress counts distinct members per event", () => {
  const event = getCityEventAt(CITY_DIRECTOR_EPOCH + CITY_EVENT_WINDOW_MS + 1);
  assert.equal(event.id, "harbor-blockade");
  assert.equal(getCityEventEffects(event, "neon", "dealer"), null);
  assert.ok(getCityEventEffects(event, "harbor", "dealer").factoryBust < event.effects.factoryBust);
  const gang = createGangState({ joined: true, name: "Port Crew", focusDistrictId: "harbor" });
  assert.equal(recordGangDirectorResponse(gang, "a", event).progress, 1);
  assert.equal(recordGangDirectorResponse(gang, "a", event).delta, 0);
  assert.equal(recordGangDirectorResponse(gang, "b", event).progress, 2);
  assert.equal(recordGangDirectorResponse(gang, "c", event).progress, 3);
  const next = getCityEventAt(event.endsAt);
  assert.equal(recordGangDirectorResponse(gang, "a", next).progress, 1);
});
