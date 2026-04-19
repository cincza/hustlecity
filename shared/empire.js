import { clamp, getFactorySlotLimit } from "./economy.js";
import { DRUGS } from "./socialGameplay.js";

export const BUSINESSES = [
  { id: "bar", name: "Bar na zapleczu", respect: 3, cost: 12000, incomePerHour: 300, incomePerMinute: 5, kind: "lokal" },
  { id: "club", name: "Klub nocny", respect: 3, cost: 42000, incomePerHour: 1050, incomePerMinute: 17.5, kind: "lokal" },
  { id: "laundry", name: "Pralnia samoobslugowa", respect: 5, cost: 90000, incomePerHour: 2250, incomePerMinute: 37.5, kind: "uslugi", note: "Cichy biznes z dobrym obrotem i niska spina." },
  { id: "cleaning", name: "Firma sprzatajaca", respect: 8, cost: 110000, incomePerHour: 2750, incomePerMinute: 110000 / 2400, kind: "uslugi", note: "Legalna przykrywka pod regularny cashflow i kontakty." },
  { id: "travel", name: "Biuro podrozy", respect: 8, cost: 140000, incomePerHour: 3500, incomePerMinute: 140000 / 2400, kind: "biuro", note: "Daje spokojny dochod i ladnie maskuje ruch ludzi." },
  { id: "school", name: "Szkola jezykowa", respect: 10, cost: 160000, incomePerHour: 4000, incomePerMinute: 160000 / 2400, kind: "edukacja", note: "Dobre zaplecze pod ludzi, papiery i czystszy wizerunek." },
  { id: "cinema", name: "Kino lokalne", respect: 15, cost: 180000, incomePerHour: 4500, incomePerMinute: 75, kind: "lokal", note: "Mocniejszy ruch wieczorami i lepsza sprzedaz dodatkow." },
  { id: "garage", name: "Warsztat chop-shop", respect: 15, cost: 78000, incomePerHour: 1950, incomePerMinute: 32.5, kind: "przykrywka" },
  { id: "furniture", name: "Salon meblowy", respect: 18, cost: 220000, incomePerHour: 5500, incomePerMinute: 220000 / 2400, kind: "handel", note: "Grubszy obrot, wyzszy prog wejscia i ladny front dla imperium." },
  { id: "pilllab", name: "Mini fabryka tabletek", respect: 20, cost: 145000, incomePerHour: 3625, incomePerMinute: 145000 / 2400, kind: "fabryka" },
  { id: "brew", name: "Destylarnia zaplecza", respect: 25, cost: 240000, incomePerHour: 6000, incomePerMinute: 100, kind: "fabryka" },
  { id: "tower", name: "Siec lokali premium", respect: 30, cost: 420000, incomePerHour: 10500, incomePerMinute: 175, kind: "imperium" },
];

export const SUPPLIERS = [
  { id: "tobacco", name: "Tyton i filtry", unit: "karton", price: 55 },
  { id: "grain", name: "Zboze i zacier", unit: "worek", price: 60 },
  { id: "spores", name: "Zarodniki", unit: "zestaw", price: 95 },
  { id: "herbs", name: "Trawa i nasiona", unit: "paczka", price: 55 },
  { id: "resin", name: "Zywica i prasowanka", unit: "kostka", price: 120 },
  { id: "chemicals", name: "Chemia bazowa", unit: "kanister", price: 95 },
  { id: "pharma", name: "Odczynniki farmaceutyczne", unit: "pakiet", price: 170 },
  { id: "pills", name: "Puste kapsuly", unit: "rolka", price: 75 },
  { id: "solvent", name: "Rozpuszczalnik", unit: "baniak", price: 125 },
  { id: "poppy", name: "Mak i lateks", unit: "skrzynka", price: 180 },
  { id: "coca", name: "Liscie koki", unit: "belka", price: 260 },
  { id: "acid", name: "Kwasy laboratoryjne", unit: "pojemnik", price: 290 },
  { id: "cactus", name: "Kaktusy i ekstrakt", unit: "pakiet", price: 240 },
  { id: "glass", name: "Szklo laboratoryjne", unit: "skrzynka", price: 160 },
  { id: "packaging", name: "Pakowanie i woreczki", unit: "karton", price: 50 },
];

