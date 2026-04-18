export const CLUB_MARKET = [
  {
    id: "club-1",
    name: "Chrome Mirage",
    ownerLabel: "Miasto",
    respect: 20,
    takeoverCost: 1750000,
    popularity: 24,
    mood: 64,
    policeBase: 8,
    note: "Duzy lokal w centrum. Bezpieczniejszy, ale marza nizsza.",
  },
  {
    id: "club-2",
    name: "Velvet Ash",
    ownerLabel: "Grey Saints",
    respect: 28,
    takeoverCost: 1950000,
    popularity: 34,
    mood: 70,
    policeBase: 11,
    note: "Znany punkt na nocnej mapie miasta. Wyzszy ruch i wyzsza uwaga glin.",
  },
  {
    id: "club-3",
    name: "Saint Static",
    ownerLabel: "Cold Avenue",
    respect: 36,
    takeoverCost: 3250000,
    popularity: 46,
    mood: 73,
    policeBase: 14,
    note: "Gruby lokal pod VIP i mocniejszy towar. Wielkie pieniadze, wielka presja.",
  },
];

export const ESCORTS = [
  {
    id: "corner",
    name: "Uliczna panienka",
    cost: 14000,
    respect: 6,
    cashPerMinute: 70,
    sellPrice: 8500,
    note: "Tani start pod ulice. Slaby zarobek, ale szybki obrot.",
  },
  {
    id: "velvet",
    name: "Klubowa panienka",
    cost: 42000,
    respect: 14,
    cashPerMinute: 210,
    sellPrice: 26000,
    note: "Lepsza klientela i mocniejsza dzialka z nocy.",
  },
  {
    id: "vip",
    name: "VIP escort",
    cost: 98000,
    respect: 24,
    cashPerMinute: 540,
    sellPrice: 61000,
    note: "Droga zabawka pod gruba klientele i powazniejsze stawki.",
  },
];

