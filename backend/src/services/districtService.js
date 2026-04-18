import {
  DISTRICTS,
  applyDistrictActivity,
  createCityState,
  findDistrictById,
  getDistrictModifierSummary,
  getDistrictSummaries,
  normalizeCityState,
  syncCityState,
} from "../../../shared/districts.js";
import { CLUB_MARKET, getClubNightPlan } from "../../../shared/socialGameplay.js";
import { ensureGangWeeklyGoal, getGangProjectEffects, incrementGangGoalProgress } from "../../../shared/gangProjects.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export function ensurePlayerCityState(player) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  player.city = normalizeCityState(player.city || createCityState());
}

export function resolveClubDistrictId(player, venueId = null) {
  const preferredId = String(
    venueId || player?.club?.districtId || player?.club?.sourceId || player?.club?.visitId || ""
  ).trim();
  const linkedVenue =
    CLUB_MARKET.find((entry) => entry.id === preferredId || entry.districtId === preferredId) || null;
  if (linkedVenue?.districtId) {
    return linkedVenue.districtId;
  }
  return findDistrictById(player?.city?.focusDistrictId || DISTRICTS[0].id).id;
}

export function syncCityStateForPlayer(player, now = Date.now()) {
  ensurePlayerCityState(player);
  player.city = syncCityState(player.city, now);

  if (player?.club?.owned) {
    const gangEffects = getGangProjectEffects(player?.gang || {});
    const districtId = resolveClubDistrictId(player);
    const district = getDistrictModifierSummary(player.city, districtId);
    player.club.districtId = districtId;

    const baseSecurity =
      Number(player.club.securityLevel || 0) * 12 +
      Number(gangEffects.clubSecurity || 0) * 12 +
      (player.club.nightPlanId === "lowlights" ? 6 : 0);
    const desiredThreat = Math.round(
      Math.min(
        100,
        Math.max(
          0,
          district.pressure * 0.48 +
            district.threat * 0.34 -
            baseSecurity * 0.65 -
            Math.max(0, Number(player.club.mood || 0) - 55) * 0.18
        )
      )
    );
    const desiredReadiness = Math.round(
      Math.min(
        100,
        Math.max(
          18,
          44 +
            baseSecurity +
            (district.pressureState.id === "quiet" ? 5 : 0) -
            desiredThreat * 0.32
        )
      )
    );

    player.club.threatLevel = Math.round((Number(player.club.threatLevel || 0) + desiredThreat) / 2);
    player.club.defenseReadiness = Math.round(
      (Number(player.club.defenseReadiness || 44) + desiredReadiness) / 2
    );
  }

  if (player?.gang && typeof player.gang === "object") {
    player.gang = ensureGangWeeklyGoal(player.gang, now);
    const summaries = getDistrictSummaries(player.city);
    const controlled = summaries.filter((entry) => entry.controlState.id === "control").length;
    const totalInfluence = summaries.reduce((sum, entry) => sum + Number(entry.influence || 0), 0);
    player.gang.territory = player.gang.joined ? controlled : 0;
    player.gang.influence = player.gang.joined ? Math.floor(totalInfluence) : 0;
  }

  return player.city;
}

function getDistrictIdForHeist(heist) {
  const respect = Number(heist?.respect || 0);
  if (respect >= 20) return "harbor";
  if (respect >= 10) return "neon";
  return "oldtown";
}

export function applyHeistDistrictOutcome(player, heist, { success = false, now = Date.now() } = {}) {
  syncCityStateForPlayer(player, now);
  const districtId = getDistrictIdForHeist(heist);
  const gangEffects = getGangProjectEffects(player?.gang || {});
  const focusBonus = player?.gang?.focusDistrictId === districtId ? 1.08 + Number(gangEffects.influenceGain || 0) : 1;
  const influenceBase = success ? 2.6 : 0.9;
  const pressureBase = success ? 3.8 + Number(heist?.risk || 0) * 14 : 2.2 + Number(heist?.risk || 0) * 9;
  const activity = applyDistrictActivity(player.city, {
    districtId,
    influenceDelta: influenceBase * focusBonus,
    pressureDelta: pressureBase * (1 - Number(gangEffects.pressureMitigation || 0)),
    threatDelta: success ? 1 : 1.6,
    actionFamily: `heist:${districtId}`,
    eventText: success ? "Napad podbil ruch w dzielnicy." : "Nieudany ruch zostawil slad na dzielni.",
    now,
  });
  player.city = activity.city;

  if (player?.gang?.joined && player.gang.focusDistrictId === districtId) {
    player.gang = incrementGangGoalProgress(player.gang, "focusHeists", 1, now);
  }

  syncCityStateForPlayer(player, now);
  return activity;
}

