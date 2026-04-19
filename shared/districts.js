const clampDistrictValue = (value, min, max) =>
  Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

export const DISTRICT_SYSTEM_RULES = {
  pressureDecayPerHour: 3.2,
  pressureReturnPerHour: 1.1,
  threatDecayPerHour: 1.8,
  actionWindowMs: 45 * 60 * 1000,
  repeatStep: 0.17,
  repeatFloor: 0.36,
  influenceEdge: 20,
  influenceControl: 52,
  influenceSoftCap: 72,
};

export const DISTRICTS = [
  {
    id: "oldtown",
    name: "Old Town",
    shortName: "Old",
    flavor: "Fronty, papier i cichy obrot.",
    assetType: "fronty",
    basePressure: 16,
    bonusLabel: "Cichsze fronty",
    bonusText: "Latwiej utrzymac spokoj i trzymac papiery w ryzach.",
    note: "Dzielnica pod fronty, male biznesy i spokojniejsze ruchy.",
  },
  {
    id: "neon",
    name: "Neon Strip",
    shortName: "Neon",
    flavor: "Kluby, VIP i glod okazji.",
    assetType: "kluby",
    basePressure: 24,
    bonusLabel: "Ruch po zmroku",
    bonusText: "Lepszy klubowy ruch i szybsze kontakty, ale gliny patrza.",
    note: "Najmocniejszy grunt pod kluby, kontakty i nocne okazje.",
  },
  {
    id: "harbor",
    name: "Harbor Line",
    shortName: "Harbor",
    flavor: "Magazyny, dostawy i szybki odjazd.",
    assetType: "operacje",
    basePressure: 20,
    bonusLabel: "Logistyka i wyjazd",
    bonusText: "Lepsze warunki pod operacje i grubsze transporty.",
    note: "Mocne miejsce pod dostawy, magazyny i grubsze roboty.",
  },
];

const FACTORY_DISTRICT_MAP = {
  smokeworks: "oldtown",
  distillery: "oldtown",
  wetlab: "neon",
  greenhouse: "neon",
  powderlab: "harbor",
  poppyworks: "harbor",
  cartelrefinery: "harbor",
  acidlab: "harbor",
  designerlab: "harbor",
};

export const DISTRICT_PRESSURE_STATES = [
  {
    id: "quiet",
    label: "Spokojnie",
    min: 0,
    max: 24,
    trafficMultiplier: 1.03,
    prepCostMultiplier: 0.97,
    leakMultiplier: 0.92,
    heistHeatMultiplier: 0.95,
    successPenalty: 0,
  },
  {
    id: "watched",
    label: "Pod okiem",
    min: 24,
    max: 49,
    trafficMultiplier: 0.97,
    prepCostMultiplier: 1.02,
    leakMultiplier: 1.04,
    heistHeatMultiplier: 1.02,
    successPenalty: 0.015,
  },
  {
    id: "crackdown",
    label: "Crackdown",
    min: 49,
    max: 74,
    trafficMultiplier: 0.86,
    prepCostMultiplier: 1.1,
    leakMultiplier: 1.2,
    heistHeatMultiplier: 1.16,
    successPenalty: 0.05,
  },
  {
    id: "lockdown",
    label: "Lockdown",
    min: 74,
    max: 101,
    trafficMultiplier: 0.68,
    prepCostMultiplier: 1.24,
    leakMultiplier: 1.38,
    heistHeatMultiplier: 1.32,
    successPenalty: 0.1,
  },
];

export function findDistrictById(districtId) {
  return DISTRICTS.find((district) => district.id === districtId) || DISTRICTS[0];
}

export function getFactoryDistrictId(factoryId) {
  return findDistrictById(FACTORY_DISTRICT_MAP[String(factoryId || "").trim()] || DISTRICTS[0].id).id;
}

export function getDistrictPressureState(pressure = 0) {
  return (
    DISTRICT_PRESSURE_STATES.find(
      (state) => Number(pressure || 0) >= state.min && Number(pressure || 0) < state.max
    ) || DISTRICT_PRESSURE_STATES[DISTRICT_PRESSURE_STATES.length - 1]
  );
}

