import { getOperationOutcomePreview } from "../../../shared/operations.js";

const formatPercent = (value) => `${Math.round(Number(value || 0) * 100)}%`;

const formatMultiplier = (value) => `x${Number(value || 1).toFixed(2)}`;

const formatSignedPercent = (value) => {
  const percent = Math.round(Math.abs(Number(value || 0)) * 100);
  if (!percent) return "0%";
  return `${value >= 0 ? "+" : "-"}${percent}%`;
};

export function getDistrictEffectLines(districtSummary, { gangEffects = {}, focused = false } = {}) {
  if (!districtSummary?.pressureState) {
    return [];
  }

  const pressureState = districtSummary.pressureState;
  const lines = [
    `Klub: ruch gości ${formatMultiplier(pressureState.trafficMultiplier)}.`,
    `Operacje: przygotowanie ${formatMultiplier(pressureState.prepCostMultiplier)} | przeciek ${formatMultiplier(pressureState.leakMultiplier)} | Heat ${formatMultiplier(pressureState.heistHeatMultiplier)}.`,
  ];

  const modifiers = [];
  if (Number(pressureState.successPenalty || 0) > 0) {
    modifiers.push(`powodzenie ${formatSignedPercent(-pressureState.successPenalty)}`);
  }
  if (focused && Number(gangEffects.influenceGain || 0) > 0) {
    modifiers.push(`front gangu +${Math.round(Number(gangEffects.influenceGain || 0) * 100)}% wpływów`);
  }

  if (modifiers.length) {
    lines.push(`Sytuacja: ${modifiers.join(" | ")}.`);
  }

  return lines;
}

export function getDistrictAlertText(districtSummary) {
  if (!districtSummary?.pressureState) {
    return null;
  }

  switch (districtSummary.pressureState.id) {
    case "lockdown":
      return "Pełna blokada dusi ruch, podbija przecieki i zamyka grubsze roboty.";
    case "crackdown":
      return "Obława podnosi Heat i zostawia brudny ślad po każdej akcji.";
    case "watched":
      return "Dzielnica jest pod okiem. Koszty i ryzyko przecieku zaczynają rosnąć.";
    default:
      return focusedText(districtSummary);
  }
}

function focusedText(districtSummary) {
  return districtSummary?.focused ? "To jest główny front. Tutaj gang najszybciej buduje wspólne wpływy." : null;
}

export function getOperationPreviewDetails({
  operation,
  activeOperation = null,
  player = {},
  districtSummary = null,
  gangEffects = {},
} = {}) {
  if (!operation || !districtSummary) {
    return null;
  }

  const preview = getOperationOutcomePreview({
    operation,
    activeOperation,
    player,
    districtPressure: districtSummary.pressure,
    districtInfluence: districtSummary.influence,
    gangEffects,
  });

  if (!preview) {
    return null;
  }

  return {
    preview,
    lines: [
      `Powodzenie ${formatPercent(preview.successChance)} | Przeciek ${formatPercent(preview.leakChance)}.`,
      `Łup x${Number(preview.rewardMultiplier || 1).toFixed(2)} | Heat +${preview.heatGain}.`,
      districtSummary.pressureState?.id === "lockdown"
        ? "Dzielnica jest całkowicie zablokowana. Ta robota poczeka, aż policyjny nacisk osłabnie."
        : `${districtSummary.name}: ${districtSummary.pressureLabel}, ${districtSummary.bonusLabel.toLowerCase()}.`,
    ],
  };
}

export function getOperationChoiceImpactLines(choice) {
  if (!choice) {
    return [];
  }

  const primary = [];
  if (choice.successDelta) primary.push(`powodzenie ${formatSignedPercent(choice.successDelta)}`);
  if (choice.leakDelta) primary.push(`przeciek ${formatSignedPercent(choice.leakDelta)}`);
  if (choice.retentionDelta) primary.push(`łup ${formatSignedPercent(choice.retentionDelta)}`);

  const secondary = [];
  if (choice.cashCost) secondary.push(`koszt $${Math.round(Number(choice.cashCost || 0))}`);
  if (choice.heatDelta) secondary.push(`Heat ${choice.heatDelta > 0 ? "+" : ""}${choice.heatDelta}`);

  return [
    primary.length ? primary.join(" | ") : "Bez dużej zmiany ryzyka i łupu.",
    secondary.length ? secondary.join(" | ") : choice.summary,
  ];
}

