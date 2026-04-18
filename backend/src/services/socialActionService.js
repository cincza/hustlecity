import { applyXpProgression } from "../../../shared/progression.js";
import {
  CLUB_ESCORT_SEARCH_COST,
  CLUB_MARKET,
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
  if (!player.club || typeof player.club !== "object" || Array.isArray(player.club)) {
    player.club = {
      owned: false,
      name: "Velvet Static",
      sourceId: null,
      visitId: null,
      ownerLabel: null,
      popularity: 0,
      mood: 60,
      policeBase: 0,
      note: null,
      lastRunAt: 0,
      stash: createDrugCounterMap(),
    };
  } else {
    if (!player.club.stash || typeof player.club.stash !== "object" || Array.isArray(player.club.stash)) {
      player.club.stash = createDrugCounterMap();
    }
  }
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

function getClubVenueProfile(venue) {
  const popularity = Number(venue?.popularity || 0);
  const mood = Number(venue?.mood || 0);
  const respect = Number(venue?.respect || 0);
  const policeBase = Number(venue?.policeBase || 0);

  return {
    escortBonus: clampSocialValue(
      0.008 + popularity * 0.0012 + mood * 0.0006 - policeBase * 0.0008,
      0.008,
      0.09
    ),
    contactChance: clampSocialValue(
      0.06 + popularity * 0.0022 + mood * 0.0014 - policeBase * 0.001,
      0.06,
      0.34
    ),
    drugChance: clampSocialValue(
      0.05 + popularity * 0.002 + respect * 0.0018 - policeBase * 0.0011,
      0.05,
      0.32
    ),
    eventChance: clampSocialValue(0.08 + popularity * 0.0018 + mood * 0.0012, 0.08, 0.36),
  };
}

export function searchEscortInClubForPlayer(player, venueId, now = Date.now()) {
  ensurePlayerSocialState(player);
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Nie szukasz kontaktow z celi.");
  }

  const venue = findClubVenueById(venueId);
  if (!venue) {
    fail("Najpierw wejdz do jakiegos klubu. Dopiero tam szukasz kontaktow.", 404);
  }
  if (Number(player.profile?.cash || 0) < CLUB_ESCORT_SEARCH_COST) {
    fail(`Brakuje $${CLUB_ESCORT_SEARCH_COST} na wejscie i szukanie kontaktow.`);
  }

  const profile = getClubVenueProfile(venue);
  const baseChance = clampSocialValue(
    0.03 +
      Number(player.profile?.charisma || 0) * 0.004 +
      Number(player.profile?.dexterity || 0) * 0.003 +
      profile.escortBonus,
    0.03,
    0.26
  );
  const unlockedEscorts = ESCORTS.filter((escort) => escort.respect <= Number(player.profile?.respect || 0));
  const foundEscort = unlockedEscorts.length > 0 && Math.random() < baseChance;

  player.profile.cash = Number(player.profile.cash || 0) - CLUB_ESCORT_SEARCH_COST;

  if (foundEscort) {
    const weightedPool = unlockedEscorts.flatMap((escort) =>
      Array.from({ length: Math.max(1, 32 - escort.respect) }, () => escort)
    );
    const escort = weightedPool[randomBetween(0, weightedPool.length - 1)];
    ensureEscortOwnedEntry(player, escort);

    return {
      outcome: "escort",
      escort,
      chance: Number(baseChance.toFixed(4)),
      logMessage: `W ${venue.name} siada kontakt: ${escort.name}. Dragowy klimat podbil szanse wejscia na ${Math.round(baseChance * 100)}%.`,
    };
  }

  const eventRoll = Math.random();
  if (eventRoll < profile.eventChance) {
    if (eventRoll < profile.drugChance) {
      const unlockedDrugs = DRUGS.filter((drug) => drug.unlockRespect <= Number(player.profile?.respect || 0));
      const foundDrug = unlockedDrugs[randomBetween(0, Math.max(0, unlockedDrugs.length - 1))];
      if (foundDrug) {
        player.drugInventory[foundDrug.id] = Number(player.drugInventory?.[foundDrug.id] || 0) + 1;
        return {
          outcome: "drug",
          drug: foundDrug,
          logMessage: `W ${venue.name} wpada probka: ${foundDrug.name}. Lokal ma klimat i towar krazy po stolach.`,
        };
      }
    }

    if (eventRoll < profile.contactChance) {
      const tipCash = Math.floor(180 + Number(venue.popularity || 0) * 14 + Number(venue.mood || 0) * 9);
      const xpTip = Number(venue.popularity || 0) >= 32 ? 9 : 0;
      player.profile.cash = Number(player.profile.cash || 0) + tipCash;
      if (xpTip > 0) {
        const progression = applyXpProgression(
          { respect: player.profile.respect, xp: player.profile.xp },
          xpTip
        );
        player.profile.respect = progression.respect;
        player.profile.xp = progression.xp;
        player.profile.level = progression.respect;
      }
      appendPlayerMessage(player, {
        from: venue.ownerLabel || "Miasto",
        subject: `Kontakt z ${venue.name}`,
        preview: `Lokal podrzuca trop. Wpada $${tipCash} i nowy numer do ludzi z zaplecza.`,
        time: createTimeLabel(now),
      });
      return {
        outcome: "contact",
        rewardCash: tipCash,
        rewardXp: xpTip,
        logMessage: `${venue.name} podrzuca kontakt. Wpada $${tipCash}${xpTip ? ` i +${xpTip} XP` : ""}.`,
      };
    }
  }

  return {
    outcome: "miss",
    logMessage: `Obszedles ${venue.name} i spaliles $${CLUB_ESCORT_SEARCH_COST}. Nic konkretnego dzis nie wpadlo.`,
  };
}

export function getKnownClubVenues() {
  return CLUB_MARKET.map((venue) => ({ ...venue }));
}
