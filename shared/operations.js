import { DISTRICTS, getDistrictPressureState } from "./districts.js";

const clampOperationValue = (value, min, max) =>
  Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

export const OPERATION_STAGE_ORDER = ["intel", "approach", "loadout", "crew", "escape"];
export const OPERATION_STAGE_LABELS = { intel: "Rozpoznanie", approach: "Wejście", loadout: "Sprzęt", crew: "Ekipa", escape: "Odwrót" };
export const OPERATION_COOLDOWN_MS = 30 * 60 * 1000;
export const OPERATION_PHASES = { PLANNING: "planning", COMPLICATION: "complication" };
export const OPERATION_COMPLICATIONS = {
  oldtown: [
    { id: "paper-trail", title: "Ślad w księgach", summary: "Audyt zamyka wyjście. Musisz zdecydować, co poświęcić, zanim dokumenty trafią na biurko śledczych." },
    { id: "silent-alarm", title: "Cichy alarm kancelarii", summary: "Ochrona jeszcze nie wie, którego frontu szuka. Szybka decyzja może uratować legendę albo cały łup." },
  ],
  neon: [
    { id: "vip-witness", title: "Świadek na zapleczu", summary: "VIP rozpoznał ekipę, a ochrona blokuje korytarz. Możesz uciszyć sprawę, zmienić trasę albo iść na zwarcie." },
    { id: "double-booking", title: "Druga ekipa na piętrze", summary: "Ktoś sprzedał ten sam cel dwóm ekipom. Możesz negocjować podział, zmylić rywali albo przebić się pierwszy." },
  ],
  harbor: [
    { id: "sealed-checkpoint", title: "Zamknięty punkt kontroli", summary: "Trasa wywozu została spalona. Ładunek nadal jest twój, ale każda minuta podnosi ryzyko." },
    { id: "wrong-container", title: "Podwójny manifest", summary: "Dwa kontenery mają ten sam numer. Jeden niesie łup, drugi policyjny znacznik i nie ma czasu na pełne sprawdzenie." },
  ],
  vault: [
    { id: "city-lockdown", title: "Alarm całego miasta", summary: "Skarbiec uruchomił procedurę blokady. To ostatnia decyzja: zabezpieczyć część łupu, zaryzykować wszystko albo wycofać ekipę." },
    { id: "inside-betrayal", title: "Kontakt zmienia warunki", summary: "Człowiek od środka żąda drugiej wypłaty. Bez niego wyjście nadal istnieje, lecz prowadzi przez aktywną blokadę." },
  ],
};
const CONDITIONS = [
  { id: "routine", label: "Zmiana ochrony", summary: "Łatwiejsze wejście, mniejszy transport gotówki.", successDelta: 0.04, rewardDelta: -0.08, heatDelta: -2 },
  { id: "payday", label: "Dzień wypłat", summary: "Większy łup, dodatkowa ochrona i rozgłos.", successDelta: -0.04, rewardDelta: 0.2, heatDelta: 3 },
  { id: "patrol", label: "Kontrole uliczne", summary: "Ciche wejście zyskuje 6 pp szans; siłowe traci 4 pp. Większy przypał.", successDelta: 0, rewardDelta: 0.08, heatDelta: 4 },
];

export function getOperationCondition(districtId, now = Date.now()) {
  const slot = Math.floor(now / (6 * 60 * 60 * 1000));
  const index = Math.max(0, DISTRICTS.findIndex((entry) => entry.id === districtId));
  return { ...CONDITIONS[(slot + index) % CONDITIONS.length], endsAt: (slot + 1) * 6 * 60 * 60 * 1000 };
}

export function getOperationChoiceLock(choice, player = {}) {
  if (choice.requires === "business" && !(player.businessesOwned || []).some((entry) => Number(entry.count) > 0)) return "Wymaga własnego biznesu";
  if (choice.requires === "factory" && !Object.values(player.factoriesOwned || {}).some(Boolean)) return "Wymaga własnej fabryki";
  if (choice.requires === "tool" && !player.contracts?.loadout?.tool) return "Wyposaż narzędzie kontraktowe w zakładce Itemy";
  if (choice.requires === "car" && !player.contracts?.loadout?.car) return "Wyposaż auto kontraktowe w zakładce Auta";
  return null;
}

