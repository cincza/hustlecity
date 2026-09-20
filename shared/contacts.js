import { DISTRICTS, applyDistrictActivity, syncCityState, getDistrictPressureState } from "./districts.js";
import { getOperationCondition } from "./operations.js";
import { applyXpProgression } from "./progression.js";
import { recordPremiumChange } from "./premium.js";
import { applyCityConsequenceToQuote, consumeCityConsequence, getCitySituation, normalizeCityStories, recordContactTrust, resolveCitySituation } from "./cityStories.js";
import { getCityEventAt, getCityEventEffects } from "./cityDirector.js";

export const CONTACT_CLASSES = [
  { id: "broker", name: "Biznesmen", contact: "Mecenas Radecki", icon: "briefcase-variant-outline", accent: "#d7ae5d", fantasy: "Brudne pieniądze w czystych dokumentach.", hook: "Kupujesz ciszę, uruchamiasz fronty i wygrywasz układy kapitałem.", strengths: ["niski Heat", "bank i biznes", "legalne wyjścia"], voice: "Na ulicy każdy dług ma papier. Ja tylko pilnuję podpisów.", text: "Finansujesz dyskretne umowy. Mniejszy zarobek, mniej Heat; własny biznes otwiera większe zlecenia.", energy: 1, cost: 300, reward: 430, heat: -4 },
  { id: "dealer", name: "Diler", contact: "Nadia „Łącznik” Wrona", icon: "package-variant-closed", accent: "#75b98c", fantasy: "Towar rusza, zanim miasto zdąży zapytać skąd.", hook: "Łączysz rynek z własną produkcją i budujesz przewagę na dostawach.", strengths: ["własny towar", "hurtowe układy", "kontrola dostaw"], voice: "Nie pytaj, kto czeka. Pytaj, ile dowieziesz przed świtem.", text: "Dostarczasz towar z rynku. Własna produkcja otwiera hurtowe kontakty.", energy: 2, cost: 0, goods: "smoke", quantity: 8, reward: 420, heat: 4 },
  { id: "hustler", name: "Hustler", contact: "Milo „Most” Baran", icon: "swap-horizontal-bold", accent: "#d98a57", fantasy: "Każda różnica ceny to otwarte drzwi.", hook: "Czytasz rynek, przerzucasz zasoby i zawsze masz drugą drogę zapłaty.", strengths: ["barter", "rynek", "elastyczne koszty"], voice: "Nie sprzedaję rzeczy. Sprzedaję właściwy moment.", text: "Przerzucasz spirytus między dzielnicami. Zarobek zależy także od ceny zakupu na rynku.", energy: 2, cost: 0, goods: "spirytus", quantity: 5, reward: 450, heat: 2 },
  { id: "host", name: "Król nocy", contact: "Lena „Velvet” Kraj", icon: "glass-cocktail", accent: "#bd78d6", fantasy: "Najważniejsze umowy zapadają po zamknięciu drzwi.", hook: "Budujesz wpływy przez klub, listy gości i spotkania bez utraty twarzy.", strengths: ["klub", "relacje", "gaszenie Heat"], voice: "Gość bez nazwiska potrafi zapłacić najwięcej. Jeśli wejdzie.", text: "Finansujesz spotkania i gasisz konflikty. Własny lokal daje dostęp do zamkniętych imprez.", energy: 2, cost: 150, reward: 350, heat: -2 },
  { id: "enforcer", name: "Egzekutor", contact: "Bruno „Dług” Kosa", icon: "hand-back-right-outline", accent: "#cf665f", fantasy: "Kiedy kończą się słowa, zaczyna się twoja robota.", hook: "Zamieniasz zdrowie i rozgłos na bezpośredni nacisk oraz szybkie finały.", strengths: ["siłowe wyjścia", "duże ryzyko", "szybka presja"], voice: "Daj im wybór. Zapłacą teraz albo zapamiętają później.", text: "Odzyskujesz długi własnymi rękami. Większa wypłata kosztuje zdrowie, energię i rozgłos.", energy: 3, cost: 0, reward: 350, heat: 8, damage: 8 },
];
export const CONTACT_SLOT_MS = 6 * 60 * 60 * 1000;
export const CONTACT_SPECIALIZATIONS = {
  broker: "Finansowanie bankowe: koszt umowy pobierany z banku; $40 prowizji zamiast noszenia gotówki.",
  dealer: "Dyskretny transport: $60 za zabezpieczenie dostawy, Heat mniejszy o 3.",
  hustler: "Barter: zamiast spirytusu dostarczasz dwa razy więcej fajek z rynku. Porównaj ceny i zapasy.",
  host: "Lista gości: oddajesz $100 z wypłaty, ale oszczędzasz 1 EN; XP odpowiednio niższe.",
  enforcer: "Negocjacje: $120 kosztów, brak obrażeń, o 1 EN i 4 Heat mniej; XP odpowiednio niższe.",
};
export const CONTACT_COSMETICS = [
  { id: "silver", name: "Srebrna wizytówka", cost: 2, color: "#cbd5e1" },
  { id: "neon", name: "Neonowa wizytówka", cost: 4, color: "#c084fc" },
  { id: "gold", name: "Złota wizytówka", cost: 6, color: "#f4c96a" },
];
const WEEK = 7 * 86400000;
export const contactWeek = (now) => Math.floor((now - 4 * 86400000) / WEEK);
const fail = (message) => { const error = new Error(message); error.statusCode = 400; throw error; };
export function normalizeContacts(value = {}, now = Date.now()) {
  value = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const week = contactWeek(now);
  return {
    classId: CONTACT_CLASSES.some((c) => c.id === value.classId) ? value.classId : null,
    learned: (value.learned || []).filter((id) => CONTACT_CLASSES.some((c) => c.id === id)),
    completed: Math.max(0, Number(value.completed) || 0),
    districts: { ...(value.districts || {}) }, methods: { ...(value.methods || {}) },
    slot: Number(value.slot ?? -1), used: [...(value.used || [])],
    week, weekCount: value.week === week ? Number(value.weekCount || 0) : 0,
    weekClaimed: value.week === week && Boolean(value.weekClaimed),
    milestones: [...(value.milestones || [])], cosmetics: [...(value.cosmetics || [])],
    cosmetic: value.cosmetic || null, history: (value.history || []).slice(0, 12),
    walletHistory: (value.walletHistory || []).slice(0, 40),
    stories: normalizeCityStories(value.stories, now),
  };
}
export function contactMilestones(player, now = Date.now()) {
  const s = normalizeContacts(player.contacts, now);
  const business = (player.businessesOwned || []).filter((b) => b.count > 0).length;
  const factories = Object.values(player.factoriesOwned || {}).filter(Boolean).length;
  const districts = DISTRICTS.filter((d) => s.districts[d.id] >= 3).length;
  const wins = Number(player.stats?.operationsCompleted || 0);
  return [
    { id: "first-network", title: "Pierwszy krąg", text: "Wykonaj po 3 zlecenia w każdej dzielnicy.", ready: districts === 3, progress: `${districts}/3 dzielnice`, cost: 0, tokens: 3 },
    { id: "district-patron", title: "Patron dzielnicy", text: "24 zlecenia, 2 różne biznesy i 1 operacja. Ufunduj sieć lokali za $100 000.", ready: s.completed >= 24 && business >= 2 && wins >= 1, progress: `${s.completed}/24 zlecenia · ${business}/2 biznesy · ${wins}/1 operacja`, cost: 100000, tokens: 4 },
    { id: "city-patron", title: "Mecenas miasta", text: "60 zleceń, kontakty w 3 dzielnicach, fabryka i 3 operacje. Fundusz $1 000 000.", ready: s.completed >= 60 && districts === 3 && factories >= 1 && wins >= 3, progress: `${s.completed}/60 zleceń · ${factories}/1 fabryka · ${wins}/3 operacje`, cost: 1000000, tokens: 6 },
    { id: "city-legend", title: "Legenda miasta", text: "150 zleceń, wszystkie 5 profesji, 5 biznesów, 3 fabryki i 10 operacji. Fundusz $10 000 000. Tytuł bez premii bojowych.", ready: s.completed >= 150 && s.learned.length === 5 && business >= 5 && factories >= 3 && wins >= 10, progress: `${s.completed}/150 zleceń · ${s.learned.length}/5 profesji · ${business}/5 biznesów · ${factories}/3 fabryki · ${wins}/10 operacji`, cost: 10000000, tokens: 10 },
  ].map((m) => ({ ...m, claimed: s.milestones.includes(m.id) }));
}
export function getContactQuote(player, districtId, methodId, mode = "quiet", now = Date.now(), source = "market", approach = "standard") {
  const s = normalizeContacts(player.contacts, now), p = player.profile || player.player || {};
  const method = CONTACT_CLASSES.find((c) => c.id === methodId);
  const district = DISTRICTS.find((d) => d.id === districtId);
  if (!method || !district || !["quiet", "rush"].includes(mode)) return null;
  if (!["market", "production"].includes(source) || (source === "production" && methodId !== "dealer")) return null;
  if (!["standard", "specialist", "favor"].includes(approach)) return null;
  const condition = getOperationCondition(districtId, now);
  const pressure = getDistrictPressureState(syncCityState(player.city, now).districts[districtId].pressure);
  const tier = s.completed >= 24 && Number(p.respect) >= 15 ? 3 : s.completed >= 9 && Number(p.respect) >= 5 ? 2 : 1;
  const asset = methodId === "broker" ? (player.businessesOwned || []).some((b) => b.count > 0)
    : methodId === "dealer" ? Object.values(player.factoriesOwned || {}).some(Boolean)
      : methodId === "host" ? Boolean(player.club?.owned) : methodId === "enforcer" ? Number(player.stats?.operationsCompleted || 0) > 0 : Number(player.stats?.marketGoodsSold || 0) >= 25;
  const scale = asset ? tier : 1;
  const rush = mode === "rush";
  let chance = rush ? Math.max(0.35, Math.min(0.93, 0.94 + Number(district.rushChanceDelta || 0) - Number(p.heat || 0) * 0.004 - pressure.successPenalty - (condition.id === "patrol" ? 0.12 : 0))) : 1;
  let goods = source === "production" ? "smokes" : method.goods;
  const inventory = source === "production" ? player.producedDrugInventory : player.inventory;
  let cost = method.cost * scale, quantity = (source === "production" ? 3 : (method.quantity || 0)) * scale;
  const pressureOpportunity = rush ? Number(pressure.opportunityMultiplier || 1) : 1;
  let reward = Math.round(method.reward * scale * Number(district.contactRewardMultiplier || 1) * (condition.id === "payday" ? 1.15 : 1) * (rush ? 1.5 : 1) * pressureOpportunity);
  let heat = method.heat + Number(district.contactHeatDelta || 0) + Number(pressure.contactHeatDelta || 0) + (rush ? 10 : 0) + (condition.id === "patrol" && method.heat > 0 ? 3 : 0);
  let energy = method.energy, damage = method.damage || 0, bankCost = 0;
  if (approach === "specialist") {
    if (methodId === "broker") { bankCost = cost + 40; cost = 0; }
    if (methodId === "dealer") { cost += 60; heat -= 3; }
    if (methodId === "hustler") { goods = "smoke"; quantity *= 2; }
    if (methodId === "host") { reward -= 100; energy--; }
    if (methodId === "enforcer") { cost += 120; damage = 0; energy--; heat -= 4; }
  }
  if (approach === "favor") {
    cost = Math.ceil(cost * 0.5);
    quantity = quantity ? Math.max(1, Math.ceil(quantity * 0.6)) : 0;
    reward = Math.round(reward * 0.84);
    heat -= 3;
    chance = Math.min(0.98, chance + 0.03);
  }
  const cityEvent = getCityEventAt(now);
  const cityEventEffects = getCityEventEffects(cityEvent, districtId, s.classId, mode);
  if (cityEventEffects) {
    reward = Math.round(reward * cityEventEffects.contactReward);
    heat += cityEventEffects.contactHeat;
    if (rush) chance = Math.max(0.3, Math.min(0.95, chance + cityEventEffects.contactChance));
  }
  const applied = applyCityConsequenceToQuote(
    { districtId, mode, reward, heat, quantity, damage, cost, energy, chance },
    s.stories,
    now
  );
  ({ reward, heat, quantity, damage, cost, energy, chance } = applied.quote);
  const reasons = [];
  if (approach === "specialist" && Number(s.methods[methodId] || 0) < 6) reasons.push("Specjalizacja wymaga 6 udanych umów tą metodą");
  const favorTrust = Number(s.stories?.relations?.[districtId]?.trust || 0);
  if (approach === "favor" && favorTrust < 5) reasons.push("Przysługa wymaga 5 zaufania w tej dzielnicy");
  if (Number(p.bank || 0) < bankCost) reasons.push(`Potrzebujesz $${bankCost} w banku`);
  if (Number(p.jailUntil || 0) > now) reasons.push("Najpierw opuść więzienie");
  if (pressure.id === "lockdown" && !rush && method.heat > 0) reasons.push("Blokada dzielnicy: wybierz dyskretną metodę Biznesmena/Króla nocy albo ryzykowny transport pilny");
  if (!s.classId) reasons.push("Wybierz profesję");
  if (!s.learned.includes(methodId)) reasons.push("Poznaj tę profesję przez praktykę");
  if (s.slot === Math.floor(now / CONTACT_SLOT_MS) && s.used.includes(districtId)) reasons.push("Kontakt już obsłużony w tym oknie");
  if (Number(p.cash || 0) < cost) reasons.push(`Potrzebujesz $${cost}`);
  if (Number(p.energy || 0) < energy) reasons.push(`Potrzebujesz ${energy} energii`);
  if (Number(p.hp || 0) <= damage) reasons.push("Za mało zdrowia");
  if (quantity && Number(inventory?.[goods] || 0) < quantity) reasons.push(`Potrzebujesz ${quantity} × ${goods === "spirytus" ? "Spirytus" : "Fajki"} ${source === "production" ? "z własnej produkcji" : "z rynku"}`);
  return { districtId, methodId, mode, source, approach, bankCost, condition, pressure: pressure.label, pressureId: pressure.id, pressureOpportunity, districtFlavor: district.flavor, tier: scale, cost, quantity, goods, energy, damage, reward, xp: energy * 3 + (scale - 1) * 3, heat, chance, cityEvent: cityEventEffects ? { key: cityEvent.key, title: cityEvent.title } : null, consequence: applied.consequence, reasons };
}
// Called only inside the same transaction and player lock as the resource debit.
export function executeContactAction(player, action, body = {}, now = Date.now(), random = Math.random) {
  const s = normalizeContacts(player.contacts, now), p = player.profile;
  const previousTokens = Number(p.premiumTokens || 0);
  let message;
  if (action === "class") {
    const c = CONTACT_CLASSES.find((entry) => entry.id === body.classId);
    if (!c) fail("Nieznana profesja.");
    if (s.classId === c.id) fail("Masz już tę profesję.");
    if (s.classId) {
      if (!s.learned.includes(c.id)) fail("Najpierw poznaj tę profesję przez praktykę. Żetony nie zastępują rozwoju.");
      if (Number(p.premiumTokens || 0) < 3) fail("Zmiana kosztuje 3 żetony.");
      p.premiumTokens -= 3;
    } else s.learned = [c.id];
    s.classId = c.id;
    message = `Twoja profesja: ${c.name}. Kontakt: ${c.contact}.`;
  } else if (action === "learn") {
    if (!s.classId || !CONTACT_CLASSES.some((c) => c.id === body.classId) || s.learned.includes(body.classId)) fail("Nie możesz poznać tej profesji.");
    const needed = s.learned.length * 6;
    if (s.completed < needed) fail(`Potrzebujesz ${needed} ukończonych zleceń. Praktyka jest bezpłatna.`);
    s.learned.push(body.classId);
    message = "Nowy kontakt odblokowany. Możesz używać jego metody bez zmiany klasy.";
  } else if (action === "execute") {
    const q = getContactQuote(player, body.districtId, body.methodId, body.mode, now, body.source || "market", body.approach || "standard");
    if (!q) fail("Nieznane zlecenie.");
    if (Number(body.slot) !== Math.floor(now / CONTACT_SLOT_MS)) fail("Miasto zmieniło warunki. Odśwież zlecenia.");
    if (q.reasons.length) fail(q.reasons.join(". "));
    p.cash -= q.cost; p.energy -= q.energy; p.hp -= q.damage;
    if (q.bankCost) p.bank -= q.bankCost;
    if (q.quantity) (q.source === "production" ? player.producedDrugInventory : player.inventory)[q.goods] -= q.quantity;
    if (q.approach === "favor") recordContactTrust(s, q.districtId, -1, now);
    consumeCityConsequence(s, q.consequence?.id, now);
    const success = random() < q.chance;
    const gain = success ? q.reward : 0;
    p.cash += gain; p.heat = Math.max(0, Math.min(100, Number(p.heat || 0) + q.heat));
    const xp = applyXpProgression(p, success ? q.xp : 1);
    p.respect = xp.respect; p.level = xp.respect; p.xp = xp.xp;
    player.stats ||= {};
    player.stats.totalEarned = Number(player.stats.totalEarned || 0) + gain;
    if (s.slot !== Math.floor(now / CONTACT_SLOT_MS)) s.used = [];
    s.slot = Math.floor(now / CONTACT_SLOT_MS); s.used.push(q.districtId);
    if (success) {
      s.completed++; s.weekCount++;
      s.districts[q.districtId] = Number(s.districts[q.districtId] || 0) + 1;
      s.methods[q.methodId] = Number(s.methods[q.methodId] || 0) + 1;
      recordContactTrust(s, q.districtId, 1, now);
    }
    player.city = applyDistrictActivity(player.city, { districtId: q.districtId, influenceDelta: success ? 2 : 0, pressureDelta: q.heat / 2, threatDelta: success ? 0 : 2, actionFamily: "contacts", eventText: success ? "Kontakt dotrzymał umowy." : "Policja przejęła zlecenie.", now }).city;
    message = success ? `Zlecenie zamknięte: $${gain}, +${q.xp} XP.` : "Przechwycono zlecenie. Koszty i towar przepadają; kontakt wróci w następnym oknie.";
    s.history.unshift({ at: now, districtId: q.districtId, methodId: q.methodId, mode: q.mode, success, gain });
    s.history = s.history.slice(0, 12);
  } else if (action === "situation") {
    const situation = getCitySituation(player, body.districtId, now);
    if (!situation) fail("Nieznana sytuacja miejska.");
    player.contacts = s;
    const result = resolveCitySituation(player, body.districtId, body.choiceId, now);
    Object.assign(s, normalizeContacts(player.contacts, now));
    message = result.message;
    player.contacts = s;
    return result;
  } else if (action === "weekly") {
    if (s.weekCount < 9 || s.weekClaimed) fail("Wykonaj 9 udanych zleceń w tygodniu. Nagroda tylko raz.");
    s.weekClaimed = true; p.premiumTokens = Number(p.premiumTokens || 0) + 2;
    message = "Tydzień kontaktów: +2 żetony.";
  } else if (action === "milestone") {
    const m = contactMilestones(player, now).find((entry) => entry.id === body.id);
    if (!m || !m.ready || m.claimed) fail("Cel jeszcze nie jest gotowy albo został odebrany.");
    if (Number(p.cash || 0) < m.cost) fail(`Fundusz wymaga $${m.cost} w gotówce.`);
    p.cash -= m.cost; p.premiumTokens = Number(p.premiumTokens || 0) + m.tokens;
    s.milestones.push(m.id); message = `${m.title}: +${m.tokens} żetonów. Tytuł zapisany na wizytówce.`;
  } else if (action === "cosmetic") {
    const c = CONTACT_COSMETICS.find((entry) => entry.id === body.id);
    if (!c) fail("Nieznana wizytówka.");
    if (!s.cosmetics.includes(c.id)) {
      if (Number(p.premiumTokens || 0) < c.cost) fail(`Potrzebujesz ${c.cost} żetonów.`);
      p.premiumTokens -= c.cost; s.cosmetics.push(c.id);
    }
    s.cosmetic = c.id; message = `Wybrano: ${c.name}.`;
  } else fail("Nieznana akcja kontaktów.");
  player.contacts = s;
  const tokenDelta = Number(p.premiumTokens || 0) - previousTokens;
  if (tokenDelta) recordPremiumChange(player, tokenDelta, message, now);
  return { message };
}
