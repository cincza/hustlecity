import { clamp } from "./economy.js";
import { getArenaActionModifiers } from "./arena.js";

// Used by both the preview and the server roll. Keep balance rules in one place.
export function getSoloHeistOdds(profile, heist, activeBoosts = [], now = Date.now()) {
  const statScore =
    Number(profile.attack || 0) * 1.2 +
    Number(profile.defense || 0) * 0.65 +
    Number(profile.dexterity || 0) * 1.1 +
    Number(profile.stamina || 0) * 0.5;
  const heat = Number(profile.heat || 0);
  const modifiers = getArenaActionModifiers(activeBoosts, "heist", now);
  const chance = clamp(
    heist.baseSuccess + (statScore - heist.difficultyScore) / 100 +
      modifiers.heistSuccessBonus - heat * 0.0045 -
      (profile.hp < profile.maxHp * 0.4 ? 0.05 : 0),
    heist.minSuccess,
    heist.maxSuccess
  );
  const jailChance = clamp(
    0.08 + heist.risk * 0.48 + heist.energy * 0.018 + heat * 0.0025 -
      Number(profile.defense || 0) * 0.004 - Number(profile.dexterity || 0) * 0.006,
    0.06,
    0.72
  );
  return { chance, jailChance, arrestChance: (1 - chance) * jailChance };
}
