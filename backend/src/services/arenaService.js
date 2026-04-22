import { applyXpProgression } from "../../../shared/progression.js";
import { clamp, ECONOMY_RULES } from "../../../shared/economy.js";
import {
  ARENA_MODES,
  ARENA_STYLES,
  createArenaBoostInstance,
  createArenaState,
  getArenaBoostById,
  getArenaModeById,
  getArenaRewardWindowState,
  getArenaStyleById,
  normalizeArenaState,
} from "../../../shared/arena.js";
import { applyCriticalCareDamage, assertPlayerNotInCriticalCare } from "./criticalCareService.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function randomBetween(min, max) {
  const safeMin = Math.floor(Number(min || 0));
  const safeMax = Math.floor(Number(max || 0));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

const OPPONENT_PREFIXES = ["Portowy", "Uliczny", "Cichy", "Brudny", "Zimny", "Ringowy"];
const OPPONENT_SUFFIXES = ["Rzezimieszek", "Technik", "Bramkarz", "Egzekutor", "Kostka", "Slugger"];

function buildArenaOpponentName(fightIndex, now = Date.now()) {
  const seed = Math.abs(Math.floor(Number(now || 0) / 60000) + fightIndex * 17);
  const prefix = OPPONENT_PREFIXES[seed % OPPONENT_PREFIXES.length];
  const suffix = OPPONENT_SUFFIXES[(seed + fightIndex * 5) % OPPONENT_SUFFIXES.length];
  return `${prefix} ${suffix}`;
}

function syncArenaRewardWindow(arena, now = Date.now()) {
  const rewardWindow = getArenaRewardWindowState(arena, now);
  arena.rewardWindowStartedAt = rewardWindow.rewardWindowStartedAt;
  arena.rewardedRunsInWindow = rewardWindow.rewardedRunsInWindow;
  return rewardWindow;
}

export function ensurePlayerArenaState(player, now = Date.now()) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  if (!player.profile || typeof player.profile !== "object") {
    player.profile = {};
  }
  if (!player.stats || typeof player.stats !== "object") {
    player.stats = {};
  }
  if (!player.timers || typeof player.timers !== "object") {
    player.timers = {};
  }
  if (!Array.isArray(player.activeBoosts)) {
    player.activeBoosts = [];
  }

  player.arena = normalizeArenaState(player.arena || createArenaState());
  player.stats.arenaRuns = Math.max(0, Math.floor(Number(player.stats.arenaRuns || 0)));
  player.stats.arenaFightWins = Math.max(0, Math.floor(Number(player.stats.arenaFightWins || 0)));
  player.stats.arenaTokensEarned = Math.max(0, Math.floor(Number(player.stats.arenaTokensEarned || 0)));
  syncArenaRewardWindow(player.arena, now);
  return player.arena;
}

function getStyleWeightedPower(profile, style) {
  const safeProfile = profile && typeof profile === "object" ? profile : {};
  const weights = style?.weights || {};
  return (
    Number(safeProfile.attack || 0) * Number(weights.attack || 1) * 1.22 +
    Number(safeProfile.defense || 0) * Number(weights.defense || 1) +
    Number(safeProfile.dexterity || 0) * Number(weights.dexterity || 1) * 1.1 +
    Number(safeProfile.stamina || 0) * 0.55 +
    Number(safeProfile.respect || 0) * 0.34
  );
}

