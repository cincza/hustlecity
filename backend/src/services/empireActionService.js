import { applyXpProgression } from "../../../shared/progression.js";
import { ECONOMY_RULES, clamp, getFactorySlotLimit } from "../config/economy.js";
import {
  BUSINESSES,
  FACTORIES,
  SUPPLIERS,
  canBuyFactorySlot,
  createBusinessCollections,
  findBusinessById,
  findFactoryById,
  findSupplyById,
  getBusinessIncomePerMinute,
  getBusinessUpgradeCost,
  getDrugProductionRespectRequirement,
  getDrugPoliceProfile,
  normalizeBusinessCollections,
  normalizeBusinessUpgrades,
  normalizeBusinessesOwned,
  normalizeFactoriesOwned,
  normalizeSupplies,
} from "../../../shared/empire.js";
import { getDistrictModifierSummary, getFactoryDistrictId } from "../../../shared/districts.js";
import { ESCORTS, createDrugCounterMap, findDrugById } from "../../../shared/socialGameplay.js";
import {
  findStreetDistrictById,
  getEscortDistrictCount,
  getEscortIncomePerMinute,
  getEscortReserveCount,
  getEscortRoutes,
  getEscortWorkingCount,
  normalizeEscortsOwned,
} from "../../../shared/street.js";
import { getTaskStateById } from "../../../shared/tasks.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function ensureStatsShape(player) {
  if (!player.stats || typeof player.stats !== "object" || Array.isArray(player.stats)) {
    player.stats = {};
  }
  player.stats.heistsDone = Math.max(0, Math.floor(Number(player.stats.heistsDone || 0)));
  player.stats.totalEarned = Math.max(0, Math.floor(Number(player.stats.totalEarned || 0)));
  player.stats.drugBatches = Math.max(0, Math.floor(Number(player.stats.drugBatches || 0)));
}

function buildTaskSnapshot(player) {
  return {
    player: player?.profile || {},
    stats: player?.stats || {},
    gang: player?.gang || {},
    club: player?.club || {},
    city: player?.city || {},
    contracts: player?.contracts || {},
    businessesOwned: player?.businessesOwned || [],
    factoriesOwned: player?.factoriesOwned || {},
    tasksClaimed: player?.tasksClaimed || [],
  };
}

export function ensurePlayerEmpireState(player) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }

  ensureStatsShape(player);
  player.escortsOwned = normalizeEscortsOwned(player.escortsOwned);
  player.businessesOwned = normalizeBusinessesOwned(player.businessesOwned);
  player.businessUpgrades = normalizeBusinessUpgrades(player.businessUpgrades);
  player.factoriesOwned = normalizeFactoriesOwned(player.factoriesOwned);
  player.supplies = normalizeSupplies(player.supplies);
  player.tasksClaimed = Array.isArray(player.tasksClaimed)
    ? [...new Set(player.tasksClaimed.filter((taskId) => typeof taskId === "string"))]
    : [];
  player.collections = normalizeBusinessCollections(player.collections || createBusinessCollections());
}

export function syncBusinessCollections(player, now = Date.now()) {
  ensurePlayerEmpireState(player);
  const perMinute = getBusinessIncomePerMinute(player, BUSINESSES);
  const lastAccruedAt = Number(player.collections.businessAccruedAt || now);
  const elapsedMs = Math.max(0, now - lastAccruedAt);

  if (elapsedMs <= 0) {
    player.collections.businessAccruedAt = now;
    return {
      perMinute,
      cap: perMinute * ECONOMY_RULES.energy.passiveClaimCapMinutes,
    };
  }

  if (perMinute > 0) {
    const cap = perMinute * ECONOMY_RULES.energy.passiveClaimCapMinutes;
    player.collections.businessCash = Math.min(
      Number(player.collections.businessCash || 0) + perMinute * (elapsedMs / 60000),
      cap
    );
  }

  player.collections.businessAccruedAt = now;
  return {
    perMinute,
    cap: perMinute * ECONOMY_RULES.energy.passiveClaimCapMinutes,
  };
}

