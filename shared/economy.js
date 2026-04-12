export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const ECONOMY_RULES = {
  version: "alpha-v5-loop-balance",
  energy: {
    baseMax: 20,
    regenSeconds: 6 * 60,
    passiveClaimCapMinutes: 12 * 60,
    restaurantEnergyCapPerHour: 10,
  },
  bank: {
    depositFeeRate: 0.005,
    depositFeeFreeUnder: 2500,
    depositFeeMin: 10,
    withdrawFeeRate: 0.02,
    withdrawFeeMin: 15,
  },
  market: {
    updateIntervalMs: 5 * 60 * 1000,
    minMultiplier: 0.74,
    maxMultiplier: 1.7,
    npcFallbackMarkup: 1.16,
    sellRate: 0.82,
    minPriceFloor: 8,
    maxBuyPerOrder: 12,
    maxSellPerOrder: 20,
    maxSharePerOrder: 0.42,
    demandBuyWeight: 1.35,
    demandSellWeight: 0.9,
    demandDecayPerTick: 0.88,
    scarcityPriceWeight: 0.52,
    demandPriceWeight: 0.3,
    oversupplyDiscountWeight: 0.16,
    monopolyProtectionFloorRatio: 0.25,
    fallbackHardFloorUnits: 2,
  },
  casino: {
    actionCooldownSeconds: 4,
    dailyLossCapBase: 25000,
    dailyLossCapRespectWeight: 900,
    dailyLossCapLevelWeight: 2500,
    dailyLossCapHardCap: 180000,
    slot: {
      minBet: 100,
      maxBet: 6000,
      targetRtp: 0.888,
      dailyBetShareCap: 0.22,
      outcomes: [
        { id: "jackpot", weight: 8, multiplier: 28, label: "777 JACKPOT", symbols: ["7", "7", "7"] },
        { id: "triple", weight: 30, multiplier: 8, label: "Triple hit", symbols: ["BAR", "BAR", "BAR"] },
        { id: "double", weight: 120, multiplier: 2, label: "Double match", symbols: ["CHERRY", "CHERRY", "BAR"] },
        { id: "single", weight: 160, multiplier: 1.15, label: "Lucky cherry", symbols: ["CHERRY", "LEMON", "BAR"] },
        { id: "miss", weight: 682, multiplier: 0, label: "Miss", symbols: ["LEMON", "BAR", "SKULL"] },
      ],
    },
    highRisk: {
      minBet: 500,
      maxBet: 15000,
      targetRtp: 0.88,
      dailyBetShareCap: 0.35,
      winChance: 0.44,
      winMultiplier: 2,
      lossMessage: "Bank bierze pule.",
      winMessage: "Doubleshot siadl.",
    },
    blackjack: {
      targetRtp: 0.92,
      minBet: 100,
      maxBet: 5000,
      enabledPreviewOnly: true,
    },
  },
  factories: {
    warehouseUnlockRequiresFactory: true,
    baseFactorySlotLimit: 1,
    hardFactoryCap: 3,
    additionalSlotRespectBreakpoints: [28, 44],
    upkeepClaimRate: 0.12,
    launderingRate: 0.05,
    softCapPenaltyPerExtraFactory: 0.22,
    raidBaseChance: 0.03,
    raidHeatWeight: 0.0018,
    raidTierWeight: 0.025,
    raidStockWeight: 0.006,
    componentQualityBonusCap: 0.18,
  },
  boosts: {
    globalStatBonusCap: 0.24,
    maxConcurrentBoostFamilies: 2,
    defaultDurationSeconds: 30 * 60,
    defaultCooldownSeconds: 20 * 60,
    stackingDiminishing: 0.58,
    diminishingFloorWeight: 0.12,
  },
  clubs: {
    baseHourlyIncome: 180,
    visitorSpendMin: 28,
    visitorSpendMax: 64,
    maxVisitorsPerTickBase: 3,
    maxVisitorsPerTickBonusFromPopularity: 2,
    tickMinutes: 10,
    upkeepRate: 0.18,
    launderingRate: 0.06,
    heatRateFromCrowd: 0.012,
    crowdIncomeWeight: 1,
    sameCategoryDiminishing: 0.72,
    playerTrafficWeight: 0.55,
    selfTrafficWeight: 0.2,
  },
  clubPvp: {
    playerAttackCooldownSeconds: 45 * 60,
    gangAttackCooldownSeconds: 90 * 60,
    defenderShieldAfterAttackSeconds: 75 * 60,
    sameTargetRepeatCooldownSeconds: 4 * 60 * 60,
    maxIncomingAttacksPerDay: 4,
    maxIncomingFromSameAttackerPerDay: 2,
    griefProtectionRespectThreshold: 18,
    griefProtectionPowerRatio: 2.35,
    griefProtectionLossCap: 0.05,
    starterClubProtectionHours: 48,
    baseChance: 0.42,
    minChance: 0.12,
    maxChance: 0.82,
    underdogBonusCap: 0.12,
    overdogPenaltyCap: 0.14,
    sameTargetPressurePenalty: 0.06,
    clubExposureWeight: 0.14,
    attackHeatWeight: 0.0014,
    defenseHeatWeight: 0.001,
    chainPressurePerRecentAttack: 0.03,
    minStealRate: 0.05,
    maxStealRate: 0.2,
    securityUpgradeScoreWeight: 18,
    securityMaintenanceRate: 0.035,
    gangDefenseMemberWeight: 1.9,
    gangDefenseInfluenceWeight: 0.85,
    safeReserveRate: 0.65,
    raidRepairRate: 0.18,
  },
  streetIncome: {
    baseFindChance: 0.03,
    maxFindChance: 0.055,
    boostWeight: 0.0025,
    locationWeight: 0.001,
    hourlyClaimCapMultiplier: 10,
    dailyClaimCapMultiplier: 22,
    diminishingAfterRoutes: 3,
    diminishingPenaltyPerExtraRoute: 0.18,
    antiSpamSearchCooldownSeconds: 12 * 60,
    heatPerClaimUnit: 0.004,
    riskEventBaseChance: 0.035,
    riskEventHeatWeight: 0.0015,
    riskEventDistrictWeight: 0.08,
  },
  loopControl: {
    passiveSoftCapMinutes: 4 * 60,
    passiveHardCapMinutes: 12 * 60,
    idleDecayPerHourAfterSoftCap: 0.05,
    idleDecayMax: 0.4,
    freeHeistsPerWindow: 3,
    heistPressureWindowMinutes: 45,
    repeatRewardPenaltyPerRun: 0.06,
    repeatSuccessPenaltyPerRun: 0.025,
    repeatHeatMultiplierPerRun: 0.09,
    repeatHpRiskPerRun: 0.015,
    heistPressureRewardFloor: 0.72,
    heistPressureSuccessPenaltyCap: 0.14,
    heistPressureHeatMultiplierCap: 1.55,
    empireMaintenancePerIllegalAsset: 0.06,
    empireMaintenancePerExtraFactory: 0.18,
    empireMaintenancePerActiveBoostFamily: 0.08,
    empireMaintenancePerExtraStreetRoute: 0.04,
    empireMaintenanceCap: 2.4,
    factoryRaidPerIllegalBusiness: 0.012,
    factoryRaidPerActiveBoostFamily: 0.018,
    factoryRaidPerRecentBatch: 0.01,
    difficultyPenaltyPerFactoryAboveOne: 0.012,
    difficultyPenaltyPerExtraBoostFamily: 0.02,
  },
  empire: {
    clubTakeoverCost: 1750000,
    clubFoundingCashCost: 4800000,
    clubFoundingPremiumCost: 5,
  },
  premium: {
    dailyEnergyRefillCap: 2,
    maxQueueHelpersPerDay: 3,
  },
  backend: {
    rateLimitsMs: {
      authLogin: 1200,
      authRegister: 2500,
      marketTrade: 400,
      bankOperation: 700,
      casinoOperation: 900,
      heistExecute: 500,
      clubPvpPreview: 800,
    },
    validation: {
      maxMarketQuantity: 100,
      maxBankTransaction: 5000000,
      maxCasinoBet: 250000,
    },
  },
};

