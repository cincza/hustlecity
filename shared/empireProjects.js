import { applyDistrictActivity, DISTRICTS, findDistrictById, syncCityState } from "./districts.js";
import { normalizeContacts } from "./contacts.js";
import { normalizeOperationsState } from "./operations.js";
import { registerRivalTrigger } from "./rivals.js";

const HOUR = 60 * 60 * 1000;
export const EMPIRE_DIRECTIVE_COOLDOWN_MS = 20 * HOUR;
const fail = (message) => { throw Object.assign(new Error(message), { statusCode: 400 }); };
const number = (value) => Math.max(0, Math.floor(Number(value) || 0));
const businessCount = (player) => (player?.businessesOwned || []).filter((entry) => number(entry?.count) > 0).length;
const factoryCount = (player) => Object.values(player?.factoriesOwned || {}).filter((value) => number(value) > 0).length;
const producedCount = (player) => Object.values(player?.producedDrugInventory || {}).reduce((sum, value) => sum + number(value), 0);
const trust = (player, districtId) => number(player?.contacts?.stories?.relations?.[districtId]?.trust);
const operationWins = (player, operationId) => number(normalizeOperationsState(player?.operations).progress?.[operationId]?.wins);
const completedCount = (player) => Object.keys(normalizeEmpireProjects(player?.empireProjects).completed).length;

export const EMPIRE_PROJECTS = [
  {
    id: "city-holding", name: "Holding miejski", districtId: "oldtown", respect: 30, funding: 280000,
    summary: "Połącz lokale, obrót i kontakty w jedną rozpoznawalną sieć frontów.",
    requirement: "30 RES, 4 różne biznesy i 24 ukończone zlecenia kontaktów.",
    proof: "Po finansowaniu odbierz 4 utargi, sprzedaj 20 towarów i wpłać 100 000$ do banku.",
    directive: { name: "Fundusz obywatelski", summary: "75 000$ z banku kupuje ciszę: -8 Heat i -6 presji w Old Town." },
    choices: [
      { id: "charter", name: "Karta legalnego holdingu", summary: "Droższa, czysta struktura oparta o bank i zaufanie.", bankCost: 350000, trust: 3 },
      { id: "takeover", name: "Wrogie przejęcie", summary: "Tańszy finał wymaga dwóch nowych operacji i zostawia głośny ślad.", cashCost: 220000, operationDelta: 2, heatDelta: 9 },
    ],
  },
  {
    id: "supply-corridor", name: "Korytarz logistyczny", districtId: "harbor", respect: 32, funding: 320000,
    summary: "Zepnij fabryki, własny towar i operacje portowe w odporny łańcuch dostaw.",
    requirement: "32 RES, 2 różne fabryki i 24 ukończone zlecenia kontaktów.",
    proof: "Po finansowaniu wyprodukuj 6 partii, sprzedaj własny towar za 12 000$ i ukończ operację.",
    directive: { name: "Awaryjny przerzut", summary: "10 szt. własnego towaru i 2 EN obniża presję portu o 8 i daje 2 wpływu." },
    choices: [
      { id: "own-stock", name: "Trasa własnego ładunku", summary: "Poświęć 18 sztuk dowolnego wyprodukowanego towaru.", producedCost: 18 },
      { id: "harbor-deal", name: "Umowa z portem", summary: "Kup stabilność z banku i oprzyj ją na zaufaniu w Harbor Line.", bankCost: 500000, trust: 3 },
    ],
  },
  {
    id: "night-council", name: "Rada nocnego miasta", districtId: "neon", respect: 34, funding: 300000,
    summary: "Zbuduj pozycję społeczną przez klub, szeroką sieć lokali albo pracę kontaktów.",
    requirement: "34 RES, 30 zleceń i własny klub albo 6 różnych biznesów.",
    proof: "Po finansowaniu wykonaj 6 zleceń oraz 2 ruchy klubowego stashu albo 3 odbiory z biznesów.",
    directive: { name: "Nocny szczyt", summary: "60 000$ i 2 EN obniża Heat o 4 oraz presję Neon Strip o 9." },
    choices: [
      { id: "club-summit", name: "Szczyt właścicieli", summary: "Własny klub, gotówka i lokalne zaufanie zamykają układ przy stole.", cashCost: 220000, trust: 3, requiresClub: true },
      { id: "city-hosts", name: "Sieć gospodarzy", summary: "Droższa droga solo dla gracza bez klubu, oparta o kontakty i bank.", bankCost: 400000, energyCost: 4, trust: 5 },
      { id: "gang-table", name: "Stół gangu", summary: "Gang z fokusem w Neonie dzieli koszt organizacji, ale nie zwiększa nagrody.", cashCost: 160000, trust: 2, requiresGangFocus: true },
    ],
  },
  {
    id: "city-headquarters", name: "Centrala Hustle City", districtId: "oldtown", respect: 45, funding: 2000000,
    summary: "Finał imperium: połącz wcześniejsze projekty, Skarbiec miasta i aktywność w całej metropolii.",
    requirement: "45 RES, 2 ukończone projekty, wygrany Skarbiec miasta i co najmniej 12 wpływu w każdej dzielnicy.",
    proof: "Po finansowaniu ukończ 3 operacje, rozwiąż konflikt z rywalem oraz wykonaj 6 zleceń; gangowy wkład 50 000$ może zastąpić zlecenia.",
    directive: { name: "Sztab kryzysowy", summary: "250 000$ z banku i 3 EN stabilizuje wybraną dzielnicę: -10 presji, -8 zagrożenia i +3 wpływu." },
    choices: [
      { id: "civic-pact", name: "Pakt miejski", summary: "Najczystszy finał: kapitał i zaufanie we wszystkich dzielnicach.", bankCost: 2500000, allTrust: 3, maxHeat: 50 },
      { id: "street-crown", name: "Korona ulicy", summary: "Gotówka, energia i wysoki Heat pokazują miastu cenę dominacji.", cashCost: 1800000, energyCost: 6, heatDelta: 12 },
    ],
  },
];

