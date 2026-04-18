export const RESTAURANT_ITEMS = [
  { id: "burger", name: "Burger uliczny", energy: 3, price: 90 },
  { id: "kebab", name: "Kebab XXL", energy: 5, price: 180 },
  { id: "meal", name: "Obiad ochrony", energy: 8, price: 320 },
  { id: "energybox", name: "Box energetyczny", energy: 12, price: 650 },
];

export const GYM_PASSES = [
  { id: "day", name: "Karnet 1 dzien", price: 350, durationMs: 24 * 60 * 60 * 1000 },
  { id: "week", name: "Karnet 7 dni", price: 1800, durationMs: 7 * 24 * 60 * 60 * 1000 },
  { id: "perm", name: "Karnet na stale", price: 8500, durationMs: null },
];

export const GYM_EXERCISES = [
  { id: "power", name: "Lawka i ciezary", costEnergy: 2, gains: { attack: 2 }, note: "+2 atak" },
  { id: "guard", name: "Tarcze i obrona", costEnergy: 2, gains: { defense: 2 }, note: "+2 obrona" },
  { id: "reflex", name: "Sprint i refleks", costEnergy: 2, gains: { dexterity: 2 }, note: "+2 zrecznosc" },
  { id: "conditioning", name: "Obwod kondycyjny", costEnergy: 3, gains: { maxHp: 8, hp: 8 }, note: "+8 zdrowie max" },
];

export const PROFILE_AVATAR_IDS = ["ghost", "razor", "saint", "vandal", "boss"];

export const HOSPITAL_RULES = {
  healCost: 220,
  healHp: 30,
  healHeatReduction: 2,
  bribeBaseCost: 400,
  bribeCostPerSecond: 8,
  bribeHeatIncrease: 5,
};

export function getRestaurantItemById(itemId) {
  return RESTAURANT_ITEMS.find((item) => item.id === itemId) || null;
}

export function getGymPassById(passId) {
  return GYM_PASSES.find((pass) => pass.id === passId) || null;
}

export function getGymExerciseById(exerciseId) {
  return GYM_EXERCISES.find((exercise) => exercise.id === exerciseId) || null;
}

export function isSupportedAvatarId(avatarId) {
  return PROFILE_AVATAR_IDS.includes(avatarId);
}
