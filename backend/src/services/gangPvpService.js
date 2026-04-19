import {
  ECONOMY_RULES,
  clamp,
  getClubAttackScore,
  getClubDefenseScore,
  getClubRaidChance,
  getClubRaidLoss,
  getClubSecurityUpkeep,
} from "../config/economy.js";
import { appendPlayerMessage } from "./socialActionService.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

function createGangEvent(text, now = Date.now()) {
  return {
    id: `gang-pvp-${now}-${Math.random().toString(36).slice(2, 8)}`,
    author: "System",
    text,
    time: new Date(now).toISOString(),
  };
}

function pushGangEvent(player, text, now = Date.now()) {
  if (!player?.gang || typeof player.gang !== "object") {
    return;
  }
  player.gang.chat = [createGangEvent(text, now), ...(Array.isArray(player.gang.chat) ? player.gang.chat : [])].slice(0, 20);
}

function getGangAttackTargetKey(gangName) {
  return String(gangName || "").trim().toLowerCase();
}

function getAttackCooldownState(attackerPlayer, targetGangName, now = Date.now()) {
  const targetKey = getGangAttackTargetKey(targetGangName);
  const globalCooldownRemainingMs = Math.max(
    0,
    Number(attackerPlayer?.cooldowns?.gangAttackUntil || 0) - now
  );
  const sameTargetCooldownRemainingMs = Math.max(
    0,
    Number(attackerPlayer?.cooldowns?.gangAttackTargets?.[targetKey] || 0) - now
  );

  return {
    targetKey,
    globalCooldownRemainingMs,
    sameTargetCooldownRemainingMs,
    globalCooldownRemainingSeconds: Math.ceil(globalCooldownRemainingMs / 1000),
    sameTargetCooldownRemainingSeconds: Math.ceil(sameTargetCooldownRemainingMs / 1000),
  };
}

function buildGangRaidProfiles(attackerPlayer, attackerGangEntry, targetGangEntry, targetBossPlayer, now = Date.now()) {
  const targetClub =
    targetBossPlayer?.club && typeof targetBossPlayer.club === "object" && targetBossPlayer.club.owned
      ? targetBossPlayer.club
      : null;
  const targetProfile = targetBossPlayer?.profile || {};
  const attackerProfile = attackerPlayer?.profile || {};

  const attacker = {
    attack: Number(attackerProfile.attack || 0),
    defense: Number(attackerProfile.defense || 0),
    dexterity: Number(attackerProfile.dexterity || 0),
    respect: Number(attackerProfile.respect || 0),
    heat: Number(attackerProfile.heat || 0),
    gangMembers: Math.max(1, Math.floor(Number(attackerGangEntry?.members || attackerPlayer?.gang?.members || 1))),
    gangInfluence: Math.max(0, Math.floor(Number(attackerGangEntry?.influence || attackerPlayer?.gang?.influence || 0))),
    committedCrew: Math.max(1, Math.min(Math.max(1, Math.floor(Number(attackerGangEntry?.members || 1))), 4)),
    intelBonus: 0,
  };
  const defender = {
    ownerAttack: Math.max(8, Number(targetProfile.attack || 0) || Math.round(Number(targetGangEntry?.respect || 0) * 0.32)),
    ownerDefense: Math.max(8, Number(targetProfile.defense || 0) || Math.round(Number(targetGangEntry?.respect || 0) * 0.28)),
    ownerDexterity: Math.max(7, Number(targetProfile.dexterity || 0) || Math.round(Number(targetGangEntry?.respect || 0) * 0.24)),
    ownerRespect: Math.max(0, Math.floor(Number(targetGangEntry?.respect || targetProfile.respect || 0))),
    ownerHeat: Math.max(0, Math.floor(Number(targetProfile.heat || 18))),
    gangMembers: Math.max(1, Math.floor(Number(targetGangEntry?.members || 1))),
    gangInfluence: Math.max(0, Math.floor(Number(targetGangEntry?.influence || 0))),
    popularity: Math.max(18, Math.floor(Number(targetClub?.popularity || 35 + Number(targetGangEntry?.territory || 0) * 4))),
    mood: clampNumber(Number(targetClub?.mood || 62), 0, 100),
    recentTraffic: Math.max(2, Math.round(Number(targetClub?.traffic || 0) || Number(targetGangEntry?.members || 1) / 2)),
    recentIncomingAttacks: Math.max(0, Math.floor(Number(targetClub?.recentIncomingAttacks || 0))),
    recentIncomingFromSameAttacker: Math.max(0, Math.floor(Number(targetClub?.recentIncomingFromSameAttacker || 0))),
    clubAgeHours: Math.max(72, Math.floor(Number(targetClub?.ageHours || 96))),
    defenderShieldSeconds: Math.max(
      0,
      Math.floor((Number(targetClub?.defenderShieldUntil || 0) - now) / 1000)
    ),
    clubCash: Math.max(0, Math.floor(Number(targetGangEntry?.vault || 0))),
    targetUnclaimedIncome: Math.max(
      1200,
      Math.round(
        Number(targetClub?.lastNightSummary?.payout || 0) ||
          Math.max(0, Number(targetGangEntry?.influence || 0)) * 240
      )
    ),
    targetNetWorth: Math.max(Math.floor(Number(targetGangEntry?.vault || 0) * 4), 20000),
    clubSecurityLevel: Math.max(
      0,
      Math.floor(Number(targetClub?.securityLevel || Math.round(Number(targetGangEntry?.territory || 1) / 2)))
    ),
    baseNet: Math.max(
      1800,
      Math.round(Number(targetClub?.takeoverCost || 0) * 0.0022) || Math.round(Math.max(0, Number(targetGangEntry?.influence || 0)) * 320)
    ),
  };

  return { attacker, defender, targetClub };
}

