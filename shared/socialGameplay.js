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

export const CLUB_SYSTEM_RULES = {
  trafficTickMinutes: 10,
  actionCooldownMs: 3 * 60 * 1000,
  leadRequired: 100,
  visitDiminishingFloor: 0.16,
  ownerSelfTrafficFactor: 0.32,
  scoutTipDailyCapPerVenue: 280,
  scoutTipCountCapPerVenue: 3,
  trafficDecayPerTick: 0.58,
  pressureDecayPerHour: 3.5,
  nightlyTrafficSoftCap: 18,
  nightlyTrafficHardCap: 34,
};

export const CLUB_NIGHT_PLANS = [
  {
    id: "showtime",
    name: "Showtime",
    summary: "Wiekszy ruch, lepsze tipy, ale klub robi sie glosniejszy.",
    scoutTipMultiplier: 1.18,
    huntMultiplier: 0.92,
    layLowMultiplier: 0.88,
    trafficMultiplier: 1.18,
    pressureMultiplier: 1.18,
    nightIncomeBonus: 0.04,
  },
  {
    id: "guestlist",
    name: "Guest List",
    summary: "Kontakty, leady i czystszy balans pod utility.",
    scoutTipMultiplier: 1,
    huntMultiplier: 1.22,
    layLowMultiplier: 1,
    trafficMultiplier: 1.06,
    pressureMultiplier: 1.03,
    nightIncomeBonus: 0.01,
  },
  {
    id: "lowlights",
    name: "Low Lights",
    summary: "Mniej szumu, mniej presji i mocniejsze bezpieczne okno.",
    scoutTipMultiplier: 0.92,
    huntMultiplier: 0.96,
    layLowMultiplier: 1.32,
    trafficMultiplier: 0.84,
    pressureMultiplier: 0.78,
    nightIncomeBonus: -0.04,
  },
];

export const CLUB_VISITOR_ACTIONS = [
  {
    id: "scout",
    name: "Scout",
    summary: "Maly tip i lekki wzrost ruchu bez gonienia RNG.",
    costCash: 0,
    baseTraffic: 1.05,
  },
  {
    id: "hunt",
    name: "Hunt Contacts",
    summary: "Placisz za wejscie i pompujesz lead meter do escort.",
    costCash: CLUB_ESCORT_SEARCH_COST,
    baseTraffic: 1.35,
  },
  {
    id: "laylow",
    name: "Lay Low",
    summary: "Troche ciszej, troche bezpieczniej, bez grubej nagrody.",
    costCash: 0,
    baseTraffic: 0.72,
  },
];

export const DEALER_START_STOCK = DRUGS.reduce((acc, drug, index) => {
  acc[drug.id] = Math.max(20, 90 - index * 4);
  return acc;
}, {});

export function clampSocialValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getClubNightPlan(planId) {
  return CLUB_NIGHT_PLANS.find((plan) => plan.id === planId) || CLUB_NIGHT_PLANS[1];
}

