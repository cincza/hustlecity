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
  findDrugById,
  getClubNightPlan,
  getClubVenueProfile,
} from "../../../shared/socialGameplay.js";
import { ensureGangWeeklyGoal, getGangProjectEffects, incrementGangGoalProgress } from "../../../shared/gangProjects.js";
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
    recentIncident: null,
    note: `Nowy lokal postawiony od zera w ${district.name}. Wysoki koszt, wysoki potencjal i szybsza uwaga sluzb.`,
    securityLevel: 0,
    defenseReadiness: 46,
    threatLevel: 8,
    stash: {},
    lastNightSummary: null,
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
  player.club.stash[drug.id] = Number(player.club.stash?.[drug.id] || 0) + safeQuantity;
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
  const previousClubPressure = Number(player.club.policePressure || 0);
  const previousDistrictPressure = Number(district.pressure || 0);
  const totalUnits = DRUGS.reduce((sum, drug) => sum + Number(player.club?.stash?.[drug.id] || 0), 0);
  if (!totalUnits) {
    fail("Klub stoi pusty. Dorzuc najpierw towar na stash.");
  }
  const trafficWeight = clampNumber(traffic / CLUB_SYSTEM_RULES.nightlyTrafficSoftCap, 0, 1.2);
  const pressureDrag = Math.max(0, (Math.max(0, Number(district.pressure || 0) - 48) / 36));
  const effectiveTraffic = Math.max(0, traffic - pressureDrag);
  const starterFloorDemand = totalUnits > 0 ? 1 : 0;
  const demandBudget = Math.max(
    starterFloorDemand,
    Math.min(
      9,
      Math.floor(effectiveTraffic / 2.6) + (plan.id === "showtime" && effectiveTraffic >= 7 ? 1 : 0)
    )
  );

  if (demandBudget <= 0) {
    fail("Presja zabila noc. Uspokoj dzielnice albo podbij ruch w lokalu.");
  }

  const workingStock = DRUGS.reduce((acc, drug) => {
    acc[drug.id] = Number(player.club?.stash?.[drug.id] || 0);
    return acc;
  }, {});
  const soldByDrug = {};
  let remainingDemand = demandBudget;

  while (remainingDemand > 0) {
    const candidate = DRUGS
      .filter((drug) => workingStock[drug.id] > 0)
      .sort(
        (left, right) =>
          workingStock[right.id] * (1 + Number(right.streetPrice || 0) / 7000) -
          workingStock[left.id] * (1 + Number(left.streetPrice || 0) / 7000)
      )[0];

    if (!candidate) break;
    soldByDrug[candidate.id] = (soldByDrug[candidate.id] || 0) + 1;
    workingStock[candidate.id] -= 1;
    remainingDemand -= 1;
  }

  const soldUnits = Object.values(soldByDrug).reduce((sum, amount) => sum + Number(amount || 0), 0);
  if (!soldUnits) {
    fail("Kolejka byla, ale nic konkretnego nie zeszlo ze stashu.");
  }

  const venueProfile = getClubVenueProfile(
    {
      ...player.club,
      popularity: Number(player.club.popularity || 0),
      mood: Number(player.club.mood || 0),
      respect: Number(player.profile?.respect || 0),
      policeBase: Number(player.club.policeBase || 0),
      nightPlanId: plan.id,
    },
    { planId: plan.id }
  );

  let grossIncome = 0;
  Object.entries(soldByDrug).forEach(([currentDrugId, amount]) => {
    const drug = findDrugById(currentDrugId);
    if (!drug || !amount) return;
    const perUnit = Math.max(
      80,
      Math.floor(Number(drug.streetPrice || 0) * Number(venueProfile.nightIncomeFactor || 0.22) * (0.58 + trafficWeight * 0.28))
    );
    grossIncome += perUnit * Number(amount || 0);
  });

  const projectedPressure = clampNumber(
    Number(player.club.policePressure || 0) +
      effectiveTraffic * 1.4 +
      soldUnits * 1.8 +
      Math.max(0, totalUnits - soldUnits) * 0.18 +
      Number(player.profile?.heat || 0) * 0.08,
    0,
    100
  );
  const incidentChance = clampNumber(
    0.03 + Math.max(0, projectedPressure - 58) / 190 + trafficWeight * 0.05,
    0.03,
    0.24
  );
  const incidentTriggered = Math.random() < incidentChance;
  const incidentLoss = incidentTriggered ? Math.floor(grossIncome * (0.12 + Math.random() * 0.08)) : 0;
  const payout = Math.max(0, grossIncome - incidentLoss);
  const quietNight = traffic < 1.25;
  const soldSummary = Object.entries(soldByDrug)
    .filter(([, amount]) => Number(amount || 0) > 0)
    .map(([currentDrugId, amount]) => {
      const drug = findDrugById(currentDrugId);
      return drug ? `${amount}x ${drug.name}` : null;
    })
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");

  Object.entries(soldByDrug).forEach(([currentDrugId, amount]) => {
    player.club.stash[currentDrugId] = Math.max(
      0,
      Number(player.club?.stash?.[currentDrugId] || 0) - Number(amount || 0)
    );
  });

  player.profile.cash = Number(player.profile.cash || 0) + payout;
  player.profile.heat = clampNumber(Number(player.profile.heat || 0) + (incidentTriggered ? 4 : 1), 0, 100);
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + payout;
  player.club.lastRunAt = now;
  player.club.traffic = clampNumber(traffic * 0.34, 0, 100);
  player.club.popularity = clampNumber(
    Number(player.club.popularity || 0) + (incidentTriggered ? -1 : traffic >= 9 ? 2 : 1),
    0,
    100
  );
  player.club.mood = clampNumber(
    Number(player.club.mood || 0) + (incidentTriggered ? -4 : soldUnits >= 4 ? 2 : 1),
    0,
    100
  );
  player.club.policePressure = clampNumber(
    Number(player.club.policePressure || 0) + effectiveTraffic * 0.9 + soldUnits * 0.7 + (incidentTriggered ? 5.5 : 2.1),
    0,
    100
  );
  player.club.threatLevel = clampNumber(
    Number(player.club.threatLevel || 0) +
      Number(district.pressure || 0) * 0.12 +
      soldUnits * 0.28 -
      Number(player.club.defenseReadiness || 0) * 0.05,
    0,
    100
  );
  player.club.recentIncident = incidentTriggered
    ? {
        tone: "risk",
        text: `Patrol przecial sale i scial ${incidentLoss}$ z nocnego utargu.`,
        createdAt: now,
      }
    : {
        tone: quietNight ? "calm" : traffic >= 12 ? "traffic" : "calm",
        text:
          quietNight
            ? "Lokal przepchnal cicha noc i rozruszal zaplecze bez szumu."
            : traffic >= 12
            ? "Kolejka dowiozla noc i lokal dalej trzyma ruch."
            : "Noc zeszla spokojnie i bez zbednego szumu.",
        createdAt: now,
      };

  const activity = applyDistrictActivity(player.city, {
    districtId: district.id,
    influenceDelta: 1.2 + Math.min(3, traffic / 7) + Math.min(2.2, soldUnits * 0.28),
    pressureDelta:
      plan.id === "lowlights"
        ? -4.4
        : 2 + effectiveTraffic * (plan.id === "showtime" ? 0.34 : 0.22) + soldUnits * 0.12,
    threatDelta: payout >= 950 ? 0.9 : -0.8,
    actionFamily: `club-night:${district.id}`,
    eventText: "Noc klubu zamknela sie i zostawila slad na dzielnicy.",
    now,
  });
  player.city = activity.city;
  const districtPressureGain = Number(
    (Number(activity?.district?.pressure || previousDistrictPressure) - previousDistrictPressure).toFixed(1)
  );
  const clubPressureGain = Number(
    (Number(player.club.policePressure || 0) - previousClubPressure).toFixed(1)
  );

  if (player?.gang?.joined && player.gang.focusDistrictId === district.id) {
    player.gang = incrementGangGoalProgress(player.gang, "clubActions", 1, now);
  }

  player.club.lastNightSummary = {
    venueId: player.club.sourceId,
    venueName: player.club.name,
    districtId: district.id,
    districtName: district.name,
    soldUnits,
    soldByDrug,
    soldSummary,
    payout,
    grossIncome,
    incidentTriggered,
    incidentLoss,
    incidentText: player.club.recentIncident?.text || null,
    clubPressureGain,
    districtPressureGain,
    influenceGain: Number(activity?.appliedInfluence || 0),
    quietNight,
    ranAt: now,
  };

  syncCityStateForPlayer(player, now);

  return {
    payout,
    soldUnits,
    soldSummary,
    clubPressureGain,
    districtPressureGain,
    incidentTriggered,
    incidentLoss,
    districtId: district.id,
    logMessage: incidentTriggered
      ? `Noc klubu domknieta na ${payout}$. Patrol przycial ${incidentLoss}$. Poszlo: ${soldSummary || "skromny miks"}.`
      : quietNight
        ? `Cicha noc domknieta na ${payout}$. Poszlo: ${soldSummary || "skromny miks"}.`
        : `Noc klubu dowiozla ${payout}$. Poszlo: ${soldSummary || "skromny miks"}.`,
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