function getBlockedReason({ attackerPlayer, targetGangEntry, raidChance, cooldownState, energyCost = 3, now = Date.now() }) {
  if (!attackerPlayer?.gang?.joined || !attackerPlayer?.gang?.name) {
    return "Na gang idzie sie ze swoja ekipa, nie solo.";
  }
  if (!targetGangEntry?.name) {
    return "Nie ma takiej ekipy na miescie.";
  }
  if (String(attackerPlayer.gang.name || "").trim().toLowerCase() === String(targetGangEntry.name || "").trim().toLowerCase()) {
    return "Nie zaatakujesz wlasnego gangu z poziomu tej akcji.";
  }
  if (Number(attackerPlayer?.profile?.jailUntil || 0) > now) {
    return "Atak na gang odpalasz dopiero po wyjsciu z celi.";
  }
  if (Number(attackerPlayer?.profile?.energy || 0) < energyCost) {
    return `Potrzebujesz ${energyCost} energii na akcje przeciw gangowi.`;
  }
  if (cooldownState.globalCooldownRemainingMs > 0) {
    return `Ekipa studzi sie jeszcze przez ${Math.ceil(cooldownState.globalCooldownRemainingMs / 60000)} min.`;
  }
  if (cooldownState.sameTargetCooldownRemainingMs > 0) {
    return `Na ten gang wracasz za ${Math.ceil(cooldownState.sameTargetCooldownRemainingMs / 60000)} min.`;
  }
  if (raidChance?.protection?.starterShield) {
    return "Cel siedzi jeszcze pod swieza oslona po starcie.";
  }
  if (raidChance?.protection?.shieldActive) {
    return "Cel ma jeszcze tarcze po poprzednim najedzie.";
  }
  if (raidChance?.protection?.griefProtected) {
    return "Ten cel siedzi pod oslona przeciw nagonce.";
  }
  if (raidChance?.blocked) {
    return "Najazd jest chwilowo zablokowany przez oslony celu.";
  }
  return "";
}

export function buildGangRaidPreview(attackerPlayer, attackerGangEntry, targetGangEntry, targetBossPlayer, now = Date.now()) {
  if (!targetGangEntry?.name) {
    fail("Nie ma takiej ekipy na miescie.", 404);
  }

  const { attacker, defender } = buildGangRaidProfiles(
    attackerPlayer,
    attackerGangEntry,
    targetGangEntry,
    targetBossPlayer,
    now
  );
  const attackScore = getClubAttackScore(attacker);
  const defenseScore = getClubDefenseScore(defender);
  const targetExposure = clamp(
    defender.popularity / 100 + defender.recentTraffic / 14 + defender.ownerHeat / 220,
    0,
    1
  );
  const raidChance = getClubRaidChance({
    attackerPower: attackScore,
    defenderPower: defenseScore,
    attackerRespect: attacker.respect,
    defenderRespect: defender.ownerRespect,
    targetExposure,
    recentIncomingAttacks: defender.recentIncomingAttacks,
    recentIncomingFromSameAttacker: defender.recentIncomingFromSameAttacker,
    clubAgeHours: defender.clubAgeHours,
    defenderShieldSeconds: defender.defenderShieldSeconds,
  });
  const attackRollMargin = clamp((attackScore - defenseScore) / Math.max(80, defenseScore), 0, 0.45);
  const lossPreview = getClubRaidLoss({
    successChance: raidChance.chance || 0,
    attackRollMargin,
    targetClubCash: defender.clubCash,
    targetUnclaimedIncome: defender.targetUnclaimedIncome,
    targetNetWorth: defender.targetNetWorth,
    targetSecurityLevel: defender.clubSecurityLevel,
    defenderProtected: raidChance.protection?.griefProtected || raidChance.protection?.starterShield || false,
    defenderRespect: defender.ownerRespect,
    attackerPower: attackScore,
    defenderPower: defenseScore,
  });
  const securityUpkeep = getClubSecurityUpkeep({
    clubSecurityLevel: defender.clubSecurityLevel,
    baseNet: defender.baseNet,
  });
  const cooldownState = getAttackCooldownState(attackerPlayer, targetGangEntry.name, now);
  const blockedReason = getBlockedReason({
    attackerPlayer,
    targetGangEntry,
    raidChance,
    cooldownState,
    now,
  });

  return {
    targetGangName: targetGangEntry.name,
    attackScore,
    defenseScore,
    targetExposure,
    raidChance,
    lossPreview,
    securityUpkeep,
    cooldowns: {
      gangAttackCooldownSeconds: ECONOMY_RULES.clubPvp.gangAttackCooldownSeconds,
      sameTargetRepeatCooldownSeconds: ECONOMY_RULES.clubPvp.sameTargetRepeatCooldownSeconds,
      defenderShieldAfterAttackSeconds: ECONOMY_RULES.clubPvp.defenderShieldAfterAttackSeconds,
    },
    attackerState: {
      canAttack: !blockedReason,
      reason: blockedReason || null,
      energyCost: 3,
      globalCooldownRemainingSeconds: cooldownState.globalCooldownRemainingSeconds,
      sameTargetCooldownRemainingSeconds: cooldownState.sameTargetCooldownRemainingSeconds,
    },
  };
}

