export const GAME_MODES = {
  OFFLINE_DEMO: "offline_demo",
  ONLINE_ALPHA: "online_alpha",
};

export function getGameMode({ sessionToken, apiStatus }) {
  return sessionToken && apiStatus === "online" ? GAME_MODES.ONLINE_ALPHA : GAME_MODES.OFFLINE_DEMO;
}

export function isOnlineAlphaMode(mode) {
  return mode === GAME_MODES.ONLINE_ALPHA;
}
