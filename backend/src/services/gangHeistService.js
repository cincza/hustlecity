import { clamp } from "../../../shared/economy.js";
import { applyXpProgression } from "../../../shared/progression.js";
import {
  canRunGangHeistRole,
  getGangHeistBonusRate,
  getGangHeistById,
  getGangHeistEffectiveProfile,
  getGangHeistFailureJailChance,
  getGangHeistFailureJailSentenceSeconds,
  getGangHeistOdds,
  getGangHeistParticipants,
} from "../../../shared/gangHeists.js";
import { applyGangHeistDistrictOutcome } from "./districtService.js";

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

function pushGangChat(gang, text, now = Date.now()) {
  gang.chat = [
    {
      id: `gang-heist-${now}-${Math.random().toString(36).slice(2, 8)}`,
      author: "System",
      text,
      time: new Date(now).toISOString(),
    },
    ...(Array.isArray(gang.chat) ? gang.chat : []),
  ].slice(0, 20);
}

function ensureGangHeistStats(player) {
  if (!player.stats || typeof player.stats !== "object") {
    player.stats = {};
  }
  player.stats.gangHeistsWon = Math.max(0, Math.floor(Number(player.stats.gangHeistsWon || 0)));
  player.stats.totalEarned = Math.max(0, Math.floor(Number(player.stats.totalEarned || 0)));
}

