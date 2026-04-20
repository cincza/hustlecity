import { clamp } from "../../../shared/economy.js";
import { applyXpProgression } from "../../../shared/progression.js";
import {
  buildGangHeistResultMessage,
  canRunGangHeistRole,
  getGangHeistBonusRate,
  getGangHeistById,
  getGangHeistEffectiveProfile,
  getGangHeistFailureJailChance,
  getGangHeistFailureJailSentenceSeconds,
  getGangHeistSquadSummary,
  getGangRescueOptionById,
  getGangHeistVaultCut,
} from "../../../shared/gangHeists.js";
import {
  ensureGangWeeklyGoal,
  getGangMemberCapUpgrade,
  getGangMemberCapForLevel,
  getGangProjectEffects,
  normalizeGangState,
  recordGangJobProgress,
} from "../../../shared/gangProjects.js";
import { applyGangHeistDistrictOutcome } from "./districtService.js";
import {
  applyCriticalCareDamage,
  assertPlayerNotInCriticalCare,
} from "./criticalCareService.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function randomBetween(min, max) {
  const safeMin = Math.floor(Number(min || 0));
  const safeMax = Math.floor(Number(max || 0));
  const lower = Math.min(safeMin, safeMax);
  const upper = Math.max(safeMin, safeMax);
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

function pushLog(player, message) {
  player.log = [message, ...(Array.isArray(player.log) ? player.log : [])].slice(0, 16);
}

function ensureGangHeistStats(player) {
  if (!player.stats || typeof player.stats !== "object") {
    player.stats = {};
  }
  player.stats.gangHeistsWon = Math.max(0, Math.floor(Number(player.stats.gangHeistsWon || 0)));
  player.stats.totalEarned = Math.max(0, Math.floor(Number(player.stats.totalEarned || 0)));
}

function ensureGangEntry(entry, now = Date.now()) {
  if (!entry?.player || !entry.userId) {
    fail("Gang entry is required", 500);
  }
  entry.player.gang = ensureGangWeeklyGoal(normalizeGangState(entry.player.gang), now);
  return entry;
}

function getActorEntry(gangEntries, actorUserId, now = Date.now()) {
  const actor = (Array.isArray(gangEntries) ? gangEntries : []).find(
    (entry) => String(entry?.userId || "").trim() === String(actorUserId || "").trim()
  );
  if (!actor) {
    fail("Nie ma Cie w tym skladzie.", 404);
  }
  return ensureGangEntry(actor, now);
}

function buildParticipantSnapshot(entry) {
  const profile = entry?.player?.profile || {};
  return {
    userId: entry.userId,
    name: profile.name || entry.username || "Gracz",
    profile,
    effectiveProfile: getGangHeistEffectiveProfile(profile, entry?.player?.activeBoosts),
    role: String(entry?.player?.gang?.role || "Czlonek").trim() || "Czlonek",
    jailed: Number(profile.jailUntil || 0) > Date.now(),
  };
}

function getLobbyParticipants(gangEntries, lobby) {
  const participantIds = Array.isArray(lobby?.participantIds)
    ? lobby.participantIds.map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  return participantIds
    .map((userId) =>
      (Array.isArray(gangEntries) ? gangEntries : []).find(
        (entry) => String(entry?.userId || "").trim() === userId
      )
    )
    .filter(Boolean)
    .map((entry) => ensureGangEntry(entry));
}

function pushGangChatShared(gangEntries, text, now = Date.now()) {
  const message = {
    id: `gang-heist-${now}-${Math.random().toString(36).slice(2, 8)}`,
    author: "System",
    text,
    time: new Date(now).toISOString(),
  };
  (Array.isArray(gangEntries) ? gangEntries : []).forEach((entry) => {
    entry.player.gang.chat = [message, ...(Array.isArray(entry.player.gang.chat) ? entry.player.gang.chat : [])].slice(0, 20);
  });
}

function applySharedGangState(gangEntries, sharedPatch, now = Date.now()) {
  const entries = Array.isArray(gangEntries) ? gangEntries : [];
  entries.forEach((entry) => {
    const currentGang = ensureGangWeeklyGoal(normalizeGangState(entry.player.gang), now);
    entry.player.gang = ensureGangWeeklyGoal(
      normalizeGangState({
        ...currentGang,
        ...sharedPatch,
        role: currentGang.role,
        name: currentGang.name,
        joined: currentGang.joined,
        members: entries.length,
      }),
      now
    );
  });
}

