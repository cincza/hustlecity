import { applyDistrictActivity, findDistrictById, getDistrictSummaries } from "./districts.js";
import { getCityEventAt, getCityEventResponse, normalizePlayerDirector } from "./cityDirector.js";
import { CONTACT_CLASSES, getContactQuote, normalizeContacts } from "./contacts.js";
import { applyXpProgression } from "./progression.js";
import { getOperationById, isMajorOperation, normalizeOperationsState } from "./operations.js";
import { getRivalView, normalizeRivalState } from "./rivals.js";
import { getEmpireProjectsView, normalizeEmpireProjects } from "./empireProjects.js";

export const SESSION_PLAN_WINDOW_MS = 24 * 60 * 60 * 1000;
export const SESSION_PLAN_ACTIVE_MS = 12 * 60 * 60 * 1000;
const MIN_ACCEPT_WINDOW_MS = 15 * 60 * 1000;
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value) || 0));
const fail = (message, statusCode = 400) => { throw Object.assign(new Error(message), { statusCode }); };
const hasFactory = (player) => Object.values(player?.factoriesOwned || {}).some((count) => Number(count) > 0);
const hasBusiness = (player) => (player?.businessesOwned || []).some((entry) => Number(entry?.count || 0) > 0);

function planSlot(now) {
  return Math.floor(now / SESSION_PLAN_WINDOW_MS);
}

function getProfile(player) {
  return player?.profile || player?.player || {};
}

function getBaseline(player) {
  const stats = player?.stats || {};
  return {
    heistsDone: Number(stats.heistsDone || 0),
    heistsWon: Number(stats.heistsWon || 0),
    bankDepositedTotal: Number(stats.bankDepositedTotal || 0),
    businessCollections: Number(stats.businessCollections || 0),
    marketGoodsSold: Number(stats.marketGoodsSold || 0),
    drugBatches: Number(stats.drugBatches || 0),
    producedDrugSalesValue: Number(stats.producedDrugSalesValue || 0),
    clubStashMoves: Number(stats.clubStashMoves || 0),
    contractsCompleted: Number(stats.contractsCompleted || 0),
  };
}

export function createSessionPlanState() {
  return { version: 1, active: null, claims: [], dismissed: [] };
}

export function normalizeSessionPlanState(value, now = Date.now()) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const recent = now - 45 * 86400000;
  return {
    version: 1,
    active: safe.active && typeof safe.active === "object" && typeof safe.active.key === "string"
      ? { ...safe.active, baseline: { ...(safe.active.baseline || {}) } }
      : null,
    claims: Array.isArray(safe.claims) ? safe.claims.filter((entry) => entry?.key && Number(entry.at) > recent).slice(0, 60) : [],
    dismissed: Array.isArray(safe.dismissed) ? safe.dismissed.filter((entry) => entry?.key && Number(entry.at) > recent).slice(0, 30) : [],
  };
}

function contactAttempts(player, active, filters = {}, now = Date.now()) {
  return normalizeContacts(player?.contacts, now).history.filter((entry) =>
    Number(entry.at || 0) >= Number(active.acceptedAt || 0) &&
    (!filters.districtId || entry.districtId === filters.districtId) &&
    (!filters.mode || entry.mode === filters.mode)
  );
}

function buildEventPlan(player, now, event) {
  const contacts = normalizeContacts(player?.contacts, now);
  if (!contacts.classId || normalizePlayerDirector(player?.cityDirector, now).claims.some((entry) => entry.key === event.key)) return null;
  const responseChoices = getCityEventResponse(player, now).choices;
  const gangAligned = Boolean(player?.gang?.joined && player.gang.focusDistrictId === event.districtId);
  const classId = contacts.classId;
  const className = CONTACT_CLASSES.find((entry) => entry.id === classId)?.name || classId;
  return {
    id: gangAligned ? "gang-event" : "event-pivot",
    key: `${event.key}:${gangAligned ? "gang" : "solo"}`,
    title: gangAligned ? `Ekipa odpowiada: ${event.title}` : `Okno okazji: ${event.title}`,
    reason: gangAligned
      ? `Wydarzenie uderza w dzielnicę fokusu gangu. Twoja reakcja liczy się do wspólnego celu.`
      : `Plan istnieje dlatego, że ${event.title.toLowerCase()} zmienia warunki w ${findDistrictById(event.districtId).name}.`,
    risk: event.tone === "danger" ? "Wysokie" : event.tone === "risk" ? "Podwyższone" : "Średnie",
    rewardHint: gangAligned ? "XP, mniej Heat i wkład do celu gangu" : "XP, wpływ lub mniej Heat",
    expiresAt: event.endsAt,
    districtId: event.districtId,
    eventKey: event.key,
    score: gangAligned ? 110 : 100,
    approaches: [
      { id: "cautious", title: "Zmiana trasy", summary: "Najpierw bezpieczna reakcja, potem cicha umowa w dzielnicy.", requiredChoiceId: "adapt", contactMode: "quiet", destination: { tab: "city", section: "contacts" } },
      { id: "class-route", title: `Droga klasy: ${className}`, summary: "Użyj zasobów swojej profesji, a potem wykorzystaj dowolną umowę w dzielnicy.", requiredChoiceId: classId, contactMode: null, destination: { tab: "city", section: "contacts" } },
    ].filter((approach) => responseChoices.find((choice) => choice.id === approach.requiredChoiceId)?.reasons.length === 0),
  };
}