export function getOperationUnlockReasons(operation, player = {}, now = Date.now()) {
  const profile = player.profile || player.player || {};
  const progress = normalizeOperationsState(player.operations).progress;
  const reasons = [];
  if (Number(profile.respect || 0) < operation.respect) reasons.push(`${operation.respect} RES`);
  for (const id of operation.requiresWins || []) if (!progress[id]?.wins) reasons.push(`Ukończ: ${getOperationById(id)?.name || id}`);
  if (operation.requiresAsset) {
    const reason = getOperationChoiceLock({ requires: operation.requiresAsset }, player);
    if (reason) reasons.push(reason);
  }
  const remaining = Number(progress[operation.id]?.cooldownUntil || 0) - now;
  if (remaining > 0) reasons.push(`Ochrona czujna jeszcze ${Math.ceil(remaining / 60000)} min`);
  return reasons;
}

export const OPERATION_STAGE_CHOICES = {
  intel: [
    { id: "business-cover", label: "Legalna przykrywka", summary: "Własny biznes daje dostęp do dokumentów. Taniej i ciszej, ale bez premii do wejścia.", requires: "business", cashCost: 80, leakDelta: -0.12, heatDelta: -2 },
    {
      id: "inside-tip",
      label: "Inside Tip",
      summary: "Kontakt z sali daje lepszy odczyt i mniej przeciekow.",
      cashCost: 350,
      successDelta: 0.05,
      leakDelta: -0.08,
    },
    {
      id: "street-look",
      label: "Street Look",
      summary: "Tani rekonesans z ulicy, bez gwarancji czystego wejscia.",
      cashCost: 0,
      successDelta: 0.02,
      leakDelta: 0.02,
    },
  ],
  approach: [
    {
      id: "quiet-entry",
      label: "Quiet Entry",
      summary: "Ciszej, wolniej i z mniejszym przypalem.",
      cashCost: 220,
      successDelta: 0.03,
      leakDelta: -0.04,
      heatDelta: -1,
    },
    {
      id: "hard-push",
      label: "Hard Push",
      summary: "Gruba presja na wejsciu. Szybciej, ale glosniej.",
      cashCost: 120,
      successDelta: 0.05,
      leakDelta: 0.05,
      heatDelta: 1,
    },
  ],
  loadout: [
    { id: "owned-tools", label: "Własne narzędzia", summary: "Wykorzystaj wyposażone narzędzie kontraktowe. Płacisz tylko za serwis.", requires: "tool", cashCost: 120, successDelta: 0.05, leakDelta: -0.02, retentionDelta: 0.02 },
    {
      id: "burner-kit",
      label: "Burner Kit",
      summary: "Sprzet pod ciche wejscie i spalona logistyke.",
      cashCost: 480,
      successDelta: 0.04,
      leakDelta: -0.04,
      retentionDelta: 0.02,
    },
    {
      id: "heavy-tools",
      label: "Heavy Tools",
      summary: "Wieksza sila wejscia, ale gorszy slad po robocie.",
      cashCost: 520,
      successDelta: 0.06,
      leakDelta: 0.03,
      retentionDelta: -0.01,
    },
  ],
  crew: [
    { id: "factory-logistics", label: "Załoga z zaplecza", summary: "Własna fabryka zapewnia logistykę i większy wywóz. Więcej świadków, mniej profesjonalna ekipa.", requires: "factory", cashCost: 180, retentionDelta: 0.14, leakDelta: 0.07 },
    {
      id: "tight-crew",
      label: "Tight Crew",
      summary: "Mniej ludzi, mniej przeciekow, mniejszy margines bledu.",
      cashCost: 260,
      successDelta: 0.02,
      leakDelta: -0.05,
    },
    {
      id: "full-crew",
      label: "Full Crew",
      summary: "Wieksza sila wykonawcza kosztem wiekszego ruchu.",
      cashCost: 420,
      successDelta: 0.05,
      leakDelta: 0.04,
      retentionDelta: 0.03,
    },
  ],
  escape: [
    { id: "own-car", label: "Własny samochód", summary: "Użyj wyposażonego auta. Tani odwrót, lecz policja może powiązać je z tobą.", requires: "car", cashCost: 60, successDelta: 0.04, leakDelta: 0.06, heatDelta: 2 },
    {
      id: "burner-sedan",
      label: "Burner Sedan",
      summary: "Niepozorny odjazd i mniejszy slad po wszystkim.",
      cashCost: 300,
      successDelta: 0.02,
      leakDelta: -0.03,
      retentionDelta: 0.02,
    },
    {
      id: "panel-van",
      label: "Panel Van",
      summary: "Lepszy wywoz ladunku, ale trudniej sie schowac.",
      cashCost: 360,
      successDelta: 0.03,
      leakDelta: 0.02,
      retentionDelta: 0.05,
      heatDelta: 1,
    },
  ],
};

