import { BUSINESSES, getDrugBatchSupplyCost, getDrugProductionEnergyCost } from "../shared/empire.js";
import { ECONOMY_RULES, HEIST_DEFINITIONS } from "../shared/economy.js";
import { getSoloHeistOdds } from "../shared/heists.js";
import { getXpRequirementForRespect } from "../shared/progression.js";
import { CONTACT_CLASSES } from "../shared/contacts.js";
import { CONTRACT_CATALOG } from "../shared/contracts.js";
import { OPERATION_CATALOG } from "../shared/operations.js";
import { DRUGS, ESCORTS } from "../shared/socialGameplay.js";

const TARGETS = [3, 8, 15, 30, 45];
const avg = ([low, high]) => (Number(low || 0) + Number(high || 0)) / 2;

export const PROGRESSION_PROFILES = [
  { id: "casual", label: "Casual", sessions: 1, energy: 20, classId: "broker", strategy: "safe", rush: false, contractEvery: 2, operationEveryDays: 7 },
  { id: "regular", label: "Regularny", sessions: 2, energy: 20, classId: "hustler", strategy: "balanced", rush: false, contractEvery: 2, operationEveryDays: 5 },
  { id: "active", label: "Aktywny", sessions: 3, energy: 20, classId: "host", strategy: "balanced", rush: false, contractEvery: 2, operationEveryDays: 4 },
  { id: "risk", label: "Ryzykowny", sessions: 3, energy: 25, classId: "enforcer", strategy: "risk", rush: true, contractEvery: 1, operationEveryDays: 4 },
  { id: "economic", label: "Ekonomiczny", sessions: 2, energy: 20, classId: "broker", strategy: "cash", rush: false, contractEvery: 3, operationEveryDays: 6 },
];

function addExpectedXp(state, amount) {
  state.xp += Math.max(0, Number(amount || 0));
  while (state.xp >= getXpRequirementForRespect(state.respect)) {
    state.xp -= getXpRequirementForRespect(state.respect);
    state.respect += 1;
  }
}

function modeledProfile(respect, strategy) {
  const step = Math.max(0, respect - 1);
  return {
    attack: 11 + step * 0.7,
    defense: 8 + step * 0.45,
    dexterity: 7 + step * 0.6,
    stamina: 7 + step * 0.25,
    hp: 100,
    maxHp: 100,
    heat: strategy === "risk" ? 55 : strategy === "safe" || strategy === "cash" ? 18 : 32,
  };
}

function chooseHeist(respect, strategy) {
  const profile = modeledProfile(respect, strategy);
  const candidates = HEIST_DEFINITIONS.filter((entry) => entry.respect <= respect).map((heist) => {
    const chance = getSoloHeistOdds(profile, heist, [], 0).chance;
    const expectedXp = chance * avg(heist.xpGain);
    const expectedCash = chance * avg(heist.reward) - (1 - chance) * avg(heist.failCashLoss);
    const xpPerEnergy = expectedXp / heist.energy;
    const cashPerEnergy = expectedCash / heist.energy;
    const score = strategy === "cash" ? cashPerEnergy : strategy === "risk" ? heist.respect * 2 + heist.tier * 10 + expectedXp : xpPerEnergy * 100 + cashPerEnergy * 0.02;
    return { heist, chance, expectedXp, expectedCash, score };
  });
  return candidates.sort((a, b) => b.score - a.score)[0];
}

function contactEconomy(method, tier, rush) {
  const goodsCost = method.id === "dealer" ? 8 * 40 : method.id === "hustler" ? 5 * 80 : 0;
  const chance = rush ? 0.68 : 1;
  const reward = method.reward * tier * (rush ? 1.5 : 1);
  const cost = (method.cost + goodsCost) * tier;
  const xp = method.energy * 3 + (tier - 1) * 3;
  return { expectedXp: chance * xp + (1 - chance), expectedCash: chance * reward - cost, energy: method.energy };
}

function chooseContract(respect) {
  return CONTRACT_CATALOG.filter((entry) => entry.respect <= respect)
    .sort((a, b) => (b.xpGain / b.energyCost) - (a.xpGain / a.energyCost))[0] || null;
}

function chooseOperation(respect, wins) {
  return OPERATION_CATALOG.filter((entry) => entry.respect <= respect && (entry.requiresWins || []).every((id) => wins.has(id)))
    .sort((a, b) => (b.xpGain / b.energyCost) - (a.xpGain / a.energyCost))[0] || null;
}

