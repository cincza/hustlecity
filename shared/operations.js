import { DISTRICTS, getDistrictPressureState } from "./districts.js";

const clampOperationValue = (value, min, max) =>
  Math.min(max, Math.max(min, Number.isFinite(Number(value)) ? Number(value) : min));

export const OPERATION_STAGE_ORDER = ["intel", "approach", "loadout", "crew", "escape"];

export const OPERATION_STAGE_CHOICES = {
  intel: [
    {
      id: "inside-tip",
      label: "Inside Tip",
      summary: "Kontakt z sali daje lepszy odczyt i mniej przeciekow.",
      cashCost: 350,
      successDelta: 0.05,
      leakDelta: -0.08,
    },
    {
      id: "street-look",
      label: "Street Look",
      summary: "Tani rekonesans z ulicy, bez gwarancji czystego wejscia.",
      cashCost: 0,
      successDelta: 0.02,
      leakDelta: 0.02,
    },
  ],
  approach: [
    {
      id: "quiet-entry",
      label: "Quiet Entry",
      summary: "Ciszej, wolniej i z mniejszym przypalem.",
      cashCost: 220,
      successDelta: 0.03,
      leakDelta: -0.04,
      heatDelta: -1,
    },
    {
      id: "hard-push",
      label: "Hard Push",
      summary: "Gruba presja na wejsciu. Szybciej, ale glosniej.",
      cashCost: 120,
      successDelta: 0.05,
      leakDelta: 0.05,
      heatDelta: 1,
    },
  ],
  loadout: [
    {
      id: "burner-kit",
      label: "Burner Kit",
      summary: "Sprzet pod ciche wejscie i spalona logistyke.",
      cashCost: 480,
      successDelta: 0.04,
      leakDelta: -0.04,
      retentionDelta: 0.02,
    },
    {
      id: "heavy-tools",
      label: "Heavy Tools",
      summary: "Wieksza sila wejscia, ale gorszy slad po robocie.",
      cashCost: 520,
      successDelta: 0.06,
      leakDelta: 0.03,
      retentionDelta: -0.01,
    },
  ],
  crew: [
    {
      id: "tight-crew",
      label: "Tight Crew",
      summary: "Mniej ludzi, mniej przeciekow, mniejszy margines bledu.",
      cashCost: 260,
      successDelta: 0.02,
      leakDelta: -0.05,
    },
    {
      id: "full-crew",
      label: "Full Crew",
      summary: "Wieksza sila wykonawcza kosztem wiekszego ruchu.",
      cashCost: 420,
      successDelta: 0.05,
      leakDelta: 0.04,
      retentionDelta: 0.03,
    },
  ],
  escape: [
    {
      id: "burner-sedan",
      label: "Burner Sedan",
      summary: "Niepozorny odjazd i mniejszy slad po wszystkim.",
      cashCost: 300,
      successDelta: 0.02,
      leakDelta: -0.03,
      retentionDelta: 0.02,
    },
    {
      id: "panel-van",
      label: "Panel Van",
      summary: "Lepszy wywoz ladunku, ale trudniej sie schowac.",
      cashCost: 360,
      successDelta: 0.03,
      leakDelta: 0.02,
      retentionDelta: 0.05,
      heatDelta: 1,
    },
  ],
};

export const OPERATION_CATALOG = [
  {
    id: "ledger-pull",
    name: "Ledger Pull",
    districtId: "oldtown",
    respect: 10,
    summary: "Wyciagniecie papierow i kopert z cichszego frontu.",
    prepCost: 900,
    energyCost: 2,
    baseReward: [2600, 3900],
    baseSuccess: 0.53,
    baseLeak: 0.22,
    baseHeat: 8,
    xpGain: 12,
    hpLoss: [8, 14],
  },
  {
    id: "vip-lift",
    name: "VIP Lift",
    districtId: "neon",
    respect: 16,
    summary: "Gruba nocna akcja pod klub, kontakt i szybki skok na stol.",
    prepCost: 1500,
    energyCost: 3,
    baseReward: [4200, 6800],
    baseSuccess: 0.49,
    baseLeak: 0.28,
    baseHeat: 11,
    xpGain: 15,
    hpLoss: [10, 18],
  },
  {
    id: "dock-run",
    name: "Dock Run",
    districtId: "harbor",
    respect: 22,
    summary: "Magazyn, odjazd i ladunek zanim miasto zdazy mrugnac.",
    prepCost: 2600,
    energyCost: 4,
    baseReward: [8200, 12800],
    baseSuccess: 0.44,
    baseLeak: 0.33,
    baseHeat: 15,
    xpGain: 20,
    hpLoss: [14, 24],
  },
];

export function getOperationById(operationId) {
  return OPERATION_CATALOG.find((entry) => entry.id === operationId) || null;
}

export function getOperationChoicesForStage(stageId) {
  return OPERATION_STAGE_CHOICES[stageId] || [];
}

export function createOperationsState(overrides = {}) {
  return {
    active: null,
    history: [],
    ...overrides,
  };
}