export const OPERATION_CATALOG = [
  { id: "city-vault", name: "Skarbiec miasta", districtId: "oldtown", respect: 45, summary: "Finał sieci: trzy dzielnice, jedna robota. Dowiedź, że potrafisz połączyć całe zaplecze.", requiresWins: ["syndicate-ledger", "neon-reserve", "harbor-convoy"], prepCost: 48000, energyCost: 8, baseReward: [115000, 170000], baseSuccess: 0.3, baseLeak: 0.4, baseHeat: 25, xpGain: 90, hpLoss: [25, 40] },
  { id: "syndicate-ledger", name: "Księgi syndykatu", districtId: "oldtown", respect: 28, summary: "Biznes otwiera drzwi do finansowego zaplecza syndykatu.", requiresWins: ["ledger-pull"], requiresAsset: "business", prepCost: 9000, energyCost: 5, baseReward: [24000, 35000], baseSuccess: 0.4, baseLeak: 0.3, baseHeat: 17, xpGain: 35, hpLoss: [18, 28] },
  { id: "neon-reserve", name: "Rezerwa Neon", districtId: "neon", respect: 34, summary: "Zabezpieczony depozyt. Zwykła siła nie zastąpi własnych narzędzi.", requiresWins: ["vip-lift"], requiresAsset: "tool", prepCost: 15000, energyCost: 6, baseReward: [40000, 58000], baseSuccess: 0.36, baseLeak: 0.34, baseHeat: 19, xpGain: 45, hpLoss: [20, 30] },
  { id: "harbor-convoy", name: "Konwój portowy", districtId: "harbor", respect: 38, summary: "Przechwyć transport dzięki logistyce własnej fabryki.", requiresWins: ["dock-run"], requiresAsset: "factory", prepCost: 22000, energyCost: 7, baseReward: [58000, 85000], baseSuccess: 0.34, baseLeak: 0.37, baseHeat: 22, xpGain: 55, hpLoss: [22, 34] },
  { id: "records-exchange", name: "Wymiana archiwum", districtId: "oldtown", respect: 20, summary: "Podmień rejestr podczas przeprowadzki urzędu. Biznes daje legendę, ale finał wymaga decyzji pod presją.", requiresWins: ["ledger-pull"], requiresAsset: "business", prepCost: 5200, energyCost: 4, baseReward: [13500, 20500], baseSuccess: 0.43, baseLeak: 0.27, baseHeat: 13, xpGain: 27, hpLoss: [13, 21] },
  { id: "afterhours-take", name: "Afterhours Take", districtId: "neon", respect: 26, summary: "Przejmij nocny depozyt między zamknięciem sali a porannym liczeniem. Własne auto otwiera szybki odwrót.", requiresWins: ["vip-lift"], requiresAsset: "car", prepCost: 7600, energyCost: 5, baseReward: [19000, 28500], baseSuccess: 0.4, baseLeak: 0.31, baseHeat: 16, xpGain: 32, hpLoss: [16, 25] },
  { id: "customs-switch", name: "Podmiana celna", districtId: "harbor", respect: 30, summary: "Zmień oznaczenie ładunku w aktywnym terminalu. Narzędzie kontraktowe zastępuje brutalne wejście.", requiresWins: ["dock-run"], requiresAsset: "tool", prepCost: 10800, energyCost: 6, baseReward: [27000, 41000], baseSuccess: 0.38, baseLeak: 0.33, baseHeat: 18, xpGain: 38, hpLoss: [18, 28] },
  {
    id: "ledger-pull",
    name: "Ledger Pull",
    districtId: "oldtown",
    respect: 10,
    summary: "Wyciagniecie papierow i kopert z cichszego frontu.",
    prepCost: 900,
    energyCost: 2,
    baseReward: [2600, 3900],
    baseSuccess: 0.53,
    baseLeak: 0.22,
    baseHeat: 8,
    xpGain: 12,
    hpLoss: [8, 14],
  },
  {
    id: "vip-lift",
    name: "VIP Lift",
    districtId: "neon",
    respect: 16,
    summary: "Gruba nocna akcja pod klub, kontakt i szybki skok na stol.",
    prepCost: 1500,
    energyCost: 3,
    baseReward: [4200, 6800],
    baseSuccess: 0.49,
    baseLeak: 0.28,
    baseHeat: 11,
    xpGain: 15,
    hpLoss: [10, 18],
  },
  {
    id: "dock-run",
    name: "Dock Run",
    districtId: "harbor",
    respect: 22,
    summary: "Magazyn, odjazd i ladunek zanim miasto zdazy mrugnac.",
    prepCost: 2600,
    energyCost: 4,
    baseReward: [8200, 12800],
    baseSuccess: 0.44,
    baseLeak: 0.33,
    baseHeat: 15,
    xpGain: 20,
    hpLoss: [14, 24],
  },
];