export function getGangEffectLines(gangEffects = {}, focusDistrictSummary = null) {
  const lines = [];

  const clubEffects = [];
  if (gangEffects.clubSecurity) clubEffects.push(`ochrona klubu +${gangEffects.clubSecurity}`);
  if (gangEffects.clubThreatMitigation) clubEffects.push(`zagrożenie ${formatSignedPercent(-gangEffects.clubThreatMitigation)}`);
  if (clubEffects.length) lines.push(`Klub: ${clubEffects.join(" | ")}.`);

  const operationEffects = [];
  if (gangEffects.operationSuccess) operationEffects.push(`powodzenie ${formatSignedPercent(gangEffects.operationSuccess)}`);
  if (gangEffects.operationLeakReduction) operationEffects.push(`przeciek ${formatSignedPercent(-gangEffects.operationLeakReduction)}`);
  if (gangEffects.operationRetention) operationEffects.push(`łup ${formatSignedPercent(gangEffects.operationRetention)}`);
  if (operationEffects.length) lines.push(`Operacje: ${operationEffects.join(" | ")}.`);

  const cityEffects = [];
  if (gangEffects.pressureMitigation) cityEffects.push(`presja ${formatSignedPercent(-gangEffects.pressureMitigation)}`);
  if (gangEffects.influenceGain) cityEffects.push(`wpływy +${Math.round(Number(gangEffects.influenceGain || 0) * 100)}% na głównym froncie`);
  if (focusDistrictSummary?.name) cityEffects.push(`front: ${focusDistrictSummary.name}`);
  if (cityEffects.length) lines.push(`Miasto: ${cityEffects.join(" | ")}.`);

  const recoveryEffects = [];
  if (gangEffects.heatRelief) recoveryEffects.push(`Heat -${gangEffects.heatRelief}`);
  if (gangEffects.hpRelief) recoveryEffects.push(`HP +${gangEffects.hpRelief}`);
  if (recoveryEffects.length) lines.push(`Kryjówka: ${recoveryEffects.join(" | ")}.`);

  return lines;
}

export function getGangProjectLevelLine(project, level = 0) {
  const safeLevel = Math.max(0, Math.floor(Number(level || 0)));
  const current = safeLevel > 0 ? project?.levels?.[safeLevel - 1] : null;
  const next = project?.levels?.[safeLevel] || null;
  const source = current || next;

  if (!source?.effect) {
    return "Brak dalszych poziomów.";
  }

  const parts = [];
  Object.entries(source.effect).forEach(([key, value]) => {
    if (!value) return;
    switch (key) {
      case "clubSecurity":
        parts.push(`ochrona klubu +${value}`);
        break;
      case "clubThreatMitigation":
        parts.push(`zagrożenie ${formatSignedPercent(-value)}`);
        break;
      case "pressureMitigation":
        parts.push(`presja ${formatSignedPercent(-value)}`);
        break;
      case "operationLeakReduction":
        parts.push(`przeciek ${formatSignedPercent(-value)}`);
        break;
      case "operationSuccess":
        parts.push(`powodzenie ${formatSignedPercent(value)}`);
        break;
      case "operationRetention":
        parts.push(`łup ${formatSignedPercent(value)}`);
        break;
      case "heatRelief":
        parts.push(`Heat -${value}`);
        break;
      case "hpRelief":
        parts.push(`HP +${value}`);
        break;
      case "influenceGain":
        parts.push(`wpływy +${Math.round(Number(value || 0) * 100)}%`);
        break;
      default:
        break;
    }
  });

  if (!parts.length) {
    return "Efekt projektu czeka na następny etap.";
  }

  return `${current ? "Aktywnie" : "Następny poziom"}: ${parts.join(" | ")}.`;
}

export function getDrugBatchEconomy(drug, suppliers, getDealerPayout) {
  const supplierPriceById = Object.fromEntries(
    (Array.isArray(suppliers) ? suppliers : []).map((entry) => [entry.id, Number(entry.price || 0)])
  );
  const batchCost = Object.entries(drug?.supplies || {}).reduce(
    (sum, [supplyId, amount]) => sum + Number(amount || 0) * Number(supplierPriceById[supplyId] || 0),
    0
  );
  const dealerPayoutPerUnit = Number(getDealerPayout?.(drug) || 0);
  const dealerCashout = dealerPayoutPerUnit * Number(drug?.batchSize || 0);
  const dealerMargin = dealerCashout - batchCost;
  const estimatedClubGross = Math.max(
    0,
    Math.floor(Number(drug?.streetPrice || 0) * 0.22 * 0.86) * Number(drug?.batchSize || 0)
  );

  let recommendation = "Diler daje pewną gotówkę. Klub potrzebuje ruchu, ale może wycisnąć z towaru więcej.";
  if (estimatedClubGross > dealerCashout * 1.12) {
    recommendation = "Ten towar zarobi więcej podczas klubowej nocy, jeśli lokal ma ruch i nie siedzi pod presją.";
  } else if (dealerMargin <= 0) {
    recommendation = "Szybka sprzedaż prawie nic nie zostawia. Lepiej nie oddawać tej partii dilerowi w ciemno.";
  }

  return {
    batchCost,
    dealerCashout,
    dealerMargin,
    estimatedClubGross,
    recommendation,
  };
}
