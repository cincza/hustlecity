import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { premiumConfiguration, createPremiumCheckout, verifyPremiumWebhook, fulfillPremiumOrder } from "../../backend/src/services/premiumService.js";
import { CONTACT_CLASSES, CONTACT_SLOT_MS, executeContactAction, getContactQuote } from "../../shared/contacts.js";
import { buyGangIdentity, recordGangSpecialist } from "../../shared/gangIdentity.js";
import { createGangState, ensureGangWeeklyGoal } from "../../shared/gangProjects.js";
import { createGangForPlayer } from "../../backend/src/services/gangProjectService.js";
const now = 1789812000000;
const env = { PREMIUM_CHECKOUT_ENABLED: "1", STRIPE_SECRET_KEY: "sk_test_isolated", STRIPE_WEBHOOK_SECRET: "whsec_isolated", PREMIUM_RETURN_URL: "http://localhost:8102/" };
const player = () => ({ profile: { cash: 5000, bank: 5000, energy: 20, hp: 100, respect: 1, xp: 0, heat: 10, premiumTokens: 10 }, inventory: { smoke: 100, spirytus: 100 }, stats: {} });
const eventFor = (order) => ({ id: "evt_test", type: "checkout.session.completed", data: { object: { id: order.id, payment_status: "paid", amount_total: order.amount, currency: order.currency, metadata: { playerId: order.userId, packId: order.packId } } } });

test("premium cannot bypass gang founding progression or alter contact quotes", () => {
  const p = player();
  executeContactAction(p, "class", { classId: "broker" }, now);
  const quote = getContactQuote(p, "oldtown", "broker", "quiet", now);
  p.profile.premiumTokens = 1000000;
  assert.deepEqual(getContactQuote(p, "oldtown", "broker", "quiet", now), quote);
  p.profile.cash = 1000000; p.profile.respect = 14;
  assert.throws(() => createGangForPlayer(p, "Earned Crew", now), /15/);
  p.profile.respect = 15; p.profile.cash = 249999;
  assert.throws(() => createGangForPlayer(p, "Earned Crew", now), /250000/);
  p.profile.cash = 250000; p.profile.premiumTokens = 0;
  createGangForPlayer(p, "Earned Crew", now);
  assert.equal(p.gang.joined, true);
  assert.equal(p.profile.cash, 0);
  assert.equal(p.profile.premiumTokens, 0);
});