export function getOperationById(operationId) {
  return OPERATION_CATALOG.find((entry) => entry.id === operationId) || null;
}

export function isMajorOperation(operation) {
  const safe = typeof operation === "string" ? getOperationById(operation) : operation;
  return Boolean(safe?.requiresWins?.length);
}

export function getOperationComplication(operation, seed = "") {
  const safe = typeof operation === "string" ? getOperationById(operation) : operation;
  if (!safe || !isMajorOperation(safe)) return null;
  const pool = safe.id === "city-vault" ? OPERATION_COMPLICATIONS.vault : OPERATION_COMPLICATIONS[safe.districtId];
  const suffix = Number(String(seed || "").match(/(\d+)$/)?.[1] || 0);
  return { ...pool[suffix % pool.length] };
}

const CLASS_ROUTE = {
  broker: { title: "Przepuść ślad przez legalny front", summary: "Płacisz z banku i odcinasz dokumenty od ekipy.", bankCost: 2200, successDelta: 0.08, leakDelta: -0.18, heatDelta: -4 },
  dealer: { title: "Zadym wyjście towarem", summary: "Zużywasz zapas z produkcji, żeby wymusić drugą trasę.", producedGoods: "smokes", quantity: 4, successDelta: 0.11, leakDelta: -0.08, heatDelta: 1 },
  hustler: { title: "Kup trasę barterem", summary: "Spirytus otwiera improwizowany przejazd bez płacenia ekipie.", goods: "spirytus", quantity: 5, successDelta: 0.08, leakDelta: -0.1, rewardDelta: 0.03 },
  host: { title: "Schowaj ekipę w nocnym ruchu", summary: "Dodatkowa energia pozwala przeczekać obławę i ograniczyć rozgłos.", energyCost: 2, successDelta: 0.06, leakDelta: -0.16, heatDelta: -5 },
  enforcer: { title: "Przebij kordon", summary: "Płacisz zdrowiem za mocne wyjście i zachowujesz większą część łupu.", hpCost: 12, successDelta: 0.14, leakDelta: 0.05, rewardDelta: 0.08, heatDelta: 4 },
};

