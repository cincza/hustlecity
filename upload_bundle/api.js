import { API_BASE_URL } from "./src/constants/env";

async function request(path, options = {}) {
  const url = `${API_BASE_URL || ""}${path}`;
  if (!API_BASE_URL || typeof API_BASE_URL !== "string") {
    throw new Error("API_BASE_URL nie jest ustawione.");
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      method: options.method || "GET",
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (_error) {
    throw new Error("Brak polaczenia z backendem.");
  }

  const raw = await response.text();
  let data = {};

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (_error) {
      data = { error: raw };
    }
  }

  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export async function loginSeedUser() {
  return loginUser({ login: "boss", password: "1234" });
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