export function syncEscortCollections(player, now = Date.now()) {
  ensurePlayerEmpireState(player);
  const perMinute = getEscortIncomePerMinute(player);
  const lastAccruedAt = Number(player.collections.escortAccruedAt || now);
  const elapsedMs = Math.max(0, now - lastAccruedAt);

  if (elapsedMs <= 0) {
    player.collections.escortAccruedAt = now;
    return {
      perMinute,
      cap: perMinute * ECONOMY_RULES.energy.passiveClaimCapMinutes,
    };
  }

  if (perMinute > 0) {
    const cap = perMinute * ECONOMY_RULES.energy.passiveClaimCapMinutes;
    player.collections.escortCash = Math.min(
      Number(player.collections.escortCash || 0) + perMinute * (elapsedMs / 60000),
      cap
    );
  }

  player.collections.escortAccruedAt = now;
  return {
    perMinute,
    cap: perMinute * ECONOMY_RULES.energy.passiveClaimCapMinutes,
  };
}

export function claimTaskForPlayer(player, taskId, now = Date.now()) {
  ensurePlayerEmpireState(player);
  const task = getTaskStateById(taskId, buildTaskSnapshot(player), {
    mode: "online_alpha",
    now,
  });

  if (!task) {
    fail("Nie ma takiej misji.");
  }
  if (task.onlineDisabled) {
    fail(task.disabledReason || "Ta misja nie jest jeszcze gotowa w online.");
  }
  if (task.claimed) {
    fail("Nagroda za te misje jest juz odebrana.");
  }
  if (!task.completed) {
    fail("Ta misja nie jest jeszcze gotowa do odbioru.");
  }

  const progression = applyXpProgression(
    { respect: Number(player.profile?.respect || 0), xp: Number(player.profile?.xp || 0) },
    task.rewardXp
  );

  player.profile.cash = Number(player.profile?.cash || 0) + task.rewardCash;
  player.profile.energy = Math.min(
    Number(player.profile?.maxEnergy || 0),
    Number(player.profile?.energy || 0) + Math.max(0, Number(task.rewardEnergy || 0))
  );
  player.profile.hp = Math.min(
    Number(player.profile?.maxHp || 0),
    Number(player.profile?.hp || 0) + Math.max(0, Number(task.rewardHp || 0))
  );
  player.profile.respect = progression.respect;
  player.profile.xp = progression.xp;
  player.profile.level = progression.respect;
  player.tasksClaimed.push(task.id);
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + task.rewardCash;

  const extraRewards = [];
  if (Number(task.rewardXp || 0) > 0) extraRewards.push(`+${task.rewardXp} XP`);
  if (Number(task.rewardEnergy || 0) > 0) extraRewards.push(`+${task.rewardEnergy} energii`);
  if (Number(task.rewardHp || 0) > 0) extraRewards.push(`+${task.rewardHp} HP`);

  return {
    taskId: task.id,
    rewardCash: task.rewardCash,
    rewardXp: task.rewardXp,
    rewardEnergy: Math.max(0, Number(task.rewardEnergy || 0)),
    rewardHp: Math.max(0, Number(task.rewardHp || 0)),
    logMessage: `Odebrano zadanie: ${task.title}. $${task.rewardCash}${extraRewards.length ? ` i ${extraRewards.join(", ")}` : ""}.`,
  };
}

