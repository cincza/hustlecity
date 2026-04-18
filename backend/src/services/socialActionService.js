import { applyXpProgression } from "../../../shared/progression.js";
import {
  CLUB_ESCORT_SEARCH_COST,
  CLUB_SYSTEM_RULES,
  CLUB_VISITOR_ACTIONS,
  CLUB_MARKET,
  createClubState,
  DRUGS,
  ESCORTS,
  FIGHT_CLUB_ENERGY_COST,
  FIGHT_CLUB_WIN_XP,
  PLAYER_BOUNTY_COST,
  PLAYER_BOUNTY_INCREMENT,
  clampSocialValue,
  createDealerInventory,
  createDrugCounterMap,
  createOnlineSocialState,
  findClubVenueById,
  findDrugById,
  findEscortById,
  getClubNightPlan,
  getClubPressureAfterDecay,
  getClubTrafficAfterDecay,
  getClubVenueProfile,
  getClubVisitDiminishing,
  getClubVisitorAction,
  getLeadTargetEscortForVenue,
  normalizeClubState,
} from "../../../shared/socialGameplay.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createTimeLabel(now = Date.now()) {
  return new Date(now).toISOString();
}

function ensurePlayerSocialState(player) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  if (!player.profile || typeof player.profile !== "object") {
    player.profile = {};
  }
  if (!player.stats || typeof player.stats !== "object") {
    player.stats = {};
  }
  if (!player.online || typeof player.online !== "object" || Array.isArray(player.online)) {
    player.online = createOnlineSocialState();
  } else {
    if (!Array.isArray(player.online.friends)) player.online.friends = [];
    if (!Array.isArray(player.online.messages)) player.online.messages = [];
  }
  if (!player.drugInventory || typeof player.drugInventory !== "object" || Array.isArray(player.drugInventory)) {
    player.drugInventory = createDrugCounterMap();
  }
  if (!player.dealerInventory || typeof player.dealerInventory !== "object" || Array.isArray(player.dealerInventory)) {
    player.dealerInventory = createDealerInventory();
  }
  if (!Array.isArray(player.escortsOwned)) {
    player.escortsOwned = [];
  }
  player.club = normalizeClubState(player.club || createClubState());
  player.profile.bounty = Math.max(0, Math.floor(Number(player.profile?.bounty || 0)));
}

export function appendPlayerMessage(player, message) {
  ensurePlayerSocialState(player);
  player.online.messages = [
    {
      id: message?.id || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      from: String(message?.from || "System"),
      subject: String(message?.subject || "Powiadomienie"),
      preview: String(message?.preview || ""),
      time: message?.time || createTimeLabel(),
    },
    ...player.online.messages,
  ].slice(0, 20);
}

function ensureEscortOwnedEntry(player, escort) {
  ensurePlayerSocialState(player);
  const existing = player.escortsOwned.find((entry) => entry.id === escort.id);
  if (existing) {
    existing.count = Math.max(1, Number(existing.count || 0) + 1);
    existing.working = Math.max(0, Number(existing.working || 0));
    existing.routes = existing.routes && typeof existing.routes === "object" ? existing.routes : {};
    return existing;
  }
  const created = {
    id: escort.id,
    count: 1,
    working: 0,
    routes: {},
  };
  player.escortsOwned.push(created);
  return created;
}

export function fightClubRoundForPlayer(player) {
  ensurePlayerSocialState(player);
  if (Number(player?.profile?.jailUntil || 0) > Date.now()) {
    fail("Fightclub nie dziala zza krat.");
  }
  if (Number(player?.profile?.energy || 0) < FIGHT_CLUB_ENERGY_COST) {
    fail("Za malo energii na sparing.");
  }

  const score =
    Number(player.profile.attack || 0) * 0.4 +
    Number(player.profile.defense || 0) * 0.25 +
    Number(player.profile.dexterity || 0) * 0.35 +
    Math.random() * 10;

  player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - FIGHT_CLUB_ENERGY_COST);

  if (score >= 16) {
    player.profile.attack = Number(player.profile.attack || 0) + 1;
    player.profile.dexterity = Number(player.profile.dexterity || 0) + 1;
    const progression = applyXpProgression(
      { respect: player.profile.respect, xp: player.profile.xp },
      FIGHT_CLUB_WIN_XP
    );
    player.profile.respect = progression.respect;
    player.profile.xp = progression.xp;
    player.profile.level = progression.respect;

    return {
      success: true,
      xpGain: FIGHT_CLUB_WIN_XP,
      statGains: { attack: 1, dexterity: 1 },
      damage: 0,
      logMessage: "Fightclub wygrany. +8 XP, +1 atak, +1 zrecznosc.",
    };
  }

  player.profile.hp = clampSocialValue(
    Number(player.profile.hp || 0) - 10,
    0,
    Number(player.profile.maxHp || 0)
  );

  return {
    success: false,
    xpGain: 0,
    statGains: { attack: 0, dexterity: 0 },
    damage: 10,
    logMessage: "Fightclub przegrany. Obite rylo, ale nauka zostaje.",
  };
}