export const FACTORY_RULES = ECONOMY_RULES.factories;
export const BOOST_RULES = ECONOMY_RULES.boosts;
export const CLUB_RULES = ECONOMY_RULES.clubs;
export const CLUB_PVP_RULES = ECONOMY_RULES.clubPvp;
export const CASINO_RULES = ECONOMY_RULES.casino;
export const STREET_INCOME_RULES = ECONOMY_RULES.streetIncome;
export const LOOP_CONTROL_RULES = ECONOMY_RULES.loopControl;
export const BACKEND_RULES = ECONOMY_RULES.backend;

export const MARKET_PRODUCTS = [
  {
    id: "smoke",
    name: "Fajki",
    basePrice: 18,
    unlockRespect: 0,
    market: {
      streetBaseStock: 70,
      fallbackBaseStock: 22,
      streetTargetPerActivePlayer: 4,
      fallbackTargetPerActivePlayer: 1.4,
      hourlyStreetRefill: 22,
      hourlyStreetRefillPerActivePlayer: 1.4,
      hourlyFallbackRefill: 6,
      hourlyFallbackRefillPerActivePlayer: 0.5,
    },
  },
  {
    id: "spirytus",
    name: "Spirytus",
    basePrice: 34,
    unlockRespect: 0,
    market: {
      streetBaseStock: 56,
      fallbackBaseStock: 18,
      streetTargetPerActivePlayer: 3.2,
      fallbackTargetPerActivePlayer: 1.1,
      hourlyStreetRefill: 16,
      hourlyStreetRefillPerActivePlayer: 1.1,
      hourlyFallbackRefill: 5,
      hourlyFallbackRefillPerActivePlayer: 0.4,
    },
  },
  {
    id: "weed",
    name: "Ziolko",
    basePrice: 90,
    unlockRespect: 5,
    market: {
      streetBaseStock: 34,
      fallbackBaseStock: 12,
      streetTargetPerActivePlayer: 2.1,
      fallbackTargetPerActivePlayer: 0.8,
      hourlyStreetRefill: 9,
      hourlyStreetRefillPerActivePlayer: 0.75,
      hourlyFallbackRefill: 3,
      hourlyFallbackRefillPerActivePlayer: 0.28,
    },
  },
  {
    id: "speed",
    name: "Speed",
    basePrice: 180,
    unlockRespect: 9,
    market: {
      streetBaseStock: 24,
      fallbackBaseStock: 8,
      streetTargetPerActivePlayer: 1.55,
      fallbackTargetPerActivePlayer: 0.6,
      hourlyStreetRefill: 6,
      hourlyStreetRefillPerActivePlayer: 0.48,
      hourlyFallbackRefill: 2,
      hourlyFallbackRefillPerActivePlayer: 0.18,
    },
  },
  {
    id: "oxy",
    name: "Piguly",
    basePrice: 260,
    unlockRespect: 14,
    market: {
      streetBaseStock: 18,
      fallbackBaseStock: 6,
      streetTargetPerActivePlayer: 1.15,
      fallbackTargetPerActivePlayer: 0.42,
      hourlyStreetRefill: 4,
      hourlyStreetRefillPerActivePlayer: 0.32,
      hourlyFallbackRefill: 1.4,
      hourlyFallbackRefillPerActivePlayer: 0.12,
    },
  },
  {
    id: "coke",
    name: "Bialy towar",
    basePrice: 530,
    unlockRespect: 20,
    market: {
      streetBaseStock: 11,
      fallbackBaseStock: 4,
      streetTargetPerActivePlayer: 0.72,
      fallbackTargetPerActivePlayer: 0.25,
      hourlyStreetRefill: 2.1,
      hourlyStreetRefillPerActivePlayer: 0.16,
      hourlyFallbackRefill: 0.85,
      hourlyFallbackRefillPerActivePlayer: 0.08,
    },
  },
  {
    id: "crystal",
    name: "Crystal",
    basePrice: 820,
    unlockRespect: 28,
    market: {
      streetBaseStock: 8,
      fallbackBaseStock: 3,
      streetTargetPerActivePlayer: 0.5,
      fallbackTargetPerActivePlayer: 0.18,
      hourlyStreetRefill: 1.4,
      hourlyStreetRefillPerActivePlayer: 0.1,
      hourlyFallbackRefill: 0.55,
      hourlyFallbackRefillPerActivePlayer: 0.05,
    },
  },
];

export const WHOLESALE_TIERS = [
  {
    id: 1,
    name: "Zaplecze bazowe",
    unlockFactoriesOwned: 1,
    unlockRespect: 18,
    upgradeCost: 0,
    storageSlots: 6,
    orderBatchMultiplier: 1,
    qualityAccess: ["standard"],
    maintenancePerClaim: 0.02,
  },
  {
    id: 2,
    name: "Hurtownia przemyslowa",
    unlockFactoriesOwned: 1,
    unlockRespect: 28,
    upgradeCost: 145000,
    storageSlots: 10,
    orderBatchMultiplier: 1.35,
    qualityAccess: ["standard", "refined"],
    maintenancePerClaim: 0.035,
  },
  {
    id: 3,
    name: "Siec dystrybucji premium",
    unlockFactoriesOwned: 2,
    unlockRespect: 42,
    upgradeCost: 390000,
    storageSlots: 16,
    orderBatchMultiplier: 1.8,
    qualityAccess: ["standard", "refined", "elite"],
    maintenancePerClaim: 0.05,
  },
];

