export const RESTAURANT_ITEMS = [
  { id: "burger", name: "Burger uliczny", energy: 3, price: 90 },
  { id: "kebab", name: "Kebab XXL", energy: 5, price: 180 },
  { id: "meal", name: "Obiad ochrony", energy: 8, price: 320 },
  { id: "energybox", name: "Box energetyczny", energy: 12, price: 650 },
];

export const GYM_PASSES = [
  { id: "day", name: "Karnet 1 dzien", price: 350, durationMs: 24 * 60 * 60 * 1000 },
  { id: "week", name: "Karnet 7 dni", price: 1800, durationMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "perm", name: "Karnet na stale", price: 8500, durationMs: null },
];

export const GYM_EXERCISES = [
  { id: "power", name: "Lawka i ciezary", costEnergy: 2, gains: { attack: 2 }, note: "+2 atak" },
  { id: "guard", name: "Tarcze i obrona", costEnergy: 2, gains: { defense: 2 }, note: "+2 obrona" },
  { id: "reflex", name: "Sprint i refleks", costEnergy: 2, gains: { dexterity: 2 }, note: "+2 zrecznosc" },
  { id: "conditioning", name: "Obwod kondycyjny", costEnergy: 3, gains: { maxHp: 8, hp: 8 }, note: "+8 zdrowie max" },
];

export const PROFILE_AVATAR_IDS = ["ghost", "razor", "saint", "vandal", "boss"];

export const HOSPITAL_RULES = {
  healCost: 220,
  healHp: 30,
  healHeatReduction: 2,
  bribeBaseCost: 400,
  bribeCostPerSecond: 8,
  bribeHeatIncrease: 5,
};

export const CRITICAL_CARE_RULES = {
  public: {
    id: "public",
    label: "Publiczna intensywna",
    durationMs: 28 * 60 * 1000,
    cost: 0,
    returnHpRatio: 0.38,
    heatRelief: 0,
  },
  private: {
    id: "private",
    label: "Prywatna klinika",
    durationMs: 5 * 60 * 1000,
    cost: 10000,
    returnHpRatio: 0.66,
    heatRelief: 4,
  },
  protectionMs: 8 * 60 * 1000,
  blockedActions: [
    "Napady",
    "Fightclub",
    "Kontrakty",
    "Operacje",
    "PvP",
    "Napady gangu",
    "Najazdy gangu",
    "Silownia",
  ],
};

function clampCareModeId(modeId) {
  return String(modeId || "").trim() === CRITICAL_CARE_RULES.private.id
    ? CRITICAL_CARE_RULES.private.id
    : CRITICAL_CARE_RULES.public.id;
}

export function getCriticalCareMode(modeId) {
  const normalizedModeId = clampCareModeId(modeId);
  return CRITICAL_CARE_RULES[normalizedModeId];
}

export function isCriticalCareActive(profile, now = Date.now()) {
  return Number(profile?.criticalCareUntil || 0) > now;
}

export function hasCriticalCareProtection(profile, now = Date.now()) {
  return Number(profile?.criticalProtectionUntil || 0) > now;
}

export function getCriticalCareRemainingMs(profile, now = Date.now()) {
  return Math.max(0, Number(profile?.criticalCareUntil || 0) - now);
}

export function getCriticalCareProtectionRemainingMs(profile, now = Date.now()) {
  return Math.max(0, Number(profile?.criticalProtectionUntil || 0) - now);
}

export function getCriticalCareRecoveryHp(maxHp = 100, modeId = CRITICAL_CARE_RULES.public.id) {
  const mode = getCriticalCareMode(modeId);
  return Math.max(1, Math.round(Math.max(1, Number(maxHp || 100)) * Number(mode.returnHpRatio || 0.38)));
}

export function getCriticalCareStatus(profile, now = Date.now()) {
  const active = isCriticalCareActive(profile, now);
  const protectedAfterRelease = !active && hasCriticalCareProtection(profile, now);
  const mode = getCriticalCareMode(profile?.criticalCareMode);
  return {
    active,
    protected: protectedAfterRelease,
    source: typeof profile?.criticalCareSource === "string" ? profile.criticalCareSource.trim() : "",
    mode,
    remainingMs: active ? getCriticalCareRemainingMs(profile, now) : 0,
    protectionRemainingMs: protectedAfterRelease ? getCriticalCareProtectionRemainingMs(profile, now) : 0,
    expectedRecoveryHp: active ? getCriticalCareRecoveryHp(profile?.maxHp, mode.id) : 0,
  };
}

export function getRestaurantItemById(itemId) {
  return RESTAURANT_ITEMS.find((item) => item.id === itemId) || null;
}

export function getGymPassById(passId) {
  return GYM_PASSES.find((pass) => pass.id === passId) || null;
}

export function getGymExerciseById(exerciseId) {
  return GYM_EXERCISES.find((exercise) => exercise.id === exerciseId) || null;
}

export function isSupportedAvatarId(avatarId) {
  return PROFILE_AVATAR_IDS.includes(avatarId);
}