export function applyClubActionDistrictOutcome(player, venue, actionResult, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  const districtId =
    findDistrictById(venue?.districtId || player?.club?.districtId || player?.city?.focusDistrictId).id;
  const gangEffects = getGangProjectEffects(player?.gang || {});
  const actionId = String(actionResult?.actionId || "club").trim().toLowerCase();
  const influenceBase =
    actionId === "hunt"
      ? actionResult?.escort
        ? 2.3
        : 1.4
      : actionId === "scout"
        ? 0.9
        : 0.5;
  const pressureBase =
    actionId === "laylow"
      ? -2.4
      : Math.max(0.25, Number(actionResult?.ownerDelta?.pressureGain || 0) * 0.82);
  const activity = applyDistrictActivity(player.city, {
    districtId,
    influenceDelta: influenceBase * (1 + Number(gangEffects.influenceGain || 0)),
    pressureDelta: pressureBase * (1 - Number(gangEffects.pressureMitigation || 0)),
    threatDelta: actionId === "hunt" ? 0.6 : 0.25,
    actionFamily: `club:${actionId}`,
    eventText:
      actionId === "laylow"
        ? "Klub ucichl i presja lekko schodzi."
        : "Ruch przy lokalu znow daje znac o sobie.",
    now,
  });
  player.city = activity.city;

  if (player?.gang?.joined && player.gang.focusDistrictId === districtId) {
    player.gang = incrementGangGoalProgress(player.gang, "clubActions", 1, now);
  }

  syncCityStateForPlayer(player, now);
  return activity;
}

export function applyOperationDistrictOutcome(
  player,
  districtId,
  { success = false, influenceDelta = 0, pressureDelta = 0, threatDelta = 0, now = Date.now() } = {}
) {
  syncCityStateForPlayer(player, now);
  const gangEffects = getGangProjectEffects(player?.gang || {});
  const activity = applyDistrictActivity(player.city, {
    districtId,
    influenceDelta:
      (success ? 7.4 : 2.1) * (1 + Number(gangEffects.influenceGain || 0)) + Number(influenceDelta || 0),
    pressureDelta:
      (success ? 8.6 : 6.2) * (1 - Number(gangEffects.pressureMitigation || 0)) + Number(pressureDelta || 0),
    threatDelta: (success ? 2 : 4.2) + Number(threatDelta || 0),
    actionFamily: `operation:${districtId}`,
    eventText: success ? "Gruba operacja podbila puls dzielnicy." : "Spalona operacja zostawila brudny slad.",
    now,
  });
  player.city = activity.city;

  if (player?.gang?.joined) {
    player.gang = incrementGangGoalProgress(player.gang, "operations", 1, now);
  }

  syncCityStateForPlayer(player, now);
  return activity;
}