function buildOperationPlan(player, now) {
  const active = normalizeOperationsState(player?.operations).active;
  const operation = getOperationById(active?.operationId);
  if (!active || !operation || !isMajorOperation(operation)) return null;
  return {
    id: "major-operation", key: `operation:${active.id}`, title: `Domknij: ${operation.name}`,
    reason: active.phase === "complication" ? "Akcja już trwa. Tablica prowadzi prosto do decyzji, która rozstrzygnie finał." : "Masz rozpoczęty duży plan. Dokończ przygotowania i przeprowadź finał bez dokładania osobnego grindu.",
    risk: "Wysokie", rewardHint: "Łup operacji, postęp celu i mała premia za pełny łańcuch", expiresAt: active.expiresAt,
    districtId: active.districtId, operationRunId: active.id, score: 140,
    approaches: [{ id: "finish", title: "Dowieź plan", summary: "Dokończ przygotowania, rozpocznij finał i rozegraj jego konsekwencję. Liczy się także częściowy wynik lub świadomy odwrót.", destination: { tab: "heists", section: "operations" } }],
  };
}

function buildRivalPlan(player, now) {
  const conflict = getRivalView(player, now).active;
  if (!conflict) return null;
  return {
    id: "rival-response", key: `rival:${conflict.id}`, title: `Odpowiedz: ${conflict.rival.name}`,
    reason: `Ten konflikt powstał przez wcześniejszy ruch: ${conflict.cause.label}`,
    risk: conflict.stage === "final" ? "Wysokie" : "Do wyboru", rewardHint: "Spokój, Heat, kontakt, wpływ albo kosztowny finał",
    expiresAt: Math.max(now + MIN_ACCEPT_WINDOW_MS + 1, Number(conflict.createdAt || now) + 48 * 60 * 60 * 1000), districtId: conflict.districtId,
    rivalConflictId: conflict.id, score: 135,
    approaches: [{ id: "respond", title: "Rozegraj konsekwencję", summary: "Wybierz zapłatę, kontakt, drogę klasy, gang albo kontrakcję na ekranie operacji.", destination: { tab: "heists", section: "operations" } }],
  };
}

function buildEmpireProjectPlan(player, now) {
  const active = getEmpireProjectsView(player, now).active;
  if (!active) return null;
  return {
    id: "empire-project", key: `empire-project:${active.projectId}:${active.startedAt}`,
    title: `Buduj: ${active.project.name}`,
    reason: active.proof.ready ? "Dowody są gotowe. Pozostała trwała decyzja o sposobie domknięcia projektu." : "Finansowanie już pracuje. Tablica prowadzi teraz do działań, które potwierdzą działanie całego zaplecza.",
    risk: "Długoterminowe", rewardHint: `Prestiż i dyrektywa: ${active.project.directive.name}`,
    expiresAt: now + 365 * 24 * 60 * 60 * 1000, districtId: active.project.districtId, projectId: active.projectId, score: 128,
    approaches: [{ id: "continue", title: active.proof.ready ? "Wybierz finał" : "Dowieź dowody", summary: active.project.proof, destination: { tab: "empire", section: "businesses" } }],
  };
}

