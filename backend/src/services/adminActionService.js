import {
  ADMIN_CASH_GRANT_MAX,
  ADMIN_CASH_GRANT_PRESETS,
  ADMIN_PROFILE_FLOORS,
  normalizeAdminGrantPresets,
} from "../../../shared/admin.js";

function ensurePlayerProfile(player) {
  if (!player?.profile || typeof player.profile !== "object") {
    throw new Error("Player profile missing");
  }

  if (!player.flags || typeof player.flags !== "object") {
    player.flags = {};
  }

  return player.profile;
}

export function applyAdminProfileFloors(player) {
  const profile = ensurePlayerProfile(player);
  let changed = false;

  const maxFloorFields = [
    "cash",
    "bank",
    "respect",
    "level",
    "attack",
    "defense",
    "dexterity",
    "charisma",
    "maxHp",
    "maxEnergy",
    "premiumTokens",
  ];

  for (const field of maxFloorFields) {
    const nextValue = Number(ADMIN_PROFILE_FLOORS[field] || 0);
    if (Number(profile[field] || 0) < nextValue) {
      profile[field] = nextValue;
      changed = true;
    }
  }

  for (const field of ["hp", "energy"]) {
    const nextValue = Number(ADMIN_PROFILE_FLOORS[field] || 0);
    if (Number(profile[field] || 0) < nextValue) {
      profile[field] = nextValue;
      changed = true;
    }
  }

  if (Number(profile.heat || 0) > Number(ADMIN_PROFILE_FLOORS.heat || 0)) {
    profile.heat = Number(ADMIN_PROFILE_FLOORS.heat || 0);
    changed = true;
  }

  return changed;
}

export function buildAdminPublicState(isAdmin) {
  if (!isAdmin) {
    return { isAdmin: false, grantPresets: [] };
  }

  return {
    isAdmin: true,
    grantPresets: normalizeAdminGrantPresets(ADMIN_CASH_GRANT_PRESETS),
  };
}

export function grantCashToPlayerByAdmin({
  actorPlayer,
  targetPlayer,
  amount,
  now = Date.now(),
  actorName = "Admin",
}) {
  ensurePlayerProfile(actorPlayer);
  const targetProfile = ensurePlayerProfile(targetPlayer);
  const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));

  if (!safeAmount || safeAmount > ADMIN_CASH_GRANT_MAX) {
    throw new Error(`Admin cash grant must be between 1 and ${ADMIN_CASH_GRANT_MAX}.`);
  }

  targetProfile.cash = Number(targetProfile.cash || 0) + safeAmount;
  targetPlayer.flags.adminGrantedCashTotal =
    Number(targetPlayer.flags?.adminGrantedCashTotal || 0) + safeAmount;
  targetPlayer.flags.lastAdminGrantAt = now;
  actorPlayer.flags.lastAdminActionAt = now;

  const targetName = targetProfile.name || "Gracz";
  const selfGrant = actorPlayer === targetPlayer;

  return {
    amount: safeAmount,
    targetName,
    logMessage: selfGrant
      ? `Admin refill: +$${safeAmount} dla siebie.`
      : `Admin grant: +$${safeAmount} dla ${targetName}.`,
    adminLogMessage: selfGrant
      ? `Admin refill wpada na konto. +$${safeAmount}.`
      : `Dosypano $${safeAmount} dla ${targetName}.`,
    targetLogMessage: selfGrant
      ? `Admin refill: konto odswiezone o $${safeAmount}.`
      : `${actorName} dosypuje Ci $${safeAmount} na testy.`,
  };
}