export const COMPONENT_QUALITY_TIERS = {
  standard: {
    id: "standard",
    label: "Standard",
    requiredWholesaleTier: 1,
    buyCostMultiplier: 1,
    yieldMultiplier: 1,
    riskModifier: 1,
    boostPotencyMultiplier: 1,
  },
  refined: {
    id: "refined",
    label: "Refined",
    requiredWholesaleTier: 2,
    buyCostMultiplier: 1.38,
    yieldMultiplier: 1.08,
    riskModifier: 0.96,
    boostPotencyMultiplier: 1.08,
  },
  elite: {
    id: "elite",
    label: "Elite",
    requiredWholesaleTier: 3,
    buyCostMultiplier: 1.82,
    yieldMultiplier: 1.15,
    riskModifier: 0.92,
    boostPotencyMultiplier: 1.15,
  },
};

export const HEIST_DEFINITIONS = [
  {
    id: "atm",
    name: "Rabuj automat z guma",
    tier: 1,
    respect: 1,
    reward: [140, 220],
    energy: 2,
    cooldownSeconds: 120,
    risk: 0.08,
    baseSuccess: 0.76,
    minSuccess: 0.45,
    maxSuccess: 0.93,
    difficultyScore: 18,
    failCashLoss: [30, 70],
    hpLoss: [4, 8],
    respectGain: [1, 1],
    heatOnSuccess: 3,
    heatOnFailure: 8,
  },
  {
    id: "snatch",
    name: "Skok na torbe kuriera",
    tier: 1,
    respect: 3,
    reward: [240, 360],
    energy: 2,
    cooldownSeconds: 180,
    risk: 0.11,
    baseSuccess: 0.72,
    minSuccess: 0.4,
    maxSuccess: 0.9,
    difficultyScore: 25,
    failCashLoss: [50, 110],
    hpLoss: [5, 10],
    respectGain: [1, 2],
    heatOnSuccess: 4,
    heatOnFailure: 10,
  },
  {
    id: "taxi",
    name: "Napad na taksowkarza",
    tier: 1,
    respect: 6,
    reward: [420, 620],
    energy: 3,
    cooldownSeconds: 300,
    risk: 0.15,
    baseSuccess: 0.69,
    minSuccess: 0.36,
    maxSuccess: 0.88,
    difficultyScore: 34,
    failCashLoss: [80, 160],
    hpLoss: [7, 12],
    respectGain: [1, 2],
    heatOnSuccess: 5,
    heatOnFailure: 12,
  },
  {
    id: "garage",
    name: "Garaz na osiedlu",
    tier: 2,
    respect: 10,
    reward: [720, 1080],
    energy: 4,
    cooldownSeconds: 420,
    risk: 0.19,
    baseSuccess: 0.66,
    minSuccess: 0.33,
    maxSuccess: 0.86,
    difficultyScore: 45,
    failCashLoss: [140, 260],
    hpLoss: [10, 16],
    respectGain: [2, 3],
    heatOnSuccess: 6,
    heatOnFailure: 14,
  },
  {
    id: "warehouse",
    name: "Magazyn hurtowni",
    tier: 2,
    respect: 16,
    reward: [1250, 1850],
    energy: 5,
    cooldownSeconds: 720,
    risk: 0.24,
    baseSuccess: 0.63,
    minSuccess: 0.28,
    maxSuccess: 0.83,
    difficultyScore: 58,
    failCashLoss: [220, 420],
    hpLoss: [12, 18],
    respectGain: [2, 4],
    heatOnSuccess: 8,
    heatOnFailure: 17,
  },
  {
    id: "restaurant",
    name: "Restauracja pod ochrona",
    tier: 3,
    respect: 24,
    reward: [2300, 3300],
    energy: 6,
    cooldownSeconds: 960,
    risk: 0.3,
    baseSuccess: 0.59,
    minSuccess: 0.24,
    maxSuccess: 0.8,
    difficultyScore: 72,
    failCashLoss: [350, 650],
    hpLoss: [16, 24],
    respectGain: [3, 5],
    heatOnSuccess: 10,
    heatOnFailure: 21,
  },
  {
    id: "club",
    name: "Dyskoteka VIP",
    tier: 3,
    respect: 32,
    reward: [4200, 6000],
    energy: 8,
    cooldownSeconds: 1500,
    risk: 0.37,
    baseSuccess: 0.55,
    minSuccess: 0.2,
    maxSuccess: 0.76,
    difficultyScore: 89,
    failCashLoss: [700, 1250],
    hpLoss: [18, 28],
    respectGain: [4, 6],
    heatOnSuccess: 12,
    heatOnFailure: 25,
  },
  {
    id: "transport",
    name: "Transport zbrojny",
    tier: 4,
    respect: 42,
    reward: [7600, 10800],
    energy: 10,
    cooldownSeconds: 2400,
    risk: 0.46,
    baseSuccess: 0.49,
    minSuccess: 0.16,
    maxSuccess: 0.7,
    difficultyScore: 112,
    failCashLoss: [1200, 2200],
    hpLoss: [22, 34],
    respectGain: [5, 7],
    heatOnSuccess: 15,
    heatOnFailure: 30,
  },
  {
    id: "bank",
    name: "Skarbiec banku",
    tier: 4,
    respect: 56,
    reward: [14500, 22000],
    energy: 14,
    cooldownSeconds: 3600,
    risk: 0.55,
    baseSuccess: 0.43,
    minSuccess: 0.12,
    maxSuccess: 0.64,
    difficultyScore: 138,
    failCashLoss: [2400, 4200],
    hpLoss: [28, 42],
    respectGain: [6, 9],
    heatOnSuccess: 20,
    heatOnFailure: 38,
  },
];

export function getFactorySlotLimit(respect) {
  let slots = ECONOMY_RULES.factories.baseFactorySlotLimit;
  for (const breakpoint of ECONOMY_RULES.factories.additionalSlotRespectBreakpoints) {
    if (respect >= breakpoint) slots += 1;
  }
  return Math.min(slots, ECONOMY_RULES.factories.hardFactoryCap);
}

export function getFactoryDiminishingMultiplier(totalFactoriesOwned) {
  if (totalFactoriesOwned <= ECONOMY_RULES.factories.baseFactorySlotLimit) return 1;
  const extras = totalFactoriesOwned - ECONOMY_RULES.factories.baseFactorySlotLimit;
  return clamp(1 - extras * ECONOMY_RULES.factories.softCapPenaltyPerExtraFactory, 0.44, 1);
}