function buildStreetPlan(player, now) {
  const profile = getProfile(player);
  if (Number(profile.energy || 0) < 1 || Number(profile.hp || 0) < Math.max(20, Number(profile.maxHp || 100) * 0.35)) return null;
  return {
    id: "street-bank", key: `${planSlot(now)}:street-bank`, title: "Skok i czyste wyjście",
    reason: "Masz siłę na uliczny ruch. Plan łączy łup z decyzją, by część wynieść z ryzyka.", risk: "Średnie",
    rewardHint: "$450–900, XP i kontrola Heat", expiresAt: now + SESSION_PLAN_ACTIVE_MS,
    districtId: "oldtown", score: Number(profile.respect || 0) < 10 ? 85 : 48,
    approaches: [
      { id: "secure", title: "Zabezpiecz wynik", summary: "Wykonaj dowolny skok i wpłać 500$ do banku.", heists: 1, wins: 0, deposit: 500, destination: { tab: "heists", section: "solo" } },
      { id: "bold", title: "Tylko udany strzał", summary: "Wygraj skok i zabezpiecz 1000$. Większa stawka, większe wymaganie.", heists: 0, wins: 1, deposit: 1000, destination: { tab: "heists", section: "solo" } },
    ],
  };
}

function buildContactPlan(player, now, event) {
  const contacts = normalizeContacts(player?.contacts, now);
  if (!contacts.classId) return null;
  const districts = getDistrictSummaries(player?.city, now);
  const quietDistrict = [...districts].sort((a, b) => a.pressure - b.pressure)[0];
  const target = event?.districtId || quietDistrict?.id || "oldtown";
  const approaches = [
    { id: "quiet", title: "Cicha umowa", summary: "Jedna próba w trybie cichym. Sukces buduje zaufanie; porażka nie blokuje finału.", contactMode: "quiet", destination: { tab: "city", section: "contacts" } },
    { id: "rush", title: "Pilne wejście", summary: "Jedna próba pilna. Wyższa wypłata planu, ale wynik może zostawić Heat.", contactMode: "rush", destination: { tab: "city", section: "contacts" } },
  ].filter((approach) => getContactQuote(player, target, contacts.classId, approach.contactMode, now)?.reasons.length === 0);
  if (!approaches.length) return null;
  return {
    id: "contact-window", key: `${planSlot(now)}:contact-window:${target}`, title: "Telefon, który nie poczeka",
    reason: event?.districtId === target ? `Kontakt w ${findDistrictById(target).name} reaguje na aktualną sytuację miasta.` : `Najspokojniejszy front daje teraz czytelne warunki do umowy.`,
    risk: "Do wyboru", rewardHint: "Gotówka, XP, zaufanie albo konsekwencja", expiresAt: Math.min(now + SESSION_PLAN_ACTIVE_MS, event?.endsAt || Infinity),
    districtId: target, score: 72,
    approaches,
  };
}

function buildFactoryPlan(player, now, event) {
  if (!hasFactory(player)) return null;
  const clubRoute = Boolean(player?.club?.owned);
  return {
    id: "factory-chain", key: `${planSlot(now)}:factory-chain`, title: "Partia z odbiorcą",
    reason: event?.districtId === "harbor" ? "Problemy w porcie zwiększają znaczenie własnego łańcucha dostaw." : "Masz fabrykę, więc tablica proponuje pełny obrót zamiast samego kliknięcia produkcji.",
    risk: event?.districtId === "harbor" ? "Podwyższone" : "Średnie", rewardHint: "Gotówka, XP i ulga presji", expiresAt: now + SESSION_PLAN_ACTIVE_MS,
    districtId: event?.districtId || "harbor", score: event?.districtId === "harbor" ? 90 : 76,
    approaches: [
      { id: "dealer", title: "Produkcja → diler", summary: "Wyprodukuj partię, a potem sprzedaj choć część własnego towaru dilerowi.", batches: 1, producedSale: 1, destination: { tab: "empire", section: "factories" } },
      ...(clubRoute ? [{ id: "club", title: "Produkcja → klub", summary: "Wyprodukuj partię i przenieś towar do stashu własnego lokalu.", batches: 1, stashMoves: 1, destination: { tab: "empire", section: "factories" } }] : []),
    ],
  };
}