export const FACTORIES = [
  { id: "smokeworks", name: "Fabryka fajek", respect: 8, cost: 65000, text: "Tani, szybki towar na poczatek i pod lokalne bary.", unlocks: ["smokes"] },
  { id: "distillery", name: "Destylarnia spirytusu", respect: 12, cost: 105000, text: "Spirytus schodzi zawsze, ale wymaga zaplecza i butelek.", unlocks: ["spirit"] },
  { id: "wetlab", name: "Wet Lab GBL", respect: 16, cost: 210000, text: "Chemia klubowa i szybki zarobek przy dobrym ruchu.", unlocks: ["gbl"] },
  { id: "greenhouse", name: "Szklarnie botaniczne", respect: 20, cost: 410000, text: "Salvia, grzybki, hasz i marihuana dla stalych klientow.", unlocks: ["salvia", "shrooms", "hash", "weed"] },
  { id: "powderlab", name: "Laboratorium proszkow", respect: 25, cost: 760000, text: "Amfetamina i rohypnol, czyli mocniejszy towar z wiekszym ryzykiem.", unlocks: ["amphetamine", "rohypnol"] },
  { id: "poppyworks", name: "Zaklad opium i heroiny", respect: 25, cost: 1150000, text: "Ciezki zarobek, ciezkie ryzyko i bardzo mocny towar.", unlocks: ["opium", "heroin"] },
  { id: "cartelrefinery", name: "Rafineria kokainy", respect: 25, cost: 1650000, text: "Kokaina daje wielkie pieniadze, ale wymaga solidnego lancucha dostaw.", unlocks: ["cocaine"] },
  { id: "acidlab", name: "Acid Lab", respect: 25, cost: 2350000, text: "Produkcja LSD pod najbardziej odklejonych klientow miasta.", unlocks: ["lsd"] },
  { id: "designerlab", name: "Designer Lab", respect: 25, cost: 3300000, text: "Extasy i meskalina dla topowego rynku i najbogatszych ekip.", unlocks: ["ecstasy", "mescaline"] },
];

export function createSupplyCounterMap(initialValue = 0) {
  return Object.fromEntries(SUPPLIERS.map((item) => [item.id, initialValue]));
}

export function createBusinessCollections() {
  return {
    businessCash: 0,
    escortCash: 0,
    businessCollectedAt: null,
    escortCollectedAt: null,
    businessAccruedAt: Date.now(),
    escortAccruedAt: Date.now(),
  };
}

export function findBusinessById(businessId) {
  return BUSINESSES.find((business) => business.id === businessId) || null;
}

export function findFactoryById(factoryId) {
  return FACTORIES.find((factory) => factory.id === factoryId) || null;
}

export function findSupplyById(supplyId) {
  return SUPPLIERS.find((supply) => supply.id === supplyId) || null;
}

export function getOwnedFactoryCount(factoriesOwned) {
  return Object.values(factoriesOwned || {}).reduce((sum, count) => sum + (Number(count || 0) > 0 ? 1 : 0), 0);
}

export function hasFactory(factoriesOwned, factoryId) {
  return Number(factoriesOwned?.[factoryId] || 0) > 0;
}

export function canBuyFactorySlot({ respect = 0, factoriesOwned = {} } = {}) {
  const slotLimit = getFactorySlotLimit(Number(respect || 0));
  return getOwnedFactoryCount(factoriesOwned) < slotLimit;
}

export function normalizeBusinessesOwned(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => entry && typeof entry.id === "string")
    .map((entry) => ({
      id: entry.id,
      count: Math.max(0, Math.floor(Number(entry.count || 0))),
    }))
    .filter((entry) => entry.count > 0);
}

export function normalizeBusinessUpgrades(upgrades) {
  if (!upgrades || typeof upgrades !== "object" || Array.isArray(upgrades)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(upgrades)
      .filter(([businessId]) => Boolean(findBusinessById(businessId)))
      .map(([businessId, value]) => [
        businessId,
        {
          speedLevel: Math.max(0, Math.floor(Number(value?.speedLevel || 0))),
          cashLevel: Math.max(0, Math.floor(Number(value?.cashLevel || 0))),
        },
      ])
  );
}

export function normalizeFactoriesOwned(factoriesOwned) {
  if (!factoriesOwned || typeof factoriesOwned !== "object" || Array.isArray(factoriesOwned)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(factoriesOwned)
      .filter(([factoryId]) => Boolean(findFactoryById(factoryId)))
      .map(([factoryId, value]) => [factoryId, Number(value || 0) > 0 ? 1 : 0])
      .filter(([, value]) => value > 0)
  );
}

export function normalizeSupplies(supplies) {
  const base = createSupplyCounterMap(0);
  if (!supplies || typeof supplies !== "object" || Array.isArray(supplies)) {
    return base;
  }

  for (const supply of SUPPLIERS) {
    base[supply.id] = Math.max(0, Math.floor(Number(supplies[supply.id] || 0)));
  }
  return base;
}

export function normalizeBusinessCollections(collections) {
  const now = Date.now();
  const safe = collections && typeof collections === "object" && !Array.isArray(collections) ? collections : {};
  return {
    businessCash: Math.max(0, Number(safe.businessCash || 0)),
    escortCash: Math.max(0, Number(safe.escortCash || 0)),
    businessCollectedAt: Number.isFinite(safe.businessCollectedAt) ? safe.businessCollectedAt : null,
    escortCollectedAt: Number.isFinite(safe.escortCollectedAt) ? safe.escortCollectedAt : null,
    businessAccruedAt: Number.isFinite(safe.businessAccruedAt) ? safe.businessAccruedAt : now,
    escortAccruedAt: Number.isFinite(safe.escortAccruedAt) ? safe.escortAccruedAt : now,
  };
}

