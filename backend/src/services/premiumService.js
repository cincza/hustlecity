import crypto from "node:crypto";
import { PREMIUM_PACKS, recordPremiumChange } from "../../../shared/premium.js";
import { isPremiumCheckoutEnabled } from "../../../shared/releaseFeatures.js";
const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };

export function premiumConfiguration(env = process.env) {
  let returnUrl;
  try {
    const parsed = new URL(env.PREMIUM_RETURN_URL);
    if (parsed.protocol === "https:" || (parsed.protocol === "http:" && ["127.0.0.1", "localhost"].includes(parsed.hostname))) returnUrl = parsed.href;
  } catch {}
  return { enabled: Boolean(isPremiumCheckoutEnabled(env) && env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && returnUrl), returnUrl };
}
export async function createPremiumCheckout(userId, packId, key, { env = process.env, send = fetch, now = Date.now() } = {}) {
  const config = premiumConfiguration(env);
  if (!config.enabled) fail("Zakup żetonów nie jest jeszcze uruchomiony.", 503);
  const pack = PREMIUM_PACKS.find((entry) => entry.id === packId);
  if (!pack) fail("Nieznany pakiet żetonów.");
  const body = new URLSearchParams({ mode: "payment", success_url: config.returnUrl, cancel_url: config.returnUrl,
    "payment_method_types[0]": "card", "line_items[0][quantity]": "1", "line_items[0][price_data][currency]": pack.currency,
    "line_items[0][price_data][unit_amount]": String(pack.amount), "line_items[0][price_data][product_data][name]": `HUSTLE CITY — ${pack.tokens} żetonów`,
    "metadata[playerId]": userId, "metadata[packId]": pack.id });
  const response = await send("https://api.stripe.com/v1/checkout/sessions", { method: "POST", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded", "Idempotency-Key": `${userId}:${key}` }, body });
  if (!response.ok) fail("Operator płatności jest chwilowo niedostępny. Spróbuj ponownie.", 502);
  const session = await response.json();
  let url;
  try { url = new URL(session.url); } catch { fail("Nieprawidłowa odpowiedź operatora.", 502); }
  if (!/^cs_/.test(session.id) || url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") fail("Nieprawidłowa odpowiedź operatora.", 502);
  return { id: session.id, url: url.href, userId, packId: pack.id, tokens: pack.tokens, amount: pack.amount, currency: pack.currency, state: "pending", createdAt: now };
}
export function verifyPremiumWebhook(raw, signature, secret, now = Date.now()) {
  if (!secret) fail("Płatności są wyłączone.", 503);
  if (!Buffer.isBuffer(raw)) fail("Brak oryginalnej treści płatności.");
  const parts = String(signature || "").split(",").map((part) => part.trim().split("="));
  const timestamp = parts.find(([key]) => key === "t")?.[1];
  if (!/^\d+$/.test(timestamp || "") || Math.abs(now / 1000 - Number(timestamp)) > 300) fail("Nieprawidłowy podpis płatności.");
  const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.`).update(raw).digest();
  const valid = parts.filter(([key, value]) => key === "v1" && /^[a-f0-9]{64}$/i.test(value || "")).some(([, value]) => crypto.timingSafeEqual(expected, Buffer.from(value, "hex")));
  if (!valid) fail("Nieprawidłowy podpis płatności.");
  let event;
  try { event = JSON.parse(raw.toString("utf8")); } catch { fail("Nieprawidłowe zdarzenie płatności."); }
  if (!event?.id || !event?.type || !event?.data?.object) fail("Nieprawidłowe zdarzenie płatności.");
  return event;
}
export function fulfillPremiumOrder(player, order, event, now = Date.now()) {
  const session = event.data.object;
  if (!["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type) || session.payment_status !== "paid") return false;
  if (session.id !== order.id || session.amount_total !== order.amount || session.currency !== order.currency || session.metadata?.playerId !== order.userId || session.metadata?.packId !== order.packId) fail("Płatność nie zgadza się z zamówieniem.");
  if (order.state === "paid") return false;
  if (order.state !== "pending" || !Number.isSafeInteger(order.tokens) || order.tokens <= 0) fail("Nieprawidłowe zamówienie.");
  player.profile.premiumTokens = Number(player.profile.premiumTokens || 0) + order.tokens;
  recordPremiumChange(player, order.tokens, `Zakup: ${order.tokens} żetonów`, now);
  order.state = "paid"; order.paidAt = now; order.eventId = event.id;
  return true;
}
