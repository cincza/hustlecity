import {
  CRITICAL_CARE_RULES,
  getCriticalCareMode,
  getCriticalCareRecoveryHp,
  getCriticalCareRemainingMs,
  getCriticalCareStatus,
  hasCriticalCareProtection,
  isCriticalCareActive,
} from "../../../shared/playerActions.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function formatRemainingLabel(remainingMs) {
  const safeMs = Math.max(0, Number(remainingMs || 0));
  const totalSeconds = Math.max(1, Math.ceil(safeMs / 1000));
  if (totalSeconds < 120) {
    return `${totalSeconds}s`;
  }
  return `${Math.max(1, Math.ceil(totalSeconds / 60))} min`;
}

export function ensurePlayerCriticalCareState(player) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  if (!player.profile || typeof player.profile !== "object") {
    player.profile = {};
  }
  if (!player.timers || typeof player.timers !== "object") {
    player.timers = {};
  }
  if (!Object.prototype.hasOwnProperty.call(player.profile, "criticalCareUntil")) {
    player.profile.criticalCareUntil = null;
  }
  if (!Object.prototype.hasOwnProperty.call(player.profile, "criticalCareSource")) {
    player.profile.criticalCareSource = null;
  }
  if (!Object.prototype.hasOwnProperty.call(player.profile, "criticalCareMode")) {
    player.profile.criticalCareMode = null;
  }
  if (!Object.prototype.hasOwnProperty.call(player.profile, "criticalProtectionUntil")) {
    player.profile.criticalProtectionUntil = null;
  }
}

export function syncPlayerCriticalCare(player, now = Date.now()) {
  ensurePlayerCriticalCareState(player);
  const profile = player.profile;

  if (isCriticalCareActive(profile, now)) {
    player.timers.hpUpdatedAt = now;
    profile.hp = Math.max(1, Math.min(Number(profile.maxHp || 100), Number(profile.hp || 1)));
    return {
      active: true,
      released: false,
      protected: false,
      status: getCriticalCareStatus(profile, now),
    };
  }

  const hadCriticalCare = Number(profile.criticalCareUntil || 0) > 0;
  if (hadCriticalCare && Number(profile.criticalCareUntil || 0) <= now) {
    const mode = getCriticalCareMode(profile.criticalCareMode);
    profile.hp = Math.max(
      Number(profile.hp || 0),
      getCriticalCareRecoveryHp(profile.maxHp, mode.id)
    );
    profile.heat = Math.max(0, Number(profile.heat || 0) - Number(mode.heatRelief || 0));
    profile.criticalProtectionUntil = Math.max(
      Number(profile.criticalProtectionUntil || 0),
      now + Number(CRITICAL_CARE_RULES.protectionMs || 0)
    );
    profile.criticalCareUntil = null;
    profile.criticalCareSource = null;
    profile.criticalCareMode = null;
    player.timers.hpUpdatedAt = now;

    return {
      active: false,
      released: true,
      protected: true,
      status: getCriticalCareStatus(profile, now),
      mode,
    };
  }

  return {
    active: false,
    released: false,
    protected: hasCriticalCareProtection(profile, now),
    status: getCriticalCareStatus(profile, now),
  };
}

export function isPlayerInCriticalCare(player, now = Date.now()) {
  ensurePlayerCriticalCareState(player);
  return isCriticalCareActive(player.profile, now);
}

export function enterPlayerCriticalCare(player, { source = "robota", now = Date.now(), modeId = CRITICAL_CARE_RULES.public.id } = {}) {
  ensurePlayerCriticalCareState(player);
  const profile = player.profile;
  if (isCriticalCareActive(profile, now)) {
    return {
      entered: false,
      status: getCriticalCareStatus(profile, now),
      mode: getCriticalCareMode(profile.criticalCareMode),
    };
  }

  const mode = getCriticalCareMode(modeId);
  profile.hp = Math.max(1, Math.min(Number(profile.maxHp || 100), Number(profile.hp || 1)));
  profile.criticalCareUntil = now + Number(mode.durationMs || 0);
  profile.criticalCareSource = String(source || "robota").trim() || "robota";
  profile.criticalCareMode = mode.id;
  player.timers.hpUpdatedAt = now;

  return {
    entered: true,
    mode,
    status: getCriticalCareStatus(profile, now),
  };
}

