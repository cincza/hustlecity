import { clamp, CONTRACT_RULES } from "./economy.js";

export const CONTRACT_TAGS = ["stealth", "breach", "combat", "escape", "cargo"];

export const CONTRACT_LOADOUT_SLOTS = [
  { id: "weapon", label: "Bron" },
  { id: "armor", label: "Ochrona" },
  { id: "tool", label: "Narzedzia" },
  { id: "electronics", label: "Elektronika" },
  { id: "car", label: "Auto" },
];

export const CONTRACT_ITEM_CATEGORIES = CONTRACT_LOADOUT_SLOTS.filter((entry) => entry.id !== "car");

export const CONTRACT_ITEMS = [
  {
    id: "switchblade",
    category: "weapon",
    name: "Sprezynowiec",
    summary: "Lekka bron pod cichy docisk na krotkim dystansie.",
    respect: 12,
    price: 22000,
    power: 0.05,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.08, stealth: 0.04 },
  },
  {
    id: "compact-pistol",
    category: "weapon",
    name: "Compact Pistol",
    summary: "Krotka sztuka do ciasnych wejsc i cichej presji.",
    respect: 18,
    price: 56000,
    power: 0.08,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.12, stealth: 0.03 },
  },
  {
    id: "sawn-off",
    category: "weapon",
    name: "Sawn-Off",
    summary: "Brudna sila, kiedy plan ma wejsc na twardo.",
    respect: 24,
    price: 128000,
    power: 0.11,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.18, breach: 0.06 },
  },
  {
    id: "carbine",
    category: "weapon",
    name: "Street Carbine",
    summary: "Stabilna sila pod grubsze kontrakty i eskorte wyjscia.",
    respect: 32,
    price: 265000,
    power: 0.14,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.22, breach: 0.08 },
  },
  {
    id: "smart-rifle",
    category: "weapon",
    name: "Smart Rifle",
    summary: "Topowa bron pod wejscie premium i kontrolowany chaos.",
    respect: 42,
    price: 470000,
    power: 0.18,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.26, stealth: 0.05 },
  },
  {
    id: "street-vest",
    category: "armor",
    name: "Street Vest",
    summary: "Podstawowa ochrona, zeby nie wracac z kazdej wtopy na sygnale.",
    respect: 12,
    price: 26000,
    power: 0.02,
    protection: 0.08,
    heatMitigation: 0.03,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.03 },
  },
  {
    id: "plated-jacket",
    category: "armor",
    name: "Plated Jacket",
    summary: "Ciezsza kurtka pod kontakt i twardsze wejscia.",
    respect: 18,
    price: 64000,
    power: 0.03,
    protection: 0.11,
    heatMitigation: 0.04,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.05 },
  },
  {
    id: "recon-weave",
    category: "armor",
    name: "Recon Weave",
    summary: "Lzejsza ochrona, kiedy kontrakt chce ciszy i ruchu.",
    respect: 24,
    price: 138000,
    power: 0.04,
    protection: 0.1,
    heatMitigation: 0.05,
    retention: 0,
    leakReduction: 0.02,
    tags: { stealth: 0.06, escape: 0.03 },
  },
  {
    id: "assault-rig",
    category: "armor",
    name: "Assault Rig",
    summary: "Sztywniejsza platforma pod napor i trzymanie linii.",
    respect: 32,
    price: 295000,
    power: 0.05,
    protection: 0.14,
    heatMitigation: 0.06,
    retention: 0,
    leakReduction: 0,
    tags: { combat: 0.07, breach: 0.04 },
  },
  {
    id: "ghost-plate",
    category: "armor",
    name: "Ghost Plate",
    summary: "Dobra ochrona bez zabijania tempa i zejsciowego planu.",
    respect: 42,
    price: 520000,
    power: 0.06,
    protection: 0.18,
    heatMitigation: 0.08,
    retention: 0.02,
    leakReduction: 0.03,
    tags: { stealth: 0.04, escape: 0.05 },
  },
  {
    id: "lock-kit",
    category: "tool",
    name: "Lock Kit",
    summary: "Krotki zestaw pod zamki, zaplecza i szybkie drzwi serwisowe.",
    respect: 12,
    price: 24000,
    power: 0.03,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0.02,
    tags: { breach: 0.07, stealth: 0.04 },
  },
  {
    id: "glass-cutter",
    category: "tool",
    name: "Glass Cutter",
    summary: "Pomaga tam, gdzie wejscie ma zostac prawie niewidzialne.",
    respect: 18,
    price: 52000,
    power: 0.04,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0.03,
    tags: { stealth: 0.08, breach: 0.05 },
  },
  {
    id: "thermal-charge",
    category: "tool",
    name: "Thermal Charge",
    summary: "Do pancernych przeszkod, sejfow i wejsc na grubo.",
    respect: 26,
    price: 146000,
    power: 0.07,
    protection: 0,
    heatMitigation: 0,
    retention: 0,
    leakReduction: 0,
    tags: { breach: 0.15, combat: 0.04 },
  },
  {
    id: "hydraulic-ram",
    category: "tool",
    name: "Hydraulic Ram",
    summary: "Wchodzi w drzwi i bramy, kiedy liczy sie sekunda i sila.",
    respect: 34,
    price: 284000,
    power: 0.09,
    protection: 0,
    heatMitigation: 0,
    retention: 0.03,
    leakReduction: 0,
    tags: { breach: 0.18, cargo: 0.04 },
  },
  {
    id: "silent-drill",
    category: "tool",
    name: "Silent Drill",
    summary: "Endgame pod cichy breach bez rozwalania calego planu.",
    respect: 44,
    price: 498000,
    power: 0.11,
    protection: 0,
    heatMitigation: 0,
    retention: 0.02,
    leakReduction: 0.04,
    tags: { breach: 0.14, stealth: 0.12 },
  },
  {
    id: "burner-scanner",
    category: "electronics",
    name: "Burner Scanner",
    summary: "Podstawowy skan tras i szybkie czytanie kamer.",
    respect: 12,
    price: 28000,
    power: 0.03,
    protection: 0,
    heatMitigation: 0.02,
    retention: 0,
    leakReduction: 0.05,
    tags: { stealth: 0.06, escape: 0.04 },
  },
  {
    id: "signal-jammer",
    category: "electronics",
    name: "Signal Jammer",
    summary: "Przycina alarm i skraca okno przecieku po wejsciu.",
    respect: 18,
    price: 68000,
    power: 0.04,
    protection: 0,
    heatMitigation: 0.02,
    retention: 0,
    leakReduction: 0.07,
    tags: { stealth: 0.08, combat: 0.03 },
  },
  {
    id: "recon-drone",
    category: "electronics",
    name: "Recon Drone",
    summary: "Daje lepszy wglad, zanim ekipa wbije do srodka.",
    respect: 26,
    price: 158000,
    power: 0.05,
    protection: 0,
    heatMitigation: 0.03,
    retention: 0,
    leakReduction: 0.09,
    tags: { stealth: 0.1, escape: 0.04 },
  },
  {
    id: "route-scrambler",
    category: "electronics",
    name: "Route Scrambler",
    summary: "Miesza trop po robocie i pomaga wyjechac z ladunkiem.",
    respect: 34,
    price: 292000,
    power: 0.06,
    protection: 0,
    heatMitigation: 0.05,
    retention: 0.06,
    leakReduction: 0.08,
    tags: { escape: 0.12, cargo: 0.04 },
  },
  {
    id: "ghost-link",
    category: "electronics",
    name: "Ghost Link",
    summary: "Topowy pakiet pod stealth i zejscie z radaru po wszystkim.",
    respect: 44,
    price: 540000,
    power: 0.07,
    protection: 0,
    heatMitigation: 0.06,
    retention: 0.04,
    leakReduction: 0.11,
    tags: { stealth: 0.14, escape: 0.08 },
  },
];

