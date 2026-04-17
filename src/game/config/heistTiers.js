export const HEIST_TIERS = [
  {
    id: "street",
    title: "Tier 1: Ulica",
    shortLabel: "Ulica",
    unlockRespect: 0,
    description: "Male roboty na szybki start i pierwsze wejscie w rytm miasta.",
  },
  {
    id: "stores",
    title: "Tier 2: Sklepy",
    shortLabel: "Sklepy",
    unlockRespect: 5,
    description: "Sklepy i mniejsze punkty. Lepsza kasa, wiekszy przypal.",
  },
  {
    id: "companies",
    title: "Tier 3: Firmy",
    shortLabel: "Firmy",
    unlockRespect: 10,
    description: "Firmy, magazyny i grubsze zaplecze pod konkretny skok.",
  },
  {
    id: "highrisk",
    title: "Tier 4: High Risk",
    shortLabel: "High Risk",
    unlockRespect: 20,
    description: "Najgrubsze roboty. Najwieksza kasa i najwieksze ryzyko.",
  },
];

export function getHeistTierId(heist) {
  const respect = Number(heist?.respect || 0);
  if (respect >= 20) return "highrisk";
  if (respect >= 10) return "companies";
  if (respect >= 5) return "stores";
  return "street";
}

export function groupHeistsByTier(heists) {
  const safeHeists = Array.isArray(heists) ? heists : [];
  return HEIST_TIERS.reduce((acc, tier) => {
    acc[tier.id] = safeHeists.filter((heist) => getHeistTierId(heist) === tier.id);
    return acc;
  }, {});
}

export function getNextHeistTier(playerRespect) {
  return HEIST_TIERS.find((tier) => Number(playerRespect || 0) < tier.unlockRespect) || null;
}
