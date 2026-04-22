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
import { ECONOMY_RULES } from "../../../shared/economy.js";
import {
  CLUB_MARKET,
  CLUB_SYSTEM_RULES,
  DRUGS,
  clampClubEntryFee,
  findDrugById,
  getClubEntryProfile,
  getClubNightPlan,
  getClubGuestVenueState,
  getDefaultClubEntryFee,
  getClubStashSupport,
  getClubVenueProfile,
  hasClubGuestAccess,
} from "../../../shared/socialGameplay.js";
import {
  ensureGangWeeklyGoal,
  getGangProjectEffects,
  incrementGangGoalProgress,
  recordGangJobProgress,
  syncGangProtectedClub,
} from "../../../shared/gangProjects.js";
import { applyDrugConsumptionToPlayer } from "./socialActionService.js";

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

function recordDistrictTaskAction(player, districtId, amount = 1) {
  if (!player || typeof player !== "object") return;
  if (!player.stats || typeof player.stats !== "object" || Array.isArray(player.stats)) {
    player.stats = {};
  }
  if (!player.stats.districtActionsById || typeof player.stats.districtActionsById !== "object" || Array.isArray(player.stats.districtActionsById)) {
    player.stats.districtActionsById = {};
  }
  const safeDistrictId = findDistrictById(districtId).id;
  player.stats.districtActionsById[safeDistrictId] =
    Math.max(0, Math.floor(Number(player.stats.districtActionsById[safeDistrictId] || 0))) +
    Math.max(1, Math.floor(Number(amount || 1)));
}

function consumeProducedDrugStock(player, drugId, quantity = 1) {
  if (!player?.producedDrugInventory || typeof player.producedDrugInventory !== "object" || Array.isArray(player.producedDrugInventory)) {
    return 0;
  }
  const safeQuantity = Math.max(0, Math.floor(Number(quantity || 0)));
  const available = Math.max(0, Number(player.producedDrugInventory?.[drugId] || 0));
  const consumed = Math.min(available, safeQuantity);
  player.producedDrugInventory[drugId] = Math.max(0, available - consumed);
  return consumed;
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
    const gangEffects = getGangProjectEffects(player.gang);
    const protectedClub =
      player?.club?.owned &&
      player.gang.joined &&
      String(player.gang.role || "").trim() === "Boss"
        ? {
            id: String(player.club.sourceId || "").trim(),
            name: player.club.name,
            districtId: resolveClubDistrictId(player, player.club.sourceId),
            threat: Math.max(0, Math.floor(Number(player.club.threatLevel || 0))),
            stability: Math.max(0, Math.floor(Number(player.club.defenseReadiness || 0))),
            influenceBonus: Number(gangEffects.influenceGain || 0),
          }
        : null;
    player.gang = syncGangProtectedClub(player.gang, protectedClub);
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
  recordDistrictTaskAction(player, districtId);

  if (player?.gang?.joined && player.gang.focusDistrictId === districtId) {
    player.gang = incrementGangGoalProgress(player.gang, "focusHeists", 1, now);
  }

  syncCityStateForPlayer(player, now);
  return activity;
}