export const CONTRACT_CARS = [
  {
    id: "ghost-bike",
    name: "Ghost Bike",
    summary: "Lekki motocykl pod ciche wejscie i szybki zjazd z miejsca.",
    respect: 10,
    price: 75000,
    power: 0.03,
    protection: 0,
    heatMitigation: 0.03,
    retention: 0.02,
    leakReduction: 0.02,
    tags: { stealth: 0.08, escape: 0.12 },
  },
  {
    id: "burner-sedan",
    name: "Burner Sedan",
    summary: "Niepozorne auto pod codzienne wyjazdy i spalona tablice.",
    respect: 16,
    price: 130000,
    power: 0.04,
    protection: 0.01,
    heatMitigation: 0.04,
    retention: 0.03,
    leakReduction: 0.03,
    tags: { stealth: 0.06, escape: 0.1 },
  },
  {
    id: "panel-van",
    name: "Panel Van",
    summary: "Kiedy kontrakt chce wywiezc ladunek, a nie tylko ekipe.",
    respect: 24,
    price: 245000,
    power: 0.05,
    protection: 0.02,
    heatMitigation: 0.03,
    retention: 0.09,
    leakReduction: 0,
    tags: { cargo: 0.14, escape: 0.06 },
  },
  {
    id: "interceptor-coupe",
    name: "Interceptor Coupe",
    summary: "Szybkie auto pod agresywny kontrakt i twardy odjazd.",
    respect: 32,
    price: 410000,
    power: 0.07,
    protection: 0.03,
    heatMitigation: 0.06,
    retention: 0.05,
    leakReduction: 0.01,
    tags: { escape: 0.16, combat: 0.06 },
  },
  {
    id: "courier-wagon",
    name: "Courier Wagon",
    summary: "Woz pod ciezszy wywoz, schowki i spokojniejsze zejscie z towarem.",
    respect: 40,
    price: 620000,
    power: 0.08,
    protection: 0.03,
    heatMitigation: 0.05,
    retention: 0.12,
    leakReduction: 0.02,
    tags: { cargo: 0.18, escape: 0.08 },
  },
  {
    id: "armored-suv",
    name: "Armored SUV",
    summary: "Topowy woz pod ciezki kontrakt, docisk i przezycie po wtapie.",
    respect: 50,
    price: 980000,
    power: 0.1,
    protection: 0.08,
    heatMitigation: 0.08,
    retention: 0.08,
    leakReduction: 0.02,
    tags: { combat: 0.12, escape: 0.12, cargo: 0.08 },
  },
];