const COMPLICATION_ROUTES = {
  "paper-trail": { id: "burn-ledger", title: "Spal jeden legalny front", summary: "Własny biznes bierze ślad na siebie. Tracisz część marży, ale mocno ograniczasz przeciek.", requiresBusiness: true, cashCostRate: 0.08, successDelta: 0.12, leakDelta: -0.2, rewardDelta: -0.1, heatDelta: -3 },
  "silent-alarm": { id: "freeze-alarm", title: "Zamroź system ochrony", summary: "Wyposażona elektronika kupuje kilka minut bez niszczenia legendy.", requiresElectronics: true, cashCostRate: 0.05, successDelta: 0.14, leakDelta: -0.16, heatDelta: -4 },
  "vip-witness": { id: "buy-silence", title: "Kup milczenie świadka", summary: "Wysoka wypłata dla VIP-a usuwa przeciek, ale tnie końcową marżę.", cashCostRate: 0.12, successDelta: 0.1, leakDelta: -0.22, rewardDelta: -0.12, heatDelta: -3 },
  "double-booking": { id: "split-take", title: "Podziel łup z drugą ekipą", summary: "Jeden punkt zaufania gwarantuje rozejm. Wynik jest pewniejszy, lecz część łupu znika.", trustCost: 1, successDelta: 0.15, leakDelta: -0.1, rewardDelta: -0.22, heatDelta: -2 },
  "sealed-checkpoint": { id: "change-plates", title: "Zmień samochód na trasie", summary: "Własne auto kontraktowe tworzy drugi odwrót i ogranicza ryzyko zatrzymania.", requiresCar: true, cashCostRate: 0.06, successDelta: 0.14, leakDelta: -0.14, retentionDelta: 0.03, heatDelta: -2 },
  "wrong-container": { id: "test-cargo", title: "Sprawdź znacznik narzędziem", summary: "Wyposażone narzędzie pozwala rozpoznać pułapkę kosztem czasu i części ładunku.", requiresTool: true, cashCostRate: 0.05, successDelta: 0.16, leakDelta: -0.15, rewardDelta: -0.08, heatDelta: -2 },
  "city-lockdown": { id: "seal-sector", title: "Odciąć jedną dzielnicę", summary: "Duża wypłata z banku przekierowuje blokadę i chroni większość łupu.", bankCostRate: 0.14, successDelta: 0.14, leakDelta: -0.18, rewardDelta: -0.08, heatDelta: -4 },
  "inside-betrayal": { id: "double-agent", title: "Przeciągnij kontakt z powrotem", summary: "Zaufanie i bank kupują lojalność, ale pozostawiają mniejszą marżę.", trustCost: 3, bankCostRate: 0.1, successDelta: 0.18, leakDelta: -0.2, rewardDelta: -0.12, heatDelta: -3 },
};