export function applyGangHeistDistrictOutcome(player, heist, { success = false, now = Date.now() } = {}) {
  syncCityStateForPlayer(player, now);
  const districtId = findDistrictById(
    heist?.districtId || player?.gang?.focusDistrictId || player?.city?.focusDistrictId
  ).id;
  const gangEffects = getGangProjectEffects(player?.gang || {});
  const focusBonus =
    player?.gang?.focusDistrictId === districtId
      ? 1.14 + Number(gangEffects.influenceGain || 0)
      : 1;
  const influenceBase = success ? 4.8 : 1.7;
  const pressureBase =
    success
      ? 5.4 + Number(heist?.risk || 0) * 18
      : 3.6 + Number(heist?.risk || 0) * 13;

  const activity = applyDistrictActivity(player.city, {
    districtId,
    influenceDelta: influenceBase * focusBonus,
    pressureDelta: pressureBase * (1 - Number(gangEffects.pressureMitigation || 0)),
    threatDelta: success ? 1.4 : 2.7,
    actionFamily: `gang-heist:${districtId}`,
    eventText: success
      ? "Gang odpala grubsza robote i podbija puls dzielni."
      : "Spalona robota gangu zostawia gruby slad na dzielni.",
    now,
  });
  player.city = activity.city;
  recordDistrictTaskAction(player, districtId);

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
  recordDistrictTaskAction(player, districtId);

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
  recordDistrictTaskAction(player, districtId);

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

function createClubSoldByDrugCounter() {
  return DRUGS.reduce((acc, drug) => {
    acc[drug.id] = 0;
    return acc;
  }, {});
}

function getClubTotalStashUnits(club) {
  return DRUGS.reduce((sum, drug) => sum + Number(club?.stash?.[drug.id] || 0), 0);
}

function getClubProtectorState(player, districtId = null) {
  const protectsClub =
    Boolean(player?.club?.owned) &&
    Boolean(player?.gang?.joined) &&
    String(player?.gang?.role || "").trim() === "Boss" &&
    typeof player?.gang?.name === "string" &&
    player.gang.name.trim().length > 0;
  const effects = protectsClub ? getGangProjectEffects(player?.gang || {}) : getGangProjectEffects({});
  const focusDistrictId = protectsClub
    ? findDistrictById(player?.gang?.focusDistrictId || districtId || DISTRICTS[0].id).id
    : null;

  return {
    active: protectsClub,
    gangName: protectsClub ? String(player.gang.name || "").trim() : null,
    focusDistrictId,
    focused: Boolean(protectsClub && districtId && focusDistrictId === districtId),
    effects,
  };
}

function consumeClubDemandFromStash(club, demandBudget = 0) {
  const workingStock = DRUGS.reduce((acc, drug) => {
    acc[drug.id] = Number(club?.stash?.[drug.id] || 0);
    return acc;
  }, {});
  const soldByDrug = createClubSoldByDrugCounter();
  let remainingDemand = Math.max(0, Math.floor(Number(demandBudget || 0)));

  while (remainingDemand > 0) {
    const candidate = DRUGS
      .filter((drug) => Number(workingStock?.[drug.id] || 0) > 0)
      .sort(
        (left, right) =>
          Number(workingStock?.[right.id] || 0) * (1 + Number(right.streetPrice || 0) / 7000) -
          Number(workingStock?.[left.id] || 0) * (1 + Number(left.streetPrice || 0) / 7000)
      )[0];

    if (!candidate) break;
    soldByDrug[candidate.id] = Number(soldByDrug?.[candidate.id] || 0) + 1;
    workingStock[candidate.id] = Math.max(0, Number(workingStock?.[candidate.id] || 0) - 1);
    remainingDemand -= 1;
  }

  Object.entries(soldByDrug).forEach(([drugId, amount]) => {
    if (!amount) return;
    club.stash[drugId] = Math.max(0, Number(club?.stash?.[drugId] || 0) - Number(amount || 0));
  });

  const soldUnits = Object.values(soldByDrug).reduce((sum, amount) => sum + Number(amount || 0), 0);
  const soldSummary = Object.entries(soldByDrug)
    .filter(([, amount]) => Number(amount || 0) > 0)
    .map(([currentDrugId, amount]) => {
      const drug = findDrugById(currentDrugId);
      return drug ? `${amount}x ${drug.name}` : null;
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  return {
    soldByDrug,
    soldUnits,
    soldSummary,
  };
}

function buildClubReportLogMessage(summary) {
  if (!summary) {
    return "Lokal pracuje w tle, ale ten okres jeszcze nic nie dowiozl.";
  }
  if (summary.incidentTriggered) {
    return `Lokal domknal ${summary.payout}$. Incydent przycial ${summary.incidentLoss}$.`;
  }
  if (summary.quietReport) {
    return `Lokal zamyka cichy okres na ${summary.payout}$.`;
  }
  return `Lokal domknal raport na ${summary.payout}$.`;
}

export function settleClubPassiveReportForPlayer(player, now = Date.now(), { force = false } = {}) {
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    return null;
  }

  const intervalMs = Number(CLUB_SYSTEM_RULES.reportIntervalMs || 0);
  const lastSettlementAt = Math.max(0, Number(player.club.lastSettlementAt || player.club.lastRunAt || now));
  const elapsedMs = Math.max(0, now - lastSettlementAt);
  if (!force && intervalMs > 0 && elapsedMs < intervalMs) {
    return null;
  }

  const cycles = force
    ? 1
    : Math.max(
        1,
        Math.min(
          Number(CLUB_SYSTEM_RULES.reportBackfillMaxCycles || 1),
          Math.floor(elapsedMs / Math.max(1, intervalMs))
        )
      );
  let pendingGuests = Math.max(0, Math.floor(Number(player.club.pendingGuestCount || 0)));
  let pendingEntryRevenue = Math.max(0, Math.floor(Number(player.club.pendingEntryRevenue || 0)));
  let pendingGuestConsumeCount = Math.max(0, Math.floor(Number(player.club.pendingGuestConsumeCount || 0)));
  let latestSummary = null;

  for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex += 1) {
    const district = getDistrictModifierSummary(
      player.city,
      resolveClubDistrictId(player, player.club.sourceId)
    );
    const protector = getClubProtectorState(player, district.id);
    const plan = getClubNightPlan(player.club.nightPlanId);
    const venueProfile = getClubVenueProfile(
      {
        ...player.club,
        popularity: Number(player.club.popularity || 0),
        mood: Number(player.club.mood || 0),
        respect: Number(player.profile?.respect || 0),
        policeBase: Number(player.club.policeBase || 0),
        entryFee: Number(player.club.entryFee || 0),
        stash: player.club.stash || {},
      },
      { planId: plan.id }
    );
    const totalUnits = getClubTotalStashUnits(player.club);
    const cycleGuests = cycleIndex === 0 ? pendingGuests : 0;
    const cycleEntryRevenue = cycleIndex === 0 ? pendingEntryRevenue : 0;
    const cycleGuestConsumes = cycleIndex === 0 ? pendingGuestConsumeCount : 0;
    const trafficFactor = Number(district?.pressureState?.trafficMultiplier || 1);
    const activeTraffic = Math.max(
      0,
      Number(player.club.traffic || 0) * trafficFactor +
        cycleGuests * 0.85 +
        cycleGuestConsumes * 0.55 +
        Number(venueProfile.stashSupport || 0) * 1.45 +
        (protector.active ? 0.85 + Number(protector.effects.clubSecurity || 0) * 0.18 : 0)
    );
    const demandBudget =
      totalUnits > 0
        ? Math.max(
            0,
            Math.min(
              10,
              Math.floor(activeTraffic / 2.35) +
                (plan.id === "showtime" ? 1 : 0) +
                (Number(venueProfile.stashSupport || 0) >= 0.7 ? 1 : 0)
            )
          )
        : 0;
    const { soldByDrug, soldUnits, soldSummary } = consumeClubDemandFromStash(player.club, demandBudget);

    let grossDrugIncome = 0;
    Object.entries(soldByDrug).forEach(([currentDrugId, amount]) => {
      const drug = findDrugById(currentDrugId);
      if (!drug || !amount) return;
      const perUnit = Math.max(
        60,
        Math.floor(
          Number(drug.streetPrice || 0) *
            Number(venueProfile.nightIncomeFactor || 0.18) *
            (0.52 + Math.min(1.15, activeTraffic / 18))
        )
      );
      grossDrugIncome += perUnit * Number(amount || 0);
    });

    const grossLocalRevenue = Math.max(0, grossDrugIncome + cycleEntryRevenue);
    const payoutBeforeIncident = Math.max(
      0,
      Math.floor(grossDrugIncome * 0.74 + cycleEntryRevenue * 0.82)
    );
    const previousClubPressure = Number(player.club.policePressure || 0);
    const previousDistrictPressure = Number(district.pressure || 0);
    const securityBuffer =
      Number(player.club.defenseReadiness || 0) * 0.0022 +
      Number(protector.effects.clubThreatMitigation || 0) +
      Number(protector.effects.pressureMitigation || 0) * 0.6;
    const incidentChance = clampNumber(
      0.03 +
        Math.max(0, Number(player.club.policePressure || 0) - 44) / 180 +
        Number(district.pressure || 0) / 250 +
        Number(player.club.threatLevel || 0) / 220 +
        soldUnits * 0.018 +
        activeTraffic * 0.012 -
        securityBuffer,
      0.02,
      0.28
    );
    const incidentTriggered = Math.random() < incidentChance;
    const incidentLoss = incidentTriggered
      ? Math.floor(payoutBeforeIncident * (0.1 + Math.random() * 0.08))
      : 0;
    const payout = Math.max(0, payoutBeforeIncident - incidentLoss);
    const quietReport = activeTraffic < 1.25 && soldUnits <= 1 && cycleGuests <= 1;

    player.club.safeCash = Math.max(0, Number(player.club.safeCash || 0) + payout);
    player.club.lastSettlementAt = intervalMs > 0 && !force ? lastSettlementAt + intervalMs * (cycleIndex + 1) : now;
    player.club.lastRunAt = now;
    player.club.traffic = clampNumber(
      activeTraffic * (plan.id === "showtime" ? 0.46 : 0.4),
      0,
      CLUB_SYSTEM_RULES.nightlyTrafficHardCap
    );
    player.club.popularity = clampNumber(
      Number(player.club.popularity || 0) + (incidentTriggered ? -1 : cycleGuests >= 2 || soldUnits >= 4 ? 2 : 1),
      0,
      100
    );
    player.club.mood = clampNumber(
      Number(player.club.mood || 0) + (incidentTriggered ? -4 : soldUnits + cycleGuestConsumes >= 3 ? 2 : cycleGuests > 0 ? 1 : 0),
      0,
      100
    );
    player.club.policePressure = clampNumber(
      Number(player.club.policePressure || 0) +
        Math.max(0, activeTraffic * 0.68 + soldUnits * 0.72 + cycleEntryRevenue / 380) *
          (1 - Number(protector.effects.pressureMitigation || 0)) +
        (incidentTriggered ? 4.2 : 1.7),
      0,
      100
    );
    player.club.threatLevel = clampNumber(
      Number(player.club.threatLevel || 0) +
        Number(district.pressure || 0) * 0.08 +
        soldUnits * 0.24 -
        Number(player.club.defenseReadiness || 0) * 0.05 -
        Number(protector.effects.clubThreatMitigation || 0) * 18,
      0,
      100
    );

    player.club.recentIncident = incidentTriggered
      ? {
          tone: "risk",
          text: `Incydent przy drzwiach przycial ${incidentLoss}$ z lokalu.`,
          createdAt: now,
        }
      : {
          tone: quietReport ? "calm" : activeTraffic >= 10 ? "traffic" : "calm",
          text: quietReport
            ? "Lokal przepchnal spokojny okres i dowiozl raport bez szumu."
            : "Lokal trzyma rytm i nadal sciaga ruch.",
          createdAt: now,
        };

    const activity = applyDistrictActivity(player.city, {
      districtId: district.id,
      influenceDelta:
        0.8 +
        Math.min(2.2, activeTraffic / 7.5) +
        Math.min(1.6, (soldUnits + cycleGuestConsumes) * 0.22) +
        (protector.focused ? 0.7 : 0) +
        Number(protector.effects.influenceGain || 0) * 3.5,
      pressureDelta:
        (plan.id === "lowlights" ? -3.1 : 1.2) +
        activeTraffic * 0.16 +
        soldUnits * 0.11 -
        Number(protector.effects.pressureMitigation || 0) * 8,
      threatDelta: incidentTriggered ? 1.8 : -0.6,
      actionFamily: `club-report:${district.id}`,
      eventText: "Lokal domknal raport i zostawil slad na dzielnicy.",
      now,
    });
    player.city = activity.city;
    const districtPressureGain = Number(
      (Number(activity?.district?.pressure || previousDistrictPressure) - previousDistrictPressure).toFixed(1)
    );
    const clubPressureGain = Number(
      (Number(player.club.policePressure || 0) - previousClubPressure).toFixed(1)
    );

    if (player?.gang?.joined && player.gang.focusDistrictId === district.id && (cycleGuests > 0 || soldUnits > 0)) {
      player.gang = incrementGangGoalProgress(player.gang, "clubActions", 1, now);
      player.gang = recordGangJobProgress(
        player.gang,
        "districtInfluencePulse",
        Math.max(1, Math.round(Number(activity?.appliedInfluence || 0))),
        now
      ).gang;
    }
    if (protector.active && !incidentTriggered && Number(player.club.threatLevel || 0) <= 56) {
      player.gang = recordGangJobProgress(player.gang, "protectedClubStableReports", 1, now).gang;
    }

    latestSummary = {
      venueId: player.club.sourceId,
      venueName: player.club.name,
      districtId: district.id,
      districtName: district.name,
      guestCount: cycleGuests,
      entryRevenue: cycleEntryRevenue,
      stashUsed: soldUnits + cycleGuestConsumes,
      guestConsumeCount: cycleGuestConsumes,
      soldUnits,
      soldByDrug,
      soldSummary,
      grossIncome: grossLocalRevenue,
      payout,
      safeCash: Math.max(0, Math.floor(Number(player.club.safeCash || 0))),
      incidentTriggered,
      incidentLoss,
      incidentText: player.club.recentIncident?.text || null,
      clubPressureGain,
      districtPressureGain,
      influenceGain: Number(activity?.appliedInfluence || 0),
      quietReport,
      protectorGangName: protector.gangName,
      reportAt: now,
      entryFee: Number(player.club.entryFee || 0),
    };
    player.club.lastReportSummary = latestSummary;
    player.club.lastNightSummary = {
      ...latestSummary,
      ranAt: now,
    };
    pendingGuests = 0;
    pendingEntryRevenue = 0;
    pendingGuestConsumeCount = 0;
  }

  player.club.pendingGuestCount = 0;
  player.club.pendingEntryRevenue = 0;
  player.club.pendingGuestConsumeCount = 0;
  syncCityStateForPlayer(player, now);
  return latestSummary
    ? {
        ...latestSummary,
        logMessage: buildClubReportLogMessage(latestSummary),
      }
    : null;
}

export function setClubEntryFeeForPlayer(player, entryFee, now = Date.now()) {
  settleClubPassiveReportForPlayer(player, now);
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Najpierw musisz miec swoj lokal.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Wejscie ustawiasz tylko bedac u siebie.");
  }

  const safeEntryFee = clampClubEntryFee(entryFee);
  const entryProfile = getClubEntryProfile(safeEntryFee);
  player.club.entryFee = safeEntryFee;
  player.club.recentIncident = {
    tone: "door",
    text:
      safeEntryFee > 0
        ? `Bramka leci teraz po ${safeEntryFee}$. ${entryProfile.trafficMultiplier < 0.9 ? "Za wysoko i ruch moze siasc." : "Cena dalej trzyma ruch."}`
        : "Lista otwarta. Lokal wpuszcza ludzi bez oplaty.",
    createdAt: now,
  };

  return {
    entryFee: safeEntryFee,
    logMessage:
      safeEntryFee > 0
        ? `Wejscie ustawione na ${safeEntryFee}$.`
        : "Wejscie ustawione za free.",
  };
}

