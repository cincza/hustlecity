import { ECONOMY_RULES } from "./economy.js";

const WINDOW_MS = 60 * 60 * 1000;

export function getRestaurantAllowance(profile, now = Date.now()) {
  const limit = ECONOMY_RULES.energy.restaurantEnergyCapPerHour;
  const started = Number(profile?.restaurant?.windowStartedAt || 0);
  const active = started > 0 && started <= now && now < started + WINDOW_MS;
  const used = active ? Math.min(limit, Math.max(0, Number(profile.restaurant.energyUsed || 0))) : 0;
  return { limit, used, remaining: limit - used, windowStartedAt: active ? started : now, resetsAt: active ? started + WINDOW_MS : null };
}

export function getRestaurantQuote(profile, meal, now = Date.now()) {
  const allowance = getRestaurantAllowance(profile, now);
  const missing = Math.max(0, Number(profile.maxEnergy || 0) - Number(profile.energy || 0));
  const energyGain = Math.max(0, Math.min(meal.energy, missing, allowance.remaining));
  // Never charge for energy the player cannot receive.
  const cost = Math.ceil(meal.price * energyGain / meal.energy);
  const error = Number(profile.jailUntil || 0) > now ? "Restauracja jest niedostępna w więzieniu."
    : missing <= 0 ? "Masz już pełną energię."
    : allowance.remaining <= 0 ? "Limit energii z posiłków wykorzystany."
    : Number(profile.cash || 0) < cost ? "Brakuje gotówki na ten posiłek."
    : null;
  return { energyGain, cost, allowance, error };
}