export function normalizeOperationsState(value) {
  const base = createOperationsState();
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  return {
    active:
      value.active && typeof value.active === "object" && !Array.isArray(value.active)
        ? {
            id: typeof value.active.id === "string" ? value.active.id : null,
            operationId: typeof value.active.operationId === "string" ? value.active.operationId : null,
            districtId:
              DISTRICTS.find((district) => district.id === value.active.districtId)?.id ||
              getOperationById(value.active.operationId)?.districtId ||
              DISTRICTS[0].id,
            stageIndex: Math.max(0, Math.floor(Number(value.active.stageIndex || 0))),
            choiceIds:
              value.active.choiceIds && typeof value.active.choiceIds === "object" && !Array.isArray(value.active.choiceIds)
                ? { ...value.active.choiceIds }
                : {},
            prepSpent: Math.max(0, Math.floor(Number(value.active.prepSpent || 0))),
            createdAt: Math.max(0, Math.floor(Number(value.active.createdAt || 0))),
            updatedAt: Math.max(0, Math.floor(Number(value.active.updatedAt || 0))),
            expiresAt: Math.max(0, Math.floor(Number(value.active.expiresAt || 0))),
          }
        : null,
    history: Array.isArray(value.history) ? value.history.slice(0, 6) : [],
  };
}

export function createActiveOperation(operation, now = Date.now()) {
  const safeOperation =
    typeof operation === "string" ? getOperationById(operation) : getOperationById(operation?.id);
  if (!safeOperation) return null;

  return {
    id: `op-${safeOperation.id}-${now}`,
    operationId: safeOperation.id,
    districtId: safeOperation.districtId,
    stageIndex: 0,
    choiceIds: {},
    prepSpent: Number(safeOperation.prepCost || 0),
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 90 * 60 * 1000,
  };
}

export function getActiveOperationStage(activeOperation) {
  if (!activeOperation) return null;
  return OPERATION_STAGE_ORDER[Math.max(0, Math.floor(Number(activeOperation.stageIndex || 0)))] || null;
}

export function getOperationPlanEffects(activeOperation) {
  const choiceIds =
    activeOperation?.choiceIds && typeof activeOperation.choiceIds === "object"
      ? activeOperation.choiceIds
      : {};
  const totals = {
    successDelta: 0,
    leakDelta: 0,
    heatDelta: 0,
    retentionDelta: 0,
    extraCashCost: 0,
  };

  OPERATION_STAGE_ORDER.forEach((stageId) => {
    const choice = getOperationChoicesForStage(stageId).find((entry) => entry.id === choiceIds[stageId]);
    if (!choice) return;
    totals.successDelta = Number((totals.successDelta + Number(choice.successDelta || 0)).toFixed(3));
    totals.leakDelta = Number((totals.leakDelta + Number(choice.leakDelta || 0)).toFixed(3));
    totals.heatDelta = Number((totals.heatDelta + Number(choice.heatDelta || 0)).toFixed(3));
    totals.retentionDelta = Number((totals.retentionDelta + Number(choice.retentionDelta || 0)).toFixed(3));
    totals.extraCashCost += Math.max(0, Math.floor(Number(choice.cashCost || 0)));
  });

  return totals;
}

export function advanceActiveOperation(activeOperation, choiceId, now = Date.now()) {
  const safeState = normalizeOperationsState({ active: activeOperation }).active;
  if (!safeState) return null;
  const currentStage = getActiveOperationStage(safeState);
  if (!currentStage) return null;
  const choice = getOperationChoicesForStage(currentStage).find((entry) => entry.id === choiceId);
  if (!choice) return null;

  safeState.choiceIds = {
    ...(safeState.choiceIds || {}),
    [currentStage]: choice.id,
  };
  safeState.stageIndex += 1;
  safeState.updatedAt = now;
  return safeState;
}

export function canExecuteOperation(activeOperation) {
  return Boolean(activeOperation && Number(activeOperation.stageIndex || 0) >= OPERATION_STAGE_ORDER.length);
}

export function getOperationOutcomePreview({
  operation,
  activeOperation,
  player = {},
  districtPressure = 0,
  districtInfluence = 0,
  gangEffects = {},
} = {}) {
  const safeOperation = typeof operation === "string" ? getOperationById(operation) : operation;
  if (!safeOperation) return null;

  const planEffects = getOperationPlanEffects(activeOperation);
  const pressureState = getDistrictPressureState(districtPressure);
  const statScore =
    Number(player.attack || 0) * 0.013 +
    Number(player.defense || 0) * 0.008 +
    Number(player.dexterity || 0) * 0.016 +
    Number(player.charisma || 0) * 0.014;
  const influenceBonus =
    districtInfluence >= 48 ? 0.05 : districtInfluence >= 18 ? 0.025 : 0;

  const successChance = clampOperationValue(
    Number(safeOperation.baseSuccess || 0) +
      statScore +
      Number(planEffects.successDelta || 0) +
      Number(gangEffects.operationSuccess || 0) +
      influenceBonus -
      Number(pressureState.successPenalty || 0),
    0.18,
    0.9
  );
  const leakChance = clampOperationValue(
    Number(safeOperation.baseLeak || 0) +
      Number(planEffects.leakDelta || 0) +
      Number(pressureState.leakMultiplier || 1) * 0.02 -
      Number(gangEffects.operationLeakReduction || 0),
    0.05,
    0.75
  );
  const rewardMultiplier = clampOperationValue(
    1 + Number(planEffects.retentionDelta || 0) + Number(gangEffects.operationRetention || 0),
    0.78,
    1.35
  );
  const heatGain = Math.max(
    1,
    Math.round(
      (Number(safeOperation.baseHeat || 0) + Number(planEffects.heatDelta || 0)) *
        Number(pressureState.heistHeatMultiplier || 1)
    )
  );

  return {
    successChance: Number(successChance.toFixed(3)),
    leakChance: Number(leakChance.toFixed(3)),
    rewardMultiplier: Number(rewardMultiplier.toFixed(3)),
    heatGain,
  };
}