export function fortifyClubForPlayer(player, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Najpierw musisz miec swoj lokal.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Zabezpieczenie lokalu ustawiasz tylko bedac u siebie.");
  }

  const cost = 850 + Math.max(0, Number(player.club.securityLevel || 0)) * 650;
  if (Number(player?.profile?.cash || 0) < cost) {
    fail(`Brakuje ${cost}$ na szybkie zabezpieczenie lokalu.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - cost;
  player.club.securityLevel = Math.min(3, Number(player.club.securityLevel || 0) + 1);
  player.club.defenseReadiness = clampNumber(player.club.defenseReadiness + 16, 0, 100);
  player.club.threatLevel = clampNumber(player.club.threatLevel - 14, 0, 100);
  player.club.lastFortifiedAt = now;

  const districtId = resolveClubDistrictId(player, player.club.sourceId);
  const activity = applyDistrictActivity(player.city, {
    districtId,
    influenceDelta: 0.9,
    pressureDelta: 0.8,
    threatDelta: -3.5,
    actionFamily: `club:fortify:${districtId}`,
    eventText: "Lokal podbil ochrone i zlapal oddech.",
    now,
  });
  player.city = activity.city;
  syncCityStateForPlayer(player, now);

  return {
    cost,
    defenseReadiness: player.club.defenseReadiness,
    threatLevel: player.club.threatLevel,
    logMessage: "Lokal jest domkniety i gotowy na ciezsza noc.",
  };
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));
}

export function claimClubVenueForPlayer(player, venueId, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (player?.club?.owned) {
    fail("Masz juz swoj lokal.");
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Klubu nie przejmiesz z celi.");
  }

  const venue = CLUB_MARKET.find((entry) => entry.id === String(venueId || "").trim());
  if (!venue) {
    fail("Nie ma takiego lokalu na mapie miasta.", 404);
  }
  if (Number(player?.profile?.respect || 0) < Number(venue.respect || 0)) {
    fail(`Na ten lokal potrzebujesz ${venue.respect} szacunu.`);
  }
  if (Number(player?.profile?.cash || 0) < Number(venue.takeoverCost || 0)) {
    fail(`Brakuje ${venue.takeoverCost}$ na przejecie ${venue.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(venue.takeoverCost || 0);
  player.club = {
    ...player.club,
    owned: true,
    sourceId: venue.id,
    districtId: venue.districtId,
    visitId: venue.id,
    ownerLabel: player.profile?.name || "Gracz",
    name: venue.name,
    respect: Number(venue.respect || 0),
    takeoverCost: Number(venue.takeoverCost || 0),
    popularity: Number(venue.popularity || 0),
    mood: Number(venue.mood || 0),
    policeBase: Number(venue.policeBase || 0),
    policePressure: Math.max(0, Number(venue.policePressure || venue.policeBase * 3 || 0)),
    traffic: Math.max(0, Number(venue.traffic || 0)),
    nightPlanId: venue.nightPlanId || getClubNightPlan().id,
    recentIncident: null,
    note: venue.note,
    securityLevel: 0,
    defenseReadiness: 48,
    threatLevel: 8,
  };
  player.city.focusDistrictId = venue.districtId;
  syncCityStateForPlayer(player, now);

  return {
    venueId: venue.id,
    districtId: venue.districtId,
    logMessage: `${venue.name} wpada pod Twoje drzwi. Teraz ten lokal zaczyna pracowac na wplywy.`,
  };
}

export function setClubNightPlanForPlayer(player, planId, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Najpierw musisz miec swoj lokal.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Plan nocy ustawiasz tylko bedac u siebie.");
  }

  const plan = getClubNightPlan(planId);
  player.club.nightPlanId = plan.id;
  player.club.recentIncident = {
    tone: "plan",
    text: `${plan.name}. ${plan.summary}`,
    createdAt: now,
  };
  syncCityStateForPlayer(player, now);

  return {
    planId: plan.id,
    logMessage: `${plan.name}. ${plan.summary}`,
  };
}

export function runClubNightForPlayer(player, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Bez lokalu nie ma co odpalac nocy.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Musisz siedziec we wlasnym klubie, zeby odpalic noc.");
  }

  const lastRunAt = Number(player.club.lastRunAt || 0);
  const cooldownMs = 12 * 60 * 1000;
  if (lastRunAt > 0 && now - lastRunAt < cooldownMs) {
    fail(`Klub juz pracuje. Wroc za ${Math.ceil((cooldownMs - (now - lastRunAt)) / 60000)} min.`);
  }

  const district = getDistrictModifierSummary(player.city, resolveClubDistrictId(player, player.club.sourceId));
  const plan = getClubNightPlan(player.club.nightPlanId);
  const traffic = Math.max(0, Number(player.club.traffic || 0));
  const defenseDrag = Math.max(0, Number(player.club.threatLevel || 0) - Number(player.club.defenseReadiness || 0) * 0.65);
  const baseNet = 140 + Number(player.club.popularity || 0) * 3.4 + Number(player.club.mood || 0) * 2.4;
  const trafficNet = traffic * 27 * Number(district.pressureState.trafficMultiplier || 1);
  const planMultiplier = plan.id === "showtime" ? 1.08 : plan.id === "guestlist" ? 1.03 : 0.86;
  const pressureDrag =
    district.pressureState.id === "lockdown"
      ? 0.64
      : district.pressureState.id === "crackdown"
        ? 0.8
        : district.pressureState.id === "watched"
          ? 0.95
          : 1.01;
  const payout = Math.max(90, Math.round((baseNet + trafficNet - defenseDrag * 10) * planMultiplier * pressureDrag));

  player.profile.cash = Number(player.profile.cash || 0) + payout;
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + payout;
  player.club.lastRunAt = now;
  player.club.traffic = clampNumber(player.club.traffic * 0.34, 0, 100);
  player.club.policePressure = clampNumber(
    Number(player.club.policePressure || 0) +
      traffic * (plan.id === "showtime" ? 1.02 : plan.id === "guestlist" ? 0.72 : 0.22) -
      (plan.id === "lowlights" ? 5 : 0),
    0,
    100
  );
  player.club.threatLevel = clampNumber(
    Number(player.club.threatLevel || 0) + district.pressure * 0.09 - Number(player.club.defenseReadiness || 0) * 0.06,
    0,
    100
  );
  player.club.recentIncident = {
    tone: payout >= 950 ? "traffic" : district.pressureState.id === "lockdown" ? "risk" : "calm",
    text:
      payout >= 950
        ? "Lokal domyka dobra noc i zostawia ruch na dzielnicy."
        : district.pressureState.id === "lockdown"
          ? "Gliny przydusily noc, ale lokal nie zgasl."
          : "Noc schodzi spokojnie i lokal dalej trzyma puls.",
    createdAt: now,
  };

  const activity = applyDistrictActivity(player.city, {
    districtId: district.id,
    influenceDelta: 1.6 + Math.min(3, traffic / 7),
    pressureDelta:
      plan.id === "lowlights"
        ? -4.4
        : 2 + traffic * (plan.id === "showtime" ? 0.34 : 0.22),
    threatDelta: payout >= 950 ? 0.9 : -0.8,
    actionFamily: `club-night:${district.id}`,
    eventText: "Noc klubu zamknela sie i zostawila slad na dzielnicy.",
    now,
  });
  player.city = activity.city;

  if (player?.gang?.joined && player.gang.focusDistrictId === district.id) {
    player.gang = incrementGangGoalProgress(player.gang, "clubActions", 1, now);
  }

  syncCityStateForPlayer(player, now);

  return {
    payout,
    districtId: district.id,
    logMessage: `Noc klubu domknieta. Wpada ${payout}$ i lekki puls wplywu w ${district.name}.`,
  };
}

export function applyGangGoalRewardToPlayer(player, rewards = {}, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  const focusDistrictId = findDistrictById(player?.gang?.focusDistrictId || player?.city?.focusDistrictId).id;
  const activity = applyDistrictActivity(player.city, {
    districtId: focusDistrictId,
    influenceDelta: Number(rewards.focusInfluence || 0),
    pressureDelta: -Math.max(0, Number(rewards.pressureRelief || 0)),
    threatDelta: -2,
    actionFamily: `goal:${focusDistrictId}`,
    eventText: "Cel gangu domkniety. Dzielnica chwilowo oddycha lzej.",
    now,
  });
  player.city = activity.city;
  player.gang.vault = Math.max(0, Number(player?.gang?.vault || 0) + Math.floor(Number(rewards.vaultCash || 0)));
  syncCityStateForPlayer(player, now);
  return activity;
}