export function getWholesaleTierById(id) {
  return WHOLESALE_TIERS.find((tier) => tier.id === id) || WHOLESALE_TIERS[0];
}

export function getHighestWholesaleTierForPlayer({ factoriesOwned = 0, respect = 0 } = {}) {
  return (
    [...WHOLESALE_TIERS]
      .reverse()
      .find((tier) => factoriesOwned >= tier.unlockFactoriesOwned && respect >= tier.unlockRespect) || WHOLESALE_TIERS[0]
  );
}

export function getFactoryMaintenanceEstimate({
  grossClaim = 0,
  wholesaleTier = 1,
  totalFactoriesOwned = 1,
  illegalBusinesses = 0,
  activeBoostFamilies = 0,
  activeStreetRoutes = 0,
} = {}) {
  const tier = getWholesaleTierById(wholesaleTier);
  const upkeep = grossClaim * ECONOMY_RULES.factories.upkeepClaimRate;
  const laundering = grossClaim * ECONOMY_RULES.factories.launderingRate;
  const wholesaleMaintenance = grossClaim * tier.maintenancePerClaim;
  const diminishingPenalty = grossClaim * (1 - getFactoryDiminishingMultiplier(totalFactoriesOwned)) * 0.12;
  const baseOperationalCost =
    Math.floor(upkeep) +
    Math.floor(laundering) +
    Math.floor(wholesaleMaintenance) +
    Math.floor(diminishingPenalty);
  const scalingMultiplier = getEmpireMaintenanceMultiplier({
    ownedFactories: totalFactoriesOwned,
    illegalBusinesses,
    activeBoostFamilies,
    activeStreetRoutes,
  });
  const scalingPenalty = Math.floor(baseOperationalCost * Math.max(0, scalingMultiplier - 1));

  return {
    upkeep: Math.floor(upkeep),
    laundering: Math.floor(laundering),
    wholesaleMaintenance: Math.floor(wholesaleMaintenance),
    diminishingPenalty: Math.floor(diminishingPenalty),
    scalingMultiplier,
    scalingPenalty,
    total: baseOperationalCost + scalingPenalty,
  };
}

export function getFactoryRaidChance({
  heat = 0,
  illegalTier = 1,
  stockExposure = 0,
  totalFactoriesOwned = 1,
  illegalBusinesses = 0,
  activeBoostFamilies = 0,
  recentBatchSettlements = 0,
} = {}) {
  const base =
    ECONOMY_RULES.factories.raidBaseChance +
    heat * ECONOMY_RULES.factories.raidHeatWeight +
    illegalTier * ECONOMY_RULES.factories.raidTierWeight +
    stockExposure * ECONOMY_RULES.factories.raidStockWeight;

  const scalePenalty =
    Math.max(0, totalFactoriesOwned - 1) * 0.02 +
    illegalBusinesses * ECONOMY_RULES.loopControl.factoryRaidPerIllegalBusiness +
    activeBoostFamilies * ECONOMY_RULES.loopControl.factoryRaidPerActiveBoostFamily +
    recentBatchSettlements * ECONOMY_RULES.loopControl.factoryRaidPerRecentBatch;
  return clamp(base + scalePenalty, 0.03, 0.58);
}

export function calculateBoostEffectStack(boostEffects = []) {
  const totals = {};

  boostEffects.forEach((effect) => {
    Object.entries(effect || {}).forEach(([stat, value]) => {
      if (!value) return;
      if (!totals[stat]) totals[stat] = 0;
      const currentWeight = Math.max(
        ECONOMY_RULES.boosts.diminishingFloorWeight,
        Math.pow(ECONOMY_RULES.boosts.stackingDiminishing, totals[stat] / Math.max(1, ECONOMY_RULES.boosts.globalStatBonusCap))
      );
      totals[stat] += value * currentWeight;
    });
  });

  Object.keys(totals).forEach((stat) => {
    totals[stat] = Number(clamp(totals[stat], 0, ECONOMY_RULES.boosts.globalStatBonusCap).toFixed(3));
  });

  return totals;
}

export function getClubTickCapacity({ popularity = 0 } = {}) {
  return (
    ECONOMY_RULES.clubs.maxVisitorsPerTickBase +
    Math.min(ECONOMY_RULES.clubs.maxVisitorsPerTickBonusFromPopularity, Math.floor(popularity / 40))
  );
}

export function getClubIncomeBreakdown({
  popularity = 0,
  playerTraffic = 0,
  selfVisits = 0,
  ownedSameCategoryClubs = 1,
  tickRoll = 0.5,
} = {}) {
  const visitorsCap = getClubTickCapacity({ popularity });
  const effectiveTraffic = Math.min(
    visitorsCap,
    playerTraffic * ECONOMY_RULES.clubs.playerTrafficWeight + selfVisits * ECONOMY_RULES.clubs.selfTrafficWeight
  );
  const visitorSpend =
    ECONOMY_RULES.clubs.visitorSpendMin +
    (ECONOMY_RULES.clubs.visitorSpendMax - ECONOMY_RULES.clubs.visitorSpendMin) * clamp(tickRoll, 0, 1);
  const crowdIncome = Math.floor(effectiveTraffic * visitorSpend * ECONOMY_RULES.clubs.crowdIncomeWeight);
  const baseIncome = ECONOMY_RULES.clubs.baseHourlyIncome * (ECONOMY_RULES.clubs.tickMinutes / 60);
  const diminishing = Math.pow(ECONOMY_RULES.clubs.sameCategoryDiminishing, Math.max(0, ownedSameCategoryClubs - 1));
  const gross = Math.floor((baseIncome + crowdIncome) * diminishing);
  const upkeep = Math.floor(gross * ECONOMY_RULES.clubs.upkeepRate);
  const laundering = Math.floor(gross * ECONOMY_RULES.clubs.launderingRate);

  return {
    visitorsCap,
    effectiveTraffic,
    crowdIncome,
    baseIncome: Math.floor(baseIncome),
    gross,
    upkeep,
    laundering,
    net: Math.max(0, gross - upkeep - laundering),
    heatGain: Number((effectiveTraffic * ECONOMY_RULES.clubs.heatRateFromCrowd).toFixed(3)),
    diminishing,
  };
}

export function getStreetFindChance({ boostScore = 0, venueBonus = 0 } = {}) {
  return clamp(
    ECONOMY_RULES.streetIncome.baseFindChance +
      boostScore * ECONOMY_RULES.streetIncome.boostWeight +
      venueBonus * ECONOMY_RULES.streetIncome.locationWeight,
    ECONOMY_RULES.streetIncome.baseFindChance,
    ECONOMY_RULES.streetIncome.maxFindChance
  );
}

