import { applyDistrictActivity, findDistrictById } from "./districts.js";
import { normalizeCityStories } from "./cityStories.js";
import { applyXpProgression } from "./progression.js";

const HOUR = 60 * 60 * 1000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };

export const RIVAL_ARCHETYPES = {
  oldtown: { id: "varga-ledger", name: "Ivo Varga", role: "księgowy starego układu", style: "ekonomiczny", sigil: "IV", quote: "Miasto nie pamięta gróźb. Pamięta podpisy.", warning: "Varga zbiera dokumenty i po kolei odcina ci legalne przykrywki.", final: "Ludzie Vargi przejmują twoje punkty rozliczeń. Następny podpis może już nie należeć do ciebie.", baseCost: 3200 },
  neon: { id: "mara-voss", name: "Mara Voss", role: "królowa zamkniętych klubów", style: "społeczny", sigil: "MV", quote: "Drzwi są otwarte dla wszystkich. Lista gości już nie.", warning: "Mara puszcza twoją twarz po ochronie klubów i zamyka nocne wejścia.", final: "Mara wystawia własną ekipę. W Neonie masz dziś jedną noc, żeby odzyskać twarz.", baseCost: 3800 },
  harbor: { id: "iron-dogs", name: "Żelazne Psy", role: "portowa ekipa przemytników", style: "brutalny", sigil: "ŻP", quote: "Na rampie nie ma neutralnych. Są nasi i ci, którzy jeszcze nie zrozumieli.", warning: "Psy liczą utracony ładunek i obstawiają wszystkie drogi wyjazdowe.", final: "Żelazne Psy blokują rampę. Silniki pracują, a cała ekipa czeka na twoją odpowiedź.", baseCost: 4600 },
};

const CLASS_NAMES = { broker: "Biznesmen", dealer: "Diler", hustler: "Hustler", host: "Król nocy", enforcer: "Egzekutor" };
const CLASS_ROUTES = {
  broker: { title: "Przenieś spór do legalnego frontu", summary: "Pieniądze z banku kupują dokumenty i kończą nacisk bez ulicznej wojny.", bankCost: 3000, result: "legal-settlement", heatDelta: -5, pressureDelta: -4 },
  dealer: { title: "Oddaj kontrolowaną partię", summary: "Własny towar z produkcji zamyka rachunek bez wypłaty gotówki.", producedGoods: "smokes", quantity: 5, result: "supply-settlement", heatDelta: -2, pressureDelta: -3 },
  hustler: { title: "Rozlicz konflikt barterem", summary: "Spirytus i sieć pośredników zmieniają wroga w klienta jednego układu.", goods: "spirytus", quantity: 6, result: "barter-settlement", heatDelta: -3, pressureDelta: -2 },
  host: { title: "Zorganizuj neutralne spotkanie", summary: "Płacisz za miejsce i energię, ale obie strony wychodzą bez utraty twarzy.", cashCost: 1200, energyCost: 1, result: "neutral-meeting", heatDelta: -5, pressureDelta: -3 },
  enforcer: { title: "Wyślij osobiste ostrzeżenie", summary: "Ryzykujesz zdrowiem i natychmiast przenosisz konflikt do finału na swoich warunkach.", hpCost: 10, escalates: true, prepared: true, heatDelta: 4, pressureDelta: 3 },
};

export function createRivalState() {
  return { active: null, history: [], seenTriggers: [] };
}

export function normalizeRivalState(value) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const active = safe.active && typeof safe.active === "object" && RIVAL_ARCHETYPES[safe.active.districtId]
    ? { ...safe.active, escalation: clamp(safe.active.escalation, 1, 3), ignored: Boolean(safe.active.ignored), prepared: Boolean(safe.active.prepared) }
    : null;
  return {
    active,
    history: Array.isArray(safe.history) ? safe.history.filter((entry) => entry?.id).slice(0, 10) : [],
    seenTriggers: Array.isArray(safe.seenTriggers) ? [...new Set(safe.seenTriggers.filter(Boolean))].slice(0, 40) : [],
  };
}