export function createEmpireProjects() { return { version: 1, active: null, completed: {}, history: [], directiveCooldownUntil: 0 }; }

export function normalizeEmpireProjects(value) {
  const safe = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const validIds = new Set(EMPIRE_PROJECTS.map((entry) => entry.id));
  return {
    version: 1,
    active: safe.active && validIds.has(safe.active.projectId) ? { ...safe.active, baseline: { ...(safe.active.baseline || {}) } } : null,
    completed: Object.fromEntries(Object.entries(safe.completed || {}).filter(([id, entry]) => validIds.has(id) && entry?.completedAt).map(([id, entry]) => [id, { ...entry }])),
    history: Array.isArray(safe.history) ? safe.history.filter((entry) => validIds.has(entry?.projectId)).slice(0, 16) : [],
    directiveCooldownUntil: number(safe.directiveCooldownUntil),
  };
}

export function getEmpireProject(projectId) { return EMPIRE_PROJECTS.find((entry) => entry.id === projectId) || null; }

function baseline(player) {
  const stats = player?.stats || {};
  return { businessCollections: number(stats.businessCollections), marketGoodsSold: number(stats.marketGoodsSold), bankDepositedTotal: number(stats.bankDepositedTotal), drugBatches: number(stats.drugBatches), producedDrugSalesValue: number(stats.producedDrugSalesValue), operationsCompleted: number(stats.operationsCompleted), contactsCompleted: number(normalizeContacts(player?.contacts).completed), clubStashMoves: number(stats.clubStashMoves), rivalsResolved: number(stats.rivalsResolved), gangVaultContributed: number(stats.gangVaultContributed) };
}