function refreshSharedLobbySummary(gangEntries, heist, now = Date.now()) {
  const actor = ensureGangEntry(gangEntries[0], now);
  const currentLobby = actor.player.gang.activeHeistLobby;
  if (!currentLobby) return null;
  const participants = getLobbyParticipants(gangEntries, currentLobby).map(buildParticipantSnapshot);
  const summary = getGangHeistSquadSummary(participants, heist, actor.player.gang);
  const lobby = {
    ...currentLobby,
    requiredMembers: heist.minMembers,
    chance: summary.chance,
    squadPower: summary.totalPower,
    summary,
  };
  applySharedGangState(gangEntries, { activeHeistLobby: lobby }, now);
  return lobby;
}

function awardGangJobCompletions(gangEntries, completedJobs, now = Date.now()) {
  if (!Array.isArray(completedJobs) || !completedJobs.length) return [];
  const rewards = [];
  completedJobs.forEach((job) => {
    const vaultCash = Math.max(0, Math.floor(Number(job?.rewards?.vaultCash || 0)));
    if (vaultCash > 0) {
      (Array.isArray(gangEntries) ? gangEntries : []).forEach((entry) => {
        entry.player.gang.vault = Math.max(0, Number(entry.player.gang.vault || 0) + vaultCash);
      });
    }
    rewards.push({
      id: job.id,
      title: job.title,
      vaultCash,
    });
    pushGangChatShared(gangEntries, `Tablica roboty: ${job.title}. Do skarbca wpada ${vaultCash}$.`, now);
  });
  return rewards;
}

function addGangJobProgress(gangEntries, progressKey, amount, now = Date.now()) {
  if (!Array.isArray(gangEntries) || !gangEntries.length) return [];
  const actorGang = ensureGangWeeklyGoal(gangEntries[0].player.gang, now);
  const { gang, completedJobs } = recordGangJobProgress(actorGang, progressKey, amount, now);
  applySharedGangState(gangEntries, {
    jobBoard: gang.jobBoard,
    jobProgress: gang.jobProgress,
    jobRewardedAt: gang.jobRewardedAt,
  }, now);
  return awardGangJobCompletions(gangEntries, completedJobs, now);
}