export function registerRivalTrigger(player, trigger, now = Date.now()) {
  player.rivals = normalizeRivalState(player.rivals);
  const sourceKey = String(trigger?.sourceKey || "");
  const districtId = findDistrictById(trigger?.districtId).id;
  if (!sourceKey || player.rivals.seenTriggers.includes(sourceKey)) return null;
  if (player.rivals.active) {
    player.rivals.seenTriggers.unshift(sourceKey);
    player.rivals.seenTriggers = player.rivals.seenTriggers.slice(0, 40);
    return null;
  }
  const rival = RIVAL_ARCHETYPES[districtId];
  if (!rival) return null;
  const active = {
    id: `rival-${rival.id}-${now}`,
    rivalId: rival.id,
    districtId,
    stage: "warning",
    escalation: 1,
    cause: { kind: String(trigger.kind || "conflict"), label: String(trigger.label || "Twój wcześniejszy ruch naruszył lokalny układ."), sourceKey, outcome: trigger.outcome || null },
    createdAt: now,
    updatedAt: now,
    responseDueAt: now + 12 * HOUR,
    classIdSnapshot: player?.contacts?.classId || null,
    gangSnapshot: player?.gang?.joined ? { name: player.gang.name || null, focusDistrictId: player.gang.focusDistrictId || null } : null,
    eventKeySnapshot: trigger.eventKey || null,
    ignored: false,
    prepared: false,
  };
  player.rivals.active = active;
  player.rivals.seenTriggers.unshift(sourceKey);
  return active;
}

export function maybeCreateRivalFromOperation(player, { active, operation, responseId, outcome, eventKey = null } = {}, now = Date.now()) {
  if (!active || !operation || outcome === "retreat") return null;
  const heat = Number(player?.profile?.heat || 0);
  const qualifies = outcome === "partial" || outcome === "failure" || ((responseId === "push" || responseId === "gang") && heat >= 45) || heat >= 70;
  if (!qualifies) return null;
  const label = outcome === "partial"
    ? `Częściowy wynik operacji „${operation.name}” zostawił ludzi i dowody w ${findDistrictById(active.districtId).name}.`
    : outcome === "failure"
      ? `Spalona operacja „${operation.name}” ujawniła twoją ekipę w ${findDistrictById(active.districtId).name}.`
      : `Agresywne domknięcie operacji „${operation.name}” naruszyło lokalny układ w ${findDistrictById(active.districtId).name}.`;
  return registerRivalTrigger(player, { sourceKey: `operation:${active.id}`, districtId: active.districtId, kind: "operation", label, outcome, eventKey }, now);
}

export function maybeCreateRivalFromContact(player, { districtId, sourceKey, choiceId, mode, success } = {}, now = Date.now()) {
  const heat = Number(player?.profile?.heat || 0);
  const aggressiveSituation = ["sell", "hype", "skim"].includes(choiceId);
  const rushedProblem = mode === "rush" && (!success || heat >= 55);
  if (!aggressiveSituation && !rushedProblem) return null;
  return registerRivalTrigger(player, {
    sourceKey: `contact:${sourceKey}`,
    districtId,
    kind: "contact",
    outcome: success ? "success" : "failure",
    label: aggressiveSituation ? `Wykorzystałeś lokalną okazję (${choiceId}) i zostawiłeś rachunek po drugiej stronie.` : `Pilna umowa kontaktu zwróciła uwagę lokalnej ekipy przy Heat ${heat}.`,
  }, now);
}

function effectiveActive(active, now) {
  if (!active) return null;
  if (active.stage === "warning" && Number(active.responseDueAt || 0) <= now) return { ...active, stage: "final", escalation: Math.min(3, Number(active.escalation || 1) + 1), ignored: true };
  return { ...active };
}

export function getRivalOperationModifier(player, districtId, now = Date.now()) {
  const active = effectiveActive(normalizeRivalState(player?.rivals).active, now);
  if (!active || active.districtId !== districtId) return { prepMultiplier: 1, successDelta: 0, heatDelta: 0, rivalId: null, summary: null };
  const final = active.stage === "final";
  return { prepMultiplier: final ? 1.18 : 1.1, successDelta: final ? -0.06 : -0.03, heatDelta: final ? 4 : 2, rivalId: active.rivalId, summary: final ? "Aktywny rywal blokuje zaplecze i podnosi ryzyko operacji." : "Rywal obserwuje dzielnicę i podnosi koszt przygotowań." };
}