export function collectClubSafeForPlayer(player, now = Date.now()) {
  settleClubPassiveReportForPlayer(player, now);
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Najpierw musisz miec swoj lokal.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Sejf odbierasz tylko bedac w swoim lokalu.");
  }

  const amount = Math.max(0, Math.floor(Number(player.club.safeCash || 0)));
  if (amount <= 0) {
    fail("Sejf jest pusty. Lokal jeszcze nic konkretnego nie domknal.");
  }

  player.club.safeCash = Math.max(0, Number(player.club.safeCash || 0) - amount);
  player.profile.cash = Number(player.profile.cash || 0) + amount;
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + amount;
  if (player.club.lastReportSummary && typeof player.club.lastReportSummary === "object") {
    player.club.lastReportSummary = {
      ...player.club.lastReportSummary,
      safeCash: Math.max(0, Math.floor(Number(player.club.safeCash || 0))),
      collectedAt: now,
      collectedAmount: amount,
    };
  }

  return {
    amount,
    safeCash: Math.max(0, Math.floor(Number(player.club.safeCash || 0))),
    logMessage: `Wyciagasz z sejfu ${amount}$.`,
  };
}

export function enterClubVenueForPlayer(player, venue, ownerPlayer = null, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie wejdziesz na sale.");
  }
  if (!venue?.id) {
    fail("Nie ma takiego lokalu na mapie miasta.", 404);
  }

  const safeVenueId = String(venue.id || "").trim();
  const ownerSelfVisit = Boolean(player?.club?.owned && String(player.club.sourceId || "").trim() === safeVenueId);
  player.club.visitId = safeVenueId;
  if (ownerSelfVisit) {
    return {
      venueId: safeVenueId,
      entryFeePaid: 0,
      freeEntry: true,
      accessUntil: now + CLUB_SYSTEM_RULES.accessWindowMs,
      logMessage: `Wchodzisz do ${venue.name}. To Twoj lokal.`,
    };
  }

  const affinity = getClubGuestVenueState(player?.club?.guestState, safeVenueId);
  const currentAffinity = player.club.guestState.affinity[safeVenueId] || affinity;
  const protector = ownerPlayer ? getClubProtectorState(ownerPlayer, venue?.districtId || ownerPlayer?.club?.districtId) : null;
  const sharedProtectorGang =
    Boolean(protector?.active) &&
    Boolean(player?.gang?.joined) &&
    String(player?.gang?.name || "").trim().toLowerCase() === String(protector?.gangName || "").trim().toLowerCase();
  const hasValidAccess = hasClubGuestAccess(player?.club?.guestState, safeVenueId, now);
  const safeEntryFee = clampClubEntryFee(venue?.entryFee || 0);
  let entryFeePaid = 0;
  let freeEntry = sharedProtectorGang;

  if (!hasValidAccess && !freeEntry && safeEntryFee > 0) {
    if (Number(player?.profile?.cash || 0) < safeEntryFee) {
      fail(`Brakuje ${safeEntryFee}$ na wejscie do lokalu.`);
    }
    player.profile.cash = Number(player.profile.cash || 0) - safeEntryFee;
    entryFeePaid = safeEntryFee;
  }

  if (!hasValidAccess) {
    currentAffinity.accessUntil = now + CLUB_SYSTEM_RULES.accessWindowMs;
    currentAffinity.lastAccessPaidAt = now;
    currentAffinity.lastEntryFeePaid = entryFeePaid;
    player.club.guestState.affinity[safeVenueId] = currentAffinity;

    if (ownerPlayer?.club?.owned && String(ownerPlayer.club.sourceId || "").trim() === safeVenueId) {
      ownerPlayer.club.pendingGuestCount = Math.max(0, Number(ownerPlayer.club.pendingGuestCount || 0) + 1);
      ownerPlayer.club.pendingEntryRevenue = Math.max(
        0,
        Number(ownerPlayer.club.pendingEntryRevenue || 0) + entryFeePaid
      );
      const entryTrafficProfile = getClubEntryProfile(venue?.entryFee || 0);
      ownerPlayer.club.traffic = clampNumber(
        Number(ownerPlayer.club.traffic || 0) + (entryTrafficProfile.trafficMultiplier >= 0.9 ? 0.82 : 0.54),
        0,
        CLUB_SYSTEM_RULES.nightlyTrafficHardCap
      );
      ownerPlayer.club.recentIncident = {
        tone: "door",
        text:
          entryFeePaid > 0
            ? `${player?.profile?.name || "Gosc"} przechodzi przez bramke za ${entryFeePaid}$.`
            : `${player?.profile?.name || "Gosc"} wchodzi na sale ${freeEntry ? "bez wejscia dla ochrony gangu." : "bez oplaty."}`,
        createdAt: now,
      };
    }
  }

  return {
    venueId: safeVenueId,
    entryFeePaid,
    freeEntry,
    accessUntil: Number(currentAffinity.accessUntil || now + CLUB_SYSTEM_RULES.accessWindowMs),
    logMessage:
      entryFeePaid > 0
        ? `Wchodzisz do ${venue.name}. Bramka bierze ${entryFeePaid}$.`
        : freeEntry
          ? `Wchodzisz do ${venue.name}. Ochrona gangu wpuszcza Cie bez bramki.`
          : `Wchodzisz do ${venue.name}.`,
  };
}

