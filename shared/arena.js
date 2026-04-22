import { clamp, ECONOMY_RULES } from "./economy.js";

export const ARENA_ACTION_TYPES = ["heist", "contract"];

export const ARENA_MODES = [
  {
    id: "sparring",
    label: "Sparing",
    fights: 3,
    energyPerFight: 2,
    baseChance: 0.6,
    minChance: 0.24,
    maxChance: 0.88,
    difficultyStep: 4,
    cashReward: [700, 1300],
    xpReward: [4, 6],
    damageRange: [4, 9],
    heatOnLoss: 4,
    tokenRange: [0, 1],
    streakBonusCash: { small: 250, big: 650 },
    streakBonusXp: { small: 2, big: 4 },
    summary: "Lekki ring pod rozgrzewke i szybki ruch.",
  },
  {
    id: "round",
    label: "Runda",
    fights: 3,
    energyPerFight: 3,
    baseChance: 0.5,
    minChance: 0.18,
    maxChance: 0.84,
    difficultyStep: 8,
    cashReward: [1500, 2800],
    xpReward: [6, 9],
    damageRange: [8, 15],
    heatOnLoss: 6,
    tokenRange: [1, 2],
    streakBonusCash: { small: 500, big: 1200 },
    streakBonusXp: { small: 3, big: 6 },
    summary: "Trzy twardsze walki. To glowny loop Areny.",
  },
  {
    id: "tournament",
    label: "Turniej",
    fights: 5,
    energyPerFight: 4,
    baseChance: 0.44,
    minChance: 0.14,
    maxChance: 0.8,
    difficultyStep: 12,
    cashReward: [2400, 4300],
    xpReward: [8, 12],
    damageRange: [12, 22],
    heatOnLoss: 8,
    tokenRange: [2, 3],
    streakBonusCash: { small: 900, big: 2100 },
    streakBonusXp: { small: 4, big: 8 },
    summary: "Dluzszy run z wieksza kasa i ostrzejsza kara.",
  },
];

export const ARENA_STYLES = [
  {
    id: "aggression",
    label: "Agresja",
    shortLabel: "Agresja",
    statLabel: "ATK",
    weights: { attack: 1.18, defense: 0.9, dexterity: 1.02 },
    note: "Mocniej dociska sila i szybkie wejscie.",
  },
  {
    id: "technique",
    label: "Technika",
    shortLabel: "Technika",
    statLabel: "DEX",
    weights: { attack: 1, defense: 0.94, dexterity: 1.18 },
    note: "Lepsza na czysta robote i czytanie ruchu.",
  },
  {
    id: "defense",
    label: "Defensywa",
    shortLabel: "Defensywa",
    statLabel: "DEF",
    weights: { attack: 0.92, defense: 1.2, dexterity: 0.98 },
    note: "Trzyma garde i zbija presje przeciwnika.",
  },
];

export const ARENA_BOOSTS = [
  {
    id: "heist-edge",
    name: "Wejscie na goraco",
    price: 4,
    family: "arena-heist-edge",
    summary: "+10% szansy w skokach przez 3 akcje.",
    accent: "#f0c24d",
    durationSeconds: 45 * 60,
    effectTemplate: {
      actionTypes: ["heist"],
      consumeOnAction: true,
      chargesRemaining: 3,
      heistSuccessBonus: 0.1,
    },
  },
  {
    id: "contract-cut",
    name: "Gruby procent",
    price: 5,
    family: "arena-contract-cut",
    summary: "+15% payoutu kontraktu na 1 odpalenie.",
    accent: "#d7ad55",
    durationSeconds: 45 * 60,
    effectTemplate: {
      actionTypes: ["contract"],
      consumeOnAction: true,
      chargesRemaining: 1,
      contractPayoutBonus: 0.15,
    },
  },
  {
    id: "clean-exit",
    name: "Czyste zejscie",
    price: 3,
    family: "arena-clean-exit",
    summary: "-10 heat po skoku albo kontrakcie, 1 uzycie.",
    accent: "#d5b876",
    durationSeconds: 35 * 60,
    effectTemplate: {
      actionTypes: ["heist", "contract"],
      consumeOnAction: true,
      chargesRemaining: 1,
      heatReduction: 10,
    },
  },
  {
    id: "xp-hustle",
    name: "Hajs i reputa",
    price: 4,
    family: "arena-xp-hustle",
    summary: "+5% XP do skokow i kontraktow przez 10 min.",
    accent: "#f3d58a",
    durationSeconds: 10 * 60,
    effectTemplate: {
      actionTypes: ["heist", "contract"],
      consumeOnAction: false,
      chargesRemaining: 0,
      xpMultiplier: 0.05,
    },
  },
];

