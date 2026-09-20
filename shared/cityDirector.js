import { applyDistrictActivity } from "./districts.js";
import { applyXpProgression } from "./progression.js";

export const CITY_EVENT_WINDOW_MS = 12 * 60 * 60 * 1000;
export const CITY_DIRECTOR_EPOCH = Date.UTC(2026, 0, 1);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };
const MARKET_LABELS = { smoke: "Fajki", spirytus: "Spirytus", weed: "Marihuana", speed: "Speed" };
const DRUG_LABELS = { smokes: "Papierosy", spirit: "Alkohol", gbl: "GBL", weed: "Marihuana", shrooms: "Grzyby", amphetamine: "Amfetamina", cocaine: "Kokaina", ecstasy: "Ecstasy" };

export const CITY_EVENT_ARCHETYPES = [
  {
    id: "neon-festival", districtId: "neon", title: "Neon nie śpi", tone: "opportunity",
    summary: "Tłum zalewa kluby. Towar schodzi szybciej, lokale zarabiają więcej, a służby liczą każdy samochód.",
    systems: ["Rynek", "Diler", "Kluby", "Kontakty", "Produkcja", "Operacje"],
    marketProducts: ["smoke", "spirytus", "weed"], dealerDrugs: ["gbl", "weed", "shrooms"],
    effects: { marketBuy: 1.15, marketSell: 1.12, dealerBuy: 1.08, dealerSell: 1.16, clubTraffic: 1.28, clubPayout: 1.18, clubPressure: 1.22, contactReward: 1.16, contactHeat: 3, contactChance: 0, factoryBatch: 1, factoryBust: 0.02, operationPrep: 1, operationReward: 1.12, operationSuccess: 0.02, operationHeat: 3 },
  },
  {
    id: "harbor-blockade", districtId: "harbor", title: "Port stoi", tone: "risk",
    summary: "Kontrole zatrzymały transport. Legalna podaż drożeje, własna produkcja ma okno zysku, lecz każdy kurs zostawia ślad.",
    systems: ["Rynek", "Diler", "Produkcja", "Kontakty", "Operacje", "Gangi"],
    marketProducts: ["spirytus", "smoke", "speed"], dealerDrugs: ["amphetamine", "cocaine", "ecstasy"],
    effects: { marketBuy: 1.28, marketSell: 1.2, dealerBuy: 1.15, dealerSell: 1.22, clubTraffic: 0.82, clubPayout: 1.05, clubPressure: 0.95, contactReward: 1.22, contactHeat: 4, contactChance: -0.05, factoryBatch: 2, factoryBust: 0.06, operationPrep: 1.15, operationReward: 1.22, operationSuccess: -0.05, operationHeat: 5 },
  },
  {
    id: "oldtown-sweep", districtId: "oldtown", title: "Obława na fronty", tone: "danger",
    summary: "Kontrole ksiąg i lokali ściskają Old Town. Ciche kontakty zyskują znaczenie, a głośna operacja płaci tylko za realne ryzyko.",
    systems: ["Rynek", "Diler", "Kluby", "Kontakty", "Produkcja", "Operacje"],
    marketProducts: ["smoke", "spirytus"], dealerDrugs: ["smokes", "spirit", "gbl"],
    effects: { marketBuy: 0.94, marketSell: 0.88, dealerBuy: 1.12, dealerSell: 0.82, clubTraffic: 0.7, clubPayout: 0.9, clubPressure: 1.3, contactReward: 1.08, contactHeat: -2, contactChance: 0, factoryBatch: 1, factoryBust: 0.07, operationPrep: 1.2, operationReward: 1.25, operationSuccess: -0.08, operationHeat: 6 },
  },
  {
    id: "oldtown-auction", districtId: "oldtown", title: "Licytacja po zamknięciu", tone: "opportunity",
    summary: "Upadły dom aukcyjny wyprzedaje depozyty. Dokumenty otwierają ciche wejścia, ale szybki obrót przyciąga łowców okazji.",
    systems: ["Rynek", "Kontakty", "Biznesy", "Operacje"],
    marketProducts: ["smoke", "spirytus", "weed"], dealerDrugs: ["smokes", "spirit", "weed"],
    effects: { marketBuy: 0.9, marketSell: 1.08, dealerBuy: 0.94, dealerSell: 1.06, clubTraffic: 0.92, clubPayout: 1, clubPressure: 0.96, contactReward: 1.12, contactHeat: -1, contactChance: 0.04, factoryBatch: 1, factoryBust: 0.01, operationPrep: 0.9, operationReward: 1.08, operationSuccess: 0.05, operationHeat: 1 },
  },
  {
    id: "neon-blackout", districtId: "neon", title: "Blackout na Stripie", tone: "risk",
    summary: "Kamery gasną, lecz awaryjne patrole zamykają przecznice. Ciche wejście ma okno, głośny ruch może utknąć bez odwrotu.",
    systems: ["Kluby", "Kontakty", "Produkcja", "Operacje", "Gangi"],
    marketProducts: ["speed", "weed", "spirytus"], dealerDrugs: ["gbl", "ecstasy", "amphetamine"],
    effects: { marketBuy: 1.08, marketSell: 1.15, dealerBuy: 1.04, dealerSell: 1.18, clubTraffic: 0.78, clubPayout: 1.2, clubPressure: 1.18, contactReward: 1.2, contactHeat: 5, contactChance: -0.04, factoryBatch: 1, factoryBust: 0.04, operationPrep: 1.08, operationReward: 1.18, operationSuccess: 0.03, operationHeat: 5 },
  },
  {
    id: "harbor-payday", districtId: "harbor", title: "Portowa wypłata", tone: "opportunity",
    summary: "Zmiany schodzą z gotówką, rampy pracują pełną parą, a każda ekipa próbuje wykorzystać ten sam krótki moment.",
    systems: ["Rynek", "Diler", "Produkcja", "Kontakty", "Operacje", "Gangi"],
    marketProducts: ["spirytus", "smoke", "speed"], dealerDrugs: ["cocaine", "amphetamine", "spirit"],
    effects: { marketBuy: 1.12, marketSell: 1.17, dealerBuy: 1.08, dealerSell: 1.2, clubTraffic: 1.04, clubPayout: 1.08, clubPressure: 1.02, contactReward: 1.18, contactHeat: 3, contactChance: 0.02, factoryBatch: 2, factoryBust: 0.035, operationPrep: 1.05, operationReward: 1.2, operationSuccess: -0.02, operationHeat: 4 },
  },
];