function classOption(active, final = false) {
  const route = CLASS_ROUTES[active.classIdSnapshot];
  if (!route) return null;
  const resolvedRoute = final && active.classIdSnapshot === "enforcer" ? { ...route, escalates: false, showdown: true, hpCost: 8 } : route;
  return { id: "class", classId: active.classIdSnapshot, ...resolvedRoute, title: `${CLASS_NAMES[active.classIdSnapshot]}: ${route.title}` };
}

export function getRivalView(player, now = Date.now()) {
  const state = normalizeRivalState(player?.rivals);
  const active = effectiveActive(state.active, now);
  if (!active) return { active: null, history: state.history };
  const rival = RIVAL_ARCHETYPES[active.districtId];
  const trust = Number(player?.contacts?.stories?.relations?.[active.districtId]?.trust || 0);
  const final = active.stage === "final";
  const options = final ? [
    { id: "concede", title: "Oddaj część interesu", summary: "Płacisz za zamknięcie konfliktu i tracisz trochę lokalnego wpływu.", cashCost: rival.baseCost, result: "concession", heatDelta: -4, influenceDelta: -2, pressureDelta: -3 },
    { id: "contact", title: "Poproś kontakt o spotkanie", summary: "Silna relacja pozwala zakończyć spór bez kolejnej walki.", trustCost: 3, result: "mediated", heatDelta: -5, pressureDelta: -5 },
    ...(classOption(active, true) ? [classOption(active, true)] : []),
    { id: "counter", title: "Przeprowadź kontrakcję", summary: "Energia i zdrowie za próbę trwałego złamania nacisku. Wysoki Heat utrudnia wynik.", energyCost: 3, hpCost: 10, showdown: true },
    { id: "evidence", title: "Uderz dokumentami", summary: "Trzy ukończone kontrakty dają wiarygodną legendę. Płacisz z banku, ale zamykasz konflikt bez walki.", bankCost: 6000, requiresContracts: 3, result: "public-exposure", heatDelta: -3, pressureDelta: -6, influenceDelta: 2 },
    { id: "supply-sabotage", title: "Zatruj trasę rywala", summary: "Fabryka i własny towar przygotowują łatwiejszą kontrakcję. Ryzyko zostaje, ale nie płacisz zdrowiem na wejściu.", producedGoods: "smokes", quantity: 6, energyCost: 2, requiresFactory: true, showdown: true, chanceBonus: 0.12, heatDelta: 2 },
    ...(active.gangSnapshot?.name ? [{ id: "gang", title: "Uderz z gangiem", summary: "Ta sama ekipa zabezpiecza finał, ale operacja kosztuje i podnosi presję dzielnicy.", cashCost: rival.baseCost, energyCost: 1, gang: true, result: "gang-backed", heatDelta: 5, pressureDelta: 4, influenceDelta: 3 }] : []),
  ] : [
    { id: "cool-off", title: "Zniknij z radarów", summary: "Dostępne przy niskim Heat. Ograniczasz aktywność i konflikt wygasa.", energyCost: 1, maxHeat: 35, result: "cooled-off", heatDelta: -6, pressureDelta: -3 },
    { id: "tribute", title: "Zapłać za spokój", summary: "Kosztowne, ale natychmiast zamyka pierwszy sygnał bez eskalacji.", cashCost: Math.round(rival.baseCost * 0.7), result: "paid-off", heatDelta: -2, pressureDelta: -2 },
    { id: "contact", title: "Uruchom lokalny kontakt", summary: "Zużywasz zaufanie, aby wyjaśnić powód konfliktu i zamknąć go przy stole.", trustCost: 2, result: "mediated", heatDelta: -4, pressureDelta: -4 },
    { id: "undercut", title: "Przejmij jego klientów", summary: "Własny biznes i pieniądze z banku zamieniają presję rywala w legalną kontrofertę.", bankCost: Math.round(rival.baseCost * 1.1), requiresBusiness: true, result: "market-undercut", heatDelta: -2, pressureDelta: -2, influenceDelta: 1 },
    { id: "burn-route", title: "Spal obserwowaną trasę", summary: "Poświęcasz własny towar, żeby przygotować finał bez prowadzenia ludzi rywala do głównego zaplecza.", producedGoods: "smokes", quantity: 8, requiresFactory: true, escalates: true, prepared: true, heatDelta: 1, pressureDelta: -1 },
    classOption(active, false),
    { id: "confront", title: "Odpowiedz siłą", summary: "Przenosisz konflikt do finału. Zyskujesz inicjatywę kosztem Heat.", energyCost: 2, escalates: true, heatDelta: 4, pressureDelta: 3 },
    ...(active.gangSnapshot?.name && active.gangSnapshot.focusDistrictId === active.districtId ? [{ id: "gang", title: "Postaw gang na nogi", summary: "Ta sama ekipa przygotuje kontrakcję. Płacisz ludziom i podnosisz presję.", cashCost: Math.round(rival.baseCost * 0.65), gang: true, escalates: true, prepared: true, heatDelta: 3, pressureDelta: 3 }] : []),
  ].filter(Boolean);
  return {
    active: { ...active, rival, districtName: findDistrictById(active.districtId).name, stageLabel: final ? "Finał konfliktu" : "Ostrzeżenie", knownConsequence: final ? rival.final : rival.warning,
      options: options.map((option) => {
        const reasons = [];
        if (option.maxHeat !== undefined && Number(player?.profile?.heat || 0) > option.maxHeat) reasons.push(`Heat musi spaść do ${option.maxHeat}`);
        if (option.cashCost && Number(player?.profile?.cash || 0) < option.cashCost) reasons.push(`Potrzebujesz ${option.cashCost}$ gotówki`);
        if (option.bankCost && Number(player?.profile?.bank || 0) < option.bankCost) reasons.push(`Potrzebujesz ${option.bankCost}$ w banku`);
        if (option.energyCost && Number(player?.profile?.energy || 0) < option.energyCost) reasons.push(`Potrzebujesz ${option.energyCost} EN`);
        if (option.hpCost && Number(player?.profile?.hp || 0) <= option.hpCost) reasons.push(`Potrzebujesz ponad ${option.hpCost} HP`);
        if (option.trustCost && trust < option.trustCost) reasons.push(`Potrzebujesz ${option.trustCost} zaufania w dzielnicy`);
        if (option.goods && Number(player?.inventory?.[option.goods] || 0) < option.quantity) reasons.push(`Potrzebujesz ${option.quantity} × Spirytus`);
        if (option.producedGoods && Number(player?.producedDrugInventory?.[option.producedGoods] || 0) < option.quantity) reasons.push(`Potrzebujesz ${option.quantity} × wyprodukowany towar`);
        if (option.requiresBusiness && !(player?.businessesOwned || []).some((entry) => Number(entry?.count || 0) > 0)) reasons.push("Potrzebujesz własnego biznesu");
        if (option.requiresFactory && !Object.values(player?.factoriesOwned || {}).some(Boolean)) reasons.push("Potrzebujesz własnej fabryki");
        if (option.requiresContracts && Number(player?.stats?.contractsCompleted || 0) < option.requiresContracts) reasons.push(`Potrzebujesz ${option.requiresContracts} ukończonych kontraktów`);
        if (option.gang && (!player?.gang?.joined || player.gang.name !== active.gangSnapshot?.name)) reasons.push("Ta sama ekipa gangu musi nadal działać");
        return { ...option, reasons };
      }) },
    history: state.history,
  };
}

