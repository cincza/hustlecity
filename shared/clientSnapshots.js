export function normalizeMarketPayload(payload, fallbackMarket, fallbackState, fallbackMeta) {
  const source = payload && typeof payload === "object" ? payload : {};
  const marketState = source.marketState || source.products || source.supply;
  const dealer = source.dealerInventory;
  return {
    ...(dealer && typeof dealer === "object" && !Array.isArray(dealer)
      ? { dealerInventory: dealer }
      : {}),
    market: source.prices || source.market || fallbackMarket,
    marketState: marketState && !Array.isArray(marketState) ? marketState : fallbackState,
    marketMeta: {
      ...fallbackMeta,
      refreshedAt: source.refreshedAt ?? fallbackMeta?.refreshedAt ?? null,
      sellRate: source.sellRate ?? fallbackMeta?.sellRate ?? 0.82,
      npcFallbackMarkup: source.npcFallbackMarkup ?? fallbackMeta?.npcFallbackMarkup ?? 1.16,
      orderRules: source.orderRules ?? fallbackMeta?.orderRules ?? null,
    },
  };
}

export function advanceOnlineDisplay(game, now) {
  // Economy, regeneration and boost charges come from the server.
  // Only expire visual effects and advance the display clock locally.
  return {
    ...game,
    activeBoosts: game.activeBoosts.filter((boost) => boost.expiresAt > now),
    lastTick: now,
  };
}
