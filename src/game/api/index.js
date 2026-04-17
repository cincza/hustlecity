import { request } from "./client";

export async function loginSeedUser() {
  return loginUser({ login: "czincza11", password: "1234" });
}

export async function registerUser({ login, email, password }) {
  const normalizedLogin = typeof login === "string" ? login.trim() : "";
  return request("/auth/register", {
    method: "POST",
    body: { login: normalizedLogin, username: normalizedLogin, email, password },
  });
}

export async function loginUser({ login, password }) {
  const normalizedLogin = typeof login === "string" ? login.trim() : "";
  return request("/auth/login", {
    method: "POST",
    body: { login: normalizedLogin, username: normalizedLogin, password },
  });
}

export async function fetchMe(token) {
  return request("/me", { token });
}

export async function fetchMarket(token) {
  return request("/market", { token });
}

export async function fetchHeistsOnline(token) {
  return request("/heists", { token });
}

export async function executeHeistOnline(token, heistId) {
  return request(`/heists/${heistId}/execute`, {
    method: "POST",
    token,
  });
}

export async function buyProductOnline(token, productId, quantity = 1) {
  return request("/market/buy", {
    method: "POST",
    token,
    body: { productId, quantity },
  });
}

export async function sellProductOnline(token, productId, quantity = 1) {
  return request("/market/sell", {
    method: "POST",
    token,
    body: { productId, quantity },
  });
}

export async function depositOnline(token, amount) {
  return request("/bank/deposit", {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function withdrawOnline(token, amount) {
  return request("/bank/withdraw", {
    method: "POST",
    token,
    body: { amount },
  });
}

export async function previewClubPvpOnline(token, payload) {
  return request("/club-pvp/preview", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function fetchCasinoMeta(token) {
  return request("/casino/meta", { token });
}

export async function playSlotOnline(token, bet) {
  return request("/casino/slot", {
    method: "POST",
    token,
    body: { bet },
  });
}

export async function playHighRiskOnline(token, bet) {
  return request("/casino/high-risk", {
    method: "POST",
    token,
    body: { bet },
  });
}

export async function startBlackjackOnline(token, bet) {
  return request("/casino/blackjack/start", {
    method: "POST",
    token,
    body: { bet },
  });
}

export async function hitBlackjackOnline(token) {
  return request("/casino/blackjack/hit", {
    method: "POST",
    token,
  });
}

export async function standBlackjackOnline(token) {
  return request("/casino/blackjack/stand", {
    method: "POST",
    token,
  });
}

export async function syncClientStateOnline(token, game) {
  return request("/sync/client-state", {
    method: "POST",
    token,
    body: { game },
  });
}

export async function fetchSocialPlayers(token, query = "") {
  const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
  return request(`/social/players${suffix}`, { token });
}

export async function fetchRankingsOnline(token) {
  return request("/social/rankings", { token });
}

export async function fetchGlobalChatOnline(token) {
  return request("/chat/global", { token });
}

export async function sendGlobalChatMessageOnline(token, text) {
  return request("/chat/global", {
    method: "POST",
    token,
    body: { text },
  });
}
