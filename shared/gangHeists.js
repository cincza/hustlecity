import { clamp } from "./economy.js";

export const GANG_HEISTS = [
  {
    id: "pharma",
    name: "Magazyn farmaceutyczny",
    districtId: "oldtown",
    respect: 12,
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
    minMembers: 18,
    reward: [120000, 170000],
    risk: 0.68,
    energy: 7,
  },
];

export function getGangHeistById(heistId) {
  return GANG_HEISTS.find((entry) => entry.id === heistId) || null;
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

export function getGangHeistOdds(profile = {}, effectiveProfile = profile, gang = {}, heist = {}) {
  const gangPower =
    Number(effectiveProfile.attack || 0) * 1.1 +
    Number(effectiveProfile.defense || 0) * 0.8 +
    Number(effectiveProfile.dexterity || 0) * 1.0 +
    Number(profile.respect || 0) * 0.45 +
    Number(gang.members || 0) * 2.4 +
    Number(gang.influence || 0) * 1.2;
  const gangDifficulty =
    Number(heist.respect || 0) * 1.5 +
    Number(heist.energy || 0) * 5 +
    Number(heist.minMembers || 0) * 4 +
    Number(heist.risk || 0) * 60;

  return {
    chance: clamp(0.35 + (gangPower - gangDifficulty) / 140 - Number(profile.heat || 0) * 0.002, 0.06, 0.9),
  };
}

export function getGangHeistBonusRate(gang = {}) {
  return clamp(Number(gang.members || 0) * 0.01 + Number(gang.influence || 0) * 0.004, 0, 0.24);
}

export function getGangHeistParticipants(gang = {}, heist = {}) {
  const members = Math.max(0, Number(gang.members || 0));
  const jailedCrew = Math.max(0, Number(gang.jailedCrew || 0));
  const availableCrew = Math.max(0, members - jailedCrew);
  const minMembers = Math.max(1, Number(heist.minMembers || 1));
  const influenceBonus = Math.max(0, Math.floor(Number(gang.influence || 0) / 6));

  return Math.max(
    minMembers,
    Math.min(availableCrew, Math.max(minMembers, minMembers + influenceBonus))
  );
}

export function getGangHeistFailureJailChance(heist = {}) {
  return clamp(Number(heist.risk || 0) * 0.7, 0.08, 0.72);
}

export function getGangHeistFailureJailSentenceSeconds(heist = {}) {
  return 120 + Number(heist.energy || 0) * 40;
}
