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
  getOperationUnlockReasons,
  getOperationChoiceLock,
  getOperationComplication,
  getOperationComplicationOptions,
  isMajorOperation,
  OPERATION_PHASES,
  OPERATION_COOLDOWN_MS,
} from "../../../shared/operations.js";
import { getGangProjectEffects } from "../../../shared/gangProjects.js";
import { getDistrictModifierSummary } from "../../../shared/districts.js";
import { applyCriticalCareDamage, assertPlayerNotInCriticalCare } from "./criticalCareService.js";
import { getCityEventAt, getCityEventEffects } from "../../../shared/cityDirector.js";
import { getRivalOperationModifier, maybeCreateRivalFromOperation } from "../../../shared/rivals.js";

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
  assertPlayerNotInCriticalCare(player, "Operacje", now);
  const operation = getOperationById(operationId);
  if (!operation) {
    fail("Nie ma takiej operacji.");
  }
  const locks = getOperationUnlockReasons(operation, player, now);
  if (locks.length) fail(locks.join(" · "));
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
  const cityEvent = getCityEventAt(now);
  const cityEventEffects = getCityEventEffects(cityEvent, operation.districtId, player?.contacts?.classId);
  const rivalModifier = getRivalOperationModifier(player, operation.districtId, now);
  const focusDiscount =
    player?.gang?.focusDistrictId === operation.districtId ? 1 - Math.min(0.12, Number(gangEffects.influenceGain || 0)) : 1;
  const prepCost = Math.max(
    0,
    Math.round(
      Number(operation.prepCost || 0) *
        Number(district.pressureState.prepCostMultiplier || 1) *
        focusDiscount *
        Number(cityEventEffects?.operationPrep || 1) *
        Number(rivalModifier.prepMultiplier || 1)
    )
  );
  if (Number(player?.profile?.cash || 0) < prepCost) {
    fail(`Brakuje ${prepCost}$ na przygotowanie ${operation.name}.`);
  }

  player.profile.cash = Number(player.profile.cash || 0) - prepCost;
  player.operations.active = {
    ...createActiveOperation(operation, now),
    prepSpent: prepCost,
    classIdSnapshot: player?.contacts?.classId || null,
    gangSnapshot: player?.gang?.joined ? { name: player.gang.name || null, joined: true, focusDistrictId: player.gang.focusDistrictId || null } : null,
    gangEffectsSnapshot: { ...gangEffects },
    cityEventSnapshot: cityEventEffects ? { key: cityEvent.key, effects: { ...cityEventEffects } } : null,
    rivalModifierSnapshot: { ...rivalModifier },
  };

  return {
    operationId: operation.id,
    prepCost,
    districtId: operation.districtId,
    cityEventKey: cityEventEffects ? cityEvent.key : null,
    logMessage: `Operacja ${operation.name} rusza. Najpierw zbierz plan.`,
  };
}