export function leaveClubVenueForPlayer(player, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  const previousVenueId = player?.club?.visitId || null;
  player.club.visitId = null;
  return {
    venueId: previousVenueId,
    logMessage: previousVenueId ? "Wychodzisz z klubu i znikasz z sali." : "Nie siedziales teraz w zadnym klubie.",
  };
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
    entryFee: getDefaultClubEntryFee(Number(venue.respect || 0)),
    safeCash: 0,
    lastSettlementAt: now,
    recentIncident: null,
    lastReportSummary: null,
    note: venue.note,
    securityLevel: 0,
    defenseReadiness: 48,
    threatLevel: 8,
    pendingGuestCount: 0,
    pendingEntryRevenue: 0,
    pendingGuestConsumeCount: 0,
  };
  player.city.focusDistrictId = venue.districtId;
  syncCityStateForPlayer(player, now);

  return {
    venueId: venue.id,
    districtId: venue.districtId,
    logMessage: `${venue.name} wpada pod Twoje drzwi. Teraz ten lokal zaczyna pracowac na wplywy.`,
  };
}

export function foundClubForPlayer(player, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (player?.club?.owned) {
    fail("Masz juz swoj lokal.");
  }
  if (!player?.gang?.joined) {
    fail("Nowy lokal od zera stawia juz konkretna ekipa, nie solo typ.");
  }
  if (String(player?.gang?.role || "").trim() !== "Boss") {
    fail("Nowy lokal moze postawic tylko boss gangu.", 403);
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Klubu nie zalozysz z celi.");
  }
  if (Number(player?.profile?.respect || 0) < 26) {
    fail("Na zalozenie nowego klubu potrzebujesz minimum 26 szacunu.");
  }

  const foundingCost = Math.max(0, Math.floor(Number(ECONOMY_RULES.empire?.clubFoundingCashCost || 0)));
  if (Number(player?.profile?.cash || 0) < foundingCost) {
    fail(`Nowy klub od zera kosztuje ${foundingCost}$.`);
  }

  const district = findDistrictById(player?.gang?.focusDistrictId || player?.city?.focusDistrictId || DISTRICTS[0].id);
  const gangName = String(player?.gang?.name || player?.profile?.name || "Nowy lokal").trim();
  const clubId = `club-custom-${now}`;
  const clubName = `${gangName} Social Club`;

  player.profile.cash = Number(player.profile.cash || 0) - foundingCost;
  player.club = {
    ...player.club,
    owned: true,
    sourceId: clubId,
    districtId: district.id,
    visitId: clubId,
    ownerLabel: player.profile?.name || "Gracz",
    name: clubName,
    respect: 26,
    takeoverCost: foundingCost,
    popularity: 18,
    mood: 68,
    policeBase: 13,
    policePressure: 0,
    traffic: 0,
    nightPlanId: getClubNightPlan().id,
    entryFee: getDefaultClubEntryFee(26),
    safeCash: 0,
    lastSettlementAt: now,
    recentIncident: null,
    note: `Nowy lokal postawiony od zera w ${district.name}. Wysoki koszt, wysoki potencjal i szybsza uwaga sluzb.`,
    securityLevel: 0,
    defenseReadiness: 46,
    threatLevel: 8,
    stash: {},
    lastNightSummary: null,
    lastReportSummary: null,
    pendingGuestCount: 0,
    pendingEntryRevenue: 0,
    pendingGuestConsumeCount: 0,
  };
  player.city.focusDistrictId = district.id;
  syncCityStateForPlayer(player, now);

  return {
    venueId: clubId,
    districtId: district.id,
    venueName: clubName,
    foundingCost,
    logMessage: `Stawiasz od zera ${clubName}. Lokal wpina sie pod ${district.name} i zaczyna grac pod Twoj gang.`,
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

export function moveDrugToClubForPlayer(player, drugId, quantity = 1, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Najpierw musisz miec swoj lokal.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Musisz siedziec we wlasnym klubie, zeby wrzucic towar na stash.");
  }

  const drug = findDrugById(drugId);
  const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));
  if (!drug) {
    fail("Nie ma takiego towaru.", 404);
  }
  if (Number(player?.drugInventory?.[drug.id] || 0) < safeQuantity) {
    fail(`Nie masz tyle ${drug.name} przy sobie.`);
  }

  player.drugInventory[drug.id] = Math.max(0, Number(player.drugInventory?.[drug.id] || 0) - safeQuantity);
  consumeProducedDrugStock(player, drug.id, safeQuantity);
  player.club.stash[drug.id] = Number(player.club.stash?.[drug.id] || 0) + safeQuantity;
  player.stats.clubStashMoves = Math.max(0, Number(player.stats?.clubStashMoves || 0)) + 1;
  player.club.recentIncident = {
    tone: "supply",
    text: `Na zaplecze wpada ${safeQuantity}x ${drug.name}.`,
    createdAt: now,
  };

  return {
    drugId: drug.id,
    quantity: safeQuantity,
    inventoryCount: Number(player.drugInventory?.[drug.id] || 0),
    stashCount: Number(player.club.stash?.[drug.id] || 0),
    logMessage: `Do stashu wpada ${safeQuantity}x ${drug.name}.`,
  };
}

