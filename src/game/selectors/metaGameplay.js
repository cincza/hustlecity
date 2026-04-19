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
    `Klub: ruch ${formatMultiplier(pressureState.trafficMultiplier)}.`,
    `Operacje: prep ${formatMultiplier(pressureState.prepCostMultiplier)} | leak ${formatMultiplier(pressureState.leakMultiplier)} | heat ${formatMultiplier(pressureState.heistHeatMultiplier)}.`,
  ];

  const modifiers = [];
  if (Number(pressureState.successPenalty || 0) > 0) {
    modifiers.push(`wejscie ${formatSignedPercent(-pressureState.successPenalty)}`);
  }
  if (focused && Number(gangEffects.influenceGain || 0) > 0) {
    modifiers.push(`fokus +${Math.round(Number(gangEffects.influenceGain || 0) * 100)}% influence`);
  }

  if (modifiers.length) {
    lines.push(`Meta: ${modifiers.join(" | ")}.`);
  }

  return lines;
}

export function getDistrictAlertText(districtSummary) {
  if (!districtSummary?.pressureState) {
    return null;
  }

  switch (districtSummary.pressureState.id) {
    case "lockdown":
      return "Lockdown dusi ruch, podbija przecieki i zamyka grubsze roboty.";
    case "crackdown":
      return "Crackdown podnosi heat i robi brudny slad po kazdej akcji.";
    case "watched":
      return "Dzielnica jest pod okiem. Koszty i przecieki zaczynaja rosnac.";
    default:
      return focusedText(districtSummary);
  }
}

function focusedText(districtSummary) {
  return districtSummary?.focused ? "To jest aktualny fokus. Tu najlatwiej przepchnac wspolny puls gangu." : null;
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
      `Wejscie ${formatPercent(preview.successChance)} | Przeciek ${formatPercent(preview.leakChance)}.`,
      `Lup x${Number(preview.rewardMultiplier || 1).toFixed(2)} | Heat +${preview.heatGain}.`,
      districtSummary.pressureState?.id === "lockdown"
        ? "Dzielnica siedzi w lockdownie. Tej roboty nie odpalisz, dopoki nie zejdzie presja."
        : `${districtSummary.name}: ${districtSummary.pressureLabel}, ${districtSummary.bonusLabel.toLowerCase()}.`,
    ],
  };
}

export function getOperationChoiceImpactLines(choice) {
  if (!choice) {
    return [];
  }

  const primary = [];
  if (choice.successDelta) primary.push(`wejscie ${formatSignedPercent(choice.successDelta)}`);
  if (choice.leakDelta) primary.push(`przeciek ${formatSignedPercent(choice.leakDelta)}`);
  if (choice.retentionDelta) primary.push(`lup ${formatSignedPercent(choice.retentionDelta)}`);

  const secondary = [];
  if (choice.cashCost) secondary.push(`koszt $${Math.round(Number(choice.cashCost || 0))}`);
  if (choice.heatDelta) secondary.push(`heat ${choice.heatDelta > 0 ? "+" : ""}${choice.heatDelta}`);

  return [
    primary.length ? primary.join(" | ") : "Bez grubego ruchu na liczbach.",
    secondary.length ? secondary.join(" | ") : choice.summary,
  ];
}

export function getGangEffectLines(gangEffects = {}, focusDistrictSummary = null) {
  const lines = [];

  const clubEffects = [];
  if (gangEffects.clubSecurity) clubEffects.push(`ochrona klubu +${gangEffects.clubSecurity}`);
  if (gangEffects.clubThreatMitigation) clubEffects.push(`zagrozenie ${formatSignedPercent(-gangEffects.clubThreatMitigation)}`);
  if (clubEffects.length) lines.push(`Klub: ${clubEffects.join(" | ")}.`);

  const operationEffects = [];
  if (gangEffects.operationSuccess) operationEffects.push(`wejscie ${formatSignedPercent(gangEffects.operationSuccess)}`);
  if (gangEffects.operationLeakReduction) operationEffects.push(`przeciek ${formatSignedPercent(-gangEffects.operationLeakReduction)}`);
  if (gangEffects.operationRetention) operationEffects.push(`lup ${formatSignedPercent(gangEffects.operationRetention)}`);
  if (operationEffects.length) lines.push(`Operacje: ${operationEffects.join(" | ")}.`);

  const cityEffects = [];
  if (gangEffects.pressureMitigation) cityEffects.push(`pressure ${formatSignedPercent(-gangEffects.pressureMitigation)}`);
  if (gangEffects.influenceGain) cityEffects.push(`influence +${Math.round(Number(gangEffects.influenceGain || 0) * 100)}% w fokusie`);
  if (focusDistrictSummary?.name) cityEffects.push(`fokus: ${focusDistrictSummary.name}`);
  if (cityEffects.length) lines.push(`Miasto: ${cityEffects.join(" | ")}.`);

  const recoveryEffects = [];
  if (gangEffects.heatRelief) recoveryEffects.push(`heat -${gangEffects.heatRelief}`);
  if (gangEffects.hpRelief) recoveryEffects.push(`HP +${gangEffects.hpRelief}`);
  if (recoveryEffects.length) lines.push(`Safehouse: ${recoveryEffects.join(" | ")}.`);

  return lines;
}

export function getGangProjectLevelLine(project, level = 0) {
  const safeLevel = Math.max(0, Math.floor(Number(level || 0)));
  const current = safeLevel > 0 ? project?.levels?.[safeLevel - 1] : null;
  const next = project?.levels?.[safeLevel] || null;
  const source = current || next;

  if (!source?.effect) {
    return "Brak dalszych poziomow.";
  }

  const parts = [];
  Object.entries(source.effect).forEach(([key, value]) => {
    if (!value) return;
    switch (key) {
      case "clubSecurity":
        parts.push(`ochrona klubu +${value}`);
        break;
      case "clubThreatMitigation":
        parts.push(`zagrozenie ${formatSignedPercent(-value)}`);
        break;
      case "pressureMitigation":
        parts.push(`pressure ${formatSignedPercent(-value)}`);
        break;
      case "operationLeakReduction":
        parts.push(`przeciek ${formatSignedPercent(-value)}`);
        break;
      case "operationSuccess":
        parts.push(`wejscie ${formatSignedPercent(value)}`);
        break;
      case "operationRetention":
        parts.push(`lup ${formatSignedPercent(value)}`);
        break;
      case "heatRelief":
        parts.push(`heat -${value}`);
        break;
      case "hpRelief":
        parts.push(`HP +${value}`);
        break;
      case "influenceGain":
        parts.push(`influence +${Math.round(Number(value || 0) * 100)}%`);
        break;
      default:
        break;
    }
  });

  if (!parts.length) {
    return "Efekt projektu czeka na nastepny etap.";
  }

  return `${current ? "Aktywnie" : "Nastepny"}: ${parts.join(" | ")}.`;
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

  let recommendation = "Dealer daje bezpieczny cashout, a klub potrzebuje ruchu, zeby ten towar naprawde odpalic.";
  if (estimatedClubGross > dealerCashout * 1.12) {
    recommendation = "Ten towar robi lepszy wynik przy nocach klubu, jesli lokal ma ruch i nie siedzi pod presja.";
  } else if (dealerMargin <= 0) {
    recommendation = "Na szybkim cashoucie towar jest cienki. Lepiej nie pchac go slepo do dilera.";
  }

  return {
    batchCost,
    dealerCashout,
    dealerMargin,
    estimatedClubGross,
    recommendation,
  };
}