export function buyBusinessForPlayer(player, businessId, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncBusinessCollections(player, now);

  const business = findBusinessById(businessId);
  if (!business) {
    fail("Nie ma takiego biznesu.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Biznesow nie kupisz zza krat.");
  }
  if (Number(player.profile?.respect || 0) < Number(business.respect || 0)) {
    fail(`Masz za niski szacunek. Wymagany szacunek: ${business.respect}.`);
  }
  if (Number(player.profile?.cash || 0) < Number(business.cost || 0)) {
    fail(`Za malo gotowki na ${business.name}.`);
  }

  const existing = player.businessesOwned.find((entry) => entry.id === business.id);
  if (existing) {
    existing.count += 1;
  } else {
    player.businessesOwned.push({ id: business.id, count: 1 });
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(business.cost || 0);
  player.collections.businessAccruedAt = now;

  return {
    businessId: business.id,
    count: existing ? existing.count : 1,
    logMessage: `Kupiono ${business.name}. Imperium zaczyna drukowac pieniadz.`,
  };
}

export function upgradeBusinessForPlayer(player, businessId, path, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncBusinessCollections(player, now);

  const business = findBusinessById(businessId);
  if (!business) {
    fail("Nie ma takiego biznesu.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Z celi nie zrobisz upgrade'u biznesu.");
  }

  const safePath = path === "speed" ? "speed" : "cash";
  const owned = player.businessesOwned.find((entry) => entry.id === business.id);
  if (!owned?.count) {
    fail("Najpierw musisz miec ten biznes.");
  }

  const cost = getBusinessUpgradeCost(player, business, safePath);
  if (Number(player.profile?.cash || 0) < cost) {
    fail(`Brakuje $${cost} na upgrade ${business.name}.`);
  }

  const current = player.businessUpgrades[business.id] || { speedLevel: 0, cashLevel: 0 };
  player.businessUpgrades[business.id] =
    safePath === "speed"
      ? { speedLevel: Number(current.speedLevel || 0) + 1, cashLevel: Number(current.cashLevel || 0) }
      : { speedLevel: Number(current.speedLevel || 0), cashLevel: Number(current.cashLevel || 0) + 1 };
  player.profile.cash = Number(player.profile.cash || 0) - cost;
  player.collections.businessAccruedAt = now;

  return {
    businessId: business.id,
    path: safePath,
    cost,
    logMessage: `${business.name}: ${safePath === "speed" ? "szybszy obrot" : "grubsza koperta"} wszedl za $${cost}.`,
  };
}

export function collectBusinessIncomeForPlayer(player, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncBusinessCollections(player, now);

  const payout = Math.floor(Number(player.collections?.businessCash || 0));
  if (payout <= 0) {
    fail("Na razie nie ma co zgarnac z biznesow.");
  }

  player.profile.cash = Number(player.profile?.cash || 0) + payout;
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + payout;
  player.stats.businessCollections = Math.max(0, Number(player.stats?.businessCollections || 0)) + 1;
  player.collections.businessCash = 0;
  player.collections.businessCollectedAt = now;
  player.collections.businessAccruedAt = now;

  return {
    payout,
    logMessage: `Zgarnales z biznesow $${payout}. Skrytka znowu jest pusta.`,
  };
}

export function buyFactoryForPlayer(player, factoryId, now = Date.now()) {
  ensurePlayerEmpireState(player);

  const factory = findFactoryById(factoryId);
  if (!factory) {
    fail("Nie ma takiej fabryki.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Fabryk nie kupisz zza krat.");
  }
  if (Number(player.profile?.respect || 0) < Number(factory.respect || 0)) {
    fail(`Masz za niski szacunek. Wymagany szacunek: ${factory.respect}.`);
  }
  if (Number(player.profile?.cash || 0) < Number(factory.cost || 0)) {
    fail(`Brakuje $${factory.cost} na ${factory.name}.`);
  }
  if (Number(player.factoriesOwned?.[factory.id] || 0) > 0) {
    fail(`${factory.name} juz stoi.`);
  }
  if (!canBuyFactorySlot({ respect: Number(player.profile?.respect || 0), factoriesOwned: player.factoriesOwned })) {
    fail(`Masz juz pelny limit fabryk. Obecny limit: ${getFactorySlotLimit(Number(player.profile?.respect || 0))}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(factory.cost || 0);
  player.factoriesOwned[factory.id] = 1;

  return {
    factoryId: factory.id,
    logMessage: `Przejeta produkcja: ${factory.name}.`,
  };
}

export function buyEscortForPlayer(player, escortId, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncEscortCollections(player, now);

  const escort = ESCORTS.find((entry) => entry.id === escortId);
  if (!escort) {
    fail("Nie ma takiego kontaktu.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Kontaktu nie kupisz zza krat.");
  }
  if (Number(player.profile?.respect || 0) < Number(escort.respect || 0)) {
    fail(`Ten kontakt odblokuje sie przy ${escort.respect} szacunku.`);
  }
  if (Number(player.profile?.cash || 0) < Number(escort.cost || 0)) {
    fail(`Za malo gotowki na ${escort.name}.`);
  }

  const owned = player.escortsOwned.find((entry) => entry.id === escort.id);
  if (owned) {
    owned.count += 1;
    owned.working = getEscortWorkingCount(owned);
    owned.routes = { ...getEscortRoutes(owned) };
  } else {
    player.escortsOwned.push({ id: escort.id, count: 1, working: 0, routes: {} });
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(escort.cost || 0);
  player.collections.escortAccruedAt = now;

  return {
    escortId: escort.id,
    logMessage: `Kupiles kontakt: ${escort.name}. Teraz mozesz wystawic ja na ulice.`,
  };
}

export function assignEscortToStreetForPlayer(player, escortId, districtId, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncEscortCollections(player, now);

  const escort = ESCORTS.find((entry) => entry.id === escortId);
  if (!escort) {
    fail("Nie ma takiego kontaktu.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Z celi nikogo nie wystawisz na ulice.");
  }

  const district = findStreetDistrictById(districtId);
  if (!district) {
    fail("Wybierz konkretna dzielnice.");
  }
  if (Number(player.profile?.respect || 0) < Number(district.respect || 0)) {
    fail(`Na ${district.name} potrzebujesz ${district.respect} szacunku.`);
  }
  if (getEscortReserveCount(player, escort.id) <= 0) {
    fail(`Nie masz wolnej sztuki ${escort.name}, zeby wystawic ja na ulice.`);
  }

  player.escortsOwned = player.escortsOwned.map((entry) => {
    if (entry.id !== escort.id) return entry;
    const routes = {
      ...getEscortRoutes(entry),
      [district.id]: getEscortDistrictCount(player, escort.id, district.id) + 1,
    };
    return {
      ...entry,
      routes,
      working: getEscortWorkingCount({ ...entry, routes }),
    };
  });
  player.collections.escortAccruedAt = now;

  return {
    escortId: escort.id,
    districtId: district.id,
    logMessage: `${escort.name} zaczyna robic trase na ${district.name}.`,
  };
}

export function pullEscortFromStreetForPlayer(player, escortId, districtId, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncEscortCollections(player, now);

  const escort = ESCORTS.find((entry) => entry.id === escortId);
  if (!escort) {
    fail("Nie ma takiego kontaktu.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Z celi nikogo nie sciagniesz z ulicy.");
  }

  const district = findStreetDistrictById(districtId);
  if (!district) {
    fail("Wybierz konkretna dzielnice.");
  }
  if (getEscortDistrictCount(player, escort.id, district.id) <= 0) {
    fail(`${escort.name} nie stoi teraz na ${district.name}.`);
  }

  player.escortsOwned = player.escortsOwned.map((entry) => {
    if (entry.id !== escort.id) return entry;
    const routes = {
      ...getEscortRoutes(entry),
      [district.id]: Math.max(0, Number(getEscortRoutes(entry)[district.id] || 0) - 1),
    };
    if (routes[district.id] <= 0) {
      delete routes[district.id];
    }
    return {
      ...entry,
      routes,
      working: getEscortWorkingCount({ ...entry, routes }),
    };
  });
  player.collections.escortAccruedAt = now;

  return {
    escortId: escort.id,
    districtId: district.id,
    logMessage: `${escort.name} schodzi z trasy na ${district.name}.`,
  };
}

export function sellEscortForPlayer(player, escortId, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncEscortCollections(player, now);

  const escort = ESCORTS.find((entry) => entry.id === escortId);
  if (!escort) {
    fail("Nie ma takiego kontaktu.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Kontaktu nie opchniesz zza krat.");
  }
  if (getEscortReserveCount(player, escort.id) <= 0) {
    fail(`Najpierw sciagnij z ulicy wolna sztuke ${escort.name}, zeby ja opchnac.`);
  }

  player.escortsOwned = normalizeEscortsOwned(
    player.escortsOwned
      .map((entry) => {
        if (entry.id !== escort.id) return entry;
        return {
          ...entry,
          count: Math.max(0, Number(entry.count || 0) - 1),
          working: getEscortWorkingCount(entry),
          routes: { ...getEscortRoutes(entry) },
        };
      })
      .filter((entry) => Number(entry.count || 0) > 0)
  );
  player.profile.cash = Number(player.profile?.cash || 0) + Number(escort.sellPrice || 0);
  player.collections.escortAccruedAt = now;

  return {
    escortId: escort.id,
    payout: Number(escort.sellPrice || 0),
    logMessage: `Opchnales ${escort.name} za $${escort.sellPrice}.`,
  };
}

export function collectEscortIncomeForPlayer(player, now = Date.now()) {
  ensurePlayerEmpireState(player);
  syncEscortCollections(player, now);

  const payout = Math.floor(Number(player.collections?.escortCash || 0));
  if (payout <= 0) {
    fail("Na razie ulica nic jeszcze nie oddala.");
  }

  player.profile.cash = Number(player.profile?.cash || 0) + payout;
  player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + payout;
  player.collections.escortCash = 0;
  player.collections.escortCollectedAt = now;
  player.collections.escortAccruedAt = now;

  return {
    payout,
    logMessage: `Odebrales z ulicy $${payout}. Dziewczyny rozliczone.`,
  };
}

export function buyFactorySupplyForPlayer(player, supplyId, quantity = 1, now = Date.now()) {
  ensurePlayerEmpireState(player);
  const supply = findSupplyById(supplyId);
  if (!supply) {
    fail("Nie ma takiego skladnika.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Z celi nie kupisz dostawy.");
  }

  const totalFactoriesOwned = Object.keys(player.factoriesOwned || {}).length;
  if (totalFactoriesOwned <= 0) {
    fail("Najpierw przejmij jakas fabryke.");
  }

  const safeQty = Math.max(1, Math.floor(Number(quantity || 1)));
  const totalCost = Number(supply.price || 0) * safeQty;
  if (Number(player.profile?.cash || 0) < totalCost) {
    fail(`Brakuje gotowki na ${supply.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - totalCost;
  player.supplies[supply.id] = Number(player.supplies?.[supply.id] || 0) + safeQty;

  return {
    supplyId: supply.id,
    quantity: safeQty,
    totalCost,
    logMessage: `Kupiono ${supply.unit}: ${supply.name} x${safeQty}.`,
  };
}

export function produceDrugForPlayer(player, drugId, now = Date.now()) {
  ensurePlayerEmpireState(player);

  const drug = findDrugById(drugId);
  const productionRespectRequirement = getDrugProductionRespectRequirement(drug);
  if (!drug) {
    fail("Nie ma takiego towaru.");
  }
  if (Number(player.profile?.jailUntil || 0) > now) {
    fail("Z celi nie odpalisz produkcji.");
  }
  if (Number(player.factoriesOwned?.[drug.factoryId] || 0) <= 0) {
    fail(`Najpierw musisz miec ${findFactoryById(drug.factoryId)?.name || "wlasciwa fabryke"}.`);
  }
  if (Number(player.profile?.respect || 0) < productionRespectRequirement) {
    fail(`Masz za niski szacunek. Wymagany szacunek: ${productionRespectRequirement}.`);
  }

  for (const [supplyId, amount] of Object.entries(drug.supplies || {})) {
    if (Number(player.supplies?.[supplyId] || 0) < Number(amount || 0)) {
      const supplyName = findSupplyById(supplyId)?.name || supplyId;
      fail(`Brakuje skladnika: ${supplyName}.`);
    }
  }

  const policeProfile = getDrugPoliceProfile(drug);
  const factoryDistrictId = getFactoryDistrictId(drug.factoryId);
  const factoryDistrict = getDistrictModifierSummary(player?.city, factoryDistrictId);
  const focusedFactory = String(player?.gang?.focusDistrictId || "") === factoryDistrictId;
  const bustChance = clamp(
    Number(policeProfile.risk || 0) +
      Number(player.profile?.heat || 0) * 0.0022 -
      Number(player.profile?.dexterity || 0) * 0.003 +
      Math.max(0, Number(factoryDistrict.pressure || 0) - Number(factoryDistrict.basePressure || 0)) * 0.0015 +
      (factoryDistrict.pressureState?.id === "lockdown" ? 0.05 : 0) -
      (focusedFactory ? 0.012 : 0),
    0.03,
    0.52
  );
  const busted = Math.random() < bustChance;
  const jailSeconds =
    busted && Number(drug.unlockRespect || 0) >= 30 && Math.random() < bustChance * 0.42
      ? randomBetween(180, 420)
      : 0;

  for (const [supplyId, amount] of Object.entries(drug.supplies || {})) {
    player.supplies[supplyId] = Math.max(0, Number(player.supplies?.[supplyId] || 0) - Number(amount || 0));
  }

  if (busted) {
    const fine = Math.floor(Number(drug.streetPrice || 0) * (1.05 + Number(policeProfile.risk || 0)));
    player.profile.cash = Math.max(0, Number(player.profile?.cash || 0) - fine);
    player.profile.heat = clamp(
      Number(player.profile?.heat || 0) +
        Math.round((Number(policeProfile.heatGain || 0) + 5) * Number(factoryDistrict.pressureState?.heistHeatMultiplier || 1)),
      0,
      100
    );
    if (jailSeconds > 0) {
      player.profile.jailUntil = now + jailSeconds * 1000;
    }

    return {
      drugId: drug.id,
      busted: true,
      jailSeconds,
      fine,
      logMessage:
        jailSeconds > 0
          ? `Nalot na produkcji ${drug.name} w ${factoryDistrict.name}. Strata $${fine} i cela na ${Math.ceil(jailSeconds / 60)} min.`
          : `Policja weszla na produkcje ${drug.name} w ${factoryDistrict.name}. Strata $${fine} i spalone skladniki.`,
    };
  }

  player.drugInventory = player.drugInventory || {};
  if (!player.producedDrugInventory || typeof player.producedDrugInventory !== "object" || Array.isArray(player.producedDrugInventory)) {
    player.producedDrugInventory = createDrugCounterMap();
  }
  player.drugInventory[drug.id] = Number(player.drugInventory?.[drug.id] || 0) + Number(drug.batchSize || 0);
  player.producedDrugInventory[drug.id] =
    Number(player.producedDrugInventory?.[drug.id] || 0) + Number(drug.batchSize || 0);
  player.profile.heat = clamp(
    Number(player.profile?.heat || 0) +
      Math.max(
        1,
        Math.round(Number(policeProfile.heatGain || 0) * Number(factoryDistrict.pressureState?.heistHeatMultiplier || 1))
      ),
    0,
    100
  );
  player.stats.drugBatches = Number(player.stats?.drugBatches || 0) + 1;

  return {
    drugId: drug.id,
    districtId: factoryDistrict.id,
    districtName: factoryDistrict.name,
    busted: false,
    batchSize: Number(drug.batchSize || 0),
    logMessage: `Wyprodukowano ${drug.batchSize} szt. ${drug.name} pod ${factoryDistrict.name}. Ryzyko: ${policeProfile.label}, dzielnica: ${factoryDistrict.pressureLabel}.`,
  };
}
