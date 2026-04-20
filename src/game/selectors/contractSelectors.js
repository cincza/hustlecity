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

export function getContractPreviewLines({ contract, preview, districtSummary }) {
  if (!contract || !preview) return [];
  const lines = [
    `Tagi: ${getContractTagText(contract.tags) || "Brak"}`,
    `Szansa: ${formatPercent(preview.successChance)} | Reward: x${Number(preview.rewardMultiplier || 1).toFixed(2)}`,
    `Leak: ${formatPercent(preview.leakChance)} | Cela po failu: ${formatPercent(preview.jailChanceOnFail)}`,
    `Heat: +${preview.heatGain} | Loadout: ${Math.round(Number(preview.slotCoverage || 0) * 100)}%`,
  ];
  if (districtSummary?.pressureState?.label) {
    lines.push(`Dzielnica: ${districtSummary.pressureState.label} | Kara: ${formatPercent(preview.districtPenalty)}`);
  }
  return lines;
}