export const DRUGS = [
  {
    id: "smokes",
    name: "Fajki",
    factoryId: "smokeworks",
    streetPrice: 65,
    unlockRespect: 0,
    batchSize: 4,
    supplies: { tobacco: 2, packaging: 1 },
    effect: { defense: 1, charisma: 1 },
    durationSeconds: 540,
    overdoseRisk: 0.01,
  },
  {
    id: "spirit",
    name: "Spirytus",
    factoryId: "distillery",
    streetPrice: 95,
    unlockRespect: 2,
    batchSize: 3,
    supplies: { grain: 2, glass: 1 },
    effect: { attack: 1, charisma: 1 },
    durationSeconds: 360,
    overdoseRisk: 0.04,
  },
  {
    id: "gbl",
    name: "GBL",
    factoryId: "wetlab",
    streetPrice: 180,
    unlockRespect: 8,
    batchSize: 2,
    supplies: { chemicals: 2, solvent: 1, glass: 1 },
    effect: { dexterity: 2, charisma: 1 },
    durationSeconds: 420,
    overdoseRisk: 0.07,
  },
  {
    id: "salvia",
    name: "Salvia",
    factoryId: "greenhouse",
    streetPrice: 150,
    unlockRespect: 10,
    batchSize: 3,
    supplies: { herbs: 2, packaging: 1 },
    effect: { charisma: 2, defense: 1 },
    durationSeconds: 480,
    overdoseRisk: 0.06,
  },
  {
    id: "shrooms",
    name: "Grzybki",
    factoryId: "greenhouse",
    streetPrice: 210,
    unlockRespect: 12,
    batchSize: 2,
    supplies: { spores: 2, herbs: 1, packaging: 1 },
    effect: { charisma: 2, dexterity: 1 },
    durationSeconds: 540,
    overdoseRisk: 0.08,
  },
  {
    id: "hash",
    name: "Hasz",
    factoryId: "greenhouse",
    streetPrice: 260,
    unlockRespect: 15,
    batchSize: 2,
    supplies: { resin: 2, herbs: 1, packaging: 1 },
    effect: { defense: 2, charisma: 1 },
    durationSeconds: 600,
    overdoseRisk: 0.07,
  },
  {
    id: "weed",
    name: "Marihuana",
    factoryId: "greenhouse",
    streetPrice: 320,
    unlockRespect: 18,
    batchSize: 2,
    supplies: { herbs: 3, packaging: 1 },
    effect: { defense: 2, dexterity: 1 },
    durationSeconds: 600,
    overdoseRisk: 0.05,
  },
  {
    id: "amphetamine",
    name: "Amfetamina",
    factoryId: "powderlab",
    streetPrice: 480,
    unlockRespect: 22,
    batchSize: 2,
    supplies: { chemicals: 2, pills: 1, packaging: 1 },
    effect: { attack: 2, dexterity: 3 },
    durationSeconds: 360,
    overdoseRisk: 0.11,
  },
  {
    id: "opium",
    name: "Opium",
    factoryId: "poppyworks",
    streetPrice: 620,
    unlockRespect: 26,
    batchSize: 2,
    supplies: { poppy: 2, glass: 1, packaging: 1 },
    effect: { defense: 3, charisma: 1 },
    durationSeconds: 420,
    overdoseRisk: 0.15,
  },
  {
    id: "rohypnol",
    name: "Rohypnol",
    factoryId: "powderlab",
    streetPrice: 760,
    unlockRespect: 30,
    batchSize: 2,
    supplies: { pharma: 2, pills: 1, packaging: 1 },
    effect: { defense: 3, dexterity: 1 },
    durationSeconds: 420,
    overdoseRisk: 0.17,
  },
  {
    id: "cocaine",
    name: "Kokaina",
    factoryId: "cartelrefinery",
    streetPrice: 980,
    unlockRespect: 34,
    batchSize: 2,
    supplies: { coca: 2, solvent: 1, packaging: 1 },
    effect: { charisma: 3, dexterity: 4 },
    durationSeconds: 300,
    overdoseRisk: 0.2,
  },
  {
    id: "heroin",
    name: "Heroina",
    factoryId: "poppyworks",
    streetPrice: 1320,
    unlockRespect: 40,
    batchSize: 1,
    supplies: { poppy: 3, chemicals: 1, glass: 1 },
    effect: { attack: 4, defense: 2 },
    durationSeconds: 300,
    overdoseRisk: 0.26,
  },
  {
    id: "lsd",
    name: "LSD",
    factoryId: "acidlab",
    streetPrice: 1580,
    unlockRespect: 46,
    batchSize: 1,
    supplies: { acid: 2, chemicals: 1, glass: 1 },
    effect: { charisma: 5, dexterity: 3 },
    durationSeconds: 300,
    overdoseRisk: 0.24,
  },
  {
    id: "ecstasy",
    name: "Extasy",
    factoryId: "designerlab",
    streetPrice: 1860,
    unlockRespect: 50,
    batchSize: 1,
    supplies: { pharma: 2, chemicals: 1, pills: 1, packaging: 1 },
    effect: { charisma: 4, defense: 2 },
    durationSeconds: 300,
    overdoseRisk: 0.19,
  },
  {
    id: "mescaline",
    name: "Meskalina",
    factoryId: "designerlab",
    streetPrice: 2280,
    unlockRespect: 56,
    batchSize: 1,
    supplies: { cactus: 2, chemicals: 1, glass: 1 },
    effect: { charisma: 4, dexterity: 2 },
    durationSeconds: 300,
    overdoseRisk: 0.22,
  },
];

export const FIGHT_CLUB_ENERGY_COST = 3;
export const FIGHT_CLUB_WIN_XP = 8;
export const CLUB_ESCORT_SEARCH_COST = 450;
export const PLAYER_BOUNTY_COST = 2500;
export const PLAYER_BOUNTY_INCREMENT = 1500;

export const DEALER_START_STOCK = DRUGS.reduce((acc, drug, index) => {
  acc[drug.id] = Math.max(20, 90 - index * 4);
  return acc;
}, {});

export function clampSocialValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function createDrugCounterMap(initialValue = 0) {
  return DRUGS.reduce((acc, item) => {
    acc[item.id] = initialValue;
    return acc;
  }, {});
}

export function createDealerInventory() {
  return { ...DEALER_START_STOCK };
}

export function createOnlineSocialState() {
  return {
    friends: [],
    messages: [],
  };
}

export function normalizeDrugInventory(value) {
  const base = createDrugCounterMap();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }
  for (const drug of DRUGS) {
    const raw = Number(value[drug.id] || 0);
    base[drug.id] = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  }
  return base;
}

export function normalizeDealerInventory(value) {
  const base = createDealerInventory();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }
  for (const drug of DRUGS) {
    const raw = Number(value[drug.id] || 0);
    base[drug.id] = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : base[drug.id];
  }
  return base;
}

export function findDrugById(drugId) {
  return DRUGS.find((drug) => drug.id === drugId) || null;
}

export function findEscortById(escortId) {
  return ESCORTS.find((escort) => escort.id === escortId) || null;
}

export function findClubVenueById(venueId) {
  return CLUB_MARKET.find((venue) => venue.id === venueId) || null;
}
