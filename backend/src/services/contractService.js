import { applyXpProgression } from "../../../shared/progression.js";
import { clamp, CONTRACT_RULES } from "../../../shared/economy.js";
import {
  canAffordContractAsset,
  CONTRACT_CARS,
  CONTRACT_ITEMS,
  CONTRACT_LOADOUT_SLOTS,
  createContractState,
  getActiveContractBoard,
  getContractById,
  getContractCarById,
  getContractItemById,
  getContractOutcomePreview,
  hasContractAsset,
  normalizeContractHistoryEntry,
  normalizeContractState,
} from "../../../shared/contracts.js";
import { getDistrictModifierSummary } from "../../../shared/districts.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function randomBetween(min, max) {
  const safeMin = Math.floor(Number(min || 0));
  const safeMax = Math.floor(Number(max || 0));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
}

export function ensurePlayerContractState(player) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  player.contracts = normalizeContractState(player.contracts || createContractState());
}

function pushContractHistory(player, entry) {
  player.contracts.history = [normalizeContractHistoryEntry(entry), ...(player.contracts.history || [])]
    .filter(Boolean)
    .slice(0, CONTRACT_RULES.maxHistoryEntries || 10);
}

export function buildContractBoardForPlayer(player, now = Date.now()) {
  ensurePlayerContractState(player);
  const board = getActiveContractBoard(now);
  return {
    ...board,
    history: Array.isArray(player.contracts.history) ? player.contracts.history.slice(0, 6) : [],
  };
}