export function openGangHeistLobbyForGang(gangEntries, actorUserId, heistId, note = "", now = Date.now()) {
  const heist = getGangHeistById(String(heistId || "").trim());
  if (!heist) {
    fail("Nie ma takiego napadu gangu.", 404);
  }
  const actor = getActorEntry(gangEntries, actorUserId, now);
  ensureGangHeistStats(actor.player);
  assertPlayerNotInCriticalCare(actor.player, "Napady gangu", now);

  if (!actor.player?.gang?.joined) {
    fail("Najpierw musisz byc w gangu.");
  }
  if (!canRunGangHeistRole(actor.player.gang.role)) {
    fail("Lobby napadu otwiera tylko Boss, Vice Boss albo Zaufany.", 403);
  }
  if (Number(actor.player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie otworzysz lobby.");
  }
  if (Number(actor.player.gang.crewLockdownUntil || 0) > now) {
    fail("Ekipa jeszcze sie zbiera po ostatniej wtapie.");
  }
  if (actor.player.gang.activeHeistLobby?.status === "open") {
    fail("Gang ma juz otwarte jedno lobby napadu.");
  }

  const lobby = {
    id: `gang-lobby-${heist.id}-${now}`,
    heistId: heist.id,
    status: "open",
    note: String(note || "").trim().slice(0, 140),
    openedByUserId: actor.userId,
    openedByName: actor.player.profile?.name || actor.username || "Boss",
    participantIds: [actor.userId],
    requiredMembers: heist.minMembers,
    createdAt: now,
    startedAt: null,
  };

  applySharedGangState(gangEntries, {
    activeHeistLobby: lobby,
    lastHeistReport: null,
  }, now);
  const refreshedLobby = refreshSharedLobbySummary(gangEntries, heist, now);
  addGangJobProgress(gangEntries, "gangHeistsOpened", 1, now);
  pushGangChatShared(
    gangEntries,
    `${actor.player.profile?.name || "Ekipa"} otwiera lobby: ${heist.name}. ${lobby.note || "Skladujemy ludzi do roboty."}`,
    now
  );

  return {
    heistId: heist.id,
    heistName: heist.name,
    lobby: refreshedLobby,
    logMessage: `Lobby pod ${heist.name} stoi otwarte.`,
  };
}

export function joinGangHeistLobbyForGang(gangEntries, actorUserId, now = Date.now()) {
  const actor = getActorEntry(gangEntries, actorUserId, now);
  assertPlayerNotInCriticalCare(actor.player, "Napady gangu", now);
  const lobby = actor.player.gang.activeHeistLobby;
  if (!lobby || lobby.status !== "open") {
    fail("Nie ma teraz otwartego lobby napadu.");
  }
  const heist = getGangHeistById(lobby.heistId);
  if (!heist) {
    fail("To lobby prowadzi do nieistniejacego napadu.", 404);
  }
  if (Number(actor.player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie wejdziesz do skladu.");
  }
  if (Number(actor.player?.profile?.energy || 0) < Number(heist.energy || 0)) {
    fail(`Na ${heist.name} potrzebujesz ${heist.energy} energii.`);
  }

  const participantIds = new Set(
    Array.isArray(lobby.participantIds) ? lobby.participantIds.map((entry) => String(entry || "").trim()) : []
  );
  if (participantIds.has(actor.userId)) {
    fail("Juz siedzisz w tym skladzie.");
  }
  if (participantIds.size >= Number(heist.minMembers || 1)) {
    fail("Sklad jest juz pelny.");
  }

  participantIds.add(actor.userId);
  applySharedGangState(gangEntries, {
    activeHeistLobby: {
      ...lobby,
      participantIds: [...participantIds],
    },
  }, now);
  const refreshedLobby = refreshSharedLobbySummary(gangEntries, heist, now);
  pushGangChatShared(
    gangEntries,
    `${actor.player.profile?.name || "Gracz"} wbija do lobby ${heist.name}.`,
    now
  );

  return {
    heistId: heist.id,
    heistName: heist.name,
    lobby: refreshedLobby,
    logMessage: `Wbijasz do skladu pod ${heist.name}.`,
  };
}

export function leaveGangHeistLobbyForGang(gangEntries, actorUserId, now = Date.now()) {
  const actor = getActorEntry(gangEntries, actorUserId, now);
  const lobby = actor.player.gang.activeHeistLobby;
  if (!lobby || lobby.status !== "open") {
    fail("Nie ma teraz otwartego lobby napadu.");
  }
  const heist = getGangHeistById(lobby.heistId);
  if (!heist) {
    fail("To lobby prowadzi do nieistniejacego napadu.", 404);
  }

  const participantIds = new Set(
    Array.isArray(lobby.participantIds) ? lobby.participantIds.map((entry) => String(entry || "").trim()) : []
  );
  if (!participantIds.has(actor.userId)) {
    fail("Nie ma Cie w tym lobby.");
  }

  participantIds.delete(actor.userId);
  if (!participantIds.size) {
    applySharedGangState(gangEntries, { activeHeistLobby: null }, now);
    pushGangChatShared(gangEntries, `Lobby ${heist.name} rozpada sie. Nikt nie zostal w skladzie.`, now);
    return {
      heistId: heist.id,
      heistName: heist.name,
      lobby: null,
      logMessage: `Wychodzisz z lobby ${heist.name}. Lobby znika.`,
    };
  }

  applySharedGangState(gangEntries, {
    activeHeistLobby: {
      ...lobby,
      participantIds: [...participantIds],
    },
  }, now);
  const refreshedLobby = refreshSharedLobbySummary(gangEntries, heist, now);
  pushGangChatShared(gangEntries, `${actor.player.profile?.name || "Gracz"} schodzi z lobby ${heist.name}.`, now);

  return {
    heistId: heist.id,
    heistName: heist.name,
    lobby: refreshedLobby,
    logMessage: `Schodzisz z lobby ${heist.name}.`,
  };
}

export function upgradeGangCapacityForGang(gangEntries, actorUserId, now = Date.now()) {
  const actor = getActorEntry(gangEntries, actorUserId, now);
  if (!actor.player.gang.joined) {
    fail("Najpierw wejdz do gangu.");
  }
  if (String(actor.player.gang.role || "").trim() !== "Boss") {
    fail("Rozbudowe gangu kupuje tylko Boss.", 403);
  }

  const currentLevel = Number(actor.player.gang.memberCapLevel || 0);
  const upgrade = getGangMemberCapUpgrade(currentLevel);
  if (!upgrade) {
    fail("Gang ma juz wbity maksymalny sklad.");
  }
  if (Number(actor.player.gang.vault || 0) < Number(upgrade.cost || 0)) {
    fail(`Brakuje ${upgrade.cost}$ w skarbcu gangu.`);
  }

  const nextLevel = upgrade.level;
  const nextMax = getGangMemberCapForLevel(nextLevel);
  applySharedGangState(gangEntries, {
    memberCapLevel: nextLevel,
    maxMembers: nextMax,
    vault: Math.max(0, Number(actor.player.gang.vault || 0) - Number(upgrade.cost || 0)),
  }, now);
  pushGangChatShared(gangEntries, `Gang rozrasta sklad do ${nextMax} ludzi.`, now);

  return {
    level: nextLevel,
    maxMembers: nextMax,
    cost: Number(upgrade.cost || 0),
    logMessage: `Rozbudowujesz gang do ${nextMax} slotow.`,
  };
}

export function startGangHeistForGang(gangEntries, actorUserId, now = Date.now()) {
  const actor = getActorEntry(gangEntries, actorUserId, now);
  assertPlayerNotInCriticalCare(actor.player, "Napady gangu", now);
  const lobby = actor.player.gang.activeHeistLobby;
  if (!lobby || lobby.status !== "open") {
    fail("Nie ma teraz aktywnego lobby napadu.");
  }
  if (!canRunGangHeistRole(actor.player.gang.role)) {
    fail("Start odpala tylko Boss, Vice Boss albo Zaufany.", 403);
  }

  const heist = getGangHeistById(lobby.heistId);
  if (!heist) {
    fail("Nie ma takiego napadu gangu.", 404);
  }

  const participantEntries = getLobbyParticipants(gangEntries, lobby);
  const squad = participantEntries.map(buildParticipantSnapshot);
  const summary = getGangHeistSquadSummary(squad, heist, actor.player.gang);
  if (summary.memberCount < summary.requiredMembers) {
    fail(`Do startu brakuje jeszcze ${summary.requiredMembers - summary.memberCount} ludzi.`);
  }

  participantEntries.forEach((entry) => {
    ensureGangHeistStats(entry.player);
    assertPlayerNotInCriticalCare(entry.player, "Napady gangu", now);
    if (Number(entry.player?.profile?.jailUntil || 0) > now) {
      fail(`${entry.player.profile?.name || "Gracz"} siedzi i nie wejdzie do skladu.`);
    }
    if (Number(entry.player?.profile?.energy || 0) < Number(heist.energy || 0)) {
      fail(`${entry.player.profile?.name || "Gracz"} nie ma energii na ten napad.`);
    }
  });

  const bonusRate = getGangHeistBonusRate(actor.player.gang);
  const overperformance = Math.max(0, summary.totalPower - summary.requiredMembers * summary.recommendedRespect * 6.2);
  const success = Math.random() < summary.chance;
  const baseTake = randomBetween(heist.reward[0], heist.reward[1]);
  const grossTake = Math.floor(baseTake * (1 + bonusRate + Math.min(0.14, overperformance / 2400)));
  const vaultCut = getGangHeistVaultCut(grossTake);
  const participantTake = Math.max(0, grossTake - vaultCut);
  const perHeadCash = Math.max(0, Math.floor(participantTake / summary.memberCount));
  const xpGain = Math.max(6, randomBetween(Math.ceil(heist.minMembers * 2), heist.minMembers * 4));
  const jailChance = getGangHeistFailureJailChance(heist, summary.chance);
  const jailSentenceMs = getGangHeistFailureJailSentenceSeconds(heist, summary.chance) * 1000;
  const participantsReport = [];
  const jailedParticipantIds = [];

  participantEntries.forEach((entry) => {
    const player = entry.player;
    player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - Number(heist.energy || 0));
    if (!player.timers || typeof player.timers !== "object") {
      player.timers = {};
    }
    player.timers.energyUpdatedAt = now;

    if (success) {
      const progression = applyXpProgression(
        {
          respect: Number(player.profile?.respect || 0),
          xp: Number(player.profile?.xp || 0),
        },
        xpGain
      );
      player.profile.cash = Number(player.profile.cash || 0) + perHeadCash;
      player.profile.respect = progression.respect;
      player.profile.xp = progression.xp;
      player.profile.level = progression.respect;
      player.profile.heat = clamp(Number(player.profile.heat || 0) + Math.ceil(Number(heist.risk || 0) * 12), 0, 100);
      player.stats.gangHeistsWon += 1;
      player.stats.totalEarned += perHeadCash;
      applyGangHeistDistrictOutcome(player, heist, { success: true, now });
      participantsReport.push({
        userId: entry.userId,
        name: player.profile?.name || entry.username || "Gracz",
        cash: perHeadCash,
        xp: xpGain,
        jailed: false,
        heat: Math.ceil(Number(heist.risk || 0) * 12),
        hpLoss: 0,
      });
      pushLog(player, `Gang siada z robota: ${heist.name}. Twoja dzialka to $${perHeadCash}.`);
      return;
    }

    const hpLoss = randomBetween(8, 16);
    const heatGain = Math.max(4, Math.ceil(Number(heist.risk || 0) * 20));
    const jailed = Math.random() < jailChance;
    const damageState = applyCriticalCareDamage(player, hpLoss, {
      now,
      source: `wtopie na napadzie gangu ${heist.name}`,
      allowCriticalCare: true,
      minimumHp: 1,
    });
    player.profile.heat = clamp(Number(player.profile.heat || 0) + heatGain, 0, 100);
    const finalJailed = jailed && !damageState.criticalCareTriggered;
    if (finalJailed) {
      player.profile.jailUntil = Math.max(Number(player.profile.jailUntil || 0), now + jailSentenceMs);
      jailedParticipantIds.push(entry.userId);
    }
    applyGangHeistDistrictOutcome(player, heist, { success: false, now });
    participantsReport.push({
      userId: entry.userId,
      name: player.profile?.name || entry.username || "Gracz",
      cash: 0,
      xp: 0,
      criticalCareTriggered: damageState.criticalCareTriggered,
      jailed: finalJailed,
      heat: heatGain,
      hpLoss,
    });
    pushLog(
      player,
      damageState.criticalCareTriggered
        ? `Wtopa na robocie: ${heist.name}. Trafiasz na intensywna terapie.`
        : finalJailed
        ? `Wtopa na robocie: ${heist.name}. Lecisz do celi i tracisz ${hpLoss} HP.`
        : `Wtopa na robocie: ${heist.name}. Wracasz z ${hpLoss} HP straty i wiekszym heatem.`
    );
  });

  const report = {
    id: `gang-heist-report-${heist.id}-${now}`,
    heistId: heist.id,
    heistName: heist.name,
    success,
    districtId: heist.districtId,
    createdAt: now,
    totalTake: success ? grossTake : 0,
    vaultCut: success ? vaultCut : 0,
    teamChance: Number(summary.chance.toFixed(4)),
    participants: participantsReport,
    jailedParticipantIds,
    incident: success
      ? "Ekipa przycisnela robote i zeszla z hajsem."
      : jailedParticipantIds.length
        ? "Wtopa na robocie. Czesc ekipy laduje w celi."
        : "Wtopa na robocie. Ekipa ucieka poobijana.",
    rescueAttemptedAt: null,
    rescueResolvedAt: null,
    rescueMode: null,
    rescueSuccess: null,
  };

  const latestJailUntil = participantEntries.reduce(
    (best, entry) => Math.max(best, Number(entry.player?.profile?.jailUntil || 0)),
    0
  );
  applySharedGangState(gangEntries, {
    activeHeistLobby: null,
    lastHeistReport: report,
    vault: success ? Math.max(0, Number(actor.player.gang.vault || 0) + vaultCut) : Math.max(0, Number(actor.player.gang.vault || 0)),
    jailedCrew: jailedParticipantIds.length,
    crewLockdownUntil: latestJailUntil > now ? latestJailUntil : 0,
  }, now);

  if (success) {
    addGangJobProgress(gangEntries, "gangHeistsCompleted", 1, now);
    addGangJobProgress(
      gangEntries,
      "districtInfluencePulse",
      Math.max(2, Math.round(summary.requiredMembers + Number(heist.risk || 0) * 4)),
      now
    );
  }
  pushGangChatShared(gangEntries, buildGangHeistResultMessage(report), now);

  return {
    heistId: heist.id,
    result: success ? "success" : "failure",
    report,
    lobby: null,
    chance: summary.chance,
    participants: participantsReport.length,
    message: success ? "Napad gangu siadl." : "Napad gangu spalony.",
    logMessage: buildGangHeistResultMessage(report),
  };
}

export function rescueGangHeistCrewForGang(gangEntries, actorUserId, optionId, now = Date.now()) {
  const actor = getActorEntry(gangEntries, actorUserId, now);
  if (!canRunGangHeistRole(actor.player.gang.role)) {
    fail("Pomoc po wtopie odpala Boss, Vice Boss albo Zaufany.", 403);
  }
  const report = actor.player.gang.lastHeistReport;
  if (!report || report.success) {
    fail("Nie ma swiezej wtopki do ratowania.");
  }
  if (!Array.isArray(report.jailedParticipantIds) || !report.jailedParticipantIds.length) {
    fail("Po tej wtapie nikt nie siedzi.");
  }
  if (report.rescueAttemptedAt) {
    fail("Po tym raporcie pomoc byla juz odpalona.");
  }

  const option = getGangRescueOptionById(String(optionId || "").trim());
  if (!option) {
    fail("Nie ma takiego typu pomocy.", 404);
  }

  const jailedEntries = (Array.isArray(gangEntries) ? gangEntries : [])
    .filter((entry) => report.jailedParticipantIds.includes(entry.userId))
    .map((entry) => ensureGangEntry(entry, now));
  if (!jailedEntries.length) {
    fail("Nie znaleziono skazanych z tej akcji.");
  }

  const gangEffects = getGangProjectEffects(actor.player.gang);
  const cost = Math.max(0, Math.floor(Number(option.baseCost || 0) + jailedEntries.length * 2500));
  if (Number(actor.player.gang.vault || 0) < cost) {
    fail(`Brakuje ${cost}$ w skarbcu na taka pomoc.`);
  }

  const chance = clamp(
    Number(option.chance || 0) + Number(gangEffects.pressureMitigation || 0) * 0.18 + Number(gangEffects.heatRelief || 0) * 0.02,
    0.16,
    0.95
  );
  const success = Math.random() < chance;
  const releaseCount = success
    ? Math.max(1, Math.min(jailedEntries.length, Math.ceil(jailedEntries.length * Number(option.releaseRatio || 0.5))))
    : 0;
  const released = [];
  const reduced = [];

  jailedEntries.forEach((entry, index) => {
    const currentJailUntil = Number(entry.player.profile?.jailUntil || 0);
    if (!success) {
      entry.player.profile.heat = clamp(Number(entry.player.profile.heat || 0) + Number(option.heat || 0), 0, 100);
      return;
    }

    if (index < releaseCount) {
      entry.player.profile.jailUntil = 0;
      released.push(entry.player.profile?.name || entry.username || "Gracz");
      return;
    }

    const remaining = Math.max(0, currentJailUntil - now);
    const cut = Math.floor(remaining * 0.45);
    entry.player.profile.jailUntil = Math.max(now, currentJailUntil - cut);
    reduced.push(entry.player.profile?.name || entry.username || "Gracz");
  });

  const latestJailUntil = jailedEntries.reduce(
    (best, entry) => Math.max(best, Number(entry.player.profile?.jailUntil || 0)),
    0
  );
  const nextJailedIds = jailedEntries
    .filter((entry) => Number(entry.player.profile?.jailUntil || 0) > now)
    .map((entry) => entry.userId);
  const nextReport = {
    ...report,
    jailedParticipantIds: nextJailedIds,
    rescueAttemptedAt: now,
    rescueResolvedAt: success ? now : null,
    rescueMode: option.id,
    rescueSuccess: success,
  };

  applySharedGangState(gangEntries, {
    vault: Math.max(0, Number(actor.player.gang.vault || 0) - cost),
    lastHeistReport: nextReport,
    jailedCrew: nextJailedIds.length,
    crewLockdownUntil: latestJailUntil > now ? latestJailUntil : 0,
  }, now);

  const text = success
    ? `${option.name} dziala po wtapie. Wyciagacie ${released.length} ludzi, a ${reduced.length} ma krotsza odsiadke.`
    : `${option.name} nie siada. Kasa znika, a heat dalej smierdzi po miescie.`;
  pushGangChatShared(gangEntries, text, now);

  return {
    mode: option.id,
    cost,
    chance,
    success,
    released,
    reduced,
    report: nextReport,
    logMessage: text,
  };
}
