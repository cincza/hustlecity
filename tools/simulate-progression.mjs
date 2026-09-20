import { pathToFileURL } from "node:url";
import { HEIST_DEFINITIONS, MARKET_PRODUCTS } from "../shared/economy.js";
import { getSoloHeistOdds } from "../shared/heists.js";
import { applyXpProgression, getXpRequirementForRespect } from "../shared/progression.js";
import { CONTACT_CLASSES, CONTACT_SLOT_MS, executeContactAction, getContactQuote } from "../shared/contacts.js";
import { BUSINESSES, getBusinessIncomePerMinute, getBusinessPurchaseCost } from "../shared/empire.js";
import { syncPlayerHeat } from "../shared/resources.js";

// Sensitivity model, not a bot or an API load test. No real accounts/files are touched.
// Three short sessions/day, 35 energy/session (20 regenerated + 15 meals, $450),
// starter path already done ($6000 / 23 XP), health recovered between sessions.
// No bail/time delays, market shortage, advanced quests or factory/club earnings:
// heist cash is an optimistic bound, not a forecast for every playing style.
export function simulateProgression(classId = null, seed = 42, days = 7, legacy = false, investment = "bars") {
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const mean = (range) => (range[0] + range[1]) / 2;
  const p = { profile: { cash: 20500, bank: 0, energy: 20, hp: 100, maxHp: 100, heat: 6, respect: 1, xp: 23, attack: 13, defense: 8, dexterity: 7, stamina: 7 }, stats: {}, inventory: {}, businessesOwned: [] };
  const start = Date.UTC(2026, 8, 21), rows = [], unlocks = {};
  if (classId) executeContactAction(p, "class", { classId }, start);
  for (let session = 0; session < days * 3; session++) {
    const at = start + session * 8 * 3600000;
    if (!legacy) syncPlayerHeat(p, at);
    p.profile.cash += getBusinessIncomePerMinute(p) * (session ? 480 : 0);
    p.profile.cash -= 450; p.profile.energy = 35; p.profile.hp = 100;
    if (classId) for (const districtId of ["oldtown", "neon", "harbor"]) {
      const c = CONTACT_CLASSES.find((entry) => entry.id === classId);
      if (c.goods) {
        const count = Math.max(0, getContactQuote(p, districtId, classId, "quiet", at).quantity - Number(p.inventory[c.goods] || 0));
        p.profile.cash -= MARKET_PRODUCTS.find((entry) => entry.id === c.goods).basePrice * 1.16 * count;
        p.inventory[c.goods] = Number(p.inventory[c.goods] || 0) + count;
      }
      executeContactAction(p, "execute", { districtId, methodId: classId, mode: "quiet", slot: Math.floor(at / CONTACT_SLOT_MS) }, at, random);
    }
    while (p.profile.energy > 0) {
      const choices = HEIST_DEFINITIONS.filter((h) => h.respect <= p.profile.respect && h.energy <= p.profile.energy);
      choices.sort((a, b) => mean(b.xpGain) * getSoloHeistOdds(p.profile, b).chance / b.energy - mean(a.xpGain) * getSoloHeistOdds(p.profile, a).chance / a.energy);
      const h = choices[0]; if (!h) break;
      p.profile.energy -= h.energy;
      const success = random() < getSoloHeistOdds(p.profile, h).chance;
      p.profile.cash += success ? mean(h.reward) : -mean(h.failCashLoss);
      const next = applyXpProgression(p.profile, success ? h.xpGain[0] + Math.floor(random() * (h.xpGain[1] - h.xpGain[0] + 1)) : 0);
      p.profile.respect = next.respect; p.profile.xp = next.xp;
      p.profile.heat = Math.min(100, p.profile.heat + (success ? h.heatOnSuccess : h.heatOnFailure));
    }
    const price = (b) => legacy ? b.cost : getBusinessPurchaseCost(p, b);
    for (;;) {
      const eligible = BUSINESSES.filter((b) => (investment === "diverse" || b.id === "bar") && b.respect <= p.profile.respect && p.profile.cash >= price(b) + 5000);
      eligible.sort((a, b) => price(a) / a.incomePerMinute - price(b) / b.incomePerMinute);
      const business = eligible[0]; if (!business) break;
      p.profile.cash -= price(business);
      const owned = p.businessesOwned.find((b) => b.id === business.id);
      if (owned) owned.count++; else p.businessesOwned.push({ id: business.id, count: 1 });
    }
    for (const res of [3, 5, 8, 15, 25, 30, 44]) if (p.profile.respect >= res && !unlocks[res]) unlocks[res] = session + 1;
    rows.push({ session: session + 1, respect: p.profile.respect, cash: Math.round(p.profile.cash), bars: p.businessesOwned.find((b) => b.id === "bar")?.count || 0, businessTypes: p.businessesOwned.length, incomePerHour: Math.round(getBusinessIncomePerMinute(p) * 60), heat: p.profile.heat, contacts: p.contacts?.completed || 0 });
  }
  return { classId: classId || "baseline", firstSession: rows[0], firstDay: rows[2], last: rows.at(-1), unlocks };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const styles = [null, ...CONTACT_CLASSES.map((c) => c.id)];
  console.log("Baseline before balance:", JSON.stringify(simulateProgression(null, 42, 7, true)));
  console.log(JSON.stringify({ assumptions: "3 sessions/day; shared odds, costs, XP and contact rules; optimistic no jail delays; reinvestment in bars only; not full-game prediction", results: styles.map((style) => simulateProgression(style)), xpThresholds: [3, 5, 8, 15, 25, 30, 44].map((respect) => ({ respect, totalXp: Array.from({ length: respect - 1 }, (_, i) => getXpRequirementForRespect(i + 1)).reduce((a, b) => a + b, 0) })) }, null, 2));
}