export function buyContractItemForPlayer(player, itemId) {
  ensurePlayerContractState(player);
  const item = getContractItemById(itemId);
  if (!item) {
    fail("Nie ma takiego itemu.", 404);
  }
  if (hasContractAsset(player.contracts, item.id)) {
    fail("Masz juz ten item.");
  }
  if (Number(player?.profile?.respect || 0) < Number(item.respect || 0)) {
    fail(`Ten item odpala sie od ${item.respect} szacunu.`);
  }
  if (!canAffordContractAsset(player.profile, item)) {
    fail(`Brakuje ${item.price}$ na ${item.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(item.price || 0);
  player.contracts.ownedItems[item.id] = 1;

  return {
    assetType: "item",
    itemId: item.id,
    category: item.category,
    logMessage: `Wpada ${item.name}. Mozesz wrzucic go do loadoutu pod kontrakty.`,
  };
}

export function buyContractCarForPlayer(player, carId) {
  ensurePlayerContractState(player);
  const car = getContractCarById(carId);
  if (!car) {
    fail("Nie ma takiego auta.", 404);
  }
  if (hasContractAsset(player.contracts, car.id, "car")) {
    fail("To auto juz siedzi w Twoim garazu.");
  }
  if (Number(player?.profile?.respect || 0) < Number(car.respect || 0)) {
    fail(`To auto odpala sie od ${car.respect} szacunu.`);
  }
  if (!canAffordContractAsset(player.profile, car)) {
    fail(`Brakuje ${car.price}$ na ${car.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(car.price || 0);
  player.contracts.ownedCars[car.id] = 1;

  return {
    assetType: "car",
    carId: car.id,
    logMessage: `Garaz lapie ${car.name}. Auto jest gotowe pod kontrakty.`,
  };
}

export function equipContractLoadoutForPlayer(player, slotId, assetId = null) {
  ensurePlayerContractState(player);
  const slot = CONTRACT_LOADOUT_SLOTS.find((entry) => entry.id === slotId);
  if (!slot) {
    fail("Nie ma takiego slotu loadoutu.", 404);
  }

  if (!assetId) {
    player.contracts.loadout[slot.id] = null;
    return {
      slotId: slot.id,
      equippedId: null,
      logMessage: `${slot.label} schodzi z loadoutu.`,
    };
  }

  if (slot.id === "car") {
    const car = getContractCarById(assetId);
    if (!car) {
      fail("Nie ma takiego auta.", 404);
    }
    if (!hasContractAsset(player.contracts, car.id, "car")) {
      fail(`Najpierw kup ${car.name}.`);
    }
    player.contracts.loadout.car = car.id;
    return {
      slotId: "car",
      equippedId: car.id,
      logMessage: `${car.name} wskakuje do loadoutu kontraktowego.`,
    };
  }

  const item = getContractItemById(assetId);
  if (!item) {
    fail("Nie ma takiego itemu.", 404);
  }
  if (item.category !== slot.id) {
    fail(`To nie pasuje do slotu ${slot.label}.`);
  }
  if (!hasContractAsset(player.contracts, item.id)) {
    fail(`Najpierw kup ${item.name}.`);
  }

  player.contracts.loadout[slot.id] = item.id;
  return {
    slotId: slot.id,
    equippedId: item.id,
    logMessage: `${item.name} siedzi teraz w slocie ${slot.label}.`,
  };
}

export function executeContractForPlayer(player, contractId, now = Date.now()) {
  ensurePlayerContractState(player);
  const contract = getContractById(contractId);
  if (!contract) {
    fail("Nie ma takiego kontraktu.", 404);
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie odpalisz kontraktu.");
  }
  if (Number(player?.profile?.respect || 0) < Number(contract.respect || 0)) {
    fail(`Kontrakt ${contract.name} odpala sie od ${contract.respect} szacunu.`);
  }

  const board = getActiveContractBoard(now);
  if (!board.active.some((entry) => entry.id === contract.id)) {
    fail("Ten kontrakt wypadl juz z tablicy. Poczekaj na kolejna rotacje.");
  }
  if (Number(player?.profile?.energy || 0) < Number(contract.energyCost || 0)) {
    fail(`Na ${contract.name} potrzebujesz ${contract.energyCost} energii.`);
  }
  if (Number(player?.profile?.cash || 0) < Number(contract.entryCost || 0)) {
    fail(`Brakuje ${contract.entryCost}$ na przygotowanie kontraktu.`);
  }

  const districtSummary = getDistrictModifierSummary(player?.city, contract.districtId);
  if (String(districtSummary?.pressureState?.id || "") === "lockdown") {
    fail(`Ta dzielnica siedzi w lockdownie. ${contract.name} musi poczekac.`);
  }

  const preview = getContractOutcomePreview({
    contract,
    profile: player.profile,
    contractState: player.contracts,
    districtSummary,
  });
  if (!preview) {
    fail("Nie udalo sie zlozyc podgladu kontraktu.", 500);
  }

  const success = Math.random() < Number(preview.successChance || CONTRACT_RULES.minSuccessChance || 0.06);
  const baseReward = randomBetween(contract.baseReward[0], contract.baseReward[1]);
  const reward = Math.max(0, Math.floor(baseReward * Number(preview.rewardMultiplier || 1)));
  const entryCost = Number(contract.entryCost || 0);
  player.profile.cash = Math.max(0, Number(player.profile.cash || 0) - entryCost);
  player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - Number(contract.energyCost || 0));

  if (success) {
    const progression = applyXpProgression(
      { respect: Number(player.profile?.respect || 0), xp: Number(player.profile?.xp || 0) },
      Number(contract.xpGain || 0)
    );
    player.profile.cash = Number(player.profile.cash || 0) + reward;
    player.profile.heat = clamp(Number(player.profile.heat || 0) + Number(preview.heatGain || 0), 0, 100);
    player.profile.respect = progression.respect;
    player.profile.xp = progression.xp;
    player.profile.level = progression.respect;
    player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + reward;

    const historyEntry = {
      id: `contract-${contract.id}-${now}`,
      contractId: contract.id,
      name: contract.name,
      success: true,
      reward,
      entryCost,
      damage: 0,
      heatGain: Number(preview.heatGain || 0),
      jailed: false,
      jailSeconds: 0,
      time: now,
    };
    pushContractHistory(player, historyEntry);

    return {
      success: true,
      contractId: contract.id,
      reward,
      xpGain: Number(contract.xpGain || 0),
      preview,
      historyEntry,
      logMessage: `${contract.name} siada. Wpada ${reward}$ po koszcie ${entryCost}$.`,
    };
  }

  const failDamage = Math.max(
    4,
    Math.round(randomBetween(contract.hpLoss[0], contract.hpLoss[1]) * Number(preview.failDamageMultiplier || 1))
  );
  const extraLoss = Math.max(
    0,
    Math.round(
      entryCost *
        Number(CONTRACT_RULES.failExtraCostRate || 0.2) *
        clamp(
          1 - Number(preview.loadout?.protection || 0) * 0.45 - Number(preview.loadout?.retention || 0) * 0.25,
          0.55,
          1.05
        )
    )
  );
  const jailSeconds =
    Math.random() < Number(preview.jailChanceOnFail || 0.1) ? randomBetween(180, 420) : 0;

  player.profile.cash = Math.max(0, Number(player.profile.cash || 0) - extraLoss);
  player.profile.hp = clamp(
    Number(player.profile.hp || 0) - failDamage,
    1,
    Number(player.profile.maxHp || 100)
  );
  player.profile.heat = clamp(Number(player.profile.heat || 0) + Number(preview.heatGain || 0) + 4, 0, 100);
  if (jailSeconds > 0) {
    player.profile.jailUntil = Math.max(Number(player.profile.jailUntil || 0), now + jailSeconds * 1000);
  }

  const historyEntry = {
    id: `contract-${contract.id}-${now}`,
    contractId: contract.id,
    name: contract.name,
    success: false,
    reward: 0,
    entryCost: entryCost + extraLoss,
    damage: failDamage,
    heatGain: Number(preview.heatGain || 0) + 4,
    jailed: jailSeconds > 0,
    jailSeconds,
    time: now,
  };
  pushContractHistory(player, historyEntry);

  return {
    success: false,
    contractId: contract.id,
    preview,
    extraLoss,
    damage: failDamage,
    jailed: jailSeconds > 0,
    jailSeconds,
    historyEntry,
    logMessage:
      jailSeconds > 0
        ? `${contract.name} sie pali. Palisz ${entryCost + extraLoss}$, tracisz ${failDamage} HP i wpadasz do celi.`
        : `${contract.name} sie pali. Palisz ${entryCost + extraLoss}$ i wracasz z ${failDamage} HP straty.`,
  };
}