export function getStreetIncomeDiminishing(activeRoutes) {
  const extraRoutes = Math.max(0, activeRoutes - ECONOMY_RULES.streetIncome.diminishingAfterRoutes);
  return clamp(1 - extraRoutes * ECONOMY_RULES.streetIncome.diminishingPenaltyPerExtraRoute, 0.4, 1);
}

export function getStreetClaimCaps(baseHourlyIncome) {
  return {
    hourlyCap: Math.floor(baseHourlyIncome * ECONOMY_RULES.streetIncome.hourlyClaimCapMultiplier),
    dailyCap: Math.floor(baseHourlyIncome * ECONOMY_RULES.streetIncome.dailyClaimCapMultiplier),
  };
}

export function getStreetRiskChance({ heat = 0, districtRisk = 0 } = {}) {
  return clamp(
    ECONOMY_RULES.streetIncome.riskEventBaseChance +
      heat * ECONOMY_RULES.streetIncome.riskEventHeatWeight +
      districtRisk * ECONOMY_RULES.streetIncome.riskEventDistrictWeight,
    0.03,
    0.32
  );
}

export function getIdleClaimDecayMultiplier(minutesUnclaimed = 0) {
  const softCap = ECONOMY_RULES.loopControl.passiveSoftCapMinutes;
  const hardCap = ECONOMY_RULES.loopControl.passiveHardCapMinutes;
  const clampedMinutes = clamp(minutesUnclaimed, 0, hardCap);
  if (clampedMinutes <= softCap) return 1;

  const extraHours = (clampedMinutes - softCap) / 60;
  const penalty = Math.min(
    ECONOMY_RULES.loopControl.idleDecayMax,
    extraHours * ECONOMY_RULES.loopControl.idleDecayPerHourAfterSoftCap
  );

  return Number(clamp(1 - penalty, 1 - ECONOMY_RULES.loopControl.idleDecayMax, 1).toFixed(3));
}

export function getCasinoDailyLossCap({ respect = 0, level = 1 } = {}) {
  return clamp(
    ECONOMY_RULES.casino.dailyLossCapBase +
      respect * ECONOMY_RULES.casino.dailyLossCapRespectWeight +
      Math.max(0, level - 1) * ECONOMY_RULES.casino.dailyLossCapLevelWeight,
    ECONOMY_RULES.casino.dailyLossCapBase,
    ECONOMY_RULES.casino.dailyLossCapHardCap
  );
}

export function getCasinoBetLimits(gameId, { respect = 0, level = 1 } = {}) {
  const game = ECONOMY_RULES.casino[gameId];
  if (!game) return null;
  const dailyLossCap = getCasinoDailyLossCap({ respect, level });
  const dynamicMax = Math.floor(dailyLossCap * (game.dailyBetShareCap || 0.25));

  return {
    minBet: game.minBet,
    maxBet: Math.max(game.minBet, Math.min(game.maxBet, dynamicMax)),
    dailyLossCap,
  };
}

export function getCasinoRtpPreview(gameId) {
  if (gameId === "slot") {
    const outcomes = ECONOMY_RULES.casino.slot.outcomes;
    const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
    const rtp = outcomes.reduce((sum, outcome) => sum + (outcome.weight / totalWeight) * outcome.multiplier, 0);
    return {
      gameId,
      rtp: Number(rtp.toFixed(3)),
      houseEdge: Number((1 - rtp).toFixed(3)),
    };
  }

  if (gameId === "highRisk") {
    const rtp = ECONOMY_RULES.casino.highRisk.winChance * ECONOMY_RULES.casino.highRisk.winMultiplier;
    return {
      gameId,
      rtp: Number(rtp.toFixed(3)),
      houseEdge: Number((1 - rtp).toFixed(3)),
    };
  }

  if (gameId === "blackjack") {
    const rtp = ECONOMY_RULES.casino.blackjack.targetRtp;
    return {
      gameId,
      rtp: Number(rtp.toFixed(3)),
      houseEdge: Number((1 - rtp).toFixed(3)),
    };
  }

  return null;
}

export function getEmpireMaintenanceMultiplier({
  ownedFactories = 0,
  illegalBusinesses = 0,
  activeBoostFamilies = 0,
  activeStreetRoutes = 0,
} = {}) {
  const extraFactories = Math.max(0, ownedFactories - 1);
  const extraRoutes = Math.max(0, activeStreetRoutes - 2);

  const multiplier =
    1 +
    extraFactories * ECONOMY_RULES.loopControl.empireMaintenancePerExtraFactory +
    illegalBusinesses * ECONOMY_RULES.loopControl.empireMaintenancePerIllegalAsset +
    activeBoostFamilies * ECONOMY_RULES.loopControl.empireMaintenancePerActiveBoostFamily +
    extraRoutes * ECONOMY_RULES.loopControl.empireMaintenancePerExtraStreetRoute;

  return Number(clamp(multiplier, 1, ECONOMY_RULES.loopControl.empireMaintenanceCap).toFixed(3));
}

export function getHeistPressureState({
  recentHeistsInWindow = 0,
  activeBoostFamilies = 0,
  ownedFactories = 0,
  heat = 0,
  tier = 1,
} = {}) {
  const overflowRuns = Math.max(0, recentHeistsInWindow - ECONOMY_RULES.loopControl.freeHeistsPerWindow);
  const extraBoostFamilies = Math.max(0, activeBoostFamilies - 1);
  const extraFactories = Math.max(0, ownedFactories - 1);
  const highTierPressure = Math.max(0, tier - 2);

  const successPenalty = clamp(
    overflowRuns * ECONOMY_RULES.loopControl.repeatSuccessPenaltyPerRun +
      extraBoostFamilies * ECONOMY_RULES.loopControl.difficultyPenaltyPerExtraBoostFamily +
      extraFactories * ECONOMY_RULES.loopControl.difficultyPenaltyPerFactoryAboveOne +
      highTierPressure * 0.01,
    0,
    ECONOMY_RULES.loopControl.heistPressureSuccessPenaltyCap
  );

  const rewardMultiplier = clamp(
    1 -
      overflowRuns * ECONOMY_RULES.loopControl.repeatRewardPenaltyPerRun -
      extraBoostFamilies * 0.03 -
      highTierPressure * 0.015,
    ECONOMY_RULES.loopControl.heistPressureRewardFloor,
    1
  );

  const heatMultiplier = clamp(
    1 +
      overflowRuns * ECONOMY_RULES.loopControl.repeatHeatMultiplierPerRun +
      extraFactories * 0.06 +
      highTierPressure * 0.05,
    1,
    ECONOMY_RULES.loopControl.heistPressureHeatMultiplierCap
  );

  const hpRiskBonus = clamp(
    overflowRuns * ECONOMY_RULES.loopControl.repeatHpRiskPerRun + heat * 0.0008,
    0,
    0.1
  );

  return {
    overflowRuns,
    successPenalty: Number(successPenalty.toFixed(3)),
    rewardMultiplier: Number(rewardMultiplier.toFixed(3)),
    heatMultiplier: Number(heatMultiplier.toFixed(3)),
    hpRiskBonus: Number(hpRiskBonus.toFixed(3)),
    pressureWindowMinutes: ECONOMY_RULES.loopControl.heistPressureWindowMinutes,
  };
}

