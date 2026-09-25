export const MONETIZATION_VISIBLE = process.env.EXPO_PUBLIC_MONETIZATION_ENABLED === "1";

export function isPremiumCheckoutEnabled(env = process.env) {
  return env.PREMIUM_CHECKOUT_ENABLED === "1";
}