function buildArenaFight(player, modeId, styleId, fightIndex, now = Date.now()) {
  const mode = getArenaModeById(modeId);
  const style = getArenaStyleById(styleId);
  const opponentStyle = ARENA_STYLES[(fightIndex + Math.floor(Number(player?.profile?.respect || 0))) % ARENA_STYLES.length];
  const opponentLevel = Math.max(
    6,
    Math.round(Number(player?.profile?.respect || 0) * 0.58 + fightIndex * Number(mode.difficultyStep || 0) * 0.45 + 3)
  );
  const playerPower = getStyleWeightedPower(player.profile, style);
  const opponentPower =
    opponentLevel * 3.2 +
    Number(mode.difficultyStep || 0) * fightIndex +
    (opponentStyle.id === style.id ? 8 : 0) +
    Math.max(0, Number(player?.profile?.heat || 0) * 0.08);
  const heatPenalty = Number(player?.profile?.heat || 0) * 0.0022;
  const hpPenalty =
    Number(player?.profile?.maxHp || 100) > 0 &&
    Number(player?.profile?.hp || 0) < Number(player?.profile?.maxHp || 100) * 0.38
      ? 0.05
      : 0;
  const chance = clamp(
    Number(mode.baseChance || 0.5) + (playerPower - opponentPower) / 120 - heatPenalty - hpPenalty,
    Number(mode.minChance || 0.14),
    Number(mode.maxChance || 0.88)
  );

  return {
    id: `arena-fight-${now}-${fightIndex}`,
    index: fightIndex,
    opponentName: buildArenaOpponentName(fightIndex, now),
    opponentStyleId: opponentStyle.id,
    opponentStyleLabel: opponentStyle.label,
    opponentLevel,
    opponentNote: `${opponentStyle.label}. Lubi cisnac tempo w rundzie ${fightIndex}.`,
    winChance: Number(chance.toFixed(4)),
    energyCost: Number(mode.energyPerFight || 0),
    cashMin: Math.floor(Number(mode.cashReward?.[0] || 0) * (1 + (fightIndex - 1) * 0.16)),
    cashMax: Math.floor(Number(mode.cashReward?.[1] || 0) * (1 + (fightIndex - 1) * 0.18)),
    xpMin: Math.floor(Number(mode.xpReward?.[0] || 0) + (fightIndex - 1) * 2),
    xpMax: Math.floor(Number(mode.xpReward?.[1] || 0) + (fightIndex - 1) * 2),
    damageMin: Math.floor(Number(mode.damageRange?.[0] || 0) + (fightIndex - 1) * 2),
    damageMax: Math.floor(Number(mode.damageRange?.[1] || 0) + (fightIndex - 1) * 3),
  };
}

function getArenaTokenReward(mode, wins, rewardReduced) {
  if (rewardReduced) return 0;
  if (!mode) return 0;

  if (mode.id === "sparring") {
    return wins >= 3 ? 1 : 0;
  }
  if (mode.id === "round") {
    if (wins >= 3) return 2;
    if (wins >= 2) return 1;
    return 0;
  }
  if (wins >= 5) return 3;
  if (wins >= 3) return 2;
  if (wins >= 2) return 1;
  return 0;
}

function finalizeArenaRun(player, run, { now = Date.now(), endedByLoss = false } = {}) {
  const arena = ensurePlayerArenaState(player, now);
  const mode = getArenaModeById(run.modeId);
  const fullWindowState = syncArenaRewardWindow(arena, now);

  const tokenRewardRaw = getArenaTokenReward(mode, run.wins, run.rewardReduced || fullWindowState.rewardReduced);
  const tokenCap = Number(ECONOMY_RULES.arena?.tokenCap || 20);
  const tokenReward = Math.max(0, Math.min(tokenRewardRaw, tokenCap - Number(arena.tokens || 0)));
  if (tokenReward > 0) {
    arena.tokens = Math.min(tokenCap, Number(arena.tokens || 0) + tokenReward);
    player.stats.arenaTokensEarned = Math.max(0, Number(player.stats.arenaTokensEarned || 0)) + tokenReward;
  }

  if (!run.rewardReduced) {
    arena.rewardedRunsInWindow = Math.min(
      Number(ECONOMY_RULES.arena?.fullRewardRunsPerWindow || 3),
      Number(arena.rewardedRunsInWindow || 0) + 1
    );
  }

  const report = {
    id: `${run.id}-report`,
    modeId: run.modeId,
    styleId: run.styleId,
    wins: run.wins,
    losses: run.losses,
    totalCash: run.totalCash,
    totalXp: run.totalXp,
    tokenReward,
    rewardReduced: Boolean(run.rewardReduced),
    endedByLoss,
    bestStreak: run.bestStreak,
    finishedAt: now,
  };

  arena.activeRun = null;
  arena.lastRunReport = report;
  arena.recentRuns = [report, ...(Array.isArray(arena.recentRuns) ? arena.recentRuns : [])].slice(0, 6);
  player.stats.arenaRuns = Math.max(0, Number(player.stats.arenaRuns || 0)) + 1;

  return report;
}

