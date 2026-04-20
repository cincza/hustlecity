import { clamp } from "./economy.js";

export const GANG_HEISTS = [
  {
    id: "pharma",
    name: "Magazyn farmaceutyczny",
    districtId: "oldtown",
    respect: 12,
    recommendedRespect: 12,
    minMembers: 3,
    reward: [9000, 14000],
    risk: 0.32,
    energy: 3,
  },
  {
    id: "casino",
    name: "Sejf kasyna",
    districtId: "neon",
    respect: 20,
    recommendedRespect: 20,
    minMembers: 5,
    reward: [18000, 28000],
    risk: 0.4,
    energy: 4,
  },
  {
    id: "port",
    name: "Kontener w porcie",
    districtId: "harbor",
    respect: 30,
    recommendedRespect: 30,
    minMembers: 8,
    reward: [36000, 54000],
    risk: 0.49,
    energy: 5,
  },
  {
    id: "armory",
    name: "Sklad wojskowy",
    districtId: "harbor",
    respect: 42,
    recommendedRespect: 42,
    minMembers: 12,
    reward: [65000, 98000],
    risk: 0.59,
    energy: 6,
  },
  {
    id: "mint",
    name: "Miejska mennica",
    districtId: "oldtown",
    respect: 58,
    recommendedRespect: 58,
    minMembers: 18,
    reward: [120000, 170000],
    risk: 0.68,
    energy: 7,
  },
];

export const GANG_HEIST_RESCUE_OPTIONS = [
  {
    id: "contact",
    name: "Kontakt",
    summary: "Szybki numer do ludzi z tylnego pokoju. Tanszy, ale mniej pewny.",
    baseCost: 7000,
    chance: 0.46,
    heat: 3,
    releaseRatio: 0.4,
  },
  {
    id: "lawyer",
    name: "Prawnik",
    summary: "Drozej, ale scina odsiadke pewniej i robi mniej szumu.",
    baseCost: 12000,
    chance: 0.7,
    heat: 1,
    releaseRatio: 0.65,
  },
  {
    id: "bribe",
    name: "Przekupstwo",
    summary: "Najgrubszy ruch. Najwieksza szansa, ale podbija heat przy przypale.",
    baseCost: 17000,
    chance: 0.82,
    heat: 6,
    releaseRatio: 1,
  },
];

export function getGangHeistById(heistId) {
  return GANG_HEISTS.find((entry) => entry.id === heistId) || null;
}

export function getGangRescueOptionById(optionId) {
  return GANG_HEIST_RESCUE_OPTIONS.find((entry) => entry.id === optionId) || null;
}

export function canRunGangHeistRole(role) {
  return role === "Boss" || role === "Vice Boss" || role === "Zaufany";
}

export function getGangHeistEffectiveProfile(profile = {}, activeBoosts = []) {
  const bonus = (Array.isArray(activeBoosts) ? activeBoosts : []).reduce(
    (acc, boost) => ({
      attack: acc.attack + Number(boost?.effect?.attack || 0),
      defense: acc.defense + Number(boost?.effect?.defense || 0),
      dexterity: acc.dexterity + Number(boost?.effect?.dexterity || 0),
      charisma: acc.charisma + Number(boost?.effect?.charisma || 0),
    }),
    { attack: 0, defense: 0, dexterity: 0, charisma: 0 }
  );

  return {
    ...profile,
    attack: Number(profile.attack || 0) + bonus.attack,
    defense: Number(profile.defense || 0) + bonus.defense,
    dexterity: Number(profile.dexterity || 0) + bonus.dexterity,
    charisma: Number(profile.charisma || 0) + bonus.charisma,
  };
}

export function getGangHeistParticipantPower(profile = {}, effectiveProfile = profile) {
  return (
    Number(effectiveProfile.attack || 0) * 1.15 +
    Number(effectiveProfile.defense || 0) * 0.9 +
    Number(effectiveProfile.dexterity || 0) * 1.02 +
    Number(effectiveProfile.charisma || 0) * 0.42 +
    Number(profile.respect || 0) * 0.52
  );
}