export function getArenaModeById(modeId) {
  return ARENA_MODES.find((entry) => entry.id === modeId) || ARENA_MODES[1];
}

export function getArenaStyleById(styleId) {
  return ARENA_STYLES.find((entry) => entry.id === styleId) || ARENA_STYLES[0];
}

export function getArenaBoostById(boostId) {
  return ARENA_BOOSTS.find((entry) => entry.id === boostId) || null;
}

function normalizeArenaFight(entry = {}, index = 0) {
  return {
    id: typeof entry.id === "string" ? entry.id : `arena-fight-${index}`,
    index: Math.max(1, Math.floor(Number(entry.index || index + 1))),
    opponentName: typeof entry.opponentName === "string" ? entry.opponentName : "Ringowy",
    opponentStyleId: typeof entry.opponentStyleId === "string" ? entry.opponentStyleId : "aggression",
    opponentStyleLabel: typeof entry.opponentStyleLabel === "string" ? entry.opponentStyleLabel : "Agresja",
    opponentLevel: Math.max(1, Math.floor(Number(entry.opponentLevel || 1))),
    opponentNote: typeof entry.opponentNote === "string" ? entry.opponentNote : "",
    winChance: clamp(Number(entry.winChance || 0), 0, 1),
    energyCost: Math.max(0, Math.floor(Number(entry.energyCost || 0))),
    cashMin: Math.max(0, Math.floor(Number(entry.cashMin || 0))),
    cashMax: Math.max(0, Math.floor(Number(entry.cashMax || 0))),
    xpMin: Math.max(0, Math.floor(Number(entry.xpMin || 0))),
    xpMax: Math.max(0, Math.floor(Number(entry.xpMax || 0))),
    damageMin: Math.max(0, Math.floor(Number(entry.damageMin || 0))),
    damageMax: Math.max(0, Math.floor(Number(entry.damageMax || 0))),
  };
}

function normalizeArenaFightResult(entry = {}, index = 0) {
  return {
    id: typeof entry.id === "string" ? entry.id : `arena-result-${index}`,
    index: Math.max(1, Math.floor(Number(entry.index || index + 1))),
    success: Boolean(entry.success),
    opponentName: typeof entry.opponentName === "string" ? entry.opponentName : "Ringowy",
    cash: Math.max(0, Math.floor(Number(entry.cash || 0))),
    xp: Math.max(0, Math.floor(Number(entry.xp || 0))),
    damage: Math.max(0, Math.floor(Number(entry.damage || 0))),
    heat: Math.max(0, Math.floor(Number(entry.heat || 0))),
    streak: Math.max(0, Math.floor(Number(entry.streak || 0))),
    time: Math.max(0, Math.floor(Number(entry.time || 0))),
  };
}

function normalizeArenaRun(entry = null) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  return {
    id: typeof entry.id === "string" ? entry.id : `arena-run-${Date.now()}`,
    modeId: getArenaModeById(entry.modeId).id,
    styleId: getArenaStyleById(entry.styleId).id,
    step: Math.max(0, Math.floor(Number(entry.step || 0))),
    totalFights: Math.max(1, Math.floor(Number(entry.totalFights || 1))),
    wins: Math.max(0, Math.floor(Number(entry.wins || 0))),
    losses: Math.max(0, Math.floor(Number(entry.losses || 0))),
    streak: Math.max(0, Math.floor(Number(entry.streak || 0))),
    bestStreak: Math.max(0, Math.floor(Number(entry.bestStreak || 0))),
    rewardReduced: Boolean(entry.rewardReduced),
    totalCash: Math.max(0, Math.floor(Number(entry.totalCash || 0))),
    totalXp: Math.max(0, Math.floor(Number(entry.totalXp || 0))),
    currentFight: normalizeArenaFight(entry.currentFight, 0),
    results: Array.isArray(entry.results) ? entry.results.map(normalizeArenaFightResult) : [],
    startedAt: Math.max(0, Math.floor(Number(entry.startedAt || 0))),
  };
}