export function simulateProgression(profile, maxDays = 365) {
  const method = CONTACT_CLASSES.find((entry) => entry.id === profile.classId);
  const state = { respect: 1, xp: 0, cash: 15000, completedContacts: 0, businesses: [], operationWins: new Set(), sessionsDone: 0, reached: {} };
  for (let day = 1; day <= maxDays && state.respect < Math.max(...TARGETS); day += 1) {
    for (const business of state.businesses) state.cash += Number(business.incomePerHour || 0) * 12;
    for (const business of BUSINESSES) {
      if (!state.businesses.some((entry) => entry.id === business.id) && state.respect >= business.respect && state.cash >= business.cost * 1.15) {
        state.cash -= business.cost;
        state.businesses.push(business);
      }
    }
    for (let session = 0; session < profile.sessions; session += 1) {
      state.sessionsDone += 1;
      let energy = profile.energy;
      const tier = state.completedContacts >= 24 && state.respect >= 15 ? 3 : state.completedContacts >= 9 && state.respect >= 5 ? 2 : 1;
      const contact = contactEconomy(method, tier, profile.rush);
      const contactRuns = Math.min(3, Math.floor(energy / contact.energy));
      energy -= contactRuns * contact.energy;
      addExpectedXp(state, contactRuns * contact.expectedXp);
      state.cash += contactRuns * contact.expectedCash;
      state.completedContacts += contactRuns * (profile.rush ? 0.68 : 1);
      // A normal session uses the plan board alongside its actions. Six XP is the
      // conservative floor of the current plan rewards rather than bonus grinding.
      addExpectedXp(state, 6);
      if (state.respect >= 14 && state.sessionsDone % profile.contractEvery === 0) {
        const contract = chooseContract(state.respect);
        if (contract && contract.energyCost <= energy) {
          energy -= contract.energyCost;
          addExpectedXp(state, contract.xpGain * 0.62);
          state.cash += avg(contract.baseReward) * 0.62 - contract.entryCost;
        }
      }
      if (state.respect >= 10 && session === 0 && day % profile.operationEveryDays === 0) {
        const operation = chooseOperation(state.respect, state.operationWins);
        if (operation && operation.energyCost <= energy) {
          energy -= operation.energyCost;
          addExpectedXp(state, operation.xpGain * 0.65);
          state.cash += avg(operation.baseReward) * 0.65 - operation.prepCost;
          state.operationWins.add(operation.id);
        }
      }
      while (energy > 0) {
        const chosen = chooseHeist(state.respect, profile.strategy);
        if (!chosen || chosen.heist.energy > energy) break;
        energy -= chosen.heist.energy;
        addExpectedXp(state, chosen.expectedXp);
        state.cash += chosen.expectedCash;
      }
    }
    for (const target of TARGETS) if (!state.reached[target] && state.respect >= target) state.reached[target] = day;
  }
  return {
    id: profile.id,
    label: profile.label,
    classId: profile.classId,
    days: Object.fromEntries(TARGETS.map((target) => [target, state.reached[target] || null])),
    finalRespect: state.respect,
    liquidCash: Math.round(state.cash),
    businesses: state.businesses.length,
    completedContacts: Math.floor(state.completedContacts),
  };
}

export function analyzeFunctionalHardening() {
  const progression = PROGRESSION_PROFILES.map((profile) => simulateProgression(profile));
  const classComparison = CONTACT_CLASSES.map((method) => simulateProgression({ ...PROGRESSION_PROFILES[1], id: method.id, label: method.name, classId: method.id }));
  const passiveRoiHours = {
    businesses: BUSINESSES.map((entry) => ({ id: entry.id, hours: entry.cost / entry.incomePerHour })),
    escorts: ESCORTS.map((entry) => ({ id: entry.id, hours: entry.cost / (entry.cashPerMinute * 60) })),
  };
  const production = DRUGS.map((drug) => ({
    id: drug.id,
    unlockRespect: drug.unlockRespect,
    energy: getDrugProductionEnergyCost(drug),
    supplyCost: getDrugBatchSupplyCost(drug),
    grossStreetValue: drug.batchSize * drug.streetPrice,
  }));
  return { economyVersion: ECONOMY_RULES.version, progression, classComparison, passiveRoiHours, production };
}

if (import.meta.url === `file:///${process.argv[1]?.replaceAll("\\", "/")}`) {
  console.log(JSON.stringify(analyzeFunctionalHardening(), null, 2));
}