function startReasons(player, project) {
  const profile = player?.profile || {};
  const contacts = normalizeContacts(player?.contacts);
  const reasons = [];
  if (number(profile.respect) < project.respect) reasons.push(`Potrzebujesz ${project.respect} RES`);
  if (number(profile.cash) < project.funding) reasons.push(`Potrzebujesz ${project.funding}$ gotówki`);
  if (project.id === "city-holding" && businessCount(player) < 4) reasons.push("Potrzebujesz 4 różnych biznesów");
  if (project.id === "supply-corridor" && factoryCount(player) < 2) reasons.push("Potrzebujesz 2 różnych fabryk");
  if (["city-holding", "supply-corridor"].includes(project.id) && number(contacts.completed) < 24) reasons.push("Potrzebujesz 24 zleceń kontaktów");
  if (project.id === "night-council" && number(contacts.completed) < 30) reasons.push("Potrzebujesz 30 zleceń kontaktów");
  if (project.id === "night-council" && !player?.club?.owned && businessCount(player) < 6) reasons.push("Potrzebujesz własnego klubu albo 6 różnych biznesów");
  if (project.id === "city-headquarters") {
    if (completedCount(player) < 2) reasons.push("Ukończ 2 wcześniejsze projekty");
    if (operationWins(player, "city-vault") < 1) reasons.push("Wygraj operację Skarbiec miasta");
    const city = syncCityState(player?.city);
    if (DISTRICTS.some((district) => Number(city.districts?.[district.id]?.influence || 0) < 12)) reasons.push("Potrzebujesz 12 wpływu w każdej dzielnicy");
  }
  return reasons;
}

function deltas(player, active) {
  const now = baseline(player), before = active?.baseline || {};
  return Object.fromEntries(Object.keys(now).map((key) => [key, Math.max(0, now[key] - number(before[key]))]));
}

function proofState(player, project, active) {
  const d = deltas(player, active);
  let steps = [];
  if (project.id === "city-holding") steps = [["4 odbiory utargu", d.businessCollections, 4], ["20 sprzedanych towarów", d.marketGoodsSold, 20], ["100 000$ wpłat", d.bankDepositedTotal, 100000]];
  if (project.id === "supply-corridor") steps = [["6 partii produkcji", d.drugBatches, 6], ["12 000$ sprzedaży własnego towaru", d.producedDrugSalesValue, 12000], ["1 ukończona operacja", d.operationsCompleted, 1]];
  if (project.id === "night-council") steps = [["6 zleceń kontaktów", d.contactsCompleted, 6], ["2 ruchy stashu lub 3 odbiory", Math.max(d.clubStashMoves / 2, d.businessCollections / 3), 1]];
  if (project.id === "city-headquarters") steps = [["3 ukończone operacje", d.operationsCompleted, 3], ["1 rozwiązany konflikt", d.rivalsResolved, 1], ["6 zleceń lub 50 000$ wkładu do gangu", Math.max(d.contactsCompleted / 6, d.gangVaultContributed / 50000), 1]];
  const normalized = steps.map(([label, current, target]) => ({ label, current: Math.min(target, Number(current.toFixed?.(2) ?? current)), target, done: current >= target }));
  return { ready: normalized.every((entry) => entry.done), steps: normalized, deltas: d };
}

function choiceReasons(player, project, choice, active) {
  const profile = player?.profile || {}, reasons = [], d = deltas(player, active);
  if (number(profile.cash) < number(choice.cashCost)) reasons.push(`Potrzebujesz ${choice.cashCost}$ gotówki`);
  if (number(profile.bank) < number(choice.bankCost)) reasons.push(`Potrzebujesz ${choice.bankCost}$ w banku`);
  if (number(profile.energy) < number(choice.energyCost)) reasons.push(`Potrzebujesz ${choice.energyCost} EN`);
  if (choice.trust && trust(player, project.districtId) < choice.trust) reasons.push(`Potrzebujesz ${choice.trust} zaufania w ${findDistrictById(project.districtId).name}`);
  if (choice.allTrust && DISTRICTS.some((district) => trust(player, district.id) < choice.allTrust)) reasons.push(`Potrzebujesz ${choice.allTrust} zaufania w każdej dzielnicy`);
  if (choice.maxHeat !== undefined && number(profile.heat) > choice.maxHeat) reasons.push(`Heat musi spaść do ${choice.maxHeat}`);
  if (choice.operationDelta && d.operationsCompleted < choice.operationDelta) reasons.push(`Po finansowaniu ukończ ${choice.operationDelta} operacje`);
  if (choice.producedCost && producedCount(player) < choice.producedCost) reasons.push(`Potrzebujesz ${choice.producedCost} szt. własnego towaru`);
  if (choice.requiresClub && !player?.club?.owned) reasons.push("Ta droga wymaga własnego klubu");
  if (choice.requiresGangFocus && (!player?.gang?.joined || player.gang.focusDistrictId !== project.districtId)) reasons.push(`Gang musi mieć fokus w ${findDistrictById(project.districtId).name}`);
  return reasons;
}

