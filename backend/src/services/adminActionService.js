import {
  ADMIN_CASH_GRANT_MAX,
  ADMIN_CASH_GRANT_PRESETS,
  ADMIN_PROFILE_FLOORS,
  ADMIN_RESPECT_GRANT_MAX,
  ADMIN_RESPECT_GRANT_PRESETS,
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

export function applyAdminProfileFloors(player, options = {}) {
  const profile = ensurePlayerProfile(player);
  let changed = false;
  const includeEconomy = options.includeEconomy !== false;

  const maxFloorFields = [
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

  if (includeEconomy) {
    maxFloorFields.unshift("bank");
    maxFloorFields.unshift("cash");
  }

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
    respectPresets: normalizeAdminGrantPresets(ADMIN_RESPECT_GRANT_PRESETS),
  };
}

const ADMIN_EDIT_LIMITS = {
  cash: [0, 1_000_000_000_000],
  bank: [0, 1_000_000_000_000],
  premiumTokens: [0, 1_000_000],
  hp: [0, 1_000_000],
  energy: [0, 1_000_000],
  heat: [0, 100],
};

export function buildAdminPlayerSnapshot(userRecord) {
  const player = userRecord?.playerData || {};
  const profile = player.profile || {};
  return {
    id: userRecord?._id || player.id || null,
    username: userRecord?.username || player.username || profile.name || "",
    authDisabled: Boolean(userRecord?.authDisabled),
    stateRevision: Number(player.stateRevision || 0),
    classId: player.contacts?.classId || null,
    respect: Number(profile.respect || 0),
    level: Number(profile.level || profile.respect || 0),
    cash: Number(profile.cash || 0),
    bank: Number(profile.bank || 0),
    premiumTokens: Number(profile.premiumTokens || 0),
    hp: Number(profile.hp || 0),
    maxHp: Number(profile.maxHp || 0),
    energy: Number(profile.energy || 0),
    maxEnergy: Number(profile.maxEnergy || 0),
    heat: Number(profile.heat || 0),
    gang: player.gang?.joined ? player.gang?.name || "Gang" : null,
    activePlan: player.sessionPlans?.active?.key || null,
    activeOperation: player.operations?.active?.id || null,
    activeRival: player.rivals?.active?.id || null,
  };
}

export function buildAdminPlayerDetail(userRecord) {
  const player = userRecord?.playerData || {};
  return {
    ...buildAdminPlayerSnapshot(userRecord),
    email: userRecord?.email || null,
    createdAt: userRecord?.createdAt || null,
    updatedAt: userRecord?.updatedAt || null,
    profile: structuredClone(player.profile || {}),
    stats: structuredClone(player.stats || {}),
    classState: structuredClone(player.contacts || {}),
    gangState: structuredClone(player.gang || {}),
    inventory: structuredClone(player.inventory || {}),
    drugInventory: structuredClone(player.drugInventory || {}),
    businesses: structuredClone(player.businessesOwned || []),
    factories: structuredClone(player.factoriesOwned || {}),
    club: structuredClone(player.club || {}),
    sessionPlans: structuredClone(player.sessionPlans || {}),
    operations: structuredClone(player.operations || {}),
    rivals: structuredClone(player.rivals || {}),
    empireProjects: structuredClone(player.empireProjects || {}),
  };
}

export function setAdminPlayerField(player, field, value) {
  if (!ADMIN_EDIT_LIMITS[field]) throw Object.assign(new Error("Unsupported admin field"), { statusCode: 400 });
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw Object.assign(new Error("Value must be a whole number"), { statusCode: 400 });
  const [minimum, hardMaximum] = ADMIN_EDIT_LIMITS[field];
  const profile = ensurePlayerProfile(player);
  const dynamicMaximum = field === "hp"
    ? Math.max(minimum, Number(profile.maxHp || hardMaximum))
    : field === "energy"
      ? Math.max(minimum, Number(profile.maxEnergy || hardMaximum))
      : hardMaximum;
  if (parsed < minimum || parsed > dynamicMaximum) {
    throw Object.assign(new Error(`${field} must be between ${minimum} and ${dynamicMaximum}`), { statusCode: 400 });
  }
  const previous = Number(profile[field] || 0);
  profile[field] = parsed;
  return { field, previous, value: parsed };
}

export function repairAdminPlayerState(player, system) {
  if (system === "plan") {
    const previous = player?.sessionPlans?.active || null;
    if (!player.sessionPlans || typeof player.sessionPlans !== "object") player.sessionPlans = { version: 1, active: null, claims: [], dismissed: [] };
    player.sessionPlans.active = null;
    return { system, hadActiveState: Boolean(previous) };
  }
  if (system === "operation") {
    const previous = player?.operations?.active || null;
    if (!player.operations || typeof player.operations !== "object") player.operations = { version: 1, active: null, history: [] };
    player.operations.active = null;
    return { system, hadActiveState: Boolean(previous) };
  }
  throw Object.assign(new Error("System must be plan or operation"), { statusCode: 400 });
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

export function grantRespectToPlayerByAdmin({
  actorPlayer,
  targetPlayer,
  amount,
  now = Date.now(),
  actorName = "Admin",
}) {
  ensurePlayerProfile(actorPlayer);
  const targetProfile = ensurePlayerProfile(targetPlayer);
  const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));

  if (!safeAmount || safeAmount > ADMIN_RESPECT_GRANT_MAX) {
    throw new Error(`Admin respect grant must be between 1 and ${ADMIN_RESPECT_GRANT_MAX}.`);
  }

  targetProfile.respect = Number(targetProfile.respect || 0) + safeAmount;
  targetPlayer.flags.adminGrantedRespectTotal =
    Number(targetPlayer.flags?.adminGrantedRespectTotal || 0) + safeAmount;
  targetPlayer.flags.lastAdminRespectGrantAt = now;
  actorPlayer.flags.lastAdminActionAt = now;

  const targetName = targetProfile.name || "Gracz";
  const selfGrant = actorPlayer === targetPlayer;

  return {
    amount: safeAmount,
    targetName,
    logMessage: selfGrant
      ? `Admin respect: +${safeAmount} RES dla siebie.`
      : `Admin respect: +${safeAmount} RES dla ${targetName}.`,
    adminLogMessage: selfGrant
      ? `Admin respect wpada na profil. +${safeAmount} RES.`
      : `Wbito +${safeAmount} RES dla ${targetName}.`,
    targetLogMessage: selfGrant
      ? `Admin respect: profil podbity o +${safeAmount} RES.`
      : `${actorName} wbija Ci +${safeAmount} RES na testy.`,
  };
}
