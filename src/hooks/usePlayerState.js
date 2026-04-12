import { useMemo } from "react";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function getRankTitle(respect) {
  if (respect >= 60) return "Krol ulicy";
  if (respect >= 44) return "Capo";
  if (respect >= 30) return "Egzekutor";
  if (respect >= 18) return "Rozgrywajacy";
  if (respect >= 10) return "Mlody wilk";
  return "Swiezak";
}

export function getRespectInfo(respect) {
  let level = 1;
  let remaining = respect;
  let requirement = 12;
  let currentStart = 0;

  while (remaining >= requirement) {
    remaining -= requirement;
    currentStart += requirement;
    level += 1;
    requirement = Math.round(requirement * 1.25 + 4);
  }

  return {
    level,
    currentStart,
    requirement,
    progress: requirement > 0 ? remaining / requirement : 1,
    currentValue: remaining,
    nextGoal: currentStart + requirement,
  };
}

export function getEffectivePlayer(player, activeBoosts) {
  const bonus = activeBoosts.reduce(
    (acc, boost) => ({
      attack: acc.attack + (boost.effect.attack || 0),
      defense: acc.defense + (boost.effect.defense || 0),
      dexterity: acc.dexterity + (boost.effect.dexterity || 0),
      charisma: acc.charisma + (boost.effect.charisma || 0),
    }),
    { attack: 0, defense: 0, dexterity: 0, charisma: 0 }
  );

  return {
    ...player,
    attack: player.attack + bonus.attack,
    defense: player.defense + bonus.defense,
    dexterity: player.dexterity + bonus.dexterity,
    charisma: player.charisma + bonus.charisma,
  };
}

export function getAvatarById(avatarId, avatars) {
  return avatars.find((avatar) => avatar.id === avatarId) ?? avatars[0];
}

export function hasGymPass(player) {
  return player.gymPassTier === "perm" || (player.gymPassUntil && player.gymPassUntil > Date.now());
}

export function inJail(player) {
  return Boolean(player.jailUntil && player.jailUntil > Date.now());
}

export function getPlayerClubOwnerLabel(game) {
  return game.gang.joined && game.gang.name ? game.gang.name : game.player.name;
}

export function getEscortFindChance(state) {
  const boostScore = state.activeBoosts.reduce(
    (sum, boost) => sum + (boost.effect.charisma || 0) + (boost.effect.dexterity || 0),
    0
  );

  return clamp(0.03 + boostScore * 0.008 + (state.club.owned ? state.club.popularity * 0.001 : 0), 0.03, 0.18);
}

export function usePlayerState({ game, avatars }) {
  const respectInfo = useMemo(() => getRespectInfo(game.player.respect), [game.player.respect]);
  const effectivePlayer = useMemo(
    () => getEffectivePlayer(game.player, game.activeBoosts),
    [game.player, game.activeBoosts]
  );
  const activeAvatar = useMemo(() => getAvatarById(game.player.avatarId, avatars), [game.player.avatarId, avatars]);
  const clubOwnerLabel = useMemo(
    () => getPlayerClubOwnerLabel(game),
    [game.gang.joined, game.gang.name, game.player.name]
  );
  const escortBaseFindChance = useMemo(() => getEscortFindChance(game), [game]);

  return {
    respectInfo,
    effectivePlayer,
    activeAvatar,
    clubOwnerLabel,
    escortBaseFindChance,
  };
}
