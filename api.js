import { API_BASE_URL } from "./src/constants/env";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

export async function loginSeedUser() {
  return loginUser({ login: "boss", password: "1234" });
}

export async function registerUser({ login, email, password }) {
  return request("/auth/register", {
    method: "POST",
    body: { login, email, password },
  });
}

export async function loginUser({ login, password }) {
  return request("/auth/login", {
    method: "POST",
    body: { login, password },
  });
}

export async function fetchMe(token) {
  return request("/me", { token });
}

export async function fetchMarket(token) {
  return request("/market", { token });
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