function normalizeArenaReport(entry = null) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    return null;
  }

  return {
    id: typeof entry.id === "string" ? entry.id : `arena-report-${Date.now()}`,
    modeId: getArenaModeById(entry.modeId).id,
    styleId: getArenaStyleById(entry.styleId).id,
    wins: Math.max(0, Math.floor(Number(entry.wins || 0))),
    losses: Math.max(0, Math.floor(Number(entry.losses || 0))),
    totalCash: Math.max(0, Math.floor(Number(entry.totalCash || 0))),
    totalXp: Math.max(0, Math.floor(Number(entry.totalXp || 0))),
    tokenReward: Math.max(0, Math.floor(Number(entry.tokenReward || 0))),
    rewardReduced: Boolean(entry.rewardReduced),
    endedByLoss: Boolean(entry.endedByLoss),
    bestStreak: Math.max(0, Math.floor(Number(entry.bestStreak || 0))),
    finishedAt: Math.max(0, Math.floor(Number(entry.finishedAt || 0))),
  };
}

export function createArenaState() {
  return {
    tokens: 0,
    rewardedRunsInWindow: 0,
    rewardWindowStartedAt: 0,
    activeRun: null,
    lastRunReport: null,
    recentRuns: [],
  };
}

export function normalizeArenaState(state = {}) {
  const safeState =
    state && typeof state === "object" && !Array.isArray(state) ? state : createArenaState();
  return {
    tokens: clamp(
      Math.floor(Number(safeState.tokens || 0)),
      0,
      Number(ECONOMY_RULES.arena?.tokenCap || 20)
    ),
    rewardedRunsInWindow: Math.max(0, Math.floor(Number(safeState.rewardedRunsInWindow || 0))),
    rewardWindowStartedAt: Math.max(0, Math.floor(Number(safeState.rewardWindowStartedAt || 0))),
    activeRun: normalizeArenaRun(safeState.activeRun),
    lastRunReport: normalizeArenaReport(safeState.lastRunReport),
    recentRuns: Array.isArray(safeState.recentRuns)
      ? safeState.recentRuns.map(normalizeArenaReport).filter(Boolean).slice(0, 6)
      : [],
  };
}

export function getArenaRewardWindowState(arenaState, now = Date.now()) {
  const state = normalizeArenaState(arenaState);
  const windowMs = Number(ECONOMY_RULES.arena?.rewardWindowMs || 60 * 60 * 1000);
  const fullRewardRuns = Number(ECONOMY_RULES.arena?.fullRewardRunsPerWindow || 3);
  const expired = !state.rewardWindowStartedAt || now - state.rewardWindowStartedAt >= windowMs;
  const rewardedRunsInWindow = expired ? 0 : state.rewardedRunsInWindow;
  const rewardWindowStartedAt = expired ? now : state.rewardWindowStartedAt;
  const fullRewardsLeft = Math.max(0, fullRewardRuns - rewardedRunsInWindow);
  return {
    rewardWindowStartedAt,
    rewardedRunsInWindow,
    fullRewardsLeft,
    rewardReduced: fullRewardsLeft <= 0,
    remainingMs: expired ? windowMs : Math.max(0, rewardWindowStartedAt + windowMs - now),
  };
}