function variantIndex(slot, length, salt = 0) {
  const size = Math.max(1, length);
  return ((slot * 17 + salt * 13) % size + size) % size;
}

export function getCityEventAt(now = Date.now()) {
  const slot = Math.floor((now - CITY_DIRECTOR_EPOCH) / CITY_EVENT_WINDOW_MS);
  const districtOrder = ["neon", "harbor", "oldtown"];
  const districtId = districtOrder[((slot % districtOrder.length) + districtOrder.length) % districtOrder.length];
  const pool = CITY_EVENT_ARCHETYPES.filter((entry) => entry.districtId === districtId);
  const cycle = Math.floor(slot / districtOrder.length);
  const template = pool[((cycle % pool.length) + pool.length) % pool.length];
  const startsAt = CITY_DIRECTOR_EPOCH + slot * CITY_EVENT_WINDOW_MS;
  const productId = template.marketProducts[variantIndex(cycle, template.marketProducts.length, 1)];
  const drugId = template.dealerDrugs[variantIndex(cycle, template.dealerDrugs.length, 2)];
  return {
    key: `${slot}:${template.id}:${productId}:${drugId}`,
    slot, id: template.id, districtId: template.districtId, title: template.title, tone: template.tone,
    summary: template.summary, systems: [...template.systems], productId, drugId,
    startsAt, endsAt: startsAt + CITY_EVENT_WINDOW_MS, effects: { ...template.effects },
  };
}

export function getCityEventImpactLines(event) {
  if (!event?.effects) return [];
  const product = MARKET_LABELS[event.productId] || event.productId;
  const drug = DRUG_LABELS[event.drugId] || event.drugId;
  const percent = (value) => `${value >= 1 ? "+" : ""}${Math.round((value - 1) * 100)}%`;
  return [
    `${product}: zakup ${percent(event.effects.marketBuy)}, sprzedaż ${percent(event.effects.marketSell)}.`,
    `${drug} u dilera: zakup ${percent(event.effects.dealerBuy)}, skup ${percent(event.effects.dealerSell)}.`,
    `${event.districtId === "neon" ? "Kluby" : "Zaplecze"}: ruch ${percent(event.effects.clubTraffic)}, wypłata ${percent(event.effects.clubPayout)}.`,
    `Kontakty i operacje w dzielnicy: nagrody ${percent(event.effects.contactReward)} / ${percent(event.effects.operationReward)}; zmieniają się też ryzyko i Heat.`,
  ];
}