export const CONTRACT_CATALOG = [
  {
    id: "quiet-ledger",
    name: "Quiet Ledger",
    districtId: "oldtown",
    respect: 14,
    difficulty: 2,
    summary: "Wyniesienie ksieg i kopert z cichego frontu bez robienia szumu.",
    riskLabel: "Niskie-srednie",
    entryCost: 1400,
    energyCost: 2,
    baseReward: [3400, 5200],
    baseSuccess: 0.24,
    baseHeat: 8,
    baseJailRisk: 0.18,
    xpGain: 14,
    hpLoss: [6, 12],
    recommendedStats: { attack: 10, defense: 9, dexterity: 14, charisma: 12 },
    tags: ["stealth", "escape"],
  },
  {
    id: "service-door",
    name: "Service Door",
    districtId: "oldtown",
    respect: 18,
    difficulty: 2,
    summary: "Szybkie wejscie od zaplecza i wyniesienie pakietu zanim zaskrzypia rolety.",
    riskLabel: "Srednie",
    entryCost: 2200,
    energyCost: 2,
    baseReward: [5200, 7600],
    baseSuccess: 0.22,
    baseHeat: 10,
    baseJailRisk: 0.22,
    xpGain: 16,
    hpLoss: [8, 14],
    recommendedStats: { attack: 12, defense: 11, dexterity: 15, charisma: 10 },
    tags: ["breach", "escape"],
  },
  {
    id: "neon-backroom",
    name: "Neon Backroom",
    districtId: "neon",
    respect: 24,
    difficulty: 3,
    summary: "Wejscie na zaplecze premium lokalu i czyszczenie sejfu z sali VIP.",
    riskLabel: "Srednie-wysokie",
    entryCost: 3600,
    energyCost: 3,
    baseReward: [8600, 12600],
    baseSuccess: 0.2,
    baseHeat: 13,
    baseJailRisk: 0.26,
    xpGain: 20,
    hpLoss: [10, 18],
    recommendedStats: { attack: 15, defense: 13, dexterity: 18, charisma: 13 },
    tags: ["stealth", "combat"],
  },
  {
    id: "vip-reroute",
    name: "VIP Reroute",
    districtId: "neon",
    respect: 28,
    difficulty: 3,
    summary: "Przekierowanie ruchu VIP i szybki skok na wartosciowy ladunek.",
    riskLabel: "Wysokie",
    entryCost: 4700,
    energyCost: 3,
    baseReward: [10400, 15200],
    baseSuccess: 0.18,
    baseHeat: 15,
    baseJailRisk: 0.29,
    xpGain: 22,
    hpLoss: [12, 20],
    recommendedStats: { attack: 16, defense: 14, dexterity: 19, charisma: 15 },
    tags: ["stealth", "escape", "combat"],
  },
  {
    id: "dock-crate",
    name: "Dock Crate Lift",
    districtId: "harbor",
    respect: 32,
    difficulty: 4,
    summary: "Wyjecie konkretnej skrzyni z ruchu portowego zanim ktos sklei manifest.",
    riskLabel: "Wysokie",
    entryCost: 7200,
    energyCost: 4,
    baseReward: [15200, 22800],
    baseSuccess: 0.16,
    baseHeat: 18,
    baseJailRisk: 0.34,
    xpGain: 26,
    hpLoss: [14, 22],
    recommendedStats: { attack: 18, defense: 16, dexterity: 20, charisma: 12 },
    tags: ["cargo", "escape", "breach"],
  },
  {
    id: "server-room",
    name: "Server Room Rip",
    districtId: "neon",
    respect: 36,
    difficulty: 4,
    summary: "Wbicie po czysty dump i zejscie z miasta zanim sysadmin sie ocknie.",
    riskLabel: "Wysokie",
    entryCost: 8400,
    energyCost: 4,
    baseReward: [17800, 26200],
    baseSuccess: 0.15,
    baseHeat: 20,
    baseJailRisk: 0.36,
    xpGain: 28,
    hpLoss: [14, 24],
    recommendedStats: { attack: 17, defense: 15, dexterity: 22, charisma: 15 },
    tags: ["stealth", "breach"],
  },
  {
    id: "armored-sweep",
    name: "Armored Sweep",
    districtId: "oldtown",
    respect: 40,
    difficulty: 4,
    summary: "Docisniecie transportu gotowki i utrzymanie wyjscia pod presja.",
    riskLabel: "Bardzo wysokie",
    entryCost: 11200,
    energyCost: 4,
    baseReward: [21000, 31800],
    baseSuccess: 0.14,
    baseHeat: 23,
    baseJailRisk: 0.38,
    xpGain: 30,
    hpLoss: [16, 26],
    recommendedStats: { attack: 22, defense: 19, dexterity: 18, charisma: 11 },
    tags: ["combat", "escape", "cargo"],
  },
  {
    id: "cold-storage",
    name: "Cold Storage Breach",
    districtId: "harbor",
    respect: 46,
    difficulty: 5,
    summary: "Przebicie sie przez magazyn pod monitoringiem i wywiezienie topowego ladunku.",
    riskLabel: "Ekstremalne",
    entryCost: 14800,
    energyCost: 5,
    baseReward: [28200, 41800],
    baseSuccess: 0.12,
    baseHeat: 28,
    baseJailRisk: 0.42,
    xpGain: 34,
    hpLoss: [18, 30],
    recommendedStats: { attack: 24, defense: 22, dexterity: 21, charisma: 12 },
    tags: ["breach", "cargo", "combat"],
  },
  {
    id: "penthouse-vacuum",
    name: "Penthouse Vacuum",
    districtId: "neon",
    respect: 52,
    difficulty: 5,
    summary: "Topowy kontrakt pod wejscie, czysty transfer i zejscie z wiezy bez huku.",
    riskLabel: "Ekstremalne",
    entryCost: 18600,
    energyCost: 5,
    baseReward: [34800, 52000],
    baseSuccess: 0.11,
    baseHeat: 31,
    baseJailRisk: 0.45,
    xpGain: 38,
    hpLoss: [20, 34],
    recommendedStats: { attack: 22, defense: 20, dexterity: 26, charisma: 18 },
    tags: ["stealth", "escape", "combat"],
  },
];