export function getClubSecurityUpkeep({ clubSecurityLevel = 0, baseNet = 0 } = {}) {
  return Math.floor(baseNet * ECONOMY_RULES.clubPvp.securityMaintenanceRate * Math.max(0, clubSecurityLevel));
}

export function getClubAttackScore({
  attack = 0,
  defense = 0,
  dexterity = 0,
  respect = 0,
  heat = 0,
  committedCrew = 1,
  gangMembers = 0,
  gangInfluence = 0,
  intelBonus = 0,
} = {}) {
  const coreStats = attack * 1.18 + dexterity * 1.06 + defense * 0.42 + respect * 0.58;
  const gangSupport = gangMembers * 2.35 + gangInfluence * 1.8;
  const crewPressure = Math.max(0, committedCrew - 1) * 7.5;
  const heatPenalty = heat * ECONOMY_RULES.clubPvp.attackHeatWeight * 100;
  return Math.max(1, Number((coreStats + gangSupport + crewPressure + intelBonus - heatPenalty).toFixed(2)));
}

export function getClubDefenseScore({
  ownerDefense = 0,
  ownerAttack = 0,
  ownerDexterity = 0,
  ownerRespect = 0,
  ownerHeat = 0,
  clubSecurityLevel = 0,
  gangMembers = 0,
  gangInfluence = 0,
  popularity = 0,
  mood = 0,
  recentTraffic = 0,
} = {}) {
  const coreStats = ownerDefense * 1.16 + ownerAttack * 0.34 + ownerDexterity * 0.52 + ownerRespect * 0.44;
  const securityScore = clubSecurityLevel * ECONOMY_RULES.clubPvp.securityUpgradeScoreWeight;
  const gangSupport =
    gangMembers * ECONOMY_RULES.clubPvp.gangDefenseMemberWeight +
    gangInfluence * ECONOMY_RULES.clubPvp.gangDefenseInfluenceWeight;
  const venueStability = popularity * 0.18 + mood * 0.12 + recentTraffic * 1.1;
  const heatDrag = ownerHeat * ECONOMY_RULES.clubPvp.defenseHeatWeight * 100;

  return Math.max(1, Number((coreStats + securityScore + gangSupport + venueStability - heatDrag).toFixed(2)));
}

export function getClubPvPUnderdogModifier({
  attackerPower = 1,
  defenderPower = 1,
  attackerRespect = 0,
  defenderRespect = 0,
} = {}) {
  const powerRatio = attackerPower / Math.max(1, defenderPower);
  const respectGap = defenderRespect - attackerRespect;

  const underdogBonus = clamp((1 - powerRatio) * 0.16 + Math.max(0, respectGap) / 220, 0, ECONOMY_RULES.clubPvp.underdogBonusCap);
  const overdogPenalty = clamp((powerRatio - 1.18) * 0.13 + Math.max(0, -respectGap) / 360, 0, ECONOMY_RULES.clubPvp.overdogPenaltyCap);

  return {
    powerRatio: Number(powerRatio.toFixed(3)),
    underdogBonus: Number(underdogBonus.toFixed(3)),
    overdogPenalty: Number(overdogPenalty.toFixed(3)),
  };
}

export function getClubRaidProtectionState({
  defenderRespect = 0,
  attackerPower = 1,
  defenderPower = 1,
  clubAgeHours = 999,
  defenderShieldSeconds = 0,
  recentIncomingAttacks = 0,
  recentIncomingFromSameAttacker = 0,
} = {}) {
  const starterShield = clubAgeHours < ECONOMY_RULES.clubPvp.starterClubProtectionHours;
  const griefProtected =
    defenderRespect < ECONOMY_RULES.clubPvp.griefProtectionRespectThreshold &&
    attackerPower / Math.max(1, defenderPower) > ECONOMY_RULES.clubPvp.griefProtectionPowerRatio;
  const shielded = defenderShieldSeconds > 0;
  const dailyCapReached = recentIncomingAttacks >= ECONOMY_RULES.clubPvp.maxIncomingAttacksPerDay;
  const sameAttackerCapReached =
    recentIncomingFromSameAttacker >= ECONOMY_RULES.clubPvp.maxIncomingFromSameAttackerPerDay;

  return {
    starterShield,
    griefProtected,
    shielded,
    dailyCapReached,
    sameAttackerCapReached,
    protected: starterShield || shielded || dailyCapReached || sameAttackerCapReached,
  };
}

export function getClubRaidChance({
  attackerPower = 1,
  defenderPower = 1,
  attackerRespect = 0,
  defenderRespect = 0,
  targetExposure = 0,
  recentIncomingAttacks = 0,
  recentIncomingFromSameAttacker = 0,
  clubAgeHours = 999,
  defenderShieldSeconds = 0,
} = {}) {
  const protection = getClubRaidProtectionState({
    defenderRespect,
    attackerPower,
    defenderPower,
    clubAgeHours,
    defenderShieldSeconds,
    recentIncomingAttacks,
    recentIncomingFromSameAttacker,
  });
  if (protection.protected) {
    return {
      chance: 0,
      blocked: true,
      protection,
      modifiers: {
        base: ECONOMY_RULES.clubPvp.baseChance,
        underdogBonus: 0,
        overdogPenalty: 0,
        exposureBonus: 0,
        chainPenalty: 0,
      },
    };
  }

  const matchup = getClubPvPUnderdogModifier({
    attackerPower,
    defenderPower,
    attackerRespect,
    defenderRespect,
  });
  const exposureBonus = clamp(targetExposure * ECONOMY_RULES.clubPvp.clubExposureWeight, 0, 0.08);
  const chainPenalty = clamp(
    recentIncomingAttacks * ECONOMY_RULES.clubPvp.chainPressurePerRecentAttack +
      recentIncomingFromSameAttacker * ECONOMY_RULES.clubPvp.sameTargetPressurePenalty,
    0,
    0.18
  );

  const chance = clamp(
    ECONOMY_RULES.clubPvp.baseChance +
      matchup.underdogBonus -
      matchup.overdogPenalty +
      exposureBonus -
      chainPenalty +
      (attackerPower - defenderPower) / 340,
    ECONOMY_RULES.clubPvp.minChance,
    ECONOMY_RULES.clubPvp.maxChance
  );

  return {
    chance: Number(chance.toFixed(3)),
    blocked: false,
    protection,
    modifiers: {
      base: ECONOMY_RULES.clubPvp.baseChance,
      underdogBonus: matchup.underdogBonus,
      overdogPenalty: matchup.overdogPenalty,
      exposureBonus: Number(exposureBonus.toFixed(3)),
      chainPenalty: Number(chainPenalty.toFixed(3)),
    },
  };
}