export function createCityDirectorState(now = Date.now()) {
  const event = getCityEventAt(now);
  return { version: 1, currentKey: event.key, transitionedAt: now, history: [{ key: event.key, startedAt: event.startsAt }] };
}

export function advanceCityDirectorState(value, now = Date.now()) {
  const event = getCityEventAt(now);
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : createCityDirectorState(now);
  if (safe.currentKey === event.key) return { state: safe, event, changed: false };
  return { state: { version: 1, currentKey: event.key, transitionedAt: now, history: [{ key: event.key, startedAt: event.startsAt }, ...(Array.isArray(safe.history) ? safe.history : [])].slice(0, 12) }, event, changed: true };
}

export function getCityEventEffects(event, districtId, classId = null, mode = null) {
  if (!event || event.districtId !== districtId) return null;
  const effects = { ...event.effects };
  if (event.id === "neon-festival" && classId === "host") { effects.contactHeat = 1; effects.clubPressure = 1.08; }
  if (event.id === "harbor-blockade" && classId === "dealer") { effects.contactChance = -0.01; effects.factoryBust = 0.025; }
  if (event.id === "harbor-blockade" && classId === "enforcer") { effects.operationSuccess = 0; effects.operationHeat = 7; }
  if (event.id === "oldtown-sweep" && classId === "broker") { effects.operationPrep = 1.05; effects.contactHeat = -4; }
  if (event.id === "oldtown-sweep" && mode === "rush") { effects.contactReward = 1.18; effects.contactHeat += 8; effects.contactChance = -0.08; }
  if (event.id === "oldtown-auction" && classId === "hustler") { effects.contactReward = 1.2; effects.contactChance = 0.08; }
  if (event.id === "oldtown-auction" && classId === "broker") { effects.operationPrep = 0.78; effects.operationHeat = -1; }
  if (event.id === "neon-blackout" && classId === "host") { effects.clubTraffic = 0.96; effects.contactHeat = 1; }
  if (event.id === "neon-blackout" && classId === "dealer") { effects.factoryBust = 0.015; effects.contactChance = 0.03; }
  if (event.id === "harbor-payday" && classId === "enforcer") { effects.operationSuccess = 0.04; effects.operationHeat = 6; }
  if (event.id === "harbor-payday" && classId === "hustler") { effects.contactReward = 1.28; effects.contactHeat = 5; }
  return effects;
}

export function applyCityEventMarketQuote(quote, event, side, productId) {
  if (!quote || quote.error || event?.productId !== productId) return { ...quote, cityEventMultiplier: 1 };
  const multiplier = side === "sell" ? event.effects.marketSell : event.effects.marketBuy;
  if (side === "sell") return { ...quote, payoutPerUnit: Math.max(1, Math.floor(Number(quote.payoutPerUnit || 0) * multiplier)), total: Math.max(0, Math.floor(Number(quote.total || 0) * multiplier)), cityEventMultiplier: multiplier };
  return { ...quote, total: Math.max(1, Math.ceil(Number(quote.total || 0) * multiplier)), cityEventMultiplier: multiplier };
}

export function applyCityEventToMarketView(view, event) {
  if (!view?.products || !event?.productId || !view.products[event.productId]) return view;
  const next = {
    ...view,
    prices: { ...(view.prices || {}) },
    products: {
      ...view.products,
      [event.productId]: { ...view.products[event.productId] },
    },
  };
  const product = next.products[event.productId];
  product.streetPrice = Math.max(1, Math.ceil(product.streetPrice * event.effects.marketBuy));
  product.fallbackPrice = Math.max(product.streetPrice + 1, Math.ceil(product.fallbackPrice * event.effects.marketBuy));
  product.sellPrice = Math.max(1, Math.floor(product.sellPrice * event.effects.marketSell));
  product.cityEvent = { key: event.key, title: event.title };
  next.prices[event.productId] = product.streetPrice;
  return next;
}

export function getDealerCityEventPricing(event, drugId) {
  return event?.drugId === drugId ? { buyMultiplier: event.effects.dealerBuy, sellMultiplier: event.effects.dealerSell, eventKey: event.key } : { buyMultiplier: 1, sellMultiplier: 1, eventKey: null };
}

export function normalizePlayerDirector(value = {}, now = Date.now()) {
  const claims = Array.isArray(value?.claims) ? value.claims.filter((entry) => typeof entry?.key === "string" && Number(entry?.at) > now - 30 * 86400000).slice(0, 60) : [];
  return { claims };
}