export function getGangHeistRecommendedRespect(heist = {}) {
  return Math.max(0, Math.floor(Number(heist.recommendedRespect ?? heist.respect ?? 0)));
}

export function getGangHeistSquadSummary(participants = [], heist = {}, gang = {}) {
  const crew = Array.isArray(participants) ? participants : [];
  const requiredMembers = Math.max(1, Math.floor(Number(heist.minMembers || 1)));
  const memberCount = crew.length;
  const totalPower = crew.reduce(
    (sum, entry) =>
      sum + getGangHeistParticipantPower(entry?.profile || {}, entry?.effectiveProfile || entry?.profile || {}),
    0
  );
  const avgPower = memberCount ? totalPower / memberCount : 0;
  const recommendedRespect = getGangHeistRecommendedRespect(heist);
  const gangInfluence = Math.max(0, Number(gang?.influence || 0));
  const gangMembers = Math.max(0, Number(gang?.members || memberCount));
  const baseDifficulty =
    recommendedRespect * 7.4 +
    requiredMembers * 26 +
    Number(heist.energy || 0) * 18 +
    Number(heist.risk || 0) * 135;
  const supportBonus = gangInfluence * 1.2 + gangMembers * 0.7;
  const fillRatio = requiredMembers ? memberCount / requiredMembers : 1;
  const underfillPenalty = fillRatio < 1 ? (1 - fillRatio) * 0.42 : 0;
  const chance = clamp(0.14 + (totalPower + supportBonus - baseDifficulty) / 320 - underfillPenalty, 0.05, 0.94);

  return {
    memberCount,
    requiredMembers,
    totalPower: Math.round(totalPower),
    avgPower: Math.round(avgPower),
    recommendedRespect,
    chance,
    ready: memberCount >= requiredMembers,
  };
}

export function getGangHeistOdds(profile = {}, effectiveProfile = profile, gang = {}, heist = {}) {
  const summary = getGangHeistSquadSummary(
    [
      {
        profile,
        effectiveProfile,
      },
    ],
    heist,
    gang
  );
  return {
    chance: summary.chance,
  };
}

export function getGangHeistBonusRate(gang = {}) {
  return clamp(Number(gang.members || 0) * 0.008 + Number(gang.influence || 0) * 0.0035, 0, 0.18);
}

export function getGangHeistParticipants(gang = {}, heist = {}) {
  const members = Math.max(0, Number(gang.members || 0));
  const jailedCrew = Math.max(0, Number(gang.jailedCrew || 0));
  const availableCrew = Math.max(0, members - jailedCrew);
  const minMembers = Math.max(1, Number(heist.minMembers || 1));
  return Math.max(0, Math.min(availableCrew, minMembers));
}

export function getGangHeistFailureJailChance(heist = {}, chance = 0) {
  return clamp(Number(heist.risk || 0) * 0.45 + (0.55 - Number(chance || 0)) * 0.28, 0.08, 0.66);
}

export function getGangHeistFailureJailSentenceSeconds(heist = {}, chance = 0) {
  return Math.max(120, Math.round(150 + Number(heist.energy || 0) * 55 + (1 - Number(chance || 0)) * 180));
}

export function getGangHeistVaultCut(grossGain) {
  return Math.max(0, Math.floor(Number(grossGain || 0) * 0.1));
}

export function buildGangHeistResultMessage(report) {
  if (!report) return "";
  if (report.success) {
    return `${report.heistName} siadl. Ekipa wyciaga ${report.totalTake}$, a do skarbca wpada ${report.vaultCut}$.`;
  }
  const jailedCount = Array.isArray(report.jailedParticipantIds) ? report.jailedParticipantIds.length : 0;
  return jailedCount
    ? `${report.heistName} spalony. Za kraty leci ${jailedCount} ludzi i ekipa musi reagowac.`
    : `${report.heistName} spalony. Ekipa wraca poturbowana, ale bez odsiadki.`;
}