function buildBusinessPlan(player, now) {
  if (!hasBusiness(player)) return null;
  return {
    id: "business-turn", key: `${planSlot(now)}:business-turn`, title: "Obrót z zaplecza",
    reason: "Masz działający biznes. Plan łączy odbiór przychodu z ruchem prawdziwego rynku.", risk: "Niskie", rewardHint: "$650 i XP",
    expiresAt: now + SESSION_PLAN_ACTIVE_MS, districtId: "oldtown", score: 88,
    approaches: [{ id: "turnover", title: "Odbierz i sprzedaj", summary: "Odbierz biznes co najmniej raz i sprzedaj 3 zwykłe towary.", collections: 1, marketSold: 3, destination: { tab: "empire", section: "businesses" } }],
  };
}

function buildPressureReliefPlan(player, now) {
  const contacts = normalizeContacts(player?.contacts, now);
  if (!contacts.classId) return null;
  const target = [...getDistrictSummaries(player?.city, now)].sort((a, b) => b.pressure - a.pressure)[0];
  if (!target || Number(target.pressure || 0) < 49) return null;
  const approaches = [
    { id: "quiet-contact", title: "Cichy telefon", summary: `Wykonaj ciche zlecenie w ${target.name}. Wynik może być trudny, ale sam ruch pokazuje, że nie porzucasz frontu.`, contactMode: "quiet", destination: { tab: "city", section: "contacts" } },
    ...(hasBusiness(player) ? [{ id: "clean-fund", title: "Fundusz porządkowy", summary: "Odbierz utarg z biznesu i odłóż 25 000$ w banku, żeby sfinansować wygaszenie napięcia.", collections: 1, deposit: 25000, destination: { tab: "empire", section: "businesses" } }] : []),
  ];
  return { id: "pressure-relief", key: `${planSlot(now)}:pressure-relief:${target.id}`, title: `Schłodź ${target.name}`, reason: `${target.pressureLabel} zmienia koszty i ryzyko kilku systemów. Ten plan reaguje na realny stan dzielnicy.`, risk: "Kontrolowane", rewardHint: "XP i wyraźna ulga presji", expiresAt: now + SESSION_PLAN_ACTIVE_MS, districtId: target.id, score: 118, approaches };
}

function buildContractFieldTestPlan(player, now) {
  const equipped = Object.values(player?.contracts?.loadout || {}).filter(Boolean).length;
  if (equipped < 2) return null;
  return { id: "contract-field-test", key: `${planSlot(now)}:contract-field-test`, title: "Sprawdź zestaw w terenie", reason: `Masz wyposażone ${equipped} elementy kontraktowe. Plan proponuje prawdziwe użycie zestawu zamiast kolejnego zakupu.`, risk: "Zależne od celu", rewardHint: "XP i mniejszy Heat za pełny obrót sprzętu", expiresAt: now + SESSION_PLAN_ACTIVE_MS, districtId: player?.city?.focusDistrictId || "oldtown", score: 69,
    approaches: [{ id: "complete", title: "Domknij kontrakt", summary: "Ukończ jeden dowolny kontrakt z aktualnym loadoutem. Liczy się sukces, nie samo odpalenie.", contracts: 1, destination: { tab: "heists", section: "contracts" } }],
  };
}

export function getSessionPlanProposals(player, now = Date.now()) {
  const profile = getProfile(player);
  if (Number(profile.jailUntil || 0) > now || Number(profile.criticalCareUntil || 0) > now) return [];
  const event = getCityEventAt(now);
  const plans = [buildOperationPlan(player, now), buildRivalPlan(player, now), buildEmpireProjectPlan(player, now), buildPressureReliefPlan(player, now), buildEventPlan(player, now, event), buildFactoryPlan(player, now, event), buildContactPlan(player, now, event), buildBusinessPlan(player, now), buildContractFieldTestPlan(player, now), buildStreetPlan(player, now)].filter(Boolean);
  const state = normalizeSessionPlanState(player?.sessionPlans, now);
  const excluded = new Set([...state.claims, ...state.dismissed].map((entry) => entry.key));
  return plans.filter((plan) => plan.expiresAt - now >= MIN_ACCEPT_WINDOW_MS && plan.approaches.length > 0 && !excluded.has(plan.key)).sort((a, b) => b.score - a.score).slice(0, 3);
}