export function getDistrictControlState(influence = 0) {
  const safeInfluence = Number(influence || 0);
  if (safeInfluence >= DISTRICT_SYSTEM_RULES.influenceControl) {
    return { id: "control", label: "Kontrola", bonusScale: 1 };
  }
  if (safeInfluence >= DISTRICT_SYSTEM_RULES.influenceEdge) {
    return { id: "edge", label: "Przewaga", bonusScale: 0.58 };
  }
  return { id: "contested", label: "Sporne", bonusScale: 0 };
}

export function createDistrictState(districtId, overrides = {}) {
  const district = findDistrictById(districtId);
  return {
    id: district.id,
    influence: 0,
    pressure: district.basePressure,
    threat: 0,
    lastSyncAt: 0,
    lastActionAt: 0,
    lastActionFamily: null,
    actionStreak: 0,
    recentEvent: null,
    ...overrides,
  };
}

export function createCityState(overrides = {}) {
  const districts = Object.fromEntries(
    DISTRICTS.map((district) => [district.id, createDistrictState(district.id)])
  );

  return {
    focusDistrictId: DISTRICTS[0].id,
    districts,
    ...overrides,
  };
}

export function normalizeDistrictState(value, districtId) {
  const district = findDistrictById(districtId);
  const base = createDistrictState(district.id);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  return {
    id: district.id,
    influence: clampDistrictValue(value.influence, 0, 999),
    pressure: clampDistrictValue(value.pressure, 0, 100),
    threat: clampDistrictValue(value.threat, 0, 100),
    lastSyncAt: Math.max(0, Math.floor(Number(value.lastSyncAt || 0))),
    lastActionAt: Math.max(0, Math.floor(Number(value.lastActionAt || 0))),
    lastActionFamily:
      typeof value.lastActionFamily === "string" && value.lastActionFamily.trim()
        ? value.lastActionFamily.trim()
        : null,
    actionStreak: Math.max(0, Math.floor(Number(value.actionStreak || 0))),
    recentEvent:
      value.recentEvent && typeof value.recentEvent === "object" && !Array.isArray(value.recentEvent)
        ? JSON.parse(JSON.stringify(value.recentEvent))
        : null,
  };
}

export function normalizeCityState(value) {
  const base = createCityState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const districts = Object.fromEntries(
    DISTRICTS.map((district) => [
      district.id,
      normalizeDistrictState(value.districts?.[district.id], district.id),
    ])
  );
  const focusDistrict = findDistrictById(value.focusDistrictId || base.focusDistrictId);

  return {
    focusDistrictId: focusDistrict.id,
    districts,
  };
}

export function syncDistrictState(districtState, now = Date.now()) {
  const district = findDistrictById(districtState?.id);
  const safeState = normalizeDistrictState(districtState, district.id);
  const lastSyncAt = safeState.lastSyncAt || now;
  const elapsedHours = Math.max(0, now - lastSyncAt) / 3600000;

  if (elapsedHours > 0) {
    if (safeState.pressure >= district.basePressure) {
      safeState.pressure = clampDistrictValue(
        safeState.pressure - elapsedHours * DISTRICT_SYSTEM_RULES.pressureDecayPerHour,
        district.basePressure,
        100
      );
    } else {
      safeState.pressure = clampDistrictValue(
        safeState.pressure + elapsedHours * DISTRICT_SYSTEM_RULES.pressureReturnPerHour,
        0,
        district.basePressure
      );
    }

    safeState.threat = clampDistrictValue(
      safeState.threat - elapsedHours * DISTRICT_SYSTEM_RULES.threatDecayPerHour,
      0,
      100
    );
  }

  safeState.lastSyncAt = now;
  return safeState;
}