export function createArenaBoostInstance(boostId, now = Date.now()) {
  const boost = getArenaBoostById(boostId);
  if (!boost) return null;

  return {
    id: `arena-${boost.id}-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: boost.name,
    effect: {
      boostId: boost.id,
      family: boost.family,
      actionTypes: Array.isArray(boost.effectTemplate?.actionTypes)
        ? boost.effectTemplate.actionTypes.slice()
        : [],
      consumeOnAction: Boolean(boost.effectTemplate?.consumeOnAction),
      chargesRemaining: Math.max(0, Math.floor(Number(boost.effectTemplate?.chargesRemaining || 0))),
      heistSuccessBonus: Number(boost.effectTemplate?.heistSuccessBonus || 0),
      contractPayoutBonus: Number(boost.effectTemplate?.contractPayoutBonus || 0),
      heatReduction: Math.max(0, Math.floor(Number(boost.effectTemplate?.heatReduction || 0))),
      xpMultiplier: Number(boost.effectTemplate?.xpMultiplier || 0),
    },
    expiresAt: now + Number(boost.durationSeconds || 0) * 1000,
  };
}

export function getArenaBoostEffectLines(boostLike) {
  const boost = typeof boostLike === "string" ? getArenaBoostById(boostLike) : getArenaBoostById(boostLike?.id || boostLike?.effect?.boostId);
  if (!boost) return [];

  const effect = boost.effectTemplate || {};
  const lines = [];
  if (Number(effect.heistSuccessBonus || 0) > 0) {
    lines.push(`+${Math.round(Number(effect.heistSuccessBonus || 0) * 100)}% szansy w skokach`);
  }
  if (Number(effect.contractPayoutBonus || 0) > 0) {
    lines.push(`+${Math.round(Number(effect.contractPayoutBonus || 0) * 100)}% payoutu kontraktu`);
  }
  if (Number(effect.heatReduction || 0) > 0) {
    lines.push(`-${Math.round(Number(effect.heatReduction || 0))} heat po akcji`);
  }
  if (Number(effect.xpMultiplier || 0) > 0) {
    lines.push(`+${Math.round(Number(effect.xpMultiplier || 0) * 100)}% XP`);
  }
  if (Number(effect.chargesRemaining || 0) > 0) {
    lines.push(`${Math.floor(Number(effect.chargesRemaining || 0))} akcje`);
  } else {
    lines.push(`${Math.max(1, Math.round(Number(boost.durationSeconds || 0) / 60))} min`);
  }
  return lines;
}

export function getArenaActionModifiers(activeBoosts = [], actionType, now = Date.now()) {
  const safeActionType = String(actionType || "").trim();
  const modifiers = {
    heistSuccessBonus: 0,
    contractPayoutBonus: 0,
    heatReduction: 0,
    xpMultiplier: 0,
    matchedBoosts: [],
  };

  (Array.isArray(activeBoosts) ? activeBoosts : []).forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    if (Number(entry.expiresAt || 0) <= now) return;
    const effect = entry.effect && typeof entry.effect === "object" ? entry.effect : {};
    const actionTypes = Array.isArray(effect.actionTypes) ? effect.actionTypes : [];
    if (!actionTypes.includes(safeActionType)) return;
    if (Number(effect.chargesRemaining || 0) <= 0 && Boolean(effect.consumeOnAction)) return;

    modifiers.heistSuccessBonus += Number(effect.heistSuccessBonus || 0);
    modifiers.contractPayoutBonus += Number(effect.contractPayoutBonus || 0);
    modifiers.heatReduction = Math.max(modifiers.heatReduction, Math.floor(Number(effect.heatReduction || 0)));
    modifiers.xpMultiplier += Number(effect.xpMultiplier || 0);
    modifiers.matchedBoosts.push({
      id: entry.id,
      boostId: typeof effect.boostId === "string" ? effect.boostId : null,
      family: typeof effect.family === "string" ? effect.family : null,
      name: entry.name || "Boost",
      consumeOnAction: Boolean(effect.consumeOnAction),
      chargesRemaining: Math.max(0, Math.floor(Number(effect.chargesRemaining || 0))),
    });
  });

  return modifiers;
}

export function consumeArenaActionBoosts(activeBoosts = [], actionType, now = Date.now()) {
  const safeActionType = String(actionType || "").trim();
  const consumed = [];
  const nextBoosts = (Array.isArray(activeBoosts) ? activeBoosts : [])
    .filter((entry) => entry && typeof entry === "object")
    .flatMap((entry) => {
      if (Number(entry.expiresAt || 0) <= now) {
        return [];
      }
      const effect = entry.effect && typeof entry.effect === "object" ? entry.effect : {};
      const actionTypes = Array.isArray(effect.actionTypes) ? effect.actionTypes : [];
      if (!Boolean(effect.consumeOnAction) || !actionTypes.includes(safeActionType)) {
        return [entry];
      }

      const nextCharges = Math.max(0, Math.floor(Number(effect.chargesRemaining || 0)) - 1);
      consumed.push(entry.name || "Boost");
      if (nextCharges <= 0) {
        return [];
      }
      return [
        {
          ...entry,
          effect: {
            ...effect,
            chargesRemaining: nextCharges,
          },
        },
      ];
    });

  return {
    nextBoosts,
    consumed,
  };
}
