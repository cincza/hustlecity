import {
  ECONOMY_RULES,
  HEIST_DEFINITIONS,
  MARKET_PRODUCTS,
} from "../../shared/economy.js";

export {
  ECONOMY_RULES,
  HEIST_DEFINITIONS,
  MARKET_PRODUCTS,
};

export const ENERGY_REGEN_SECONDS = ECONOMY_RULES.energy.regenSeconds;
export const HEALTH_REGEN_SECONDS = ECONOMY_RULES.health.regenSeconds;
export const HEALTH_REGEN_AMOUNT = ECONOMY_RULES.health.regenAmount;
export const PASSIVE_COLLECTION_CAP_MINUTES = ECONOMY_RULES.energy.passiveClaimCapMinutes;
export const RESTAURANT_ENERGY_CAP_PER_HOUR = ECONOMY_RULES.energy.restaurantEnergyCapPerHour;
export const CLUB_TAKEOVER_COST = ECONOMY_RULES.empire.clubTakeoverCost;
export const CLUB_FOUNDING_CASH_COST = ECONOMY_RULES.empire.clubFoundingCashCost;
export const CLUB_FOUNDING_PREMIUM_COST = ECONOMY_RULES.empire.clubFoundingPremiumCost;