export function getBusinessUpgradeState(state, businessId) {
  const upgrades = state?.businessUpgrades || {};
  const current = upgrades?.[businessId] || {};
  return {
    speedLevel: Number(current.speedLevel || 0),
    cashLevel: Number(current.cashLevel || 0),
    totalLevel: Number(current.speedLevel || 0) + Number(current.cashLevel || 0),
  };
}

export function getBusinessEffectiveIncomePerMinute(state, business, count = 1) {
  const baseIncome = Number(business?.incomePerMinute || 0);
  const upgrade = getBusinessUpgradeState(state, business?.id);
  const speedMultiplier = Math.pow(1.12, upgrade.speedLevel);
  const cashMultiplier = Math.pow(1.18, upgrade.cashLevel);
  return baseIncome * speedMultiplier * cashMultiplier * Number(count || 0);
}

export function getBusinessUpgradeCost(state, business, path) {
  const safePath = path === "speed" ? "speed" : "cash";
  const upgrade = getBusinessUpgradeState(state, business?.id);
  const level = safePath === "speed" ? upgrade.speedLevel : upgrade.cashLevel;
  return Math.round(Number(business?.cost || 0) * (0.45 + level * 0.2));
}

export function getBusinessUpgradePreview(state, business, count = 1) {
  const currentIncome = getBusinessEffectiveIncomePerMinute(state, business, count);
  const speedCost = getBusinessUpgradeCost(state, business, "speed");
  const cashCost = getBusinessUpgradeCost(state, business, "cash");
  const currentState = getBusinessUpgradeState(state, business.id);
  const speedState = {
    ...state,
    businessUpgrades: {
      ...(state?.businessUpgrades || {}),
      [business.id]: {
        ...currentState,
        speedLevel: currentState.speedLevel + 1,
      },
    },
  };
  const cashState = {
    ...state,
    businessUpgrades: {
      ...(state?.businessUpgrades || {}),
      [business.id]: {
        ...currentState,
        cashLevel: currentState.cashLevel + 1,
      },
    },
  };

  return {
    currentIncome,
    speedCost,
    cashCost,
    nextSpeedIncome: getBusinessEffectiveIncomePerMinute(speedState, business, count),
    nextCashIncome: getBusinessEffectiveIncomePerMinute(cashState, business, count),
  };
}

export function getBusinessIncomePerMinute(state, businesses = BUSINESSES) {
  const safeBusinesses = Array.isArray(businesses) ? businesses : [];
  const ownedBusinesses = Array.isArray(state?.businessesOwned) ? state.businessesOwned : [];

  return ownedBusinesses.reduce((sum, owned) => {
    const business = safeBusinesses.find((entry) => entry.id === owned.id);
    return sum + (business ? getBusinessEffectiveIncomePerMinute(state, business, Number(owned.count || 0)) : 0);
  }, 0);
}

export function getDrugPoliceProfile(drug) {
  const safeDrug = drug || {};
  const risk = clamp(
    0.04 +
      Number(safeDrug.unlockRespect || 0) * 0.0045 +
      Number(safeDrug.streetPrice || 0) / 9000 +
      Number(safeDrug.overdoseRisk || 0) * 0.28,
    0.05,
    0.48
  );
  const heatGain = Math.max(
    1,
    Math.round(Number(safeDrug.unlockRespect || 0) / 10 + Number(safeDrug.streetPrice || 0) / 1200)
  );
  const label = risk >= 0.32 ? "Bardzo goraco" : risk >= 0.2 ? "Srednie ryzyko" : "Raczej cicho";

  return { risk, heatGain, label };
}

export function getFactoryRisk(factory) {
  const safeFactory = factory || {};
  return Math.max(
    0,
    ...(safeFactory.unlocks || []).map((drugId) => getDrugPoliceProfile(DRUGS.find((entry) => entry.id === drugId)).risk)
  );
}

export function getDrugProductionRespectRequirement(drug) {
  const safeDrug = drug || {};
  const factory = findFactoryById(safeDrug.factoryId);
  if (factory) {
    return Math.max(0, Math.floor(Number(factory.respect || 0)));
  }
  return Math.max(0, Math.floor(Number(safeDrug.unlockRespect || 0)));
}

export function getDrugBatchSupplyCost(drug, suppliers = SUPPLIERS) {
  const supplierPrices = Object.fromEntries((Array.isArray(suppliers) ? suppliers : SUPPLIERS).map((entry) => [entry.id, Number(entry.price || 0)]));
  return Object.entries(drug?.supplies || {}).reduce(
    (sum, [supplyId, amount]) => sum + Number(amount || 0) * Number(supplierPrices[supplyId] || 0),
    0
  );
}