function evaluateActive(player, active, now) {
  const proposal = active.proposal;
  const approach = proposal?.approaches?.find((entry) => entry.id === active.approachId);
  if (!proposal || !approach) return { status: "invalid", steps: [], ready: false, outcome: null };
  if (now > Number(active.expiresAt || 0)) return { status: "expired", steps: [], ready: false, outcome: null };
  const stats = player?.stats || {}, baseline = active.baseline || {};
  const steps = [];
  if (proposal.id === "empire-project") {
    const completion = normalizeEmpireProjects(player?.empireProjects).completed?.[proposal.projectId];
    steps.push({ id: "project", label: `Ukończ przedsięwzięcie ${proposal.title.replace("Buduj: ", "")}`, done: Boolean(completion && Number(completion.completedAt || 0) >= Number(active.acceptedAt || 0)), destination: { tab: "empire", section: "businesses" } });
    return { status: steps[0].done ? "ready" : "active", ready: steps[0].done, steps, outcome: steps[0].done ? "success" : null };
  }
  if (proposal.id === "pressure-relief") {
    if (approach.id === "quiet-contact") {
      const attempts = contactAttempts(player, active, { districtId: active.districtId, mode: "quiet" }, now);
      steps.push({ id: "quiet", label: `Wykonaj ciche zlecenie w ${findDistrictById(active.districtId).name}`, done: attempts.length > 0, destination: { tab: "city", section: "contacts" } });
    } else {
      steps.push({ id: "collect", label: "Odbierz utarg biznesu", done: Number(stats.businessCollections || 0) - Number(baseline.businessCollections || 0) >= 1, destination: { tab: "empire", section: "businesses" } });
      steps.push({ id: "deposit", label: "Wpłać 25 000$ do banku", done: Number(stats.bankDepositedTotal || 0) - Number(baseline.bankDepositedTotal || 0) >= 25000, destination: { tab: "city", section: "bank" } });
    }
    return { status: steps.every((step) => step.done) ? "ready" : "active", ready: steps.every((step) => step.done), steps, outcome: steps.every((step) => step.done) ? "success" : null };
  }
  if (proposal.id === "contract-field-test") {
    const done = Number(stats.contractsCompleted || 0) - Number(baseline.contractsCompleted || 0) >= 1;
    steps.push({ id: "contract", label: "Ukończ kontrakt z wyposażonym zestawem", done, destination: { tab: "heists", section: "contracts" } });
    return { status: done ? "ready" : "active", ready: done, steps, outcome: done ? "success" : null };
  }
  if (proposal.id === "rival-response") {
    const result = normalizeRivalState(player?.rivals).history.find((entry) => entry.id === proposal.rivalConflictId && Number(entry.resolvedAt || 0) >= Number(active.acceptedAt || 0));
    steps.push({ id: "rival", label: `Rozstrzygnij konflikt z ${proposal.title.replace("Odpowiedz: ", "")}`, done: Boolean(result), destination: { tab: "heists", section: "operations" } });
    return { status: result ? "ready" : "active", ready: Boolean(result), steps, outcome: result?.success ? "success" : result ? "setback" : null };
  }
  if (proposal.id === "major-operation") {
    const result = normalizeOperationsState(player?.operations).history.find((entry) => entry.id === proposal.operationRunId && Number(entry.time || 0) >= Number(active.acceptedAt || 0));
    steps.push({ id: "operation", label: `Rozstrzygnij operację ${proposal.title.replace("Domknij: ", "")}`, done: Boolean(result), destination: { tab: "heists", section: "operations" } });
    const ready = Boolean(result);
    const outcome = result?.outcome || (result?.success ? "success" : result ? "failure" : null);
    return { status: ready ? "ready" : "active", ready, steps, outcome };
  }
  if (proposal.id === "event-pivot" || proposal.id === "gang-event") {
    const claim = normalizePlayerDirector(player?.cityDirector, now).claims.find((entry) => entry.key === active.eventKey);
    steps.push({ id: "response", label: `Zareaguj: ${approach.title}`, done: claim?.choiceId === approach.requiredChoiceId, destination: { tab: "city", section: "contacts" } });
    const attempts = contactAttempts(player, active, { districtId: active.districtId, mode: approach.contactMode }, now);
    steps.push({ id: "contact", label: `Domknij ${approach.contactMode === "quiet" ? "cichą " : ""}umowę w ${findDistrictById(active.districtId).name}`, done: attempts.length > 0, destination: { tab: "city", section: "contacts" } });
    const ready = steps.every((step) => step.done);
    return { status: ready ? "ready" : "active", ready, steps, outcome: attempts[0]?.success ? "success" : attempts.length ? "setback" : null };
  }
  if (proposal.id === "street-bank") {
    if (approach.heists) steps.push({ id: "heist", label: "Wykonaj skok", done: Number(stats.heistsDone || 0) - Number(baseline.heistsDone || 0) >= approach.heists, destination: { tab: "heists", section: "solo" } });
    if (approach.wins) steps.push({ id: "win", label: "Wygraj skok", done: Number(stats.heistsWon || 0) - Number(baseline.heistsWon || 0) >= approach.wins, destination: { tab: "heists", section: "solo" } });
    steps.push({ id: "bank", label: `Wpłać łącznie ${approach.deposit}$`, done: Number(stats.bankDepositedTotal || 0) - Number(baseline.bankDepositedTotal || 0) >= approach.deposit, destination: { tab: "city", section: "bank" } });
  } else if (proposal.id === "contact-window") {
    const attempts = contactAttempts(player, active, { districtId: active.districtId, mode: approach.contactMode }, now);
    steps.push({ id: "contact", label: `${approach.title} w ${findDistrictById(active.districtId).name}`, done: attempts.length > 0, destination: { tab: "city", section: "contacts" } });
    const ready = steps.every((step) => step.done);
    return { status: ready ? "ready" : "active", ready, steps, outcome: attempts[0]?.success ? "success" : attempts.length ? "setback" : null };
  } else if (proposal.id === "factory-chain") {
    steps.push({ id: "batch", label: "Wyprodukuj nową partię", done: Number(stats.drugBatches || 0) - Number(baseline.drugBatches || 0) >= 1, destination: { tab: "empire", section: "factories" } });
    steps.push(approach.id === "club"
      ? { id: "delivery", label: "Przenieś towar do stashu klubu", done: Number(stats.clubStashMoves || 0) - Number(baseline.clubStashMoves || 0) >= 1, destination: { tab: "empire", section: "club" } }
      : { id: "sale", label: "Sprzedaj własny towar dilerowi", done: Number(stats.producedDrugSalesValue || 0) - Number(baseline.producedDrugSalesValue || 0) >= 1, destination: { tab: "market", section: "drugs" } });
  } else if (proposal.id === "business-turn") {
    steps.push({ id: "collect", label: "Odbierz dochód z biznesu", done: Number(stats.businessCollections || 0) - Number(baseline.businessCollections || 0) >= 1, destination: { tab: "empire", section: "businesses" } });
    steps.push({ id: "sell", label: "Sprzedaj 3 zwykłe towary", done: Number(stats.marketGoodsSold || 0) - Number(baseline.marketGoodsSold || 0) >= 3, destination: { tab: "market", section: "street" } });
  }
  const ready = steps.length > 0 && steps.every((step) => step.done);
  return { status: ready ? "ready" : "active", ready, steps, outcome: ready ? "success" : null };
}