export function buyDrugFromDealerForPlayer(player, drugId) {
  ensurePlayerSocialState(player);
  const drug = findDrugById(drugId);
  if (!drug) {
    fail("Drug not found", 404);
  }
  if (Number(player.profile?.respect || 0) < Number(drug.unlockRespect || 0)) {
    fail(`Diler puszcza ${drug.name} dopiero od ${drug.unlockRespect} szacunu.`);
  }
  if (Number(player.dealerInventory?.[drug.id] || 0) <= 0) {
    fail(`Diler nie ma juz ${drug.name} na stanie.`);
  }
  if (Number(player.profile?.cash || 0) < Number(drug.streetPrice || 0)) {
    fail(`Brakuje $${drug.streetPrice} na ${drug.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(drug.streetPrice || 0);
  player.drugInventory[drug.id] = Number(player.drugInventory?.[drug.id] || 0) + 1;
  player.dealerInventory[drug.id] = Math.max(0, Number(player.dealerInventory?.[drug.id] || 0) - 1);

  return {
    drug,
    price: Number(drug.streetPrice || 0),
    logMessage: `Kupiles od dilera: ${drug.name} za $${drug.streetPrice}.`,
  };
}

export function sellDrugToDealerForPlayer(player, drugId) {
  ensurePlayerSocialState(player);
  const drug = findDrugById(drugId);
  if (!drug) {
    fail("Drug not found", 404);
  }
  if (Number(player.drugInventory?.[drug.id] || 0) <= 0) {
    fail(`Nie masz czego sprzedac: ${drug.name}.`);
  }

  const payout = Math.max(20, Math.floor(Number(drug.streetPrice || 0) * 0.72));
  player.profile.cash = Number(player.profile.cash || 0) + payout;
  player.drugInventory[drug.id] = Math.max(0, Number(player.drugInventory?.[drug.id] || 0) - 1);
  player.dealerInventory[drug.id] = Number(player.dealerInventory?.[drug.id] || 0) + 1;
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + payout;

  return {
    drug,
    payout,
    logMessage: `Sprzedales dilerowi ${drug.name} za $${payout}.`,
  };
}

export function consumeDrugForPlayer(player, drugId, now = Date.now()) {
  ensurePlayerSocialState(player);
  const drug = findDrugById(drugId);
  if (!drug) {
    fail("Drug not found", 404);
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Z celi nie zarzucisz towaru.");
  }
  if (Number(player.drugInventory?.[drug.id] || 0) <= 0) {
    fail(`Nie masz na stanie: ${drug.name}.`);
  }

  player.drugInventory[drug.id] = Math.max(0, Number(player.drugInventory?.[drug.id] || 0) - 1);

  if (Math.random() < Number(drug.overdoseRisk || 0)) {
    const damage = randomBetween(28, 55);
    player.profile.hp = clampSocialValue(
      Number(player.profile?.hp || 0) - damage,
      1,
      Number(player.profile?.maxHp || 0)
    );
    player.profile.heat = clampSocialValue(Number(player.profile?.heat || 0) + 8, 0, 100);

    return {
      drug,
      overdose: true,
      damage,
      logMessage: `Przedawkowanie po ${drug.name}. Ledwo stoisz na nogach.`,
    };
  }

  if (!Array.isArray(player.activeBoosts)) player.activeBoosts = [];
  player.activeBoosts.push({
    id: `${drug.id}-${now}-${Math.floor(Math.random() * 1000)}`,
    name: drug.name,
    effect: { ...(drug.effect || {}) },
    expiresAt: now + Number(drug.durationSeconds || 0) * 1000,
  });

  return {
    drug,
    overdose: false,
    durationSeconds: Number(drug.durationSeconds || 0),
    effect: { ...(drug.effect || {}) },
    logMessage: `Weszlo ${drug.name}. Staty podbite na ${Math.round(Number(drug.durationSeconds || 0) / 60)} min.`,
  };
}

export function addFriendForPlayer(player, targetEntry, now = Date.now()) {
  ensurePlayerSocialState(player);
  if (!targetEntry?.id) {
    fail("Target player id is required");
  }
  if (player.online.friends.some((entry) => entry.id === targetEntry.id)) {
    fail(`${targetEntry.name || "Ten gracz"} juz siedzi w znajomych.`, 409);
  }

  player.online.friends = [
    {
      id: targetEntry.id,
      name: targetEntry.name || "Gracz",
      gang: targetEntry.gang || "No gang",
      online: Boolean(targetEntry.online),
      respect: Number(targetEntry.respect || 0),
    },
    ...player.online.friends,
  ].slice(0, 30);

  appendPlayerMessage(player, {
    from: "System",
    subject: "Zaproszenie do znajomych",
    preview: `Wyslales zaproszenie do ${targetEntry.name || "gracza"}.`,
    time: createTimeLabel(now),
  });

  return {
    friend: targetEntry,
    logMessage: `Wyslano zaproszenie do znajomych: ${targetEntry.name || "gracz"}.`,
  };
}

export function sendQuickMessageBetweenPlayers(senderPlayer, targetPlayer, senderName, targetName, now = Date.now()) {
  return sendPlayerMessageBetweenPlayers(senderPlayer, targetPlayer, {
    senderName,
    targetName,
    now,
  });
}

export function sendPlayerMessageBetweenPlayers(
  senderPlayer,
  targetPlayer,
  {
    senderName,
    targetName,
    message,
    now = Date.now(),
  } = {}
) {
  ensurePlayerSocialState(senderPlayer);
  ensurePlayerSocialState(targetPlayer);

  const safeSenderName = senderName || senderPlayer?.profile?.name || "Gracz";
  const safeTargetName = targetName || targetPlayer?.profile?.name || "Gracz";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  const quickMessage = `Hej, ${safeTargetName}. Widzimy sie na miescie.`;
  const finalMessage = normalizedMessage || quickMessage;
  const subject = normalizedMessage ? "Prywatna wiadomosc" : "Szybka wiadomosc";
  const outboundPreview = finalMessage;
  const inboundPreview = normalizedMessage ? finalMessage : `${safeSenderName}: ${finalMessage}`;

  appendPlayerMessage(senderPlayer, {
    from: safeTargetName,
    subject,
    preview: outboundPreview,
    time: createTimeLabel(now),
  });
  appendPlayerMessage(targetPlayer, {
    from: safeSenderName,
    subject,
    preview: inboundPreview,
    time: createTimeLabel(now),
  });

  return {
    preview: outboundPreview,
    logMessage: normalizedMessage
      ? `Wyslales wiadomosc do ${safeTargetName}.`
      : `Odpaliles szybka wiadomosc do ${safeTargetName}.`,
  };
}

export function placeBountyOnPlayer(actorPlayer, targetPlayer, targetName, now = Date.now()) {
  ensurePlayerSocialState(actorPlayer);
  ensurePlayerSocialState(targetPlayer);

  if (Number(actorPlayer.profile?.jailUntil || 0) > now) {
    fail("Nie ustawisz bounty z celi.");
  }
  if (Number(actorPlayer.profile?.cash || 0) < PLAYER_BOUNTY_COST) {
    fail(`Brakuje $${PLAYER_BOUNTY_COST} na wystawienie bounty.`);
  }

  actorPlayer.profile.cash = Number(actorPlayer.profile.cash || 0) - PLAYER_BOUNTY_COST;
  targetPlayer.profile.bounty = Number(targetPlayer.profile?.bounty || 0) + PLAYER_BOUNTY_INCREMENT;

  appendPlayerMessage(actorPlayer, {
    from: "System",
    subject: "Bounty wystawione",
    preview: `Na glowe ${targetName} dorzucono $${PLAYER_BOUNTY_INCREMENT} bounty.`,
    time: createTimeLabel(now),
  });
  appendPlayerMessage(targetPlayer, {
    from: "System",
    subject: "Nowe bounty",
    preview: `Na Twoja glowe dorzucono $${PLAYER_BOUNTY_INCREMENT} bounty.`,
    time: createTimeLabel(now),
  });

  return {
    cost: PLAYER_BOUNTY_COST,
    increment: PLAYER_BOUNTY_INCREMENT,
    logMessage: `Wystawiles bounty na ${targetName}. Koszt $${PLAYER_BOUNTY_COST}.`,
  };
}

function getDayKey(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

function syncClubPassiveState(club, now = Date.now()) {
  if (!club || typeof club !== "object") return;
  const referenceAt = Math.max(0, Math.floor(Number(club.lastTrafficAt || club.lastRunAt || now)));
  const elapsedMs = Math.max(0, now - referenceAt);
  club.traffic = getClubTrafficAfterDecay(club.traffic, elapsedMs);
  club.policePressure = getClubPressureAfterDecay(club.policePressure, elapsedMs);
  club.lastTrafficAt = now;
}

function getVenueAffinity(player, venueId, now = Date.now()) {
  const guestState = player.club.guestState;
  if (!guestState.affinity[venueId]) {
    guestState.affinity[venueId] = {
      visits: 0,
      lastVisitAt: 0,
      tipDayKey: getDayKey(now),
      tipValueToday: 0,
      tipCountToday: 0,
    };
  }
  const entry = guestState.affinity[venueId];
  const dayKey = getDayKey(now);
  if (entry.tipDayKey !== dayKey) {
    entry.tipDayKey = dayKey;
    entry.tipValueToday = 0;
    entry.tipCountToday = 0;
  }
  return entry;
}

function setLastClubOutcome(player, now, outcome) {
  player.club.guestState.lastActionAt = now;
  player.club.guestState.lastActionType = outcome.actionId;
  player.club.guestState.lastVenueId = outcome.venueId;
  player.club.guestState.lastOutcome = {
    ...outcome,
    time: createTimeLabel(now),
  };
}

export function applyClubVisitDeltaToOwnerClub(ownerPlayer, venueId, delta = {}, now = Date.now()) {
  ensurePlayerSocialState(ownerPlayer);
  if (!ownerPlayer.club?.owned || ownerPlayer.club.sourceId !== venueId) {
    return null;
  }

  syncClubPassiveState(ownerPlayer.club, now);
  ownerPlayer.club.traffic = clampSocialValue(
    Number(ownerPlayer.club.traffic || 0) + Number(delta.trafficGain || 0),
    0,
    CLUB_SYSTEM_RULES.nightlyTrafficHardCap
  );
  ownerPlayer.club.policePressure = clampSocialValue(
    Number(ownerPlayer.club.policePressure || 0) + Number(delta.pressureGain || 0),
    0,
    100
  );
  ownerPlayer.club.lastTrafficAt = now;

  if (ownerPlayer.club.policePressure >= 68) {
    ownerPlayer.club.recentIncident = {
      tone: "risk",
      text: "Przy wejsciu kreci sie patrol. Ruch nadal robi wynik, ale robi sie goraco.",
      createdAt: now,
    };
  } else if (ownerPlayer.club.traffic >= CLUB_SYSTEM_RULES.nightlyTrafficSoftCap) {
    ownerPlayer.club.recentIncident = {
      tone: "traffic",
      text: "Lokal lapie gruby ruch. Dobra noc, ale trzeba pilnowac cisnienia.",
      createdAt: now,
    };
  } else if (Number(delta.pressureGain || 0) < 0) {
    ownerPlayer.club.recentIncident = {
      tone: "calm",
      text: "Sala przycichla. Presja schodzi i drzwi oddychaja.",
      createdAt: now,
    };
  }

  return {
    traffic: ownerPlayer.club.traffic,
    policePressure: ownerPlayer.club.policePressure,
  };
}

export function performClubActionForPlayer(
  player,
  {
    actionId,
    venue,
    now = Date.now(),
    ownerSelfVisit = false,
  } = {}
) {
  ensurePlayerSocialState(player);
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Nie ogarniasz klubu z celi.");
  }

  const targetVenue =
    venue && typeof venue === "object"
      ? venue
      : findClubVenueById(String(venue || player?.club?.visitId || "").trim());
  if (!targetVenue) {
    fail("Najpierw wejdz do jakiegos klubu. Dopiero tam ruszasz z akcjami.", 404);
  }

  const action = getClubVisitorAction(actionId);
  const guestState = player.club.guestState;
  const cooldownRemaining = Math.max(0, Number(guestState.lastActionAt || 0) + CLUB_SYSTEM_RULES.actionCooldownMs - now);
  if (cooldownRemaining > 0) {
    fail(`Klub jeszcze trzyma Cie na cooldownie przez ${Math.ceil(cooldownRemaining / 1000)}s.`);
  }

  player.club.visitId = targetVenue.id;
  syncClubPassiveState(player.club, now);

  const venuePlanId =
    targetVenue?.nightPlanId ||
    (player.club.owned && player.club.sourceId === targetVenue.id ? player.club.nightPlanId : getClubNightPlan().id);
  const profile = getClubVenueProfile(targetVenue, { planId: venuePlanId });
  const affinity = getVenueAffinity(player, targetVenue.id, now);
  const nextVisitCount = affinity.visits + 1;
  const diminishing = getClubVisitDiminishing(nextVisitCount, ownerSelfVisit);

  let result = null;
  if (action.id === "scout") {
    const dailyBudgetLeft = Math.max(0, CLUB_SYSTEM_RULES.scoutTipDailyCapPerVenue - Number(affinity.tipValueToday || 0));
    const tipSlotsLeft = Math.max(0, CLUB_SYSTEM_RULES.scoutTipCountCapPerVenue - Number(affinity.tipCountToday || 0));
    const rawTip = Math.max(0, Math.floor(profile.scoutTipValue * diminishing));
    const cashTip =
      dailyBudgetLeft > 0 && tipSlotsLeft > 0
        ? Math.max(0, Math.min(rawTip, dailyBudgetLeft, 180))
        : 0;

    if (cashTip > 0) {
      player.profile.cash = Number(player.profile.cash || 0) + cashTip;
      affinity.tipValueToday = Number(affinity.tipValueToday || 0) + cashTip;
      affinity.tipCountToday = Number(affinity.tipCountToday || 0) + 1;
      appendPlayerMessage(player, {
        from: targetVenue.ownerLabel || "Miasto",
        subject: `Scout: ${targetVenue.name}`,
        preview: `Sala puszcza dyskretny tip. Wpada $${cashTip} i czystszy obraz sytuacji.`,
        time: createTimeLabel(now),
      });
    }

    result = {
      actionId: action.id,
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      outcome: cashTip > 0 ? "tip" : "intel",
      cashTip,
      leadGain: 0,
      heatReduced: 0,
      hpRecovered: 0,
      ownerDelta: {
        trafficGain: Number((action.baseTraffic * profile.trafficScale * diminishing).toFixed(3)),
        pressureGain: Number((0.9 * profile.pressureScale).toFixed(3)),
      },
      logMessage:
        cashTip > 0
          ? `${targetVenue.name} rzuca maly tip. Wpada $${cashTip} bez rozwalania ekonomii.`
          : `${targetVenue.name} daje czysty odczyt sali, ale dzis bez koperty.`,
    };
  } else if (action.id === "hunt") {
    if (Number(player.profile?.cash || 0) < action.costCash) {
      fail(`Brakuje $${action.costCash} na wejscie i gonienie kontaktow.`);
    }

    const leadTarget =
      guestState.leadVenueId === targetVenue.id && guestState.leadEscortId
        ? findEscortById(guestState.leadEscortId)
        : getLeadTargetEscortForVenue({
            playerRespect: player.profile?.respect || 0,
            venue: targetVenue,
            planId: venuePlanId,
          });

    if (!leadTarget) {
      fail("Na tym progu jeszcze nie ma kogo namierzac w klubie.");
    }

    if (guestState.leadVenueId !== targetVenue.id || guestState.leadEscortId !== leadTarget.id) {
      guestState.leadVenueId = targetVenue.id;
      guestState.leadEscortId = leadTarget.id;
      guestState.leadProgress = 0;
    }

    const progressGain = Math.max(
      12,
      Math.min(
        46,
        Math.round(
          (profile.huntProgressValue +
            Number(player.profile?.charisma || 0) * 0.42 +
            Number(player.profile?.dexterity || 0) * 0.28) *
            diminishing
        )
      )
    );

    player.profile.cash = Number(player.profile.cash || 0) - action.costCash;
    guestState.leadProgress = Math.min(guestState.leadRequired, Number(guestState.leadProgress || 0) + progressGain);

    let unlockedEscort = null;
    if (guestState.leadProgress >= guestState.leadRequired) {
      unlockedEscort = leadTarget;
      ensureEscortOwnedEntry(player, unlockedEscort);
      guestState.leadProgress = 0;
      guestState.leadVenueId = targetVenue.id;
      guestState.leadEscortId = leadTarget.id;
      appendPlayerMessage(player, {
        from: targetVenue.ownerLabel || "Miasto",
        subject: `Kontakt z ${targetVenue.name}`,
        preview: `Lead domkniety. Do siatki wpada ${unlockedEscort.name}.`,
        time: createTimeLabel(now),
      });
    }

    result = {
      actionId: action.id,
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      outcome: unlockedEscort ? "escort" : "progress",
      cashTip: 0,
      leadGain: progressGain,
      leadTargetId: leadTarget.id,
      leadTargetName: leadTarget.name,
      leadProgress: guestState.leadProgress,
      leadRequired: guestState.leadRequired,
      escort: unlockedEscort,
      heatReduced: 0,
      hpRecovered: 0,
      ownerDelta: {
        trafficGain: Number((action.baseTraffic * profile.trafficScale * diminishing).toFixed(3)),
        pressureGain: Number((2.2 * profile.pressureScale).toFixed(3)),
      },
      logMessage: unlockedEscort
        ? `${targetVenue.name}: lead meter dobity i wpada ${unlockedEscort.name}.`
        : `${targetVenue.name}: kontakt ruszyl do przodu o ${progressGain} pkt.`,
    };
  } else {
    const heatReduced = Math.min(
      Number(player.profile?.heat || 0),
      Math.max(0, Math.floor(profile.layLowHeat * Math.max(0.7, diminishing + 0.18)))
    );
    const hpRecovered = Math.min(
      Math.max(0, Number(player.profile?.maxHp || 0) - Number(player.profile?.hp || 0)),
      Math.max(0, Math.floor(profile.layLowHp * Math.max(0.7, diminishing + 0.22)))
    );

    player.profile.heat = Math.max(0, Number(player.profile.heat || 0) - heatReduced);
    player.profile.hp = Math.min(
      Number(player.profile.maxHp || 0),
      Number(player.profile.hp || 0) + hpRecovered
    );

    if (ownerSelfVisit && player.club.owned && player.club.sourceId === targetVenue.id) {
      player.club.policePressure = Math.max(
        0,
        Number(player.club.policePressure || 0) - Math.max(2, Math.floor(3 * profile.plan.layLowMultiplier))
      );
    }

    result = {
      actionId: action.id,
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      outcome: heatReduced || hpRecovered ? "reset" : "calm",
      cashTip: 0,
      leadGain: 0,
      heatReduced,
      hpRecovered,
      ownerDelta: {
        trafficGain: Number((action.baseTraffic * profile.trafficScale * diminishing).toFixed(3)),
        pressureGain: Number((-1.8 / Math.max(0.85, profile.pressureScale)).toFixed(3)),
      },
      logMessage:
        heatReduced || hpRecovered
          ? `${targetVenue.name}: znikasz w cieniu. Heat -${heatReduced}, HP +${hpRecovered}.`
          : `${targetVenue.name}: przeczekales chwile i sala oddycha lzej.`,
    };
  }

  affinity.visits = nextVisitCount;
  affinity.lastVisitAt = now;
  setLastClubOutcome(player, now, result);

  return result;
}

export function searchEscortInClubForPlayer(player, venueId, now = Date.now()) {
  const venue = findClubVenueById(venueId);
  return performClubActionForPlayer(player, {
    actionId: "hunt",
    venue,
    now,
    ownerSelfVisit: false,
  });
}

export function getKnownClubVenues() {
  return CLUB_MARKET.map((venue) => ({ ...venue }));
}