test("checkout prices and redirect originate on the server; no configuration means no payment call", async () => {
  assert.equal(premiumConfiguration({}).enabled, false);
  await assert.rejects(createPremiumCheckout("user", "pocket", "key", { env: {}, send: () => assert.fail("network called") }), /uruchomiony/);
  let sent;
  const order = await createPremiumCheckout("user", "pocket", "key", { env, now, send: async (url, options) => {
    sent = options;
    assert.equal(url, "https://api.stripe.com/v1/checkout/sessions");
    return { ok: true, json: async () => ({ id: "cs_test_local", url: "https://checkout.stripe.com/c/pay/test" }) };
  } });
  assert.equal(sent.body.get("line_items[0][price_data][unit_amount]"), "990");
  assert.equal(sent.headers["Idempotency-Key"], "user:key");
  assert.equal(order.tokens, 10);
  assert.equal(order.state, "pending");
});
test("webhook verifies the original bytes and timestamp, including rotated signature headers", () => {
  const raw = Buffer.from(JSON.stringify({ id: "evt_test", type: "example", data: { object: {} } }));
  const timestamp = Math.floor(now / 1000);
  const sig = crypto.createHmac("sha256", env.STRIPE_WEBHOOK_SECRET).update(`${timestamp}.`).update(raw).digest("hex");
  assert.equal(verifyPremiumWebhook(raw, `t=${timestamp},v1=${"0".repeat(64)},v1=${sig}`, env.STRIPE_WEBHOOK_SECRET, now).id, "evt_test");
  assert.throws(() => verifyPremiumWebhook(Buffer.from(raw + " "), `t=${timestamp},v1=${sig}`, env.STRIPE_WEBHOOK_SECRET, now), /podpis/);
  assert.throws(() => verifyPremiumWebhook(raw, `t=${timestamp},v1=${sig}`, env.STRIPE_WEBHOOK_SECRET, now + 301000), /podpis/);
  assert.throws(() => verifyPremiumWebhook(raw, "v1=bad", env.STRIPE_WEBHOOK_SECRET, now), /podpis/);
});
test("payment amount, owner, currency and paid status are checked; another event cannot credit the same order", () => {
  const order = { id: "cs_test", userId: "owner", packId: "pocket", tokens: 10, amount: 990, currency: "pln", state: "pending" };
  const p = player(), before = structuredClone(p);
  const event = eventFor(order);
  for (const change of [{ amount_total: 1 }, { currency: "usd" }, { metadata: { playerId: "other", packId: "pocket" } }]) {
    assert.throws(() => fulfillPremiumOrder(p, order, { ...event, data: { object: { ...event.data.object, ...change } } }, now));
    assert.deepEqual(p, before); assert.equal(order.state, "pending");
  }
  assert.equal(fulfillPremiumOrder(p, order, { ...event, data: { object: { ...event.data.object, payment_status: "unpaid" } } }, now), false);
  assert.equal(fulfillPremiumOrder(p, order, event, now), true);
  assert.equal(p.profile.premiumTokens, 20);
  assert.equal(fulfillPremiumOrder(p, order, { ...event, id: "evt_other" }, now), false);
  assert.deepEqual(p.profile, { ...before.profile, premiumTokens: 20 });
  assert.equal(p.contacts.walletHistory.length, 1);
});
test("each earned specialization exchanges different resources and cannot be purchased with premium", () => {
  for (const c of CONTACT_CLASSES) {
    const p = player(); executeContactAction(p, "class", { classId: c.id }, now);
    const body = { methodId: c.id, districtId: "oldtown", mode: "quiet", approach: "specialist", slot: Math.floor(now / CONTACT_SLOT_MS) };
    assert.throws(() => executeContactAction(p, "execute", body, now), /6 udanych/);
    p.contacts.methods[c.id] = 6;
    const q = getContactQuote(p, "oldtown", c.id, "quiet", now, "market", "specialist");
    executeContactAction(p, "execute", body, now, () => 0);
    assert.equal(p.profile.cash, 5000 - q.cost + q.reward);
    assert.equal(p.profile.bank, 5000 - q.bankCost);
    assert.equal(p.profile.energy, 20 - q.energy);
    assert.equal(p.profile.hp, 100 - q.damage);
    assert.equal(p.profile.premiumTokens, 10);
    if (c.id === "broker") assert.equal(q.bankCost, 340);
    if (c.id === "hustler") { assert.equal(p.inventory.spirytus, 100); assert.equal(p.inventory.smoke, 90); }
    if (c.id === "enforcer") { assert.equal(q.damage, 0); assert.equal(q.cost, 120); }
  }
});
test("gang identities belong to the gang; members cannot spend or change them, and owned designs are free", () => {
  const p = player(); p.gang = ensureGangWeeklyGoal(createGangState({ joined: true, name: "Test Crew", role: "Boss", vault: 4000 }), now);
  const before = structuredClone(p.gang);
  buyGangIdentity(p, "noir", now);
  assert.equal(p.profile.premiumTokens, 6);
  assert.equal(p.gang.vault, before.vault); assert.equal(p.gang.gearScore, before.gearScore);
  buyGangIdentity(p, "street", now); buyGangIdentity(p, "noir", now);
  assert.equal(p.profile.premiumTokens, 6);
  p.gang.role = "Czlonek";
  assert.throws(() => buyGangIdentity(p, "crown", now), /boss/);
  assert.equal(p.profile.premiumTokens, 6);
});
test("teamwork requires distinct people with complementary methods and survives focus changes", () => {
  let gang = ensureGangWeeklyGoal(createGangState({ joined: true, name: "Crew" }), now);
  recordGangSpecialist(gang, "a", "broker"); recordGangSpecialist(gang, "a", "dealer"); recordGangSpecialist(gang, "a", "host");
  assert.equal(recordGangSpecialist(gang, "b", "broker").progress, 2);
  assert.equal(recordGangSpecialist(gang, "c", "broker").progress, 2);
  assert.equal(recordGangSpecialist(gang, "c", "host").progress, 3);
  gang.contactNetwork.rewardedAt = now;
  gang.focusDistrictId = "neon"; gang = ensureGangWeeklyGoal(gang, now);
  assert.equal(gang.jobRewardedAt["crew-specialists"], now);
  assert.equal(ensureGangWeeklyGoal(gang, now + 7 * 86400000).contactNetwork.rewardedAt, null);
});