export function getSessionPlanBoard(player, now = Date.now()) {
  const state = normalizeSessionPlanState(player?.sessionPlans, now);
  const evaluated = state.active ? evaluateActive(player, state.active, now) : null;
  return { active: state.active ? { ...state.active, ...evaluated } : null, proposals: state.active && evaluated?.status !== "expired" ? [] : getSessionPlanProposals(player, now) };
}

export function acceptSessionPlan(player, planKey, approachId, now = Date.now()) {
  const state = normalizeSessionPlanState(player?.sessionPlans, now);
  if (state.active && evaluateActive(player, state.active, now).status !== "expired") fail("Masz już aktywny plan. Domknij go albo odpuść.");
  const proposal = getSessionPlanProposals({ ...player, sessionPlans: { ...state, active: null } }, now).find((entry) => entry.key === planKey);
  if (!proposal) fail("Ten plan nie jest już dostępny.");
  const approach = proposal.approaches.find((entry) => entry.id === approachId);
  if (!approach) fail("Wybierz dostępne podejście.");
  state.active = { key: proposal.key, planId: proposal.id, approachId, acceptedAt: now, expiresAt: proposal.expiresAt, eventKey: proposal.eventKey || null, districtId: proposal.districtId, baseline: getBaseline(player), proposal };
  player.sessionPlans = state;
  return { message: `Plan „${proposal.title}” ruszył. Pierwszy krok czeka na tablicy.`, board: getSessionPlanBoard(player, now) };
}