export function getOperationComplicationOptions(activeOperation, player = {}) {
  const operation = getOperationById(activeOperation?.operationId);
  if (!operation || activeOperation?.phase !== OPERATION_PHASES.COMPLICATION) return [];
  const scale = operation.id === "city-vault" ? 2 : 1;
  const classId = activeOperation.classIdSnapshot;
  const classRoute = CLASS_ROUTE[classId];
  const trust = Number(player?.contacts?.stories?.relations?.[operation.districtId]?.trust || 0);
  const complicationRoute = COMPLICATION_ROUTES[activeOperation?.complication?.id];
  const options = [
    { id: "push", title: "Dociśnij plan", summary: "Bez dodatkowego kosztu. Większa szansa i łup, ale wyraźnie więcej Heat oraz przecieku.", successDelta: 0.05, leakDelta: 0.08, rewardDelta: 0.08, heatDelta: 5 },
    { id: "payoff", title: "Opłać bezpieczne wyjście", summary: "Płacisz ekipie za zmianę trasy. Mniejszy ślad i mniej Heat kosztem części marży.", cashCost: Math.round(operation.prepCost * 0.18), successDelta: 0.1, leakDelta: -0.13, rewardDelta: -0.05, heatDelta: -3 },
    { id: "contact", title: "Uruchom kontakt dzielnicy", summary: "Zużywasz 2 punkty zaufania. Kontakt czyści ślad i otwiera boczne wyjście.", trustCost: 2, successDelta: 0.08, leakDelta: -0.17, heatDelta: -4 },
    ...(complicationRoute ? [{ ...complicationRoute, cashCost: Math.round(operation.prepCost * Number(complicationRoute.cashCostRate || 0)), bankCost: Math.round(operation.prepCost * Number(complicationRoute.bankCostRate || 0)) }] : []),
    ...(classRoute ? [{ id: "class", classId, ...classRoute, bankCost: Number(classRoute.bankCost || 0) * scale, quantity: Number(classRoute.quantity || 0) * scale, hpCost: Number(classRoute.hpCost || 0) * scale }] : []),
    ...(activeOperation.gangSnapshot?.joined && activeOperation.gangSnapshot?.focusDistrictId === operation.districtId
      ? [{ id: "gang", title: "Wezwij ekipę gangu", summary: "Gang osłania odwrót, ale członkowie biorą uczciwą wypłatę. Nie zwiększa to maksymalnego łupu.", cashCost: Math.round(operation.prepCost * 0.12), successDelta: 0.1, leakDelta: -0.1, rewardDelta: -0.04, heatDelta: -2 }]
      : []),
    { id: "retreat", title: "Taktyczny odwrót", summary: "Ratujesz ludzi i 12% kosztu bazowych przygotowań. Bez łupu, XP i postępu operacji.", retreat: true, refundRate: 0.12 },
  ];
  return options.map((option) => {
    const reasons = [];
    if (Number(option.cashCost || 0) > Number(player?.profile?.cash || 0)) reasons.push(`Potrzebujesz ${option.cashCost}$ gotówki`);
    if (Number(option.bankCost || 0) > Number(player?.profile?.bank || 0)) reasons.push(`Potrzebujesz ${option.bankCost}$ w banku`);
    if (option.trustCost && trust < option.trustCost) reasons.push(`Potrzebujesz ${option.trustCost} zaufania w dzielnicy`);
    if (option.goods && Number(player?.inventory?.[option.goods] || 0) < option.quantity) reasons.push(`Potrzebujesz ${option.quantity} × Spirytus`);
    if (option.producedGoods && Number(player?.producedDrugInventory?.[option.producedGoods] || 0) < option.quantity) reasons.push(`Potrzebujesz ${option.quantity} × wyprodukowany towar`);
    if (option.energyCost && Number(player?.profile?.energy || 0) < option.energyCost) reasons.push(`Potrzebujesz ${option.energyCost} EN`);
    if (option.hpCost && Number(player?.profile?.hp || 0) <= option.hpCost) reasons.push(`Potrzebujesz ponad ${option.hpCost} HP`);
    if (option.requiresBusiness && !(player?.businessesOwned || []).some((entry) => Number(entry?.count || 0) > 0)) reasons.push("Potrzebujesz własnego biznesu");
    if (option.requiresElectronics && !player?.contracts?.loadout?.electronics) reasons.push("Wyposaż elektronikę kontraktową");
    if (option.requiresCar && !player?.contracts?.loadout?.car) reasons.push("Wyposaż auto kontraktowe");
    if (option.requiresTool && !player?.contracts?.loadout?.tool) reasons.push("Wyposaż narzędzie kontraktowe");
    if (option.id === "gang" && (!player?.gang?.joined || player?.gang?.name !== activeOperation.gangSnapshot?.name)) reasons.push("Ta sama ekipa gangu musi nadal działać");
    return { ...option, reasons };
  });
}

export function getOperationChoicesForStage(stageId) {
  return OPERATION_STAGE_CHOICES[stageId] || [];
}

export function createOperationsState(overrides = {}) {
  return {
    active: null,
    history: [],
    progress: {},
    ...overrides,
  };
}

