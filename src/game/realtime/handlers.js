function hasScope(scopes, scope) {
  return Array.isArray(scopes) && scopes.includes(scope);
}

export async function handleRealtimeInvalidationEvent(
  event,
  {
    token,
    ui,
    game,
    refreshProfile,
    refreshMarket,
    refreshSocial,
    refreshContracts,
    refreshHeists,
    refreshCasino,
    refreshPrison,
  }
) {
  if (!token || event?.type !== "state.invalidate") {
    return;
  }

  const scopes = Array.isArray(event?.scopes)
    ? event.scopes.map((scope) => String(scope || "").trim().toLowerCase()).filter(Boolean)
    : [];
  if (!scopes.length) {
    return;
  }

  const activeTab = String(ui?.tab || "").trim().toLowerCase();
  const activeSectionId = String(ui?.activeSectionId || "").trim().toLowerCase();
  const isClubContext =
    activeTab === "city" ||
    activeTab === "empire" ||
    activeTab === "hub" ||
    activeSectionId === "club" ||
    activeSectionId === "clubs";
  const isGangContext =
    activeTab === "profile" ||
    activeTab === "hub" ||
    activeTab === "heists" ||
    activeSectionId === "gang";
  const isContractsContext = activeTab === "heists" && activeSectionId === "contracts";
  const isHeistsContext = activeTab === "heists";
  const isCasinoContext = activeTab === "city" && activeSectionId === "casino";
  const isPrisonContext =
    (activeTab === "heists" && activeSectionId === "prison") ||
    Number(game?.player?.jailUntil || 0) > Date.now();

  const queued = new Map();
  const queue = (key, runner) => {
    if (!queued.has(key) && typeof runner === "function") {
      queued.set(key, runner);
    }
  };

  if (hasScope(scopes, "profile")) {
    queue("profile", () => refreshProfile(token));
  }
  if (hasScope(scopes, "market")) {
    queue("market", () => refreshMarket(token));
  }
  if (hasScope(scopes, "social")) {
    queue("social", () => refreshSocial(token));
  }
  if (hasScope(scopes, "gang")) {
    queue("profile", () => refreshProfile(token));
    if (isGangContext) {
      queue("social", () => refreshSocial(token));
    }
  }
  if (hasScope(scopes, "club") && isClubContext) {
    queue("profile", () => refreshProfile(token));
  }
  if (hasScope(scopes, "contracts") && isContractsContext) {
    queue("contracts", () => refreshContracts(token));
  }
  if (hasScope(scopes, "heists") && isHeistsContext) {
    queue("heists", () => refreshHeists(token));
  }
  if (hasScope(scopes, "casino") && isCasinoContext) {
    queue("casino", () => refreshCasino(token));
  }
  if (hasScope(scopes, "prison") && isPrisonContext) {
    queue("prison", () => refreshPrison(token));
  }

  if (!queued.size) {
    return;
  }

  await Promise.allSettled([...queued.values()].map((runner) => runner()));
}
