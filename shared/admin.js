export const ADMIN_DEFAULT_USERNAME = "czincza11";

export const ADMIN_PROFILE_FLOORS = {
  cash: 5000000,
  bank: 5000000,
  respect: 30,
  level: 30,
  attack: 60,
  defense: 60,
  dexterity: 60,
  charisma: 25,
  maxHp: 140,
  hp: 140,
  maxEnergy: 20,
  energy: 20,
  premiumTokens: 25,
  heat: 0,
};

export const ADMIN_CASH_GRANT_MAX = 500000;

export const ADMIN_CASH_GRANT_PRESETS = [
  { id: "grant-20k", label: "+20k", amount: 20000 },
  { id: "grant-100k", label: "+100k", amount: 100000 },
];

export function normalizeAdminGrantPresets(presets) {
  if (!Array.isArray(presets)) return [];
  return presets
    .map((preset) => ({
      id: typeof preset?.id === "string" && preset.id.trim() ? preset.id.trim() : null,
      label:
        typeof preset?.label === "string" && preset.label.trim()
          ? preset.label.trim()
          : null,
      amount: Math.max(0, Math.floor(Number(preset?.amount || 0))),
    }))
    .filter((preset) => preset.id && preset.label && preset.amount > 0);
}