export function normalizeOperationsState(value) {
  const base = createOperationsState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const progress = {};
  for (const operation of OPERATION_CATALOG) {
    const saved = value.progress?.[operation.id];
    const legacyWins = (Array.isArray(value.history) ? value.history : []).filter((entry) => entry.operationId === operation.id && entry.success).length;
    progress[operation.id] = {
      wins: Math.max(legacyWins, Math.floor(Number(saved?.wins) || 0)),
      cooldownUntil: Math.max(0, Number(saved?.cooldownUntil) || 0),
    };
  }
  return {
    progress,
    active:
      value.active && typeof value.active === "object" && !Array.isArray(value.active)
        ? {
            id: typeof value.active.id === "string" ? value.active.id : null,
            operationId: typeof value.active.operationId === "string" ? value.active.operationId : null,
            districtId:
              DISTRICTS.find((district) => district.id === value.active.districtId)?.id ||
              getOperationById(value.active.operationId)?.districtId ||
              DISTRICTS[0].id,
            stageIndex: Math.max(0, Math.floor(Number(value.active.stageIndex || 0))),
            choiceIds:
              value.active.choiceIds && typeof value.active.choiceIds === "object" && !Array.isArray(value.active.choiceIds)
                ? { ...value.active.choiceIds }
                : {},
            prepSpent: Math.max(0, Math.floor(Number(value.active.prepSpent || 0))),
            phase: value.active.phase === OPERATION_PHASES.COMPLICATION ? OPERATION_PHASES.COMPLICATION : OPERATION_PHASES.PLANNING,
            energySpent: Boolean(value.active.energySpent),
            classIdSnapshot: typeof value.active.classIdSnapshot === "string" ? value.active.classIdSnapshot : null,
            gangSnapshot: value.active.gangSnapshot && typeof value.active.gangSnapshot === "object" ? { ...value.active.gangSnapshot } : null,
            gangEffectsSnapshot: value.active.gangEffectsSnapshot && typeof value.active.gangEffectsSnapshot === "object" ? { ...value.active.gangEffectsSnapshot } : {},
            cityEventSnapshot: value.active.cityEventSnapshot && typeof value.active.cityEventSnapshot === "object" ? { ...value.active.cityEventSnapshot } : null,
            rivalModifierSnapshot: value.active.rivalModifierSnapshot && typeof value.active.rivalModifierSnapshot === "object" ? { ...value.active.rivalModifierSnapshot } : null,
            complication: value.active.complication && typeof value.active.complication === "object" ? { ...value.active.complication } : null,
            createdAt: Math.max(0, Math.floor(Number(value.active.createdAt || 0))),
            updatedAt: Math.max(0, Math.floor(Number(value.active.updatedAt || 0))),
            expiresAt: Math.max(0, Math.floor(Number(value.active.expiresAt || 0))),
            condition: CONDITIONS.some((entry) => entry.id === value.active.condition?.id)
              ? { ...CONDITIONS.find((entry) => entry.id === value.active.condition.id), endsAt: Number(value.active.condition.endsAt || 0) } : null,
          }
        : null,
    history: Array.isArray(value.history) ? value.history.slice(0, 6) : [],
  };
}

export function createActiveOperation(operation, now = Date.now()) {
  const safeOperation =
    typeof operation === "string" ? getOperationById(operation) : getOperationById(operation?.id);
  if (!safeOperation) return null;

  return {
    id: `op-${safeOperation.id}-${now}`,
    operationId: safeOperation.id,
    districtId: safeOperation.districtId,
    stageIndex: 0,
    choiceIds: {},
    prepSpent: Number(safeOperation.prepCost || 0),
    phase: OPERATION_PHASES.PLANNING,
    energySpent: false,
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 90 * 60 * 1000,
    condition: getOperationCondition(safeOperation.districtId, now),
  };
}

export function getActiveOperationStage(activeOperation) {
  if (!activeOperation || activeOperation.phase === OPERATION_PHASES.COMPLICATION) return null;
  return OPERATION_STAGE_ORDER[Math.max(0, Math.floor(Number(activeOperation.stageIndex || 0)))] || null;
}

export function getOperationPlanEffects(activeOperation) {
  const choiceIds =
    activeOperation?.choiceIds && typeof activeOperation.choiceIds === "object"
      ? activeOperation.choiceIds
      : {};
  const totals = {
    successDelta: 0,
    leakDelta: 0,
    heatDelta: 0,
    retentionDelta: 0,
    extraCashCost: 0,
  };

  OPERATION_STAGE_ORDER.forEach((stageId) => {
    const choice = getOperationChoicesForStage(stageId).find((entry) => entry.id === choiceIds[stageId]);
    if (!choice) return;
    totals.successDelta = Number((totals.successDelta + Number(choice.successDelta || 0)).toFixed(3));
    totals.leakDelta = Number((totals.leakDelta + Number(choice.leakDelta || 0)).toFixed(3));
    totals.heatDelta = Number((totals.heatDelta + Number(choice.heatDelta || 0)).toFixed(3));
    totals.retentionDelta = Number((totals.retentionDelta + Number(choice.retentionDelta || 0)).toFixed(3));
    totals.extraCashCost += Math.max(0, Math.floor(Number(choice.cashCost || 0)));
  });

  return totals;
}