export function applyCriticalCareDamage(
  player,
  damage,
  { now = Date.now(), source = "robota", allowCriticalCare = true, minimumHp = 0 } = {}
) {
  ensurePlayerCriticalCareState(player);
  const safeDamage = Math.max(0, Math.floor(Number(damage || 0)));
  const currentHp = Math.max(0, Number(player.profile.hp || 0));
  const maxHp = Math.max(1, Number(player.profile.maxHp || 100));
  if (!safeDamage) {
    return {
      damage: 0,
      hpAfter: currentHp,
      criticalCareTriggered: false,
      status: getCriticalCareStatus(player.profile, now),
    };
  }

  const nextHp = currentHp - safeDamage;
  if (allowCriticalCare && nextHp <= 0) {
    const criticalCare = enterPlayerCriticalCare(player, { source, now });
    return {
      damage: safeDamage,
      hpAfter: Number(player.profile.hp || 1),
      criticalCareTriggered: Boolean(criticalCare.entered),
      mode: criticalCare.mode,
      status: criticalCare.status,
    };
  }

  player.profile.hp = Math.max(minimumHp, Math.min(maxHp, nextHp));
  player.timers.hpUpdatedAt = now;
  return {
    damage: safeDamage,
    hpAfter: Number(player.profile.hp || 0),
    criticalCareTriggered: false,
    status: getCriticalCareStatus(player.profile, now),
  };
}

export function assertPlayerNotInCriticalCare(player, actionLabel = "Ta akcja", now = Date.now()) {
  const state = syncPlayerCriticalCare(player, now);
  if (!state.active) return state;
  const mode = getCriticalCareMode(player.profile.criticalCareMode);
  const source = player.profile.criticalCareSource ? ` po ${player.profile.criticalCareSource}` : "";
  fail(
    `${actionLabel} wraca po wyjsciu z ${mode.label.toLowerCase()}${source}. Zostalo ${formatRemainingLabel(
      getCriticalCareRemainingMs(player.profile, now)
    )}.`,
    423
  );
}

export function assertPlayerNotProtectedAfterCriticalCare(player, now = Date.now()) {
  const state = syncPlayerCriticalCare(player, now);
  if (state.active) {
    fail("Ten gracz lezy teraz na intensywnej terapii.", 423);
  }
  if (hasCriticalCareProtection(player.profile, now)) {
    fail(
      `Ten gracz dopiero wyszedl z terapii i ma jeszcze oslone przez ${formatRemainingLabel(
        Math.max(0, Number(player.profile.criticalProtectionUntil || 0) - now)
      )}.`,
      423
    );
  }
}

export function keepPlayerOnPublicCriticalCare(player, now = Date.now()) {
  ensurePlayerCriticalCareState(player);
  if (!isCriticalCareActive(player.profile, now)) {
    fail("Nie jestes teraz w stanie krytycznym.");
  }
  if (String(player.profile.criticalCareMode || "").trim() === CRITICAL_CARE_RULES.private.id) {
    fail("Jestes juz w prywatnej klinice.");
  }
  return {
    mode: getCriticalCareMode(CRITICAL_CARE_RULES.public.id),
    status: getCriticalCareStatus(player.profile, now),
    logMessage: "Publiczna intensywna juz cie prowadzi.",
  };
}

export function movePlayerToPrivateClinic(player, now = Date.now()) {
  ensurePlayerCriticalCareState(player);
  if (!isCriticalCareActive(player.profile, now)) {
    fail("Nie jestes teraz w stanie krytycznym.");
  }

  const privateMode = getCriticalCareMode(CRITICAL_CARE_RULES.private.id);
  if (String(player.profile.criticalCareMode || "").trim() === privateMode.id) {
    fail("Prywatna klinika juz pracuje.");
  }
  if (Number(player.profile.cash || 0) < Number(privateMode.cost || 0)) {
    fail(`Brakuje $${privateMode.cost} na prywatna klinike.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(privateMode.cost || 0);
  player.profile.criticalCareMode = privateMode.id;
  player.profile.criticalCareUntil = now + Number(privateMode.durationMs || 0);
  player.timers.hpUpdatedAt = now;

  return {
    price: Number(privateMode.cost || 0),
    mode: privateMode,
    status: getCriticalCareStatus(player.profile, now),
    logMessage: `Prywatna klinika bierze Cie od razu. Koszt $${privateMode.cost}.`,
  };
}