export function resolveRivalChoice(player, choiceId, now = Date.now(), random = Math.random) {
  player.rivals = normalizeRivalState(player.rivals);
  let active = effectiveActive(player.rivals.active, now);
  if (!active) fail("Nie masz aktywnego konfliktu.");
  player.rivals.active = active;
  const view = getRivalView(player, now).active;
  const choice = view.options.find((entry) => entry.id === choiceId);
  if (!choice) fail("Nie ma takiej odpowiedzi na konflikt.");
  if (choice.reasons.length) fail(choice.reasons.join(" · "));
  const profile = player.profile;
  profile.cash = Math.max(0, Number(profile.cash || 0) - Number(choice.cashCost || 0));
  profile.bank = Math.max(0, Number(profile.bank || 0) - Number(choice.bankCost || 0));
  profile.energy = Math.max(0, Number(profile.energy || 0) - Number(choice.energyCost || 0));
  profile.hp = Math.max(1, Number(profile.hp || 0) - Number(choice.hpCost || 0));
  profile.heat = clamp(Number(profile.heat || 0) + Number(choice.heatDelta || 0), 0, 100);
  if (choice.goods) player.inventory[choice.goods] -= choice.quantity;
  if (choice.producedGoods) player.producedDrugInventory[choice.producedGoods] -= choice.quantity;
  if (choice.trustCost) {
    player.contacts ||= {};
    const stories = normalizeCityStories(player.contacts.stories, now);
    stories.relations[active.districtId].trust = Math.max(0, stories.relations[active.districtId].trust - choice.trustCost);
    player.contacts.stories = stories;
  }
  player.city = applyDistrictActivity(player.city, { districtId: active.districtId, influenceDelta: choice.influenceDelta || 0, pressureDelta: choice.pressureDelta || 0, threatDelta: choice.escalates ? 2 : -2, actionFamily: `rival:${active.id}`, eventText: `${view.rival.name}: ${choice.title}.`, now }).city;
  if (choice.escalates) {
    player.rivals.active = { ...active, stage: "final", escalation: Math.min(3, active.escalation + 1), prepared: Boolean(active.prepared || choice.prepared), previousChoiceId: choice.id, updatedAt: now, responseDueAt: now + 12 * HOUR };
    return { resolved: false, escalated: true, conflict: getRivalView(player, now).active, message: `${view.rival.name} przyjmuje odpowiedź. Konflikt przechodzi do finału.` };
  }
  let result = choice.result || "resolved";
  let success = true;
  let xpGain = 0;
  if (choice.showdown) {
    const chance = clamp(0.66 + (active.prepared ? 0.12 : 0) + Number(choice.chanceBonus || 0) - Number(profile.heat || 0) * 0.0025, 0.38, 0.86);
    success = random() < chance;
    result = success ? "rival-broken" : "costly-survival";
    profile.heat = clamp(Number(profile.heat || 0) + (success ? 3 : 9), 0, 100);
    player.city = applyDistrictActivity(player.city, { districtId: active.districtId, influenceDelta: success ? 4 : -1, pressureDelta: success ? -4 : 7, threatDelta: success ? -3 : 4, actionFamily: `rival-final:${active.id}`, eventText: success ? `${view.rival.name} traci inicjatywę.` : `Kontrakcja przeciw ${view.rival.name} kończy się wysokim kosztem.`, now }).city;
    xpGain = success ? 14 : 5;
  } else if (active.stage === "final") xpGain = choice.gang ? 10 : choice.classId ? 8 : 5;
  if (xpGain) {
    const progression = applyXpProgression(profile, xpGain);
    profile.respect = progression.respect; profile.level = progression.respect; profile.xp = progression.xp;
  }
  player.stats ||= {};
  player.stats.rivalsResolved = Number(player.stats.rivalsResolved || 0) + 1;
  const history = { id: active.id, rivalId: active.rivalId, rivalName: view.rival.name, districtId: active.districtId, cause: active.cause, escalation: active.escalation, ignored: active.ignored, choiceId: choice.id, result, success, xpGain, resolvedAt: now };
  player.rivals.history = [history, ...(player.rivals.history || [])].slice(0, 10);
  player.rivals.active = null;
  return { resolved: true, success, result, xpGain, history, message: success ? `Konflikt z ${view.rival.name} został zamknięty: ${choice.title}.` : `Przetrwałeś finał z ${view.rival.name}, ale dzielnica zapamięta jego koszt.` };
}