export function getClubRaidLoss({
  successChance = 0,
  attackRollMargin = 0,
  targetClubCash = 0,
  targetUnclaimedIncome = 0,
  targetNetWorth = 0,
  targetSecurityLevel = 0,
  defenderProtected = false,
  defenderRespect = 0,
  attackerPower = 1,
  defenderPower = 1,
} = {}) {
  const liquidPool = Math.max(0, targetClubCash + targetUnclaimedIncome);
  const safeReserve = Math.floor(liquidPool * ECONOMY_RULES.clubPvp.safeReserveRate);
  const raidablePool = Math.max(0, liquidPool - safeReserve);
  const matchup = getClubPvPUnderdogModifier({ attackerPower, defenderPower, attackerRespect: 0, defenderRespect });
  const securityMitigation = clamp(targetSecurityLevel * 0.014, 0, 0.06);
  const marginBonus = clamp(attackRollMargin * 0.12, 0, 0.05);

  let stealRate = clamp(
    ECONOMY_RULES.clubPvp.minStealRate +
      successChance * 0.08 +
      marginBonus +
      matchup.underdogBonus * 0.4 -
      securityMitigation,
    ECONOMY_RULES.clubPvp.minStealRate,
    ECONOMY_RULES.clubPvp.maxStealRate
  );

  if (defenderProtected || matchup.powerRatio > ECONOMY_RULES.clubPvp.griefProtectionPowerRatio) {
    stealRate = Math.min(stealRate, ECONOMY_RULES.clubPvp.griefProtectionLossCap);
  }

  const maxLossByWorth = Math.max(0, Math.floor(targetNetWorth * 0.035));
  const grossLoss = Math.floor(raidablePool * stealRate);
  const cashLoss = Math.max(0, Math.min(grossLoss, maxLossByWorth || grossLoss, raidablePool));
  const repairCost = Math.floor(cashLoss * ECONOMY_RULES.clubPvp.raidRepairRate);

  return {
    liquidPool,
    safeReserve,
    raidablePool,
    stealRate: Number(stealRate.toFixed(3)),
    cashLoss,
    repairCost,
  };
}

function getActivePlayerFactor(activePlayers = 1) {
  return Math.max(1, Number(activePlayers) || 1);
}

function getProductMarketTargets(product, activePlayers = 1) {
  const factor = getActivePlayerFactor(activePlayers);
  return {
    streetTarget: Math.max(1, Math.round(product.market.streetBaseStock + factor * product.market.streetTargetPerActivePlayer)),
    fallbackTarget: Math.max(
      ECONOMY_RULES.market.fallbackHardFloorUnits,
      Math.round(product.market.fallbackBaseStock + factor * product.market.fallbackTargetPerActivePlayer)
    ),
  };
}

function getMarketPricing(product, productState, activePlayers = 1) {
  const targets = getProductMarketTargets(product, activePlayers);
  const totalSupply = Math.max(0, productState.streetStock) + Math.max(0, productState.fallbackStock);
  const desiredTotalSupply = targets.streetTarget + targets.fallbackTarget;
  const scarcity = clamp((desiredTotalSupply - totalSupply) / Math.max(1, desiredTotalSupply), -0.5, 1.2);
  const oversupply = clamp((totalSupply - desiredTotalSupply) / Math.max(1, desiredTotalSupply), 0, 1.5);
  const demandPressure = clamp(productState.demandScore / Math.max(1, desiredTotalSupply), -0.9, 1.4);

  const multiplier = clamp(
    1 +
      scarcity * ECONOMY_RULES.market.scarcityPriceWeight +
      demandPressure * ECONOMY_RULES.market.demandPriceWeight -
      oversupply * ECONOMY_RULES.market.oversupplyDiscountWeight,
    ECONOMY_RULES.market.minMultiplier,
    ECONOMY_RULES.market.maxMultiplier
  );

  const streetPrice = Math.max(ECONOMY_RULES.market.minPriceFloor, Math.round(product.basePrice * multiplier));
  const fallbackPrice = Math.max(streetPrice + 1, Math.round(streetPrice * ECONOMY_RULES.market.npcFallbackMarkup));
  const sellPrice = Math.max(
    ECONOMY_RULES.market.minPriceFloor,
    Math.floor(streetPrice * ECONOMY_RULES.market.sellRate * clamp(1 - oversupply * 0.18, 0.62, 1))
  );

  return {
    streetPrice,
    fallbackPrice,
    sellPrice,
    scarcity,
    demandPressure,
    targets,
    totalSupply,
  };
}

function createProductMarketState(product, activePlayers = 1) {
  const targets = getProductMarketTargets(product, activePlayers);
  const baseState = {
    streetStock: targets.streetTarget,
    fallbackStock: targets.fallbackTarget,
    demandScore: 0,
  };

  return {
    ...baseState,
    ...getMarketPricing(product, baseState, activePlayers),
  };
}

export function createMarketState(now = Date.now(), activePlayers = 1) {
  return {
    updatedAt: now,
    products: Object.fromEntries(MARKET_PRODUCTS.map((product) => [product.id, createProductMarketState(product, activePlayers)])),
  };
}

