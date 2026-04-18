import {
  GYM_EXERCISES,
  GYM_PASSES,
  HOSPITAL_RULES,
  PROFILE_AVATAR_IDS,
  RESTAURANT_ITEMS,
} from "../../../shared/playerActions.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

export function hasGymPass(profile, now = Date.now()) {
  return profile?.gymPassTier === "perm" || Number(profile?.gymPassUntil || 0) > now;
}

export function buyGymPassForPlayer(player, passId, now = Date.now()) {
  const pass = GYM_PASSES.find((entry) => entry.id === passId);
  if (!pass) {
    fail("Gym pass not found", 404);
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Nie kupisz karnetu z celi.");
  }
  if (Number(player?.profile?.cash || 0) < pass.price) {
    fail(`Brakuje $${pass.price} na ${pass.name}.`);
  }

  player.profile.cash -= pass.price;
  player.profile.gymPassTier = pass.id;
  player.profile.gymPassUntil = pass.durationMs ? now + pass.durationMs : null;

  return {
    pass,
    logMessage: `Kupiono ${pass.name}. Czas napompowac staty.`,
  };
}

export function trainPlayerAtGym(player, exerciseId, now = Date.now()) {
  const exercise = GYM_EXERCISES.find((entry) => entry.id === exerciseId);
  if (!exercise) {
    fail("Gym exercise not found", 404);
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie dojdziesz na silownie.");
  }
  if (!hasGymPass(player?.profile, now)) {
    fail("Najpierw kup karnet na silownie.");
  }
  if (Number(player?.profile?.energy || 0) < exercise.costEnergy) {
    fail("Za malo energii na trening.");
  }

  player.profile.energy -= exercise.costEnergy;
  player.profile.attack += Number(exercise.gains?.attack || 0);
  player.profile.defense += Number(exercise.gains?.defense || 0);
  player.profile.dexterity += Number(exercise.gains?.dexterity || 0);
  player.profile.maxHp += Number(exercise.gains?.maxHp || 0);
  player.profile.hp = Math.min(
    player.profile.maxHp,
    player.profile.hp + Number(exercise.gains?.hp || 0)
  );

  return {
    exercise,
    logMessage: `Silownia zaliczona: ${exercise.name}. ${exercise.note}.`,
  };
}

export function buyRestaurantItemForPlayer(player, itemId, now = Date.now()) {
  const item = RESTAURANT_ITEMS.find((entry) => entry.id === itemId);
  if (!item) {
    fail("Restaurant item not found", 404);
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Wiezienie serwuje tylko standardowy kociolek.");
  }
  if (Number(player?.profile?.cash || 0) < item.price) {
    fail(`Brakuje kasy na ${item.name}.`);
  }

  player.profile.cash -= item.price;
  player.profile.energy = Math.min(player.profile.maxEnergy, player.profile.energy + item.energy);

  return {
    item,
    logMessage: `Zjedzone: ${item.name}. Energia +${item.energy}.`,
  };
}

export function healPlayer(player) {
  if (Number(player?.profile?.cash || 0) < HOSPITAL_RULES.healCost) {
    fail("Brakuje kasy na lekarza.");
  }

  player.profile.cash -= HOSPITAL_RULES.healCost;
  player.profile.hp = Math.min(player.profile.maxHp, player.profile.hp + HOSPITAL_RULES.healHp);
  player.profile.heat = Math.max(0, player.profile.heat - HOSPITAL_RULES.healHeatReduction);

  return {
    logMessage: "Lekarz poskladal Cie do kupy. Wracasz do gry.",
  };
}

export function bribePlayerOutOfJail(player, now = Date.now()) {
  const jailUntil = Number(player?.profile?.jailUntil || 0);
  if (jailUntil <= now) {
    fail("Nie siedzisz teraz za kratami.");
  }

  const price =
    HOSPITAL_RULES.bribeBaseCost +
    Math.ceil((jailUntil - now) / 1000) * HOSPITAL_RULES.bribeCostPerSecond;

  if (Number(player?.profile?.cash || 0) < price) {
    fail(`Brakuje $${price} na kaucje.`);
  }

  player.profile.cash -= price;
  player.profile.jailUntil = null;
  player.profile.heat = Math.min(100, player.profile.heat + HOSPITAL_RULES.bribeHeatIncrease);

  return {
    price,
    logMessage: `Zaplacono $${price} i wyszedles przed terminem.`,
  };
}

export function updatePlayerAvatar(player, avatarId) {
  if (!PROFILE_AVATAR_IDS.includes(avatarId)) {
    fail("Avatar not supported", 404);
  }

  player.profile.avatarId = avatarId;
  player.profile.avatarCustomUri = null;

  return {
    avatarId,
    logMessage: `Ustawiono avatar: ${avatarId}.`,
  };
}