export function executeGangRaidForPlayers(
  attackerPlayer,
  attackerGangLeaderPlayer,
  targetGangLeaderPlayer,
  attackerGangEntry,
  targetGangEntry,
  now = Date.now()
) {
  const preview = buildGangRaidPreview(
    attackerPlayer,
    attackerGangEntry,
    targetGangEntry,
    targetGangLeaderPlayer,
    now
  );
  if (!preview.attackerState.canAttack) {
    fail(preview.attackerState.reason || "Najazd jest chwilowo zablokowany.");
  }

  const targetKey = getGangAttackTargetKey(targetGangEntry.name);
  attackerPlayer.profile.energy = Math.max(0, Number(attackerPlayer.profile?.energy || 0) - Number(preview.attackerState.energyCost || 3));
  attackerPlayer.cooldowns.gangAttackUntil =
    now + ECONOMY_RULES.clubPvp.gangAttackCooldownSeconds * 1000;
  attackerPlayer.cooldowns.gangAttackTargets = {
    ...(attackerPlayer.cooldowns?.gangAttackTargets || {}),
    [targetKey]: now + ECONOMY_RULES.clubPvp.sameTargetRepeatCooldownSeconds * 1000,
  };

  const actorLeader = attackerGangLeaderPlayer || attackerPlayer;
  const targetLeader = targetGangLeaderPlayer;
  const attackerName = attackerPlayer?.profile?.name || "Gracz";
  const targetGangName = targetGangEntry?.name || "Gang";
  const attackSucceeded = Math.random() < Number(preview.raidChance?.chance || 0);

  let steal = 0;
  let hpLoss = 0;
  let gearLoss = 0;

  if (attackSucceeded) {
    const availableVault = Math.max(0, Math.floor(Number(targetLeader?.gang?.vault || targetGangEntry?.vault || 0)));
    const suggestedSteal = Math.max(650, Math.round(Number(preview.lossPreview?.cashLoss || 0)));
    steal = Math.min(availableVault, suggestedSteal);

    attackerPlayer.profile.cash = Number(attackerPlayer.profile.cash || 0) + steal;
    attackerPlayer.profile.heat = clamp(Number(attackerPlayer.profile.heat || 0) + 6, 0, 100);

    if (targetLeader?.gang && typeof targetLeader.gang === "object") {
      targetLeader.gang.vault = Math.max(0, Number(targetLeader.gang.vault || 0) - steal);
    }
    if (targetLeader?.club?.owned) {
      targetLeader.club.defenseReadiness = clamp(
        Number(targetLeader.club.defenseReadiness || 0) - Math.max(6, Math.round(Number(preview.lossPreview?.repairCost || 0) / 1200)),
        0,
        100
      );
      targetLeader.club.threatLevel = clamp(Number(targetLeader.club.threatLevel || 0) + 12, 0, 100);
      targetLeader.club.traffic = clamp(Number(targetLeader.club.traffic || 0) * 0.72, 0, 100);
      targetLeader.club.mood = clamp(Number(targetLeader.club.mood || 0) - 4, 0, 100);
      targetLeader.club.recentIncident = {
        tone: "risk",
        text: `${attackerName} docisnal ludzi przy lokalu i wyrwal ${steal}$.`,
        createdAt: now,
      };
    }

    pushGangEvent(actorLeader, `Najazd na ${targetGangName} siadl. Z obiegu wpada ${steal}$.`, now);
    pushGangEvent(targetLeader, `${attackerName} docisnal ${targetGangName} i wyrwal ${steal}$ ze skarbca.`, now);
    appendPlayerMessage(attackerPlayer, {
      from: "System",
      subject: "Najazd na gang",
      preview: `Najazd na ${targetGangName} dowieziony. Wpada ${steal}$.`,
      time: new Date(now).toISOString(),
    });
    appendPlayerMessage(targetLeader, {
      from: "System",
      subject: "Najazd na gang",
      preview: `${attackerName} wszedl na ${targetGangName} i zabral ${steal}$ ze skarbca.`,
      time: new Date(now).toISOString(),
    });

    return {
      success: true,
      targetGangName,
      steal,
      hpLoss: 0,
      gearLoss: 0,
      preview,
      logMessage:
        steal > 0
          ? `Najazd na ${targetGangName} siadl. Wpada ${steal}$ ze skarbca.`
          : `Najazd na ${targetGangName} siadl, ale skarbiec byl juz prawie pusty.`,
    };
  }

  hpLoss = Math.max(8, Math.round(10 + Math.random() * 10));
  gearLoss = Math.max(1, Math.round(1 + Math.random() * 3));
  attackerPlayer.profile.hp = clamp(
    Number(attackerPlayer.profile.hp || 0) - hpLoss,
    0,
    Number(attackerPlayer.profile.maxHp || 0)
  );
  attackerPlayer.profile.heat = clamp(Number(attackerPlayer.profile.heat || 0) + 4, 0, 100);
  if (actorLeader?.gang && typeof actorLeader.gang === "object") {
    actorLeader.gang.gearScore = clamp(Number(actorLeader.gang.gearScore || 0) - gearLoss, 18, 100);
  }
  if (targetLeader?.club?.owned) {
    targetLeader.club.defenseReadiness = clamp(Number(targetLeader.club.defenseReadiness || 0) + 2, 0, 100);
  }

  pushGangEvent(actorLeader, `Najazd na ${targetGangName} nie siadl. Ekipa traci rytm i ${gearLoss} pkt sprzetu.`, now);
  pushGangEvent(targetLeader, `${targetGangName} odbija probe wejscia ${attackerName}.`, now);
  appendPlayerMessage(attackerPlayer, {
    from: "System",
    subject: "Najazd na gang",
    preview: `Najazd na ${targetGangName} spalony. Dostajesz po lapach i schodzi ${gearLoss} pkt sprzetu.`,
    time: new Date(now).toISOString(),
  });
  appendPlayerMessage(targetLeader, {
    from: "System",
    subject: "Najazd na gang",
    preview: `${attackerName} probowal wejsc na ${targetGangName}, ale odbil sie od obrony.`,
    time: new Date(now).toISOString(),
  });

  return {
    success: false,
    targetGangName,
    steal: 0,
    hpLoss,
    gearLoss,
    preview,
    logMessage: `Najazd na ${targetGangName} nie wyszedl. Obity wylot i ${gearLoss} pkt sprzetu w dol.`,
  };
}

