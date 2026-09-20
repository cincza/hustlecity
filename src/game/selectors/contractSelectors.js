import {
  CONTRACT_LOADOUT_SLOTS,
  getContractLoadoutEntries,
  getContractTagText,
} from "../../../shared/contracts.js";

function formatPercent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

export function getContractAssetEffectLine(asset) {
  if (!asset) return "Brak bonusow.";
  const lines = [];
  if (asset.tags && Object.keys(asset.tags).length) {
    lines.push(`Tagi: ${Object.entries(asset.tags)
      .map(([tag, amount]) => `${tag} +${Math.round(Number(amount || 0) * 100)}%`)
      .join(" | ")}`);
  }
  if (Number(asset.protection || 0) > 0) {
    lines.push(`Oslona: -${Math.round(Number(asset.protection || 0) * 100)}% kar po failu`);
  }
  if (Number(asset.leakReduction || 0) > 0) {
    lines.push(`Leak: -${Math.round(Number(asset.leakReduction || 0) * 100)}% przecieku`);
  }
  if (Number(asset.retention || 0) > 0) {
    lines.push(`Ladunek: +${Math.round(Number(asset.retention || 0) * 100)}% utrzymania lootu`);
  }
  if (Number(asset.heatMitigation || 0) > 0) {
    lines.push(`Heat: -${Math.round(Number(asset.heatMitigation || 0) * 100)}% przypalu`);
  }
  return lines.join(" | ");
}

export function getContractLoadoutSummaryLines(contractState) {
  const loadout = getContractLoadoutEntries(contractState);
  return CONTRACT_LOADOUT_SLOTS.map((slot) => `${slot.label}: ${loadout?.[slot.id]?.name || "Brak"}`);
}

function getContractMissingSlotLabels(contractState) {
  const loadout = getContractLoadoutEntries(contractState);
  return CONTRACT_LOADOUT_SLOTS.filter((slot) => !loadout?.[slot.id]).map((slot) => slot.label);
}

export function getContractFrontHint({ contract, preview, contractState, districtSummary }) {
  if (!contract || !preview) return "Backend liczy wejscie na zywo.";
  const missingSlots = getContractMissingSlotLabels(contractState);
  if (missingSlots.length) {
    return `Braki w loadoucie: ${missingSlots.join(", ")}.`;
  }
  if (Number(preview.statRatio || 0) < 0.92) {
    return `Staty trzymaja ${formatPercent(preview.statRatio)} rekomendacji.`;
  }
  if (Number(preview.districtPenalty || 0) >= 0.08) {
    return `Dzielnica doklada ${formatPercent(preview.districtPenalty)} kary do wejscia.`;
  }
  if (districtSummary?.pressureState?.label) {
    return `Dzielnica jest teraz: ${districtSummary.pressureState.label.toLowerCase()}.`;
  }
  return "Loadout siedzi. Rozwin karte po leak, heat i cele po failu.";
}

export function getContractPreviewLines({ contract, preview, contractState, districtSummary }) {
  if (!contract || !preview) return [];
  const missingSlots = getContractMissingSlotLabels(contractState);
  const lines = [
    `Tagi: ${getContractTagText(contract.tags) || "Brak"}`,
    `Szansa: ${formatPercent(preview.successChance)} | Wyplata: x${Number(preview.rewardMultiplier || 1).toFixed(2)}`,
    `Leak: ${formatPercent(preview.leakChance)} | Cela po failu: ${formatPercent(preview.jailChanceOnFail)}`,
    `Heat: +${preview.heatGain} | Loadout: ${Math.round(Number(preview.slotCoverage || 0) * 100)}%`,
  ];
  if (missingSlots.length) {
    lines.push(`Braki: ${missingSlots.join(" | ")}`);
  } else if (Number(preview.statRatio || 0) < 0.92) {
    lines.push(`Staty: ${formatPercent(preview.statRatio)} rekomendacji pod ten kontrakt.`);
  }
  if (districtSummary?.pressureState?.label) {
    lines.push(`Dzielnica: ${districtSummary.pressureState.label} | Kara: ${formatPercent(preview.districtPenalty)}`);
  }
  return lines;
}