function normalizeOwnershipMap(value, catalog) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const validIds = new Set(catalog.map((entry) => entry.id));
  return Object.fromEntries(
    Object.entries(value)
      .map(([id, owned]) => [String(id || "").trim(), Number(owned || 0) > 0 ? 1 : 0])
      .filter(([id, owned]) => validIds.has(id) && owned > 0)
  );
}

function normalizeLoadoutSlot(slotId, value, state) {
  const normalizedId = typeof value === "string" ? value.trim() : null;
  if (!normalizedId) return null;
  if (slotId === "car") {
    return state.ownedCars?.[normalizedId] ? normalizedId : null;
  }
  const item = getContractItemById(normalizedId);
  if (!item || item.category !== slotId) return null;
  return state.ownedItems?.[normalizedId] ? normalizedId : null;
}

export function createContractState(overrides = {}) {
  return {
    ownedItems: {},
    ownedCars: {},
    loadout: {
      weapon: null,
      armor: null,
      tool: null,
      electronics: null,
      car: null,
    },
    history: [],
    ...overrides,
  };
}

export function normalizeContractState(value) {
  const base = createContractState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const state = {
    ownedItems: normalizeOwnershipMap(value.ownedItems, CONTRACT_ITEMS),
    ownedCars: normalizeOwnershipMap(value.ownedCars, CONTRACT_CARS),
    loadout: { ...base.loadout },
    history: Array.isArray(value.history) ? value.history.slice(0, CONTRACT_RULES.maxHistoryEntries || 10) : [],
  };

  for (const slot of CONTRACT_LOADOUT_SLOTS) {
    state.loadout[slot.id] = normalizeLoadoutSlot(slot.id, value.loadout?.[slot.id], state);
  }

  return state;
}