export function startArenaRunForPlayer(player, modeId, styleId, now = Date.now()) {
  const arena = ensurePlayerArenaState(player, now);
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie wejdziesz na ring.");
  }
  assertPlayerNotInCriticalCare(player, "Arena", now);
  if (arena.activeRun) {
    fail("Masz juz odpalony run Areny. Dokoncz go albo odbierz raport.");
  }

  const mode = getArenaModeById(modeId);
  const style = getArenaStyleById(styleId);
  if (Number(player?.profile?.energy || 0) < Number(mode.energyPerFight || 0)) {
    fail(`Potrzebujesz ${mode.energyPerFight} energii na pierwszy ring.`);
  }

  const rewardWindow = syncArenaRewardWindow(arena, now);
  const activeRun = {
    id: `arena-run-${now}`,
    modeId: mode.id,
    styleId: style.id,
    step: 1,
    totalFights: Number(mode.fights || 3),
    wins: 0,
    losses: 0,
    streak: 0,
    bestStreak: 0,
    rewardReduced: Boolean(rewardWindow.rewardReduced),
    totalCash: 0,
    totalXp: 0,
    currentFight: buildArenaFight(player, mode.id, style.id, 1, now),
    results: [],
    startedAt: now,
  };

  arena.activeRun = activeRun;
  return {
    run: activeRun,
    mode,
    style,
    rewardWindow,
    logMessage: rewardWindow.rewardReduced
      ? `Arena: ${mode.label}. Lecisz na przyciszonych rewardach, ale ring dalej daje ruch.`
      : `Arena: ${mode.label}. Wchodzisz stylem ${style.label.toLowerCase()}.`,
  };
}