export function syncCityState(cityState, now = Date.now()) {
  const safeCity = normalizeCityState(cityState);
  for (const district of DISTRICTS) {
    safeCity.districts[district.id] = syncDistrictState(safeCity.districts[district.id], now);
  }
  safeCity.focusDistrictId = findDistrictById(safeCity.focusDistrictId).id;
  return safeCity;
}

export function getDistrictActionDiminishing(districtState, actionFamily, now = Date.now()) {
  const safeState = normalizeDistrictState(districtState, districtState?.id || DISTRICTS[0].id);
  if (!actionFamily) return 1;
  if (safeState.lastActionFamily !== actionFamily) return 1;
  if (now - Number(safeState.lastActionAt || 0) > DISTRICT_SYSTEM_RULES.actionWindowMs) {
    return 1;
  }

  return Number(
    clampDistrictValue(
      1 - safeState.actionStreak * DISTRICT_SYSTEM_RULES.repeatStep,
      DISTRICT_SYSTEM_RULES.repeatFloor,
      1
    ).toFixed(3)
  );
}

export function applyDistrictActivity(
  cityState,
  {
    districtId,
    influenceDelta = 0,
    pressureDelta = 0,
    threatDelta = 0,
    actionFamily = "generic",
    eventText = "",
    now = Date.now(),
  } = {}
) {
  const safeCity = syncCityState(cityState, now);
  const district = findDistrictById(districtId || safeCity.focusDistrictId);
  const runtime = safeCity.districts[district.id] || createDistrictState(district.id);
  const previousActionAt = Number(runtime.lastActionAt || 0);
  const previousFamily = runtime.lastActionFamily;
  const diminishing = getDistrictActionDiminishing(runtime, actionFamily, now);
  const controlTax = runtime.influence >= DISTRICT_SYSTEM_RULES.influenceControl ? 0.8 : 1;
  const softCapTax = runtime.influence >= DISTRICT_SYSTEM_RULES.influenceSoftCap ? 0.58 : 1;
  const appliedInfluence = Number(
    (Number(influenceDelta || 0) * diminishing * controlTax * softCapTax).toFixed(2)
  );

  runtime.influence = clampDistrictValue(runtime.influence + appliedInfluence, 0, 999);
  runtime.pressure = clampDistrictValue(runtime.pressure + Number(pressureDelta || 0), 0, 100);
  runtime.threat = clampDistrictValue(runtime.threat + Number(threatDelta || 0), 0, 100);
  runtime.actionStreak =
    previousFamily === actionFamily &&
    now - previousActionAt <= DISTRICT_SYSTEM_RULES.actionWindowMs
      ? Math.max(1, Number(runtime.actionStreak || 0) + 1)
      : 1;
  runtime.lastActionAt = now;
  runtime.lastActionFamily = actionFamily;
  runtime.lastSyncAt = now;
  if (eventText) {
    runtime.recentEvent = {
      text: eventText,
      createdAt: now,
    };
  }
  safeCity.districts[district.id] = runtime;
  return {
    city: safeCity,
    district: runtime,
    appliedInfluence,
    pressureState: getDistrictPressureState(runtime.pressure),
    controlState: getDistrictControlState(runtime.influence),
  };
}

export function getDistrictModifierSummary(cityState, districtId) {
  const safeCity = syncCityState(cityState);
  const district = findDistrictById(districtId || safeCity.focusDistrictId);
  const runtime = safeCity.districts[district.id] || createDistrictState(district.id);
  const pressureState = getDistrictPressureState(runtime.pressure);
  const controlState = getDistrictControlState(runtime.influence);

  return {
    ...district,
    influence: runtime.influence,
    pressure: runtime.pressure,
    threat: runtime.threat,
    pressureState,
    controlState,
    pressureLabel: pressureState.label,
    controlLabel: controlState.label,
    recentEvent: runtime.recentEvent || null,
    focused: safeCity.focusDistrictId === district.id,
    influenceBonus: Number((controlState.bonusScale * 0.12).toFixed(3)),
  };
}

export function getDistrictSummaries(cityState) {
  return DISTRICTS.map((district) => getDistrictModifierSummary(cityState, district.id));
}