export function getClubVisitorAction(actionId) {
  return CLUB_VISITOR_ACTIONS.find((action) => action.id === actionId) || CLUB_VISITOR_ACTIONS[0];
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

export function createClubGuestVenueState() {
  return {
    visits: 0,
    lastVisitAt: 0,
    tipDayKey: null,
    tipValueToday: 0,
    tipCountToday: 0,
  };
}

export function createClubGuestState() {
  return {
    lastActionAt: 0,
    lastActionType: null,
    lastOutcome: null,
    lastVenueId: null,
    leadVenueId: null,
    leadEscortId: null,
    leadProgress: 0,
    leadRequired: CLUB_SYSTEM_RULES.leadRequired,
    affinity: {},
  };
}

export function createClubState(overrides = {}) {
  return {
    owned: false,
    name: "Velvet Static",
    sourceId: null,
    visitId: null,
    ownerLabel: null,
    popularity: 0,
    mood: 60,
    policeBase: 0,
    policePressure: 0,
    traffic: 0,
    lastTrafficAt: 0,
    nightPlanId: getClubNightPlan().id,
    recentIncident: null,
    note: null,
    lastRunAt: 0,
    stash: createDrugCounterMap(),
    guestState: createClubGuestState(),
    ...overrides,
  };
}

export function normalizeClubGuestState(value) {
  const base = createClubGuestState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const affinity = {};
  if (value.affinity && typeof value.affinity === "object" && !Array.isArray(value.affinity)) {
    Object.entries(value.affinity).forEach(([venueId, entry]) => {
      if (!venueId || !entry || typeof entry !== "object" || Array.isArray(entry)) return;
      affinity[venueId] = {
        visits: Math.max(0, Math.floor(Number(entry.visits || 0))),
        lastVisitAt: Math.max(0, Math.floor(Number(entry.lastVisitAt || 0))),
        tipDayKey: typeof entry.tipDayKey === "string" && entry.tipDayKey.trim() ? entry.tipDayKey.trim() : null,
        tipValueToday: Math.max(0, Math.floor(Number(entry.tipValueToday || 0))),
        tipCountToday: Math.max(0, Math.floor(Number(entry.tipCountToday || 0))),
      };
    });
  }

  return {
    lastActionAt: Math.max(0, Math.floor(Number(value.lastActionAt || 0))),
    lastActionType: typeof value.lastActionType === "string" && value.lastActionType.trim() ? value.lastActionType.trim() : null,
    lastOutcome:
      value.lastOutcome && typeof value.lastOutcome === "object" && !Array.isArray(value.lastOutcome)
        ? JSON.parse(JSON.stringify(value.lastOutcome))
        : null,
    lastVenueId: typeof value.lastVenueId === "string" && value.lastVenueId.trim() ? value.lastVenueId.trim() : null,
    leadVenueId: typeof value.leadVenueId === "string" && value.leadVenueId.trim() ? value.leadVenueId.trim() : null,
    leadEscortId: typeof value.leadEscortId === "string" && value.leadEscortId.trim() ? value.leadEscortId.trim() : null,
    leadProgress: Math.max(0, Math.floor(Number(value.leadProgress || 0))),
    leadRequired: Math.max(1, Math.floor(Number(value.leadRequired || CLUB_SYSTEM_RULES.leadRequired))),
    affinity,
  };
}

export function normalizeClubState(value) {
  const base = createClubState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  return {
    owned: Boolean(value.owned),
    name: typeof value.name === "string" && value.name.trim() ? value.name : base.name,
    sourceId: value.sourceId ?? null,
    visitId: value.visitId ?? null,
    ownerLabel: value.ownerLabel ?? null,
    popularity: Math.max(0, Math.floor(Number(value.popularity || 0))),
    mood: Math.max(0, Math.floor(Number(value.mood || 60))),
    policeBase: Math.max(0, Math.floor(Number(value.policeBase || 0))),
    policePressure: Math.max(0, Number(value.policePressure || 0)),
    traffic: Math.max(0, Number(value.traffic || 0)),
    lastTrafficAt: Math.max(0, Math.floor(Number(value.lastTrafficAt || 0))),
    nightPlanId: getClubNightPlan(value.nightPlanId).id,
    recentIncident:
      value.recentIncident && typeof value.recentIncident === "object" && !Array.isArray(value.recentIncident)
        ? JSON.parse(JSON.stringify(value.recentIncident))
        : null,
    note: value.note ?? null,
    lastRunAt: Math.max(0, Math.floor(Number(value.lastRunAt || 0))),
    stash: normalizeDrugInventory(value.stash),
    guestState: normalizeClubGuestState(value.guestState),
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

export function getClubVisitDiminishing(visits = 0, ownerSelfVisit = false) {
  const overflow = Math.max(0, Math.floor(Number(visits || 0)) - 1);
  const base = clampSocialValue(1 - overflow * 0.18, CLUB_SYSTEM_RULES.visitDiminishingFloor, 1);
  const ownerWeight = ownerSelfVisit ? CLUB_SYSTEM_RULES.ownerSelfTrafficFactor : 1;
  return Number((base * ownerWeight).toFixed(3));
}

export function getClubTrafficAfterDecay(traffic = 0, elapsedMs = 0) {
  if (traffic <= 0 || elapsedMs <= 0) return Number(Math.max(0, traffic || 0).toFixed(3));
  const tickMs = CLUB_SYSTEM_RULES.trafficTickMinutes * 60 * 1000;
  const ticks = elapsedMs / tickMs;
  return Number((Math.max(0, traffic) * Math.pow(CLUB_SYSTEM_RULES.trafficDecayPerTick, ticks)).toFixed(3));
}

export function getClubPressureAfterDecay(pressure = 0, elapsedMs = 0) {
  if (pressure <= 0 || elapsedMs <= 0) return Number(Math.max(0, pressure || 0).toFixed(2));
  const decay = (elapsedMs / 3600000) * CLUB_SYSTEM_RULES.pressureDecayPerHour;
  return Number(Math.max(0, pressure - decay).toFixed(2));
}

export function getClubPressureLabel(pressure = 0) {
  if (pressure >= 72) return "Goraco";
  if (pressure >= 46) return "Pod obserwacja";
  if (pressure >= 24) return "Czuja ruch";
  return "Spokojnie";
}

export function getClubTrafficLabel(traffic = 0) {
  if (traffic >= 22) return "Pelny ruch";
  if (traffic >= 12) return "Dobry ruch";
  if (traffic >= 5) return "Cos sie dzieje";
  return "Cicho";
}

export function getClubVenueProfile(venue, { planId } = {}) {
  if (!venue) {
    const plan = getClubNightPlan(planId);
    return {
      plan,
      prestige: 0,
      scoutTipValue: 0,
      huntProgressValue: 0,
      layLowHeat: 0,
      layLowHp: 0,
      trafficScale: 0,
      pressureScale: 0,
      nightIncomeFactor: 0.22 + plan.nightIncomeBonus,
      label: "Poza lokalem",
    };
  }

  const popularity = Number(venue.popularity || 0);
  const mood = Number(venue.mood || 0);
  const respect = Number(venue.respect || 0);
  const policeBase = Number(venue.policeBase || 0);
  const plan = getClubNightPlan(planId || venue.nightPlanId);
  const prestige = popularity * 0.56 + mood * 0.38 + respect * 0.24 - policeBase * 1.35;

  const scoutTipValue = Math.floor(
    clampSocialValue(
      (68 + popularity * 1.8 + mood * 1.2 - policeBase * 2.6) * plan.scoutTipMultiplier,
      68,
      220
    )
  );
  const huntProgressValue = Math.floor(
    clampSocialValue(
      (18 + popularity * 0.18 + mood * 0.12 + respect * 0.08 - policeBase * 0.16) * plan.huntMultiplier,
      18,
      42
    )
  );
  const layLowHeat = Math.floor(
    clampSocialValue(
      (2 + mood / 32 + Math.max(0, 12 - policeBase) / 10) * plan.layLowMultiplier,
      2,
      6
    )
  );
  const layLowHp = Math.floor(
    clampSocialValue(
      (4 + mood / 18 - policeBase / 10) * plan.layLowMultiplier,
      4,
      12
    )
  );
  const trafficScale = Number(
    clampSocialValue(
      (1 + popularity / 90 + mood / 120 - policeBase / 80) * plan.trafficMultiplier,
      0.72,
      1.92
    ).toFixed(3)
  );
  const pressureScale = Number(
    clampSocialValue(
      (1 + policeBase / 20 + popularity / 280 - mood / 360) * plan.pressureMultiplier,
      0.72,
      1.65
    ).toFixed(3)
  );
  const nightIncomeFactor = Number(
    clampSocialValue(0.22 + popularity / 300 + mood / 420 + plan.nightIncomeBonus, 0.2, 0.52).toFixed(3)
  );

  const label =
    prestige >= 78
      ? "Topowy lokal. Wpada ruch, tipy i grubsze nazwiska."
      : prestige >= 52
        ? "Mocny klub z konkretnym obrotem i dobrym zapleczem."
        : "Lokal pracuje, ale dalej trzeba go pompowac ruchem.";

  return {
    plan,
    prestige: Number(prestige.toFixed(2)),
    scoutTipValue,
    huntProgressValue,
    layLowHeat,
    layLowHp,
    trafficScale,
    pressureScale,
    nightIncomeFactor,
    label,
  };
}

export function getLeadTargetEscortForVenue({ playerRespect = 0, venue = null, planId } = {}) {
  const unlocked = ESCORTS.filter((escort) => escort.respect <= Number(playerRespect || 0));
  if (!unlocked.length) return null;

  const profile = getClubVenueProfile(venue, { planId });
  const premiumThreshold = 92;
  const midThreshold = 54;
  const prestige = profile.prestige;

  if (prestige >= premiumThreshold) {
    return unlocked[unlocked.length - 1] || unlocked[0];
  }
  if (prestige >= midThreshold) {
    return unlocked[Math.max(0, unlocked.length - 2)] || unlocked[0];
  }
  return unlocked[0];
}

export function findClubVenueById(venueId) {
  return CLUB_MARKET.find((venue) => venue.id === venueId) || null;
}