export function consumeClubStashDrugForPlayer(player, ownerPlayer, venueId, drugId, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (ownerPlayer) {
    syncCityStateForPlayer(ownerPlayer, now);
  }

  const safeVenueId = String(venueId || player?.club?.visitId || "").trim();
  if (!safeVenueId || String(player?.club?.visitId || "").trim() !== safeVenueId) {
    fail("Najpierw wejdz do lokalu, zeby korzystac ze stashu.");
  }
  if (player?.club?.owned && String(player.club.sourceId || "").trim() === safeVenueId) {
    fail("W swoim lokalu ogarniasz towar normalnie, nie przez stash dla gosci.");
  }
  if (!ownerPlayer?.club?.owned || String(ownerPlayer.club.sourceId || "").trim() !== safeVenueId) {
    fail("W tym lokalu nie ma aktywnego stashu gospodarza.");
  }
  if (!hasClubGuestAccess(player?.club?.guestState, safeVenueId, now)) {
    fail("Bez oplaconego wejscia nie korzystasz ze stashu lokalu.");
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie zarzucisz towaru.");
  }

  const consumeReadyAt =
    Number(player?.club?.guestState?.lastConsumeAt || 0) + Number(CLUB_SYSTEM_RULES.consumeCooldownMs || 0);
  if (consumeReadyAt > now) {
    fail(`Z lokalu zarzucisz znowu za ${Math.ceil((consumeReadyAt - now) / 1000)} sek.`);
  }

  const drug = findDrugById(drugId);
  if (!drug) {
    fail("Nie ma takiego towaru.", 404);
  }
  if (Number(ownerPlayer.club?.stash?.[drug.id] || 0) <= 0) {
    fail(`Na stashu nie ma teraz ${drug.name}.`);
  }

  ownerPlayer.club.stash[drug.id] = Math.max(0, Number(ownerPlayer.club.stash?.[drug.id] || 0) - 1);
  ownerPlayer.club.pendingGuestConsumeCount = Math.max(
    0,
    Number(ownerPlayer.club.pendingGuestConsumeCount || 0) + 1
  );
  ownerPlayer.club.recentIncident = {
    tone: "stash",
    text: `${player?.profile?.name || "Gosc"} schodzi z 1x ${drug.name} z lokalu.`,
    createdAt: now,
  };
  player.club.guestState.lastConsumeAt = now;
  player.club.guestState.lastVenueId = safeVenueId;

  const consumeResult = applyDrugConsumptionToPlayer(player, drug, now);
  const ownerName = ownerPlayer?.profile?.name || ownerPlayer?.username || "wlasciciela";

  return {
    ...consumeResult,
    drugId: drug.id,
    stashCount: Number(ownerPlayer.club?.stash?.[drug.id] || 0),
    venueId: safeVenueId,
    logMessage: consumeResult.overdose
      ? `Przedawkowanie po ${drug.name} z lokalu ${ownerName}.`
      : `Zarzuciles ${drug.name} ze stashu lokalu ${ownerName}.`,
    ownerLogMessage: `${player?.profile?.name || "Gosc"} zszedl 1x ${drug.name} ze stashu ${ownerPlayer?.club?.name || "lokalu"}.`,
  };
}

export function runClubNightForPlayer(player, now = Date.now()) {
  syncCityStateForPlayer(player, now);
  if (!player?.club?.owned) {
    fail("Bez lokalu nie ma co rozliczac.");
  }
  if (!player.club.visitId || player.club.visitId !== player.club.sourceId) {
    fail("Raport lokalu odbierasz tylko bedac u siebie.");
  }

  const summary = settleClubPassiveReportForPlayer(player, now, { force: true });
  if (!summary) {
    fail("Lokal jeszcze nie ma swiezego raportu do domkniecia.");
  }
  return summary;
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