export function sendGangAllianceOfferForPlayers(
  actorPlayer,
  actorGangLeaderPlayer,
  targetGangLeaderPlayer,
  targetGangEntry,
  now = Date.now()
) {
  const actorGangName = String(actorPlayer?.gang?.name || "").trim();
  if (!actorPlayer?.gang?.joined || !actorGangName) {
    fail("Najpierw wejdz do gangu.");
  }
  if (!targetGangEntry?.name) {
    fail("Nie ma takiej ekipy na miescie.", 404);
  }
  if (actorGangName.toLowerCase() === String(targetGangEntry.name || "").trim().toLowerCase()) {
    fail("Do swojego gangu nie wysylasz oferty sojuszu.");
  }
  if (!targetGangLeaderPlayer) {
    fail("Boss tej ekipy jest teraz poza zasiegiem.", 404);
  }

  const actorName = actorPlayer?.profile?.name || "Gracz";
  const actorLeader = actorGangLeaderPlayer || actorPlayer;
  const preview = `${actorGangName} wysyla propozycje sojuszu do ${targetGangEntry.name}.`;

  appendPlayerMessage(targetGangLeaderPlayer, {
    from: actorName,
    subject: "Oferta sojuszu",
    preview,
    time: new Date(now).toISOString(),
  });
  pushGangEvent(actorLeader, `Wyslano propozycje sojuszu do ${targetGangEntry.name}.`, now);
  pushGangEvent(targetGangLeaderPlayer, `${actorGangName} puka z propozycja sojuszu.`, now);

  return {
    targetGangName: targetGangEntry.name,
    message: preview,
    logMessage: `Oferta sojuszu poleciala do ${targetGangEntry.name}.`,
  };
}
