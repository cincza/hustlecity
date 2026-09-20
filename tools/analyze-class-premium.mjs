import { CONTACT_CLASSES } from "../shared/contacts.js";
import { ECONOMY_RULES, HEIST_DEFINITIONS } from "../shared/economy.js";
import { BUSINESSES } from "../shared/empire.js";
import { getXpRequirementForRespect } from "../shared/progression.js";
import { createGangState } from "../shared/gangProjects.js";

// Sensitivity calculation, not a playthrough. No accounts, timers or game actions.
const xpRequired = Array.from({ length: 14 }, (_, i) => getXpRequirementForRespect(i + 1)).reduce((a, b) => a + b, 0);
const heist = HEIST_DEFINITIONS[0];
const meanXp = (heist.xpGain[0] + heist.xpGain[1]) / 2;
const energyPerSession = ECONOMY_RULES.energy.baseMax + ECONOMY_RULES.energy.restaurantEnergyCapPerHour;
const bar = BUSINESSES.find((b) => b.id === "bar");
const gangCost = createGangState().createCost;
console.log(JSON.stringify({
  assumptions: [
    "2 or 3 sessions/day in separate six-hour contact windows; three successful standard contacts/session.",
    "20 regenerated + 15 meal energy/session; all other energy goes to the first heist.",
    "Success sensitivity uses that heist's minimum and maximum odds; no quest XP, advanced heists, tier bonuses or jail delays.",
    "This estimates XP throughput, not observed player completion time. Health, market supply and spending can slow it down.",
  ],
  respectTarget: 15, xpRequired, gangCost, premiumFoundingCost: 0,
  xpDays: [2, 3].map((sessions) => ({ sessionsPerDay: sessions, classes: CONTACT_CLASSES.map((c) => {
    const contacts = sessions * 3;
    const remainingEnergy = sessions * energyPerSession - contacts * c.energy;
    const days = (chance) => Math.ceil(xpRequired / (contacts * c.energy * 3 + remainingEnergy * meanXp * chance / heist.energy));
    return { class: c.name, faster: days(heist.maxSuccess), slower: days(heist.minSuccess) };
  }) })),
  cashBenchmark: {
    note: "Savings AFTER owning four bars, collecting twice/day, no upgrades or other spending; not time from account creation.",
    dailyGross: bar.incomePerHour * 4 * 24,
    daysToSave: Math.ceil(gangCost / (bar.incomePerHour * 4 * 24)),
  },
  freeTokens: { firstNetwork: 3, firstNetworkSuccessfulOrders: 9, weekly: 2, weeklySuccessfulOrders: 9, classChange: 3, subsequentChangeWeeks: "1–2 weekly claims, depending on saved balance", repeatableAnnualMaximum: 104 },
}, null, 2));