export function getEmpireProjectsView(player, now = Date.now()) {
  const state = normalizeEmpireProjects(player?.empireProjects);
  return { active: state.active ? (() => { const project = getEmpireProject(state.active.projectId); const proof = proofState(player, project, state.active); return { ...state.active, project, proof, choices: project.choices.map((choice) => ({ ...choice, reasons: proof.ready ? choiceReasons(player, project, choice, state.active) : ["Najpierw ukończ dowody aktywności"] })) }; })() : null,
    projects: EMPIRE_PROJECTS.map((project) => ({ ...project, completed: state.completed[project.id] || null, startReasons: state.active ? ["Najpierw dokończ aktywne przedsięwzięcie"] : startReasons(player, project) })),
    completedCount: Object.keys(state.completed).length,
    directiveCooldownUntil: state.directiveCooldownUntil,
    directives: EMPIRE_PROJECTS.filter((project) => state.completed[project.id]).map((project) => ({ projectId: project.id, districtId: project.districtId, ...project.directive, reasons: state.directiveCooldownUntil > now ? [`Sztab gotowy za ${Math.ceil((state.directiveCooldownUntil - now) / HOUR)} godz.`] : directiveReasons(player, project) })),
  };
}

export function startEmpireProject(player, projectId, now = Date.now()) {
  player.empireProjects = normalizeEmpireProjects(player.empireProjects);
  if (player.empireProjects.active) fail("Najpierw dokończ aktywne przedsięwzięcie.");
  const project = getEmpireProject(projectId); if (!project) fail("Nieznane przedsięwzięcie.");
  if (player.empireProjects.completed[projectId]) fail("To przedsięwzięcie jest już ukończone.");
  const reasons = startReasons(player, project); if (reasons.length) fail(reasons.join(" · "));
  player.profile.cash -= project.funding;
  player.empireProjects.active = { projectId, stage: "proof", funded: project.funding, startedAt: now, baseline: baseline(player) };
  player.city = applyDistrictActivity(player.city, { districtId: project.districtId, pressureDelta: 3, threatDelta: 1, actionFamily: `empire-start:${projectId}`, eventText: `Rozpoczęto: ${project.name}.`, now }).city;
  return { message: `Finansowanie uruchomione: ${project.name}. Teraz miasto oczekuje dowodów działania.`, projectId };
}

function consumeProduced(player, quantity) {
  let remaining = number(quantity);
  for (const [id, count] of Object.entries(player.producedDrugInventory || {})) { const used = Math.min(remaining, number(count)); player.producedDrugInventory[id] = number(count) - used; remaining -= used; if (!remaining) break; }
  if (remaining) fail("Brakuje własnego towaru.");
}

