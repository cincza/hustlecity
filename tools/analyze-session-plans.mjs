import { getCityEventAt } from "../shared/cityDirector.js";
import { createCityState } from "../shared/districts.js";
import { createSessionPlanState, getSessionPlanProposals } from "../shared/sessionPlans.js";

const now = Date.now();
const event = getCityEventAt(now);
const base = () => ({
  profile: { cash: 5000, bank: 2000, energy: 20, hp: 100, maxHp: 100, heat: 10, respect: 5, xp: 0, premiumTokens: 0 },
  stats: {}, inventory: { smoke: 20, spirytus: 20 }, producedDrugInventory: { smokes: 10 },
  contacts: { classId: null, learned: [], methods: {}, history: [] }, cityDirector: { claims: [] }, city: createCityState(),
  sessionPlans: createSessionPlanState(), gang: { joined: false }, businessesOwned: [], factoriesOwned: {}, club: { owned: false },
});
const profiles = [
  ["nowy solo", {}],
  ["klasa solo", { contacts: { classId: "broker", learned: ["broker"], methods: {}, history: [] } }],
  ["biznes", { contacts: { classId: "broker", learned: ["broker"], methods: {}, history: [] }, businessesOwned: [{ id: "bar", count: 1 }] }],
  ["produkcja i klub", { contacts: { classId: "dealer", learned: ["dealer"], methods: {}, history: [] }, factoriesOwned: { smokeworks: 1 }, club: { owned: true } }],
  ["gang w wydarzeniu", { contacts: { classId: "enforcer", learned: ["enforcer"], methods: {}, history: [] }, gang: { joined: true, focusDistrictId: event.districtId } }],
];

const matrix = profiles.map(([name, patch]) => {
  const player = { ...base(), ...patch };
  return { profile: name, proposals: getSessionPlanProposals(player, now).map((plan) => `${plan.id}[${plan.approaches.map((entry) => entry.id).join("/")}]`) };
});
const rewardCaps = {
  maxCashPerPlan: 900,
  maxXpPerPlan: 10,
  premiumAwarded: 0,
  maxPlansClaimablePerDailyKey: 1,
  streetSecureBonusVsRequiredDeposit: 450 / 500,
  streetBoldBonusVsRequiredDeposit: 900 / 1000,
};
if (matrix.some((entry) => entry.proposals.length > 3)) throw new Error("Za dużo propozycji na tablicy.");
if (rewardCaps.premiumAwarded !== 0 || rewardCaps.maxPlansClaimablePerDailyKey !== 1) throw new Error("Naruszenie ograniczeń ekonomii planów.");
process.stdout.write(`${JSON.stringify({ at: new Date(now).toISOString(), cityEvent: event.id, matrix, rewardCaps }, null, 2)}\n`);