export function abandonSessionPlan(player, now = Date.now()) {
  const state = normalizeSessionPlanState(player?.sessionPlans, now);
  if (!state.active) fail("Nie masz aktywnego planu.");
  state.dismissed.unshift({ key: state.active.key, at: now });
  const title = state.active.proposal?.title || "Plan";
  state.active = null;
  player.sessionPlans = state;
  return { message: `${title} odpuszczony. Nie ma kary ani nagrody.`, board: getSessionPlanBoard(player, now) };
}

function planReward(active, outcome) {
  const success = outcome !== "setback";
  if (active.planId === "empire-project") return { cash: 0, xp: 10, heat: 0 };
  if (active.planId === "pressure-relief") return { cash: 0, xp: 8, heat: -3, pressure: -8 };
  if (active.planId === "contract-field-test") return { cash: 0, xp: 8, heat: -4 };
  if (active.planId === "rival-response") return { cash: 0, xp: success ? 6 : 3, heat: success ? -2 : 0 };
  if (active.planId === "major-operation") return outcome === "success" ? { cash: 0, xp: 8, heat: -2 } : outcome === "partial" ? { cash: 0, xp: 5, heat: -1 } : { cash: 0, xp: 2, heat: 0 };
  if (active.planId === "street-bank") return active.approachId === "bold" ? { cash: 900, xp: 8, heat: 1 } : { cash: 450, xp: 6, heat: -4 };
  if (active.planId === "contact-window") return active.approachId === "rush" ? { cash: success ? 900 : 0, xp: success ? 7 : 3, heat: success ? 1 : 4, trust: success ? 1 : 0 } : { cash: success ? 500 : 0, xp: success ? 5 : 2, heat: -4, trust: success ? 1 : 0 };
  if (active.planId === "factory-chain") return { cash: active.approachId === "club" ? 600 : 750, xp: 7, heat: -2, pressure: -2 };
  if (active.planId === "business-turn") return { cash: 650, xp: 6, heat: -2 };
  return active.approachId === "class-route" ? { cash: 0, xp: success ? 10 : 5, heat: success ? -3 : 2, influence: success ? 2 : 0 } : { cash: 0, xp: success ? 8 : 4, heat: -6, influence: success ? 1 : 0 };
}

export function claimSessionPlan(player, now = Date.now()) {
  const state = normalizeSessionPlanState(player?.sessionPlans, now);
  if (!state.active) fail("Nie masz aktywnego planu.");
  const evaluation = evaluateActive(player, state.active, now);
  if (evaluation.status === "expired") fail("Okno tego planu już się zamknęło.");
  if (!evaluation.ready) fail("Plan nie jest jeszcze gotowy do finału.");
  if (state.claims.some((entry) => entry.key === state.active.key)) fail("Nagroda za ten plan została już odebrana.");
  const active = state.active, reward = planReward(active, evaluation.outcome);
  const profile = getProfile(player);
  profile.cash = Math.max(0, Number(profile.cash || 0) + Number(reward.cash || 0));
  profile.heat = clamp(Number(profile.heat || 0) + Number(reward.heat || 0), 0, 100);
  const progression = applyXpProgression(profile, Number(reward.xp || 0));
  profile.respect = progression.respect; profile.level = progression.respect; profile.xp = progression.xp;
  if (reward.influence || reward.pressure) {
    player.city = applyDistrictActivity(player.city, { districtId: active.districtId, influenceDelta: reward.influence || 0, pressureDelta: reward.pressure || 0, threatDelta: -1, actionFamily: `session-plan:${active.key}`, eventText: `Domknięto plan: ${active.proposal.title}.`, now }).city;
  }
  if (reward.trust) {
    const contacts = normalizeContacts(player.contacts, now);
    const relation = contacts.stories.relations[active.districtId];
    if (relation) relation.trust = Math.min(20, Number(relation.trust || 0) + reward.trust);
    player.contacts = contacts;
  }
  state.claims.unshift({ key: active.key, planId: active.planId, outcome: evaluation.outcome, at: now });
  state.active = null;
  player.sessionPlans = state;
  return { message: evaluation.outcome === "setback" ? "Plan domknięty mimo komplikacji. Dostajesz nagrodę za rozegranie konsekwencji." : "Plan domknięty. Miasto oddaje to, co wypracowałeś.", reward, outcome: evaluation.outcome, board: getSessionPlanBoard(player, now) };
}