export function advanceOperationForPlayer(player, choiceId, now = Date.now()) {
  ensurePlayerOperationState(player);
  assertPlayerNotInCriticalCare(player, "Operacje", now);
  if (!player.operations.active) {
    fail("Nie masz aktywnej operacji.");
  }
  assertPlanUsable(player, now);

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
  const choiceLock = getOperationChoiceLock(choice, player);
  if (choiceLock) fail(choiceLock);
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

export function executeOperationForPlayer(player, now = Date.now(), random = Math.random) {
  ensurePlayerOperationState(player);
  assertPlayerNotInCriticalCare(player, "Operacje", now);
  const active = player.operations.active;
  if (!active) {
    fail("Nie masz aktywnej operacji.");
  }
  assertPlanUsable(player, now);
  if (active.phase === OPERATION_PHASES.COMPLICATION) {
    fail("Komplikacja już trwa. Wybierz sposób wyjścia zamiast ponownie uruchamiać finał.");
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
  const basePreview = getOperationOutcomePreview({
    operation,
    activeOperation: active,
    player: player?.profile || {},
    districtPressure: district.pressure,
    districtInfluence: district.influence,
    gangEffects: active.gangEffectsSnapshot || {},
  });
  const cityEventEffects = active.cityEventSnapshot?.effects || null;
  const preview = cityEventEffects ? {
    ...basePreview,
    successChance: Math.max(0.12, Math.min(0.92, Number(basePreview.successChance || 0) + Number(cityEventEffects.operationSuccess || 0))),
    rewardMultiplier: Number(basePreview.rewardMultiplier || 1) * Number(cityEventEffects.operationReward || 1),
    heatGain: Math.max(0, Number(basePreview.heatGain || 0) + Number(cityEventEffects.operationHeat || 0)),
  } : basePreview;
  preview.successChance = Math.max(0.12, Math.min(0.92, Number(preview.successChance || 0) + Number(active.rivalModifierSnapshot?.successDelta || 0)));
  preview.heatGain = Math.max(0, Number(preview.heatGain || 0) + Number(active.rivalModifierSnapshot?.heatDelta || 0));

  if (isMajorOperation(operation)) {
    player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - Number(operation.energyCost || 0));
    player.operations.active = {
      ...active,
      phase: OPERATION_PHASES.COMPLICATION,
      energySpent: true,
      updatedAt: now,
      complication: { ...getOperationComplication(operation, active.id), startedAt: now, preview },
    };
    return {
      pendingComplication: true,
      districtId: active.districtId,
      complication: player.operations.active.complication,
      logMessage: `${operation.name}: wejście wykonane, ale plan zderza się z komplikacją „${player.operations.active.complication.title}”. Wybierz sposób wyjścia.`,
    };
  }

  const success = random() < Number(preview?.successChance || 0.2);
  const progress = player.operations.progress[operation.id];
  const firstClear = success && !progress.wins;
  progress.cooldownUntil = now + OPERATION_COOLDOWN_MS;
  player.stats ||= {};
  player.profile.energy = Math.max(0, Number(player.profile.energy || 0) - Number(operation.energyCost || 0));

  if (success) {
    const rawReward = Math.floor(random() * (operation.baseReward[1] - operation.baseReward[0] + 1)) + operation.baseReward[0];
    const reward = Math.max(0, Math.floor(rawReward * Number(preview.rewardMultiplier || 1)));
    const progression = applyXpProgression(
      { respect: Number(player.profile?.respect || 0), xp: Number(player.profile?.xp || 0) },
      Number(operation.xpGain || 0) * (firstClear ? 3 : 1)
    );

    player.profile.cash = Number(player.profile.cash || 0) + reward;
    player.profile.heat = Math.min(100, Number(player.profile.heat || 0) + Number(preview.heatGain || 0));
    player.profile.respect = progression.respect;
    player.profile.xp = progression.xp;
    player.profile.level = progression.respect;
    player.stats.totalEarned = Number(player.stats?.totalEarned || 0) + reward;
    player.stats.operationsCompleted = Math.max(0, Number(player.stats?.operationsCompleted || 0)) + 1;
    progress.wins += 1;
    player.operations.history = [
      {
        id: active.id,
        operationId: operation.id,
        districtId: active.districtId,
        success: true,
        reward,
        prepSpent: active.prepSpent,
        net: reward - active.prepSpent,
        firstClear,
        time: now,
      },
      ...(player.operations.history || []),
    ].slice(0, 6);
    player.operations.active = null;

    return {
      success: true,
      reward,
      xpGain: Number(operation.xpGain || 0) * (firstClear ? 3 : 1),
      firstClear,
      net: reward - active.prepSpent,
      heatGain: Number(preview.heatGain || 0),
      districtId: active.districtId,
      cityEventKey: active.cityEventSnapshot?.key || null,
      logMessage: `${operation.name}: łup ${reward}$, zysk po przygotowaniach ${reward - active.prepSpent}$.${firstClear ? " Pierwsze ukończenie: potrójne XP i trwały postęp do kolejnych celów." : ""}`,
    };
  }

  const loss = Math.min(Number(player.profile.cash || 0), preview.failureLoss);
  const damage = randomBetween(operation.hpLoss[0], operation.hpLoss[1]);
  const jailed =
    Number(preview?.leakChance || 0) > 0.42 &&
    random() < Math.min(0.36, Number(preview?.leakChance || 0) * 0.58);
  const jailSeconds = jailed ? randomBetween(120, 260) : 0;

  player.profile.cash = Math.max(0, Number(player.profile.cash || 0) - loss);
  const damageState = applyCriticalCareDamage(player, damage, {
    now,
    source: `spalonej operacji ${operation.name}`,
    allowCriticalCare: true,
    minimumHp: 0,
  });
  player.profile.heat = Math.min(100, Number(player.profile.heat || 0) + Number(preview?.heatGain || 0) + 3);
  const finalJailed = jailed && !damageState.criticalCareTriggered;
  if (finalJailed) {
    player.profile.jailUntil = Math.max(Number(player.profile.jailUntil || 0), now + jailSeconds * 1000);
  }
  player.operations.history = [
    {
      id: active.id,
      operationId: operation.id,
      districtId: active.districtId,
      success: false,
      loss,
      prepSpent: active.prepSpent,
      net: -loss - active.prepSpent,
      damage,
      jailed: finalJailed,
      jailSeconds: finalJailed ? jailSeconds : 0,
      time: now,
    },
    ...(player.operations.history || []),
  ].slice(0, 6);
  player.operations.active = null;

  return {
    success: false,
    loss,
    damage,
    criticalCareTriggered: damageState.criticalCareTriggered,
    jailed: finalJailed,
    jailSeconds: finalJailed ? jailSeconds : 0,
    heatGain: Number(preview?.heatGain || 0) + 3,
    districtId: active.districtId,
    cityEventKey: active.cityEventSnapshot?.key || null,
    logMessage: damageState.criticalCareTriggered
      ? `${operation.name} sie pali. Tracisz ${loss}$ i ladujesz na intensywnej terapii.`
      : finalJailed
      ? `${operation.name} sie pali. Tracisz ${loss}$, ${damage} HP i siadasz na chwile.`
      : `${operation.name} siada bokiem. Tracisz ${loss}$ i ${damage} HP.`,
  };
}

export function resolveOperationComplicationForPlayer(player, responseId, now = Date.now(), random = Math.random) {
  ensurePlayerOperationState(player);
  assertPlayerNotInCriticalCare(player, "Operacje", now);
  const active = player.operations.active;
  if (!active || active.phase !== OPERATION_PHASES.COMPLICATION || !active.complication?.preview) {
    fail("Nie masz aktywnej komplikacji do rozwiązania.");
  }
  assertPlanUsable(player, now);
  const operation = getOperationById(active.operationId);
  if (!operation || !isMajorOperation(operation)) fail("Aktywna operacja jest uszkodzona.");
  const response = getOperationComplicationOptions(active, player).find((entry) => entry.id === responseId);
  if (!response) fail("Nie ma takiego sposobu wyjścia.");
  if (response.reasons?.length) fail(response.reasons.join(" · "));

  const profile = player.profile;
  profile.cash = Math.max(0, Number(profile.cash || 0) - Number(response.cashCost || 0));
  profile.bank = Math.max(0, Number(profile.bank || 0) - Number(response.bankCost || 0));
  profile.energy = Math.max(0, Number(profile.energy || 0) - Number(response.energyCost || 0));
  if (response.hpCost) profile.hp = Math.max(1, Number(profile.hp || 0) - Number(response.hpCost));
  if (response.goods) player.inventory[response.goods] -= response.quantity;
  if (response.producedGoods) player.producedDrugInventory[response.producedGoods] -= response.quantity;
  if (response.trustCost) {
    const relation = player.contacts.stories.relations[operation.districtId];
    relation.trust = Math.max(0, Number(relation.trust || 0) - response.trustCost);
  }

  const progress = player.operations.progress[operation.id];
  progress.cooldownUntil = now + OPERATION_COOLDOWN_MS;
  if (response.retreat) {
    const refund = Math.max(0, Math.floor(Number(operation.prepCost || 0) * Number(response.refundRate || 0)));
    profile.cash = Number(profile.cash || 0) + refund;
    player.operations.history = [{ id: active.id, operationId: operation.id, districtId: active.districtId, outcome: "retreat", success: false, reward: refund, prepSpent: active.prepSpent, net: refund - active.prepSpent, time: now }, ...(player.operations.history || [])].slice(0, 6);
    player.operations.active = null;
    return { success: false, outcome: "retreat", refund, districtId: active.districtId, logMessage: `${operation.name}: taktyczny odwrót. Ratujesz ekipę i odzyskujesz ${refund}$, ale operacja nie daje postępu.` };
  }

  const base = active.complication.preview;
  const preview = {
    ...base,
    successChance: Math.max(0.12, Math.min(0.94, Number(base.successChance || 0) + Number(response.successDelta || 0))),
    leakChance: Math.max(0.04, Math.min(0.82, Number(base.leakChance || 0) + Number(response.leakDelta || 0))),
    rewardMultiplier: Math.max(0.65, Math.min(1.45, Number(base.rewardMultiplier || 1) + Number(response.rewardDelta || 0))),
    heatGain: Math.max(0, Number(base.heatGain || 0) + Number(response.heatDelta || 0)),
  };
  const roll = random();
  const success = roll < preview.successChance;
  const partial = !success && roll < Math.min(0.9, preview.successChance + Math.max(0.12, 0.22 - preview.leakChance * 0.1));
  const firstClear = success && !progress.wins;
  player.stats ||= {};

  if (success || partial) {
    const rawReward = Math.floor(random() * (operation.baseReward[1] - operation.baseReward[0] + 1)) + operation.baseReward[0];
    const partialMultiplier = partial ? 0.42 : 1;
    const reward = Math.max(0, Math.floor(rawReward * preview.rewardMultiplier * partialMultiplier));
    const xpGain = partial ? Math.max(1, Math.floor(operation.xpGain * 0.45)) : operation.xpGain * (firstClear ? 3 : 1);
    const progression = applyXpProgression({ respect: Number(profile.respect || 0), xp: Number(profile.xp || 0) }, xpGain);
    const damage = partial ? Math.max(4, Math.floor((operation.hpLoss[0] + operation.hpLoss[1]) * 0.22)) : 0;
    profile.cash = Number(profile.cash || 0) + reward;
    profile.heat = Math.min(100, Number(profile.heat || 0) + preview.heatGain + (partial ? 3 : 0));
    profile.respect = progression.respect; profile.level = progression.respect; profile.xp = progression.xp;
    if (damage) applyCriticalCareDamage(player, damage, { now, source: `częściowo udanej operacji ${operation.name}`, allowCriticalCare: true, minimumHp: 0 });
    player.stats.totalEarned = Number(player.stats.totalEarned || 0) + reward;
    if (success) { player.stats.operationsCompleted = Number(player.stats.operationsCompleted || 0) + 1; progress.wins += 1; }
    else player.stats.operationsPartial = Number(player.stats.operationsPartial || 0) + 1;
    const outcome = partial ? "partial" : "success";
    player.operations.history = [{ id: active.id, operationId: operation.id, districtId: active.districtId, outcome, success, reward, prepSpent: active.prepSpent, responseId: response.id, net: reward - active.prepSpent - Number(response.cashCost || 0) - Number(response.bankCost || 0), firstClear, damage, time: now }, ...(player.operations.history || [])].slice(0, 6);
    player.operations.active = null;
    const rivalCreated = maybeCreateRivalFromOperation(player, { active, operation, responseId: response.id, outcome, eventKey: active.cityEventSnapshot?.key || null }, now);
    return { success, partial, outcome, reward, xpGain, firstClear, damage, heatGain: preview.heatGain + (partial ? 3 : 0), districtId: active.districtId, rivalCreated: rivalCreated ? { id: rivalCreated.id, rivalId: rivalCreated.rivalId } : null, logMessage: (partial ? `${operation.name}: część łupu uratowana (${reward}$), ale cel pozostaje nieukończony. Tracisz ${damage} HP i zbierasz ślad.` : `${operation.name}: pełny sukces, łup ${reward}$.${firstClear ? " Pierwsze ukończenie daje potrójne XP i trwały postęp." : ""}`) + (rivalCreated ? " Ktoś z dzielnicy zapamiętał ten ruch." : "") };
  }

  const loss = Math.min(Number(profile.cash || 0), Math.max(180, Math.round(Number(base.failureLoss || 0) * (0.82 + preview.leakChance * 0.25))));
  const damage = Math.floor(random() * (operation.hpLoss[1] - operation.hpLoss[0] + 1)) + operation.hpLoss[0];
  const jailed = preview.leakChance > 0.42 && random() < Math.min(0.36, preview.leakChance * 0.58);
  const damageState = applyCriticalCareDamage(player, damage, { now, source: `spalonej operacji ${operation.name}`, allowCriticalCare: true, minimumHp: 0 });
  profile.cash = Math.max(0, Number(profile.cash || 0) - loss);
  profile.heat = Math.min(100, Number(profile.heat || 0) + preview.heatGain + 3);
  const finalJailed = jailed && !damageState.criticalCareTriggered;
  const jailSeconds = finalJailed ? Math.floor(random() * 141) + 120 : 0;
  if (finalJailed) profile.jailUntil = Math.max(Number(profile.jailUntil || 0), now + jailSeconds * 1000);
  player.operations.history = [{ id: active.id, operationId: operation.id, districtId: active.districtId, outcome: "failure", success: false, loss, prepSpent: active.prepSpent, responseId: response.id, net: -loss - active.prepSpent - Number(response.cashCost || 0) - Number(response.bankCost || 0), damage, jailed: finalJailed, jailSeconds, time: now }, ...(player.operations.history || [])].slice(0, 6);
  player.operations.active = null;
  const rivalCreated = maybeCreateRivalFromOperation(player, { active, operation, responseId: response.id, outcome: "failure", eventKey: active.cityEventSnapshot?.key || null }, now);
  return { success: false, partial: false, outcome: "failure", loss, damage, criticalCareTriggered: damageState.criticalCareTriggered, jailed: finalJailed, jailSeconds, heatGain: preview.heatGain + 3, districtId: active.districtId, rivalCreated: rivalCreated ? { id: rivalCreated.id, rivalId: rivalCreated.rivalId } : null, logMessage: (damageState.criticalCareTriggered ? `${operation.name} spalone. Tracisz ${loss}$ i trafiasz na intensywną terapię.` : `${operation.name} spalone. Tracisz ${loss}$ i ${damage} HP.`) + (rivalCreated ? " Lokalna ekipa zapamiętała, kto zostawił ten bałagan." : "") };
}

function assertPlanUsable(player, now) {
  if (Number(player.profile?.jailUntil || 0) > now) fail("Najpierw opuść celę.");
  if (player.operations.active?.expiresAt && player.operations.active.expiresAt <= now) fail("Plan wygasł. Porzuć go, aby przygotować nową operację.");
}

export function cancelOperationForPlayer(player, now = Date.now()) {
  ensurePlayerOperationState(player);
  const active = player.operations.active;
  if (!active) fail("Nie masz aktywnej operacji.");
  player.operations.history = [{ id: active.id, operationId: active.operationId, districtId: active.districtId, cancelled: true, success: false, prepSpent: active.prepSpent, net: -active.prepSpent, time: now }, ...player.operations.history].slice(0, 6);
  player.operations.active = null;
  return { logMessage: `Plan porzucony. Koszt przygotowań ${active.prepSpent}$ nie podlega zwrotowi.` };
}