export function executeGangHeistForPlayer(player, heistId, now = Date.now()) {
  const heist = getGangHeistById(String(heistId || "").trim());
  if (!heist) {
    fail("Nie ma takiego napadu gangu.", 404);
  }

  ensureGangHeistStats(player);

  if (!player?.gang?.joined) {
    fail("Najpierw musisz byc w gangu.");
  }
  if (!canRunGangHeistRole(player.gang.role)) {
    fail("Napady gangu odpalaja tylko Boss, Vice Boss albo Zaufany.", 403);
  }
  if (Number(player.gang.crewLockdownUntil || 0) > now) {
    fail("Ekipa jeszcze sie nie pozbierala po ostatniej wtapie.");
  }
  if (Number(player.gang.members || 0) < heist.minMembers) {
    fail(`Ten napad wymaga ${heist.minMembers} ludzi w ekipie.`);
  }

  const availableCrew = Math.max(
    0,
    Number(player.gang.members || 0) - Number(player.gang.jailedCrew || 0)
  );
  if (availableCrew < heist.minMembers) {
    fail("Za duzo ludzi siedzi. Nie masz pelnego skladu do tej roboty.");
  }
  if (Number(player?.profile?.respect || 0) < heist.respect) {
    fail(`Masz za niski szacunek. Wymagany szacunek: ${heist.respect}.`);
  }
  if (Number(player?.profile?.energy || 0) < heist.energy) {
    fail(`Potrzebujesz ${heist.energy} energii.`);
  }

  const effectiveProfile = getGangHeistEffectiveProfile(player.profile, player.activeBoosts);
  const { chance } = getGangHeistOdds(player.profile, effectiveProfile, player.gang, heist);
  const participants = getGangHeistParticipants(player.gang, heist);

  player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - heist.energy);
  if (!player.timers || typeof player.timers !== "object") {
    player.timers = {};
  }
  player.timers.energyUpdatedAt = now;

  if (Math.random() < chance) {
    const gangBonusRate = getGangHeistBonusRate(player.gang);
    const grossGain = Math.floor(
      (randomBetween(heist.reward[0], heist.reward[1]) + Math.floor(Number(player.gang.gearScore || 0) * 60)) *
        (1 + gangBonusRate)
    );
    const share = Math.max(600, Math.floor(grossGain / participants));
    const xpGain = Math.max(7, randomBetween(Math.ceil(heist.minMembers * 2.5), heist.minMembers * 4));
    const progression = applyXpProgression(
      {
        respect: Number(player.profile?.respect || 0),
        xp: Number(player.profile?.xp || 0),
      },
      xpGain
    );

    player.profile.cash = Number(player.profile.cash || 0) + share;
    player.profile.respect = progression.respect;
    player.profile.xp = progression.xp;
    player.profile.level = progression.respect;
    player.profile.heat = clamp(
      Number(player.profile.heat || 0) + Math.ceil(Number(heist.risk || 0) * 18),
      0,
      100
    );

    player.stats.gangHeistsWon += 1;
    player.stats.totalEarned += grossGain;
    player.gang.vault = Math.max(0, Number(player.gang.vault || 0) + Math.floor(grossGain * 0.12));
    player.gang.gearScore = clamp(
      Number(player.gang.gearScore || 0) - randomBetween(1, 3) + 1,
      28,
      100
    );

    const activity = applyGangHeistDistrictOutcome(player, heist, { success: true, now });
    const logMessage = `Napad gangu udany: ${heist.name}. Uczestnikow ${participants}, Twoja dzialka $${share} i +${xpGain} XP.`;
    pushLog(player, logMessage);
    pushGangChat(
      player.gang,
      `Napad gangu udany: ${heist.name}. Dzialka na leb: $${share}.`,
      now
    );

    return {
      heistId: heist.id,
      result: "success",
      chance,
      participants,
      grossGain,
      share,
      vaultGain: Math.floor(grossGain * 0.12),
      xpGain,
      districtId: activity?.district?.id || heist.districtId || null,
      logMessage,
      message: "Napad gangu siadl.",
    };
  }

  const jailedCrew = Math.min(
    Math.max(0, Number(player.gang.members || 0) - 1),
    randomBetween(1, Math.max(1, Math.ceil(heist.minMembers / 2)))
  );
  const gearLoss = randomBetween(6, 14);
  const vaultLoss = Math.floor(Number(heist.reward?.[0] || 0) * 0.2);
  const jailed = Math.random() < getGangHeistFailureJailChance(heist);
  const jailSeconds = jailed ? getGangHeistFailureJailSentenceSeconds(heist) : 0;

  player.profile.hp = clamp(Number(player.profile.hp || 0) - 16, 0, Number(player.profile.maxHp || 100));
  player.profile.heat = clamp(
    Number(player.profile.heat || 0) + Math.ceil(Number(heist.risk || 0) * 26),
    0,
    100
  );
  player.gang.vault = clamp(Number(player.gang.vault || 0) - vaultLoss, 0, 999999999);
  player.gang.gearScore = clamp(Number(player.gang.gearScore || 0) - gearLoss, 18, 100);
  player.gang.jailedCrew = clamp(
    Number(player.gang.jailedCrew || 0) + jailedCrew,
    0,
    Math.max(0, Number(player.gang.members || 0) - 1)
  );
  player.gang.crewLockdownUntil = Math.max(
    Number(player.gang.crewLockdownUntil || 0),
    now + (150 + heist.energy * 45) * 1000
  );

  if (jailed) {
    player.profile.jailUntil = Math.max(Number(player.profile.jailUntil || 0), now + jailSeconds * 1000);
  }

  const activity = applyGangHeistDistrictOutcome(player, heist, { success: false, now });
  const logMessage = `Napad gangu nie siadl: ${heist.name}. Siada ${jailedCrew} ludzi i leci ${gearLoss} pkt sprzetu.`;
  pushLog(player, logMessage);
  pushGangChat(
    player.gang,
    `Wtopa na robocie: ${heist.name}. Siedzi ${jailedCrew} ludzi, sprzet spalony.`,
    now
  );

  return {
    heistId: heist.id,
    result: "failure",
    chance,
    participants,
    jailedCrew,
    gearLoss,
    vaultLoss,
    jailed,
    jailSeconds,
    districtId: activity?.district?.id || heist.districtId || null,
    logMessage,
    message: jailed ? "Napad gangu spalony i wpadasz za kraty." : "Napad gangu spalony.",
  };
}
