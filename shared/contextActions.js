import { getRestaurantQuote } from "./restaurant.js";
import { RESTAURANT_ITEMS } from "./playerActions.js";
import { DRUGS } from "./socialGameplay.js";
import { normalizeContacts, getContactQuote, contactMilestones } from "./contacts.js";
import { DISTRICTS } from "./districts.js";

export function getContextActions(game, { now = Date.now(), criticalCare = false } = {}) {
  const p = game.player || {};
  if (Number(p.jailUntil || 0) > now) return [{ id: "prison", title: "Sprawdź wyjście z aresztu", hint: "Pozostałe ruchy poczekają, postęp zostaje.", tab: "heists", section: "prison" }];
  const result = [];
  if (criticalCare || p.hp < p.maxHp * 0.7) result.push({ id: "hospital", title: "Wróć do zdrowia", hint: `${p.hp}/${p.maxHp} HP · sprawdź leczenie przed kolejną akcją.`, quick: "hospital" });
  if (!criticalCare && p.energy < p.maxEnergy * 0.6) {
    const meal = RESTAURANT_ITEMS.find((entry) => !getRestaurantQuote(p, entry, now).error);
    if (meal) result.push({ id: "food", title: "Odzyskaj energię", hint: `${p.energy}/${p.maxEnergy} EN · dostępny posiłek.`, quick: "restaurant" });
  }
  const income = Math.floor(Number(game.collections?.businessCash || 0));
  const contacts = normalizeContacts(game.contacts, now);
  if (!criticalCare && contacts.classId) {
    const readyReward = (contacts.weekCount >= 9 && !contacts.weekClaimed) || contactMilestones(game, now).some((m) => m.ready && !m.claimed && p.cash >= m.cost);
    const available = DISTRICTS.filter((d) => contacts.learned.some((method) => getContactQuote(game, d.id, method, "quiet", now)?.reasons.length === 0));
    if (readyReward || available.length) result.push({ id: "contacts", title: readyReward ? "Odbierz żetony za postęp" : `Kontakty czekają · ${available.length} dzielnice`, hint: readyReward ? "Nagroda za wypracowany cel czeka na wizytówce." : "Porównaj warunki miasta i wybierz spokojną albo pilną umowę.", tab: "city", section: "contacts" });
  }
  if (!criticalCare && income > 0) result.push({ id: "collect", title: "Odbierz dochód", amount: income, hint: "Gotówka z biznesów czeka w skrytce.", action: "collectBusinessIncome" });
  if (p.cash >= 3000) result.push({ id: "bank", title: "Zabezpiecz gotówkę", amount: Math.floor(p.cash), hint: "Przygotuj wpłatę do banku. Kwotę potwierdzisz sam.", action: "prepareBank" });
  const needsSupplies = DRUGS.some((drug) => game.factoriesOwned?.[drug.factoryId] && Object.entries(drug.supplies || {}).some(([id, qty]) => Number(game.supplies?.[id] || 0) < qty));
  if (!criticalCare && needsSupplies) result.push({ id: "supply", title: "Uzupełnij surowce", hint: "Własna fabryka nie ma składników do części receptur.", tab: "empire", section: "suppliers" });
  if (!criticalCare && p.energy >= 1 && p.hp >= p.maxHp * 0.4) result.push({ id: "heist", title: "Wybierz kolejny skok", hint: "Masz energię. Sprawdź ryzyko i stawkę przed akcją.", tab: "heists", section: "solo" });
  return result.slice(0, 3);
}