export function resolveArenaFightForPlayer(player, now = Date.now()) {
  const arena = ensurePlayerArenaState(player, now);
  const run = arena.activeRun;
  if (!run) {
    fail("Najpierw odpal run Areny.");
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie dograsz tego runa.");
  }
  assertPlayerNotInCriticalCare(player, "Arena", now);

  const currentFight = run.currentFight;
  const mode = getArenaModeById(run.modeId);
  if (!currentFight) {
    fail("Arena nie ma teraz aktywnej walki.", 500);
  }
  if (Number(player?.profile?.energy || 0) < Number(currentFight.energyCost || 0)) {
    fail(`Potrzebujesz ${currentFight.energyCost} energii na te walke.`);
  }

  player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - Number(currentFight.energyCost || 0));
  player.timers.energyUpdatedAt = now;

  const success = Math.random() < Number(currentFight.winChance || 0);
  if (success) {
    const reducedCashMultiplier = Number(ECONOMY_RULES.arena?.reducedRewardMultiplier || 0.45);
    const reducedXpMultiplier = Number(ECONOMY_RULES.arena?.reducedRespectMultiplier || 0.5);
    let cashGain = randomBetween(currentFight.cashMin, currentFight.cashMax);
    let xpGain = randomBetween(currentFight.xpMin, currentFight.xpMax);
    const streak = Number(run.streak || 0) + 1;
    const bestStreak = Math.max(Number(run.bestStreak || 0), streak);

    if (streak === 2) {
      cashGain += Number(mode.streakBonusCash?.small || 0);
      xpGain += Number(mode.streakBonusXp?.small || 0);
    } else if (streak >= 3) {
      cashGain += Number(mode.streakBonusCash?.big || 0);
      xpGain += Number(mode.streakBonusXp?.big || 0);
    }

    if (run.rewardReduced) {
      cashGain = Math.max(0, Math.floor(cashGain * reducedCashMultiplier));
      xpGain = Math.max(1, Math.floor(xpGain * reducedXpMultiplier));
    }

    const progression = applyXpProgression(
      { respect: Number(player.profile?.respect || 0), xp: Number(player.profile?.xp || 0) },
      xpGain
    );
    player.profile.cash = Number(player.profile.cash || 0) + cashGain;
    player.profile.respect = progression.respect;
    player.profile.xp = progression.xp;
    player.profile.level = progression.respect;
    player.stats.totalEarned = Math.max(0, Number(player.stats?.totalEarned || 0)) + cashGain;
    player.stats.arenaFightWins = Math.max(0, Number(player.stats?.arenaFightWins || 0)) + 1;

    const fightResult = {
      id: `${currentFight.id}-result`,
      index: currentFight.index,
      success: true,
      opponentName: currentFight.opponentName,
      cash: cashGain,
      xp: xpGain,
      damage: 0,
      heat: 0,
      streak,
      time: now,
    };

    run.results = [...(Array.isArray(run.results) ? run.results : []), fightResult].slice(-8);
    run.wins = Number(run.wins || 0) + 1;
    run.streak = streak;
    run.bestStreak = bestStreak;
    run.totalCash = Math.max(0, Number(run.totalCash || 0)) + cashGain;
    run.totalXp = Math.max(0, Number(run.totalXp || 0)) + xpGain;

    const finished = currentFight.index >= Number(run.totalFights || mode.fights || 3);
    if (finished) {
      const report = finalizeArenaRun(player, run, { now, endedByLoss: false });
      return {
        success: true,
        finished: true,
        fightResult,
        report,
        run: null,
        logMessage: `${mode.label} domkniety. Wpada ${fightResult.cash}$ i ${report.tokenReward} token${report.tokenReward === 1 ? "" : report.tokenReward >= 2 && report.tokenReward <= 4 ? "y" : "ow"}.`,
      };
    }

    run.step = currentFight.index + 1;
    run.currentFight = buildArenaFight(player, run.modeId, run.styleId, run.step, now);
    return {
      success: true,
      finished: false,
      fightResult,
      run,
      logMessage: `${currentFight.opponentName} siada. Wpada ${cashGain}$ i idziesz po kolejny ring.`,
    };
  }

  const damage = randomBetween(currentFight.damageMin, currentFight.damageMax);
  const heatGain = Math.max(1, Number(mode.heatOnLoss || 0) + Math.max(0, currentFight.index - 1));
  const damageState = applyCriticalCareDamage(player, damage, {
    now,
    source: `arena po walce z ${currentFight.opponentName}`,
    allowCriticalCare: mode.id !== "sparring",
    minimumHp: 0,
  });
  player.profile.heat = clamp(Number(player.profile.heat || 0) + heatGain, 0, 100);

  const fightResult = {
    id: `${currentFight.id}-result`,
    index: currentFight.index,
    success: false,
    opponentName: currentFight.opponentName,
    cash: 0,
    xp: 0,
    damage,
    heat: heatGain,
    streak: 0,
    time: now,
  };

  run.results = [...(Array.isArray(run.results) ? run.results : []), fightResult].slice(-8);
  run.losses = Number(run.losses || 0) + 1;
  run.streak = 0;
  const report = finalizeArenaRun(player, run, { now, endedByLoss: true });
  return {
    success: false,
    finished: true,
    fightResult,
    report,
    run: null,
    criticalCareTriggered: Boolean(damageState.criticalCareTriggered),
    logMessage: damageState.criticalCareTriggered
      ? `${currentFight.opponentName} kladzie Cie na deski. Ladujesz na intensywnej terapii.`
      : `${currentFight.opponentName} wygrywa. Tracisz ${damage} HP i lapiesz ${heatGain} heat.`,
  };
}

export function buyArenaBoostForPlayer(player, boostId, now = Date.now()) {
  const arena = ensurePlayerArenaState(player, now);
  const boost = getArenaBoostById(boostId);
  if (!boost) {
    fail("Nie ma takiego boosta Areny.", 404);
  }
  if (Number(arena.tokens || 0) < Number(boost.price || 0)) {
    fail(`Brakuje ${boost.price} tokenow Areny.`);
  }

  const duplicate = (Array.isArray(player.activeBoosts) ? player.activeBoosts : []).some((entry) => {
    if (!entry || typeof entry !== "object") return false;
    if (Number(entry.expiresAt || 0) <= now) return false;
    return String(entry.effect?.family || "").trim() === String(boost.family || "").trim();
  });
  if (duplicate) {
    fail("Ten boost juz siedzi aktywnie. Najpierw go wykorzystaj.");
  }

  const instance = createArenaBoostInstance(boost.id, now);
  if (!instance) {
    fail("Nie udalo sie zlozyc boosta Areny.", 500);
  }

  arena.tokens = Math.max(0, Number(arena.tokens || 0) - Number(boost.price || 0));
  player.activeBoosts = [...(Array.isArray(player.activeBoosts) ? player.activeBoosts : []), instance];
  return {
    boostId: boost.id,
    name: boost.name,
    price: Number(boost.price || 0),
    expiresAt: instance.expiresAt,
    logMessage: `Arena: kupiles ${boost.name}.`,
  };
}