export function finalizeEmpireProject(player, choiceId, now = Date.now()) {
  player.empireProjects = normalizeEmpireProjects(player.empireProjects);
  const active = player.empireProjects.active; if (!active) fail("Nie masz aktywnego przedsięwzięcia.");
  const project = getEmpireProject(active.projectId), proof = proofState(player, project, active); if (!proof.ready) fail("Najpierw ukończ wszystkie dowody aktywności.");
  const choice = project.choices.find((entry) => entry.id === choiceId); if (!choice) fail("Nieznany sposób domknięcia.");
  const reasons = choiceReasons(player, project, choice, active); if (reasons.length) fail(reasons.join(" · "));
  player.profile.cash -= number(choice.cashCost); player.profile.bank -= number(choice.bankCost); player.profile.energy -= number(choice.energyCost);
  player.profile.heat = Math.min(100, number(player.profile.heat) + number(choice.heatDelta));
  if (choice.producedCost) consumeProduced(player, choice.producedCost);
  const completion = { projectId: project.id, projectName: project.name, choiceId: choice.id, choiceName: choice.name, completedAt: now };
  player.empireProjects.completed[project.id] = completion; player.empireProjects.history.unshift(completion); player.empireProjects.history = player.empireProjects.history.slice(0, 16); player.empireProjects.active = null;
  player.city = applyDistrictActivity(player.city, { districtId: project.districtId, influenceDelta: project.id === "city-headquarters" ? 6 : 4, pressureDelta: choice.heatDelta ? 5 : -3, threatDelta: choice.heatDelta ? 3 : -2, actionFamily: `empire-final:${project.id}`, eventText: `${project.name}: ${choice.name}.`, now }).city;
  if (choice.heatDelta) registerRivalTrigger(player, { sourceKey: `empire:${project.id}:${now}`, districtId: project.districtId, kind: "empire", label: `Głośny finał przedsięwzięcia „${project.name}” naruszył lokalny układ.` }, now);
  return { message: `${project.name} ukończone drogą „${choice.name}”. Odblokowano dyrektywę: ${project.directive.name}.`, completion };
}

function directiveReasons(player, project) {
  const p = player?.profile || {}, reasons = [];
  if (project.id === "city-holding" && number(p.bank) < 75000) reasons.push("Potrzebujesz 75 000$ w banku");
  if (project.id === "supply-corridor" && producedCount(player) < 10) reasons.push("Potrzebujesz 10 szt. własnego towaru");
  if (project.id === "supply-corridor" && number(p.energy) < 2) reasons.push("Potrzebujesz 2 EN");
  if (project.id === "night-council" && number(p.cash) < 60000) reasons.push("Potrzebujesz 60 000$ gotówki");
  if (project.id === "night-council" && number(p.energy) < 2) reasons.push("Potrzebujesz 2 EN");
  if (project.id === "city-headquarters" && number(p.bank) < 250000) reasons.push("Potrzebujesz 250 000$ w banku");
  if (project.id === "city-headquarters" && number(p.energy) < 3) reasons.push("Potrzebujesz 3 EN");
  return reasons;
}

export function runEmpireDirective(player, projectId, districtId, now = Date.now()) {
  player.empireProjects = normalizeEmpireProjects(player.empireProjects);
  const project = getEmpireProject(projectId); if (!project || !player.empireProjects.completed[projectId]) fail("Ta dyrektywa nie jest odblokowana.");
  if (player.empireProjects.directiveCooldownUntil > now) fail("Sztab nadal realizuje poprzednią dyrektywę.");
  const reasons = directiveReasons(player, project); if (reasons.length) fail(reasons.join(" · "));
  let target = project.districtId, pressureDelta = 0, threatDelta = 0, influenceDelta = 0, heatDelta = 0;
  if (project.id === "city-holding") { player.profile.bank -= 75000; pressureDelta = -6; heatDelta = -8; }
  if (project.id === "supply-corridor") { consumeProduced(player, 10); player.profile.energy -= 2; pressureDelta = -8; influenceDelta = 2; }
  if (project.id === "night-council") { player.profile.cash -= 60000; player.profile.energy -= 2; pressureDelta = -9; heatDelta = -4; }
  if (project.id === "city-headquarters") { target = findDistrictById(districtId).id; player.profile.bank -= 250000; player.profile.energy -= 3; pressureDelta = -10; threatDelta = -8; influenceDelta = 3; }
  player.profile.heat = Math.max(0, number(player.profile.heat) + heatDelta);
  player.city = applyDistrictActivity(player.city, { districtId: target, pressureDelta, threatDelta, influenceDelta, actionFamily: `empire-directive:${project.id}`, eventText: `${project.directive.name} stabilizuje dzielnicę.`, now }).city;
  player.empireProjects.directiveCooldownUntil = now + EMPIRE_DIRECTIVE_COOLDOWN_MS;
  return { message: `${project.directive.name} wykonane w ${findDistrictById(target).name}.`, projectId, districtId: target, cooldownUntil: player.empireProjects.directiveCooldownUntil };
}