export function getContractItemById(itemId) {
  return CONTRACT_ITEMS.find((entry) => entry.id === itemId) || null;
}

export function getContractCarById(carId) {
  return CONTRACT_CARS.find((entry) => entry.id === carId) || null;
}

export function getContractById(contractId) {
  return CONTRACT_CATALOG.find((entry) => entry.id === contractId) || null;
}

export function getContractCategoryById(categoryId) {
  return CONTRACT_ITEM_CATEGORIES.find((entry) => entry.id === categoryId) || null;
}

export function getOwnedContractItems(contractState, categoryId = null) {
  const state = normalizeContractState(contractState);
  return CONTRACT_ITEMS.filter((entry) => state.ownedItems[entry.id] && (!categoryId || entry.category === categoryId));
}

export function getOwnedContractCars(contractState) {
  const state = normalizeContractState(contractState);
  return CONTRACT_CARS.filter((entry) => state.ownedCars[entry.id]);
}

export function getContractLoadoutEntries(contractState) {
  const state = normalizeContractState(contractState);
  return {
    weapon: getContractItemById(state.loadout.weapon),
    armor: getContractItemById(state.loadout.armor),
    tool: getContractItemById(state.loadout.tool),
    electronics: getContractItemById(state.loadout.electronics),
    car: getContractCarById(state.loadout.car),
  };
}

export function getContractRotationWindow(now = Date.now()) {
  const rotationMs = Math.max(60 * 60 * 1000, Number(CONTRACT_RULES.rotationHours || 4) * 60 * 60 * 1000);
  const windowIndex = Math.max(0, Math.floor(Number(now || 0) / rotationMs));
  const refreshedAt = windowIndex * rotationMs;
  return {
    rotationMs,
    windowIndex,
    refreshedAt,
    nextRefreshAt: refreshedAt + rotationMs,
  };
}

