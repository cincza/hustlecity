import { applyXpProgression } from "../../../shared/progression.js";
import {
  advanceActiveOperation,
  canExecuteOperation,
  createActiveOperation,
  createOperationsState,
  getActiveOperationStage,
  getOperationById,
  getOperationChoicesForStage,
  getOperationOutcomePreview,
  normalizeOperationsState,
} from "../../../shared/operations.js";
import { getGangProjectEffects } from "../../../shared/gangProjects.js";
import { getDistrictModifierSummary } from "../../../shared/districts.js";

function fail(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function ensurePlayerOperationState(player) {
  if (!player || typeof player !== "object") {
    fail("Player state is required", 500);
  }
  player.operations = normalizeOperationsState(player.operations || createOperationsState());
}

export function startOperationForPlayer(player, operationId, now = Date.now()) {
  ensurePlayerOperationState(player);
  const operation = getOperationById(operationId);
  if (!operation) {
    fail("Nie ma takiej operacji.");
  }
  if (player.operations.active) {
    fail("Masz juz aktywna operacje.");
  }
  if (Number(player?.profile?.jailUntil || 0) > now) {
    fail("Z celi nie odpalisz operacji.");
  }
  if (Number(player?.profile?.respect || 0) < Number(operation.respect || 0)) {
    fail(`Za niski szacunek. Operacja odpala sie od ${operation.respect}.`);
  }

  const district = getDistrictModifierSummary(player?.city, operation.districtId);
  if (district.pressureState.id === "lockdown") {
    fail(`Ta dzielnica siedzi w lockdownie. Operacja ${operation.name} musi poczekac.`);
  }

  const gangEffects = getGangProjectEffects(player?.gang || {});
  const focusDiscount =
    player?.gang?.focusDistrictId === operation.districtId ? 1 - Math.min(0.12, Number(gangEffects.influenceGain || 0)) : 1;
  const prepCost = Math.max(
    0,
    Math.round(
      Number(operation.prepCost || 0) *
        Number(district.pressureState.prepCostMultiplier || 1) *
        focusDiscount
    )
  );
  if (Number(player?.profile?.cash || 0) < prepCost) {
    fail(`Brakuje ${prepCost}$ na przygotowanie ${operation.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - prepCost;
  player.operations.active = {
    ...createActiveOperation(operation, now),
    prepSpent: prepCost,
  };

  return {
    operationId: operation.id,
    prepCost,
    districtId: operation.districtId,
    logMessage: `Operacja ${operation.name} rusza. Najpierw zbierz plan.`,
  };
}

export function advanceOperationForPlayer(player, choiceId, now = Date.now()) {
  ensurePlayerOperationState(player);
  if (!player.operations.active) {
    fail("Nie masz aktywnej operacji.");
  }

  const operation = getOperationById(player.operations.active.operationId);
  if (!operation) {
    fail("Aktywna operacja jest uszkodzona.");
  }
  const stageId = getActiveOperationStage(player.operations.active);
  if (!stageId) {
    fail("Operacja jest juz gotowa do wykonania.");
  }

  const choice = getOperationChoicesForStage(stageId).find((entry) => entry.id === choiceId);
  if (!choice) {
    fail("Nie ma takiego ruchu na tym etapie.");
  }
  if (Number(player?.profile?.cash || 0) < Number(choice.cashCost || 0)) {
    fail(`Brakuje ${choice.cashCost || 0}$ na ten etap.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - Number(choice.cashCost || 0);
  const advanced = advanceActiveOperation(player.operations.active, choice.id, now);
  if (!advanced) {
    fail("Nie udalo sie zapisac ruchu operacji.");
  }
  player.operations.active = advanced;

  return {
    stageId,
    choiceId: choice.id,
    ready: canExecuteOperation(player.operations.active),
    logMessage: canExecuteOperation(player.operations.active)
      ? `${operation.name} jest gotowa do odpalenia.`
      : `${operation.name}: etap ${choice.label} jest domkniety.`,
  };
}

export function executeOperationForPlayer(player, now = Date.now()) {
  ensurePlayerOperationState(player);
  const active = player.operations.active;
  if (!active) {
    fail("Nie masz aktywnej operacji.");
  }
  if (!canExecuteOperation(active)) {
    fail("Najpierw domknij wszystkie etapy operacji.");
  }

  const operation = getOperationById(active.operationId);
  if (!operation) {
    fail("Aktywna operacja jest uszkodzona.");
  }
  if (Number(player?.profile?.energy || 0) < Number(operation.energyCost || 0)) {
    fail("Za malo energii, zeby dowiezc final.");
  }

  const district = getDistrictModifierSummary(player?.city, active.districtId || operation.districtId);
  const preview = getOperationOutcomePreview({
    operation,
    activeOperation: active,
    player: player?.profile || {},
    districtPressure: district.pressure,
    districtInfluence: district.influence,
    gangEffects: getGangProjectEffects(player?.gang || {}),
  });

  const success = Math.random() < Number(preview?.successChance || 0.2);
  player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - Number(operation.energyCost || 0));

  if (success) {
    const rawReward = randomBetween(operation.baseReward[0], operation.baseReward[1]);
    const reward = Math.max(0, Math.floor(rawReward * Number(preview.rewardMultiplier || 1)));
    const progression = applyXpProgression(
      { respect: Number(player.profile?.respect || 0), xp: Number(player.profile?.xp || 0) },
      Number(operation.xpGain || 0)
    );

    player.profile.cash = Number(player.profile.cash || 0) + reward;
    player.profile.heat = Math.min(100, Number(player.profile.heat || 0) + Number(preview.heatGain || 0));
    player.profile.respect = progression.respect;
    player.profile.xp = progression.xp;
    player.profile.level = progression.respect;
    player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + reward;
    player.operations.history = [
      {
        id: active.id,
        operationId: operation.id,
        districtId: active.districtId,
        success: true,
        reward,
        time: now,
      },
      ...(player.operations.history || []),
    ].slice(0, 6);
    player.operations.active = null;

    return {
      success: true,
      reward,
      xpGain: Number(operation.xpGain || 0),
      heatGain: Number(preview.heatGain || 0),
      districtId: active.districtId,
      logMessage: `${operation.name} siada. Wpada ${reward}$ i dzielnica czuje ruch.`,
    };
  }

  const loss = Math.max(180, Math.round(Number(operation.prepCost || 0) * (0.42 + Number(preview?.leakChance || 0))));
  const damage = randomBetween(operation.hpLoss[0], operation.hpLoss[1]);
  const jailed =
    Number(preview?.leakChance || 0) > 0.42 &&
    Math.random() < Math.min(0.36, Number(preview?.leakChance || 0) * 0.58);
  const jailSeconds = jailed ? randomBetween(120, 260) : 0;

  player.profile.cash = Math.max(0, Number(player.profile.cash || 0) - loss);
  player.profile.hp = Math.max(1, Number(player.profile.hp || 0) - damage);
  player.profile.heat = Math.min(100, Number(player.profile.heat || 0) + Number(preview?.heatGain || 0) + 3);
  if (jailed) {
    player.profile.jailUntil = Math.max(Number(player.profile.jailUntil || 0), now + jailSeconds * 1000);
  }
  player.operations.history = [
    {
      id: active.id,
      operationId: operation.id,
      districtId: active.districtId,
      success: false,
      loss,
      damage,
      jailed,
      jailSeconds,
      time: now,
    },
    ...(player.operations.history || []),
  ].slice(0, 6);
  player.operations.active = null;

  return {
    success: false,
    loss,
    damage,
    jailed,
    jailSeconds,
    heatGain: Number(preview?.heatGain || 0) + 3,
    districtId: active.districtId,
    logMessage: jailed
      ? `${operation.name} sie pali. Tracisz ${loss}$, ${damage} HP i siadasz na chwile.`
      : `${operation.name} siada bokiem. Tracisz ${loss}$ i ${damage} HP.`,
  };
}