export function getCityEventResponse(player, now = Date.now()) {
  const event = getCityEventAt(now), state = normalizePlayerDirector(player?.cityDirector, now);
  const classId = player?.contacts?.classId || null, mastered = Number(player?.contacts?.methods?.[classId] || 0) >= 6;
  const choices = [
    { id: "adapt", label: "Zmień trasę", text: "2 EN. Bezpieczna reakcja dostępna każdemu.", energy: 2, xp: 6, pressure: -1 },
    { id: "broker", classId: "broker", label: "Postaw legalną osłonę", text: "Gotówka uspokaja kontrolę i chroni zaplecze.", cash: mastered ? 350 : 500, xp: 8, pressure: -4 },
    { id: "dealer", classId: "dealer", label: "Wypuść zapas przez boczny kanał", text: "Towar zamiast gotówki; specjalizacja zmniejsza wkład.", goods: "smoke", quantity: mastered ? 3 : 5, xp: 8, pressure: -3 },
    { id: "hustler", classId: "hustler", label: "Rozlicz pośredników barterem", text: "Spirytus kupuje elastyczność bez premii do siły.", goods: "spirytus", quantity: mastered ? 2 : 4, xp: 8, pressure: -3 },
    { id: "host", classId: "host", label: "Przenieś ruch na zamkniętą listę", text: "Koszt energii i gotówki ogranicza chaos wydarzenia.", cash: mastered ? 150 : 250, energy: 1, xp: 8, pressure: -4 },
    { id: "enforcer", classId: "enforcer", label: "Zabezpiecz teren osobiście", text: "Zdrowie zastępuje wydatek; negocjacje specjalisty usuwają obrażenia.", energy: 1, damage: mastered ? 0 : 6, xp: 8, pressure: -2 },
  ].map((choice) => {
    const reasons = [];
    if (choice.classId && choice.classId !== classId) reasons.push("Wymaga tej aktualnej klasy");
    if (Number(player?.profile?.cash || 0) < Number(choice.cash || 0)) reasons.push(`Potrzebujesz $${choice.cash}`);
    if (Number(player?.profile?.energy || 0) < Number(choice.energy || 0)) reasons.push(`Potrzebujesz ${choice.energy} EN`);
    if (Number(player?.profile?.hp || 0) <= Number(choice.damage || 0)) reasons.push("Za mało zdrowia");
    if (choice.quantity && Number(player?.inventory?.[choice.goods] || 0) < choice.quantity) reasons.push(`Potrzebujesz ${choice.quantity} × ${choice.goods === "smoke" ? "Fajki" : "Spirytus"}`);
    return { ...choice, reasons };
  });
  return { event, responded: state.claims.some((entry) => entry.key === event.key), choices };
}

export function respondToCityEvent(player, choiceId, now = Date.now()) {
  const response = getCityEventResponse(player, now);
  if (response.responded) fail("Na to wydarzenie już zareagowałeś.");
  const choice = response.choices.find((entry) => entry.id === choiceId);
  if (!choice) fail("Nieznany sposób reakcji.");
  if (choice.reasons.length) fail(choice.reasons.join(". "));
  const profile = player.profile;
  profile.cash = Math.max(0, Number(profile.cash || 0) - Number(choice.cash || 0));
  profile.energy = Math.max(0, Number(profile.energy || 0) - Number(choice.energy || 0));
  profile.hp = Math.max(0, Number(profile.hp || 0) - Number(choice.damage || 0));
  if (choice.quantity) player.inventory[choice.goods] -= choice.quantity;
  const progression = applyXpProgression(profile, choice.xp);
  profile.respect = progression.respect; profile.level = progression.respect; profile.xp = progression.xp;
  player.city = applyDistrictActivity(player.city, { districtId: response.event.districtId, influenceDelta: 1, pressureDelta: choice.pressure, threatDelta: -1, actionFamily: `director:${response.event.key}`, eventText: `${response.event.title}: ${choice.label}`, now }).city;
  const state = normalizePlayerDirector(player.cityDirector, now);
  state.claims.unshift({ key: response.event.key, choiceId: choice.id, at: now });
  player.cityDirector = state;
  return { message: `${choice.label}: +${choice.xp} XP. Miasto zapamiętało reakcję.`, eventKey: response.event.key, districtId: response.event.districtId, responded: true };
}

export function getCityEventRemaining(event, now = Date.now()) {
  return clamp(Number(event?.endsAt || 0) - now, 0, CITY_EVENT_WINDOW_MS);
}