export function getActiveContractBoard(now = Date.now()) {
  const window = getContractRotationWindow(now);
  const totalContracts = CONTRACT_CATALOG.length;
  const anchor = totalContracts ? window.windowIndex % totalContracts : 0;
  const offsets = [0, 3, 6];
  const active = offsets
    .map((offset) => CONTRACT_CATALOG[(anchor + offset) % totalContracts])
    .filter(Boolean)
    .sort((left, right) => Number(left.respect || 0) - Number(right.respect || 0));

  return {
    refreshedAt: window.refreshedAt,
    nextRefreshAt: window.nextRefreshAt,
    active,
  };
}

function getWeightedStatPower(profile = {}, contract = {}) {
  const recommended = contract.recommendedStats || {};
  const weights = {
    attack: contract.tags?.includes("combat") ? 1.25 : 0.9,
    defense: contract.tags?.includes("combat") ? 1.05 : 0.85,
    dexterity: contract.tags?.includes("stealth") ? 1.3 : 1.05,
    charisma: contract.tags?.includes("stealth") ? 0.95 : 0.8,
  };
  const playerScore =
    Number(profile.attack || 0) * weights.attack +
    Number(profile.defense || 0) * weights.defense +
    Number(profile.dexterity || 0) * weights.dexterity +
    Number(profile.charisma || 0) * weights.charisma;
  const recommendedScore =
    Math.max(1, Number(recommended.attack || 0)) * weights.attack +
    Math.max(1, Number(recommended.defense || 0)) * weights.defense +
    Math.max(1, Number(recommended.dexterity || 0)) * weights.dexterity +
    Math.max(1, Number(recommended.charisma || 0)) * weights.charisma;

  return {
    playerScore,
    recommendedScore,
    ratio: clamp(playerScore / Math.max(1, recommendedScore), 0.25, 1.4),
  };
}

function getContractLoadoutMetrics(contractState, contract) {
  const loadout = getContractLoadoutEntries(contractState);
  const entries = Object.values(loadout).filter(Boolean);
  const slotCoverage = entries.length / CONTRACT_LOADOUT_SLOTS.length;
  const tagHits = {};
  let power = 0;
  let protection = 0;
  let heatMitigation = 0;
  let retention = 0;
  let leakReduction = 0;

  entries.forEach((entry) => {
    power += Number(entry.power || 0);
    protection += Number(entry.protection || 0);
    heatMitigation += Number(entry.heatMitigation || 0);
    retention += Number(entry.retention || 0);
    leakReduction += Number(entry.leakReduction || 0);
    Object.entries(entry.tags || {}).forEach(([tag, amount]) => {
      tagHits[tag] = Number((Number(tagHits[tag] || 0) + Number(amount || 0)).toFixed(3));
    });
  });

  const relevantTags = Array.isArray(contract?.tags) ? contract.tags : [];
  const matchScore = relevantTags.length
    ? relevantTags.reduce((sum, tag) => sum + Number(tagHits[tag] || 0), 0) / relevantTags.length
    : 0;

  return {
    slotCoverage,
    entries,
    power,
    protection,
    heatMitigation,
    retention,
    leakReduction,
    tagHits,
    matchScore: clamp(matchScore, 0, CONTRACT_RULES.maxTagBonusPerContract || 0.36),
  };
}