export function rebalanceMarketState(existingState, now = Date.now(), activePlayers = 1) {
  const factor = getActivePlayerFactor(activePlayers);
  const state = existingState?.products ? existingState : createMarketState(now, factor);
  const lastUpdatedAt = state.updatedAt || now;
  const elapsedMs = now - lastUpdatedAt;
  const tickMs = ECONOMY_RULES.market.updateIntervalMs;

  if (elapsedMs < tickMs) {
    return state;
  }

  const ticks = Math.floor(elapsedMs / tickMs);
  const elapsedHours = (ticks * tickMs) / 3600000;

  for (const product of MARKET_PRODUCTS) {
    const productState = state.products[product.id] || createProductMarketState(product, factor);
    const targets = getProductMarketTargets(product, factor);
    const shortageRatioStreet = clamp((targets.streetTarget - productState.streetStock) / Math.max(1, targets.streetTarget), 0, 1.25);
    const shortageRatioFallback = clamp((targets.fallbackTarget - productState.fallbackStock) / Math.max(1, targets.fallbackTarget), 0, 1.35);

    const streetRefill = Math.ceil(
      (product.market.hourlyStreetRefill + factor * product.market.hourlyStreetRefillPerActivePlayer) * elapsedHours * (1 + shortageRatioStreet * 0.9)
    );
    const fallbackRefill = Math.ceil(
      (product.market.hourlyFallbackRefill + factor * product.market.hourlyFallbackRefillPerActivePlayer) * elapsedHours * (1 + shortageRatioFallback * 1.1)
    );

    const monopolyFloor = Math.max(
      ECONOMY_RULES.market.fallbackHardFloorUnits,
      Math.ceil(targets.fallbackTarget * ECONOMY_RULES.market.monopolyProtectionFloorRatio)
    );
    const streetHardCap = Math.ceil(targets.streetTarget * 1.55);
    const fallbackHardCap = Math.ceil(targets.fallbackTarget * 1.25);

    productState.streetStock = clamp(productState.streetStock + streetRefill, 0, streetHardCap);
    productState.fallbackStock = clamp(productState.fallbackStock + fallbackRefill, monopolyFloor, fallbackHardCap);
    productState.demandScore = Number((productState.demandScore * Math.pow(ECONOMY_RULES.market.demandDecayPerTick, ticks)).toFixed(3));

    Object.assign(productState, getMarketPricing(product, productState, factor));
    state.products[product.id] = productState;
  }

  state.updatedAt = lastUpdatedAt + ticks * tickMs;
  return state;
}

export function getMarketPublicView(state, activePlayers = 1) {
  const factor = getActivePlayerFactor(activePlayers);
  const prices = {};
  const products = {};

  for (const product of MARKET_PRODUCTS) {
    const productState = state.products[product.id] || createProductMarketState(product, factor);
    prices[product.id] = productState.streetPrice;
    products[product.id] = {
      streetStock: productState.streetStock,
      fallbackStock: productState.fallbackStock,
      totalSupply: productState.streetStock + productState.fallbackStock,
      streetPrice: productState.streetPrice,
      fallbackPrice: productState.fallbackPrice,
      sellPrice: productState.sellPrice,
      demandPressure: productState.demandPressure,
      scarcity: productState.scarcity,
      targets: productState.targets,
    };
  }

  return {
    prices,
    products,
    refreshedAt: state.updatedAt,
  };
}

export function getMarketBuyLimit(productState, quantity) {
  const totalSupply = productState.streetStock + productState.fallbackStock;
  const shareCap = Math.max(1, Math.ceil(totalSupply * ECONOMY_RULES.market.maxSharePerOrder));
  return Math.min(quantity, ECONOMY_RULES.market.maxBuyPerOrder, shareCap);
}

export function getMarketSellLimit(quantity) {
  return Math.min(quantity, ECONOMY_RULES.market.maxSellPerOrder);
}

export function getMarketBuyQuote(state, productId, quantity, activePlayers = 1) {
  const factor = getActivePlayerFactor(activePlayers);
  const product = MARKET_PRODUCTS.find((entry) => entry.id === productId);
  if (!product) return { error: "Product not found" };

  const productState = state.products[productId] || createProductMarketState(product, factor);
  const totalSupply = productState.streetStock + productState.fallbackStock;
  if (totalSupply <= 0) {
    return { error: "Product temporarily out of stock" };
  }

  const requested = Math.max(1, Number(quantity) || 1);
  const buyLimit = getMarketBuyLimit(productState, requested);
  if (requested > buyLimit) {
    return {
      error: `Order too large. Max ${buyLimit} per order at current liquidity.`,
      buyLimit,
      available: totalSupply,
    };
  }
  if (requested > totalSupply) {
    return {
      error: `Only ${totalSupply} units available right now.`,
      buyLimit,
      available: totalSupply,
    };
  }

  const streetUnits = Math.min(requested, productState.streetStock);
  const fallbackUnits = Math.max(0, requested - streetUnits);
  const total =
    streetUnits * productState.streetPrice +
    fallbackUnits * productState.fallbackPrice;

  return {
    product,
    requested,
    streetUnits,
    fallbackUnits,
    total,
    buyLimit,
    available: totalSupply,
  };
}

export function applyMarketBuy(state, productId, quantity, activePlayers = 1) {
  const quote = getMarketBuyQuote(state, productId, quantity, activePlayers);
  if (quote.error) return quote;

  const productState = state.products[productId];
  productState.streetStock -= quote.streetUnits;
  productState.fallbackStock -= quote.fallbackUnits;
  productState.demandScore += quote.requested * ECONOMY_RULES.market.demandBuyWeight;

  const product = quote.product;
  Object.assign(productState, getMarketPricing(product, productState, activePlayers));

  return {
    ...quote,
    marketState: state,
  };
}

export function applyMarketSell(state, productId, quantity, activePlayers = 1) {
  const factor = getActivePlayerFactor(activePlayers);
  const product = MARKET_PRODUCTS.find((entry) => entry.id === productId);
  if (!product) return { error: "Product not found" };

  const requested = Math.max(1, Number(quantity) || 1);
  const sellLimit = getMarketSellLimit(requested);
  if (requested > sellLimit) {
    return {
      error: `Sell order too large. Max ${sellLimit} units per order.`,
      sellLimit,
    };
  }

  const productState = state.products[productId] || createProductMarketState(product, factor);
  const payoutPerUnit = productState.sellPrice;
  const total = payoutPerUnit * requested;
  const targets = getProductMarketTargets(product, factor);
  const streetHardCap = Math.ceil(targets.streetTarget * 2.2);

  productState.streetStock = clamp(productState.streetStock + requested, 0, streetHardCap);
  productState.demandScore -= requested * ECONOMY_RULES.market.demandSellWeight;
  Object.assign(productState, getMarketPricing(product, productState, factor));
  state.products[productId] = productState;

  return {
    product,
    requested,
    payoutPerUnit,
    total,
    marketState: state,
  };
}

export function createMarketSnapshot(now = Date.now(), activePlayers = 1) {
  return getMarketPublicView(createMarketState(now, activePlayers), activePlayers).prices;
}

export function getBankDepositFee(amount) {
  if (amount < ECONOMY_RULES.bank.depositFeeFreeUnder) return 0;
  return Math.max(ECONOMY_RULES.bank.depositFeeMin, Math.floor(amount * ECONOMY_RULES.bank.depositFeeRate));
}

export function getBankWithdrawFee(amount) {
  return Math.max(ECONOMY_RULES.bank.withdrawFeeMin, Math.floor(amount * ECONOMY_RULES.bank.withdrawFeeRate));
}

export function getHeistById(id) {
  return HEIST_DEFINITIONS.find((entry) => entry.id === id) || null;
}
