export function getCasinoGameConfig(meta, gameId, fallback = {}) {
  const limits =
    meta?.limits && typeof meta.limits === "object" && !Array.isArray(meta.limits)
      ? meta.limits[gameId] || null
      : null;
  const minBet = Number.isFinite(Number(limits?.minBet))
    ? Math.max(0, Number(limits.minBet))
    : Math.max(0, Number(fallback.minBet || 0));
  const maxBet = Number.isFinite(Number(limits?.maxBet))
    ? Math.max(minBet, Number(limits.maxBet))
    : Math.max(minBet, Number(fallback.maxBet || minBet));
  const cooldownRemainingMs = Math.max(0, Math.round(Number(meta?.cooldownRemainingSeconds || 0) * 1000));
  const dailyLoss = Math.max(0, Number(meta?.dailyLoss || 0));
  const dailyLossCap = Math.max(0, Number(meta?.dailyLossCap || 0));

  return {
    hasServerLimits: Boolean(limits),
    minBet,
    maxBet,
    cooldownRemainingMs,
    dailyLoss,
    dailyLossCap,
    remainingDailyLoss: Math.max(0, dailyLossCap - dailyLoss),
  };
}

export function getGangRaidPreviewLines(preview) {
  if (!preview || typeof preview !== "object") {
    return [];
  }

  const chance = Number(preview.raidChance?.chance || 0);
  const cashLoss = Math.max(0, Math.floor(Number(preview.lossPreview?.cashLoss || 0)));
  const heatLoss = Math.max(0, Math.floor(Number(preview.lossPreview?.heatGain || 0)));
  const sameTargetCooldownSeconds = Math.max(
    0,
    Math.floor(Number(preview.cooldowns?.sameTargetRepeatCooldownSeconds || 0))
  );
  const protection = preview.raidChance?.protection || {};

  const lines = [
    `Szansa wejscia ok. ${Math.round(chance * 100)}%.`,
    cashLoss > 0 ? `Przy sukcesie mozesz wyrwac do $${cashLoss}.` : "Cel ma niski zapas do wyrwania.",
    heatLoss > 0 ? `Po akcji robi sie cieplej: +${heatLoss} heat.` : "Przypal po akcji jest niski.",
  ];

  if (sameTargetCooldownSeconds > 0) {
    lines.push(`Ten sam cel blokuje sie na ${Math.ceil(sameTargetCooldownSeconds / 60)} min.`);
  }
  if (protection?.starterShield) {
    lines.push("Cel siedzi jeszcze pod swieza ochrona startowa.");
  } else if (protection?.griefProtected) {
    lines.push("Ochrona slabego celu ucina potencjal strat.");
  } else if (protection?.shieldActive) {
    lines.push("Na celu siedzi jeszcze tarcza po poprzednim ataku.");
  }

  return lines;
}