export function advanceActiveOperation(activeOperation, choiceId, now = Date.now()) {
  const safeState = normalizeOperationsState({ active: activeOperation }).active;
  if (!safeState) return null;
  const currentStage = getActiveOperationStage(safeState);
  if (!currentStage) return null;
  const choice = getOperationChoicesForStage(currentStage).find((entry) => entry.id === choiceId);
  if (!choice) return null;

  safeState.choiceIds = {
    ...(safeState.choiceIds || {}),
    [currentStage]: choice.id,
  };
  safeState.stageIndex += 1;
  safeState.prepSpent += Number(choice.cashCost || 0);
  safeState.updatedAt = now;
  return safeState;
}

export function canExecuteOperation(activeOperation) {
  return Boolean(activeOperation && activeOperation.phase !== OPERATION_PHASES.COMPLICATION && Number(activeOperation.stageIndex || 0) >= OPERATION_STAGE_ORDER.length && OPERATION_STAGE_ORDER.every((stage) => getOperationChoicesForStage(stage).some((choice) => choice.id === activeOperation.choiceIds?.[stage])));
}

export function getOperationOutcomePreview({
  operation,
  activeOperation,
  player = {},
  districtPressure = 0,
  districtInfluence = 0,
  gangEffects = {},
} = {}) {
  const safeOperation = typeof operation === "string" ? getOperationById(operation) : operation;
  if (!safeOperation) return null;

  const planEffects = getOperationPlanEffects(activeOperation);
  const pressureState = getDistrictPressureState(districtPressure);
  const statScore = Math.min(0.16, (
    Number(player.attack || 0) * 0.013 +
    Number(player.defense || 0) * 0.008 +
    Number(player.dexterity || 0) * 0.016 +
    Number(player.charisma || 0) * 0.014) * 0.15);
  const condition = activeOperation?.condition || {};
  const patrolDelta = condition.id === "patrol" ? (activeOperation?.choiceIds?.approach === "quiet-entry" ? 0.06 : activeOperation?.choiceIds?.approach === "hard-push" ? -0.04 : 0) : 0;
  const influenceBonus =
    districtInfluence >= 48 ? 0.05 : districtInfluence >= 18 ? 0.025 : 0;

  const successChance = clampOperationValue(
    Number(safeOperation.baseSuccess || 0) +
      statScore +
      Number(condition.successDelta || 0) + patrolDelta - Math.min(0.12, Math.max(0, Number(player.heat || 0)) * 0.0012) +
      Number(planEffects.successDelta || 0) +
      Number(gangEffects.operationSuccess || 0) +
      influenceBonus -
      Number(pressureState.successPenalty || 0),
    0.18,
    0.9
  );
  const leakChance = clampOperationValue(
    Number(safeOperation.baseLeak || 0) +
      Number(planEffects.leakDelta || 0) +
      Number(pressureState.leakMultiplier || 1) * 0.02 -
      Number(gangEffects.operationLeakReduction || 0),
    0.05,
    0.75
  );
  const rewardMultiplier = clampOperationValue(
    1 + Number(condition.rewardDelta || 0) + Number(planEffects.retentionDelta || 0) + Number(gangEffects.operationRetention || 0),
    0.78,
    1.35
  );
  const heatGain = Math.max(
    1,
    Math.round(
      (Number(safeOperation.baseHeat || 0) + Number(condition.heatDelta || 0) + Number(planEffects.heatDelta || 0)) *
        Number(pressureState.heistHeatMultiplier || 1)
    )
  );

  return {
    successChance: Number(successChance.toFixed(3)),
    leakChance: Number(leakChance.toFixed(3)),
    rewardMultiplier: Number(rewardMultiplier.toFixed(3)),
    heatGain,
    rewardRange: safeOperation.baseReward.map((value) => Math.floor(value * rewardMultiplier)),
    netRange: safeOperation.baseReward.map((value) => Math.floor(value * rewardMultiplier) - Number(activeOperation?.prepSpent || 0)),
    failureLoss: Math.max(180, Math.round(Number(safeOperation.prepCost || 0) * (0.42 + leakChance))),
  };
}