export function getContractOutcomePreview({
  contract,
  profile = {},
  contractState,
  districtSummary = null,
} = {}) {
  const safeContract = getContractById(contract?.id || contract);
  if (!safeContract) {
    return null;
  }

  const districtPressure = Number(districtSummary?.pressure || 0);
  const districtPenalty = clamp(districtPressure / 200, 0, 0.18);
  const pressureStateId = String(districtSummary?.pressureState?.id || "quiet");
  const lockdownPenalty = pressureStateId === "lockdown" ? 0.08 : pressureStateId === "crackdown" ? 0.04 : 0;
  const statPower = getWeightedStatPower(profile, safeContract);
  const loadoutMetrics = getContractLoadoutMetrics(contractState, safeContract);
  const missingSlotPenalty = (1 - loadoutMetrics.slotCoverage) * 0.26;
  const rawChance =
    Number(safeContract.baseSuccess || 0) +
    (statPower.ratio - 1) * 0.24 +
    loadoutMetrics.matchScore +
    loadoutMetrics.power * 0.8 -
    missingSlotPenalty -
    districtPenalty -
    lockdownPenalty;
  const successChance = clamp(rawChance, CONTRACT_RULES.minSuccessChance, CONTRACT_RULES.maxSuccessChance);
  const rewardMultiplier = clamp(
    0.88 +
      Math.max(0, statPower.ratio - 0.95) * 0.18 +
      loadoutMetrics.matchScore * 0.55 +
      loadoutMetrics.retention * 0.4,
    0.82,
    CONTRACT_RULES.maxRewardMultiplier || 1.38
  );
  const failDamageMultiplier = clamp(1 - loadoutMetrics.protection * 0.72, 0.46, 1.02);
  const heatGain = Math.max(
    3,
    Math.round(
      Number(safeContract.baseHeat || 0) *
        clamp(1 - loadoutMetrics.heatMitigation * 0.7, 0.55, 1.1) *
        (1 + districtPenalty * 0.8)
    )
  );
  const leakChance = clamp(
    Number(safeContract.baseJailRisk || 0) +
      districtPenalty * 0.4 +
      lockdownPenalty * 0.5 -
      loadoutMetrics.leakReduction * 0.65 -
      loadoutMetrics.matchScore * 0.3,
    0.08,
    0.74
  );
  const jailChanceOnFail = clamp(
    Number(safeContract.baseJailRisk || 0) +
      leakChance * 0.4 -
      loadoutMetrics.protection * 0.32 -
      Number(loadoutMetrics.tagHits.escape || 0) * 0.45,
    0.08,
    0.72
  );

  return {
    statRatio: Number(statPower.ratio.toFixed(3)),
    recommendedScore: Math.round(statPower.recommendedScore),
    playerScore: Math.round(statPower.playerScore),
    slotCoverage: Number(loadoutMetrics.slotCoverage.toFixed(3)),
    matchScore: Number(loadoutMetrics.matchScore.toFixed(3)),
    successChance: Number(successChance.toFixed(4)),
    rewardMultiplier: Number(rewardMultiplier.toFixed(4)),
    heatGain,
    leakChance: Number(leakChance.toFixed(4)),
    jailChanceOnFail: Number(jailChanceOnFail.toFixed(4)),
    failDamageMultiplier: Number(failDamageMultiplier.toFixed(4)),
    districtPenalty: Number((districtPenalty + lockdownPenalty).toFixed(4)),
    loadout: loadoutMetrics,
  };
}

export function getContractTagText(tags = []) {
  return (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .join(" | ");
}

export function getContractLoadoutLabel(contractState, slotId) {
  const loadout = getContractLoadoutEntries(contractState);
  const entry = loadout?.[slotId];
  return entry?.name || "Brak";
}

export function canAffordContractAsset(profile = {}, asset = {}) {
  return Number(profile.cash || 0) >= Number(asset.price || 0);
}

export function hasContractAsset(contractState, assetId, kind = "item") {
  const state = normalizeContractState(contractState);
  return kind === "car" ? Boolean(state.ownedCars?.[assetId]) : Boolean(state.ownedItems?.[assetId]);
}

export function normalizeContractHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  return {
    id: String(entry.id || `contract-history-${Date.now()}`),
    contractId: typeof entry.contractId === "string" ? entry.contractId : null,
    name: typeof entry.name === "string" ? entry.name : "Kontrakt",
    success: Boolean(entry.success),
    reward: Math.max(0, Math.floor(Number(entry.reward || 0))),
    entryCost: Math.max(0, Math.floor(Number(entry.entryCost || 0))),
    damage: Math.max(0, Math.floor(Number(entry.damage || 0))),
    heatGain: Math.max(0, Math.floor(Number(entry.heatGain || 0))),
    jailed: Boolean(entry.jailed),
    jailSeconds: Math.max(0, Math.floor(Number(entry.jailSeconds || 0))),
    time: Math.max(0, Math.floor(Number(entry.time || 0))),
  };
}
