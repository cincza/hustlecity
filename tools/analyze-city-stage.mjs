import { CONTACT_CLASSES, getContactQuote } from "../shared/contacts.js";
import { getCitySituation } from "../shared/cityStories.js";
import { createCityState, DISTRICTS } from "../shared/districts.js";

const now = 1789812000000;
function fixture(classId, pressure) {
  const city = createCityState();
  for (const district of DISTRICTS) { city.districts[district.id].pressure = pressure; city.districts[district.id].lastSyncAt = now; }
  return { profile: { cash: 100000, bank: 100000, energy: 100, hp: 100, heat: 35, respect: 15, xp: 0 }, inventory: { smoke: 100, spirytus: 100 }, stats: { operationsCompleted: 1, marketGoodsSold: 25 }, businessesOwned: [{ id: "bar", count: 1 }], factoriesOwned: { smokeworks: true }, club: { owned: true }, city, contacts: { classId, learned: CONTACT_CLASSES.map((entry) => entry.id), completed: 24, methods: Object.fromEntries(CONTACT_CLASSES.map((entry) => [entry.id, 6])), stories: { relations: Object.fromEntries(DISTRICTS.map((district) => [district.id, { trust: 6 }])) } } };
}

const pressureSamples = [16, 60, 85];
const matrix = CONTACT_CLASSES.flatMap((profession) => DISTRICTS.flatMap((district) => pressureSamples.map((pressure) => {
  const player = fixture(profession.id, pressure);
  const quiet = getContactQuote(player, district.id, profession.id, "quiet", now);
  const rush = getContactQuote(player, district.id, profession.id, "rush", now);
  return { class: profession.name, district: district.name, pressure, quiet: { reward: quiet.reward, heat: quiet.heat }, rush: { reward: rush.reward, chance: Number(rush.chance.toFixed(3)), expectedGross: Math.round(rush.reward * rush.chance), heat: rush.heat } };
})));

const classRoutes = CONTACT_CLASSES.map((profession) => {
  const player = fixture(profession.id, 24);
  const available = DISTRICTS.flatMap((district) => getCitySituation(player, district.id, now).choices.filter((choice) => choice.classId === profession.id));
  return { class: profession.name, routes: available.map((choice) => ({ id: choice.id, cost: choice.cost, goods: choice.quantity || 0, damage: choice.damage || 0, consequence: choice.consequence.kind })) };
});

console.log(JSON.stringify({ assumptions: "Static quote sensitivity only: no timers, accounts or playthrough. Goods have no fixed cash proxy because live market prices vary.", matrix, classRoutes }, null, 2));
