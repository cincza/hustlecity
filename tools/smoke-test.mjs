import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const HOST = "127.0.0.1";
const PORT = 4100;
const BASE_URL = `http://${HOST}:${PORT}`;
const AUTH_REGISTER_DELAY_MS = 2600;
const AUTH_LOGIN_DELAY_MS = 1300;

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(retries = 40) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) {
        return;
      }
    } catch (_error) {}
    await delay(500);
  }
  throw new Error("Backend nie wystartowal na czas.");
}

async function request(pathname, { method = "GET", token, body } = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      throw new Error(`Endpoint ${pathname} nie zwrocil JSON: ${text.slice(0, 120)}`);
    }
  }

  if (!response.ok) {
    throw new Error(`${pathname} -> HTTP ${response.status}: ${data.error || "unknown error"}`);
  }

  return data;
}

function startServer(dataDir) {
  const child = spawn(
    process.execPath,
    ["backend/src/server.js"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOST,
        PORT: String(PORT),
        NODE_ENV: "test",
        JWT_SECRET: "smoke-test-secret",
        CORS_ORIGIN: "http://localhost:8090",
        DATA_DIR: dataDir,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  child.stdout.on("data", (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });
  child.stderr.on("data", (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  return child;
}

async function stopServer(child) {
  if (!child || child.killed) return;

  await new Promise((resolve) => {
    child.once("exit", () => resolve());
    child.kill();
    setTimeout(() => resolve(), 5000);
  });
}

async function main() {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), "hustle-city-smoke-"));
  let server = null;

  try {
    server = startServer(dataDir);
    await waitForHealth();

    const unique = Date.now();
    const login = `smoke${unique}`;
    const noEmailLoginOne = `sna${unique}`;
    const noEmailLoginTwo = `snb${unique}`;
    const password = "smoke123";
    const chatText = `smoke-message-${unique}`;

    const registerResult = await request("/auth/register", {
      method: "POST",
      body: {
        login,
        username: login,
        email: `${login}@example.com`,
        password,
      },
    });

    const token = registerResult.token;
    if (!token) {
      throw new Error("Rejestracja nie zwrocila tokena.");
    }

    await delay(AUTH_REGISTER_DELAY_MS);
    const noEmailRegisterOne = await request("/auth/register", {
      method: "POST",
      body: {
        login: noEmailLoginOne,
        username: noEmailLoginOne,
        password,
      },
    });

    await delay(AUTH_REGISTER_DELAY_MS);
    const noEmailRegisterTwo = await request("/auth/register", {
      method: "POST",
      body: {
        login: noEmailLoginTwo,
        username: noEmailLoginTwo,
        password,
      },
    });

    if (!noEmailRegisterOne.token || !noEmailRegisterTwo.token) {
      throw new Error("Rejestracja bez maila nie zwrocila tokena.");
    }

    await request("/auth/login", {
      method: "POST",
      body: { login, password },
    });

    await delay(AUTH_LOGIN_DELAY_MS);
    await request("/auth/login", {
      method: "POST",
      body: { login: noEmailLoginTwo, password },
    });

    const heists = await request("/heists", { token });
    const starterHeist = heists.heists?.find((entry) => entry.id === "pickpocket") || heists.heists?.[0];
    if (!starterHeist) {
      throw new Error("Backend nie zwrocil katalogu napadow.");
    }

    const preMe = await request("/me", { token });
    const cashBeforeHeist = preMe.user.profile.cash;
    const attackBeforeGym = preMe.user.profile.attack;

    const heistResult = await request(`/heists/${starterHeist.id}/execute`, {
      method: "POST",
      token,
    });

    await request("/chat/global", {
      method: "POST",
      token,
      body: { text: chatText },
    });

    await request("/player/gym/pass", {
      method: "POST",
      token,
      body: { passId: "day" },
    });

    await request("/player/gym/train", {
      method: "POST",
      token,
      body: { exerciseId: "power" },
    });

    await request("/player/profile/avatar", {
      method: "POST",
      token,
      body: { avatarId: "boss" },
    });

    const midMe = await request("/me", { token });
    const players = await request("/social/players", { token });
    const rankings = await request("/social/rankings", { token });
    const chat = await request("/chat/global", { token });

    if (!Array.isArray(players.players) || !players.players.some((entry) => entry.name === login)) {
      throw new Error("Gracz nie pojawia sie w katalogu social.");
    }

    const rankingEntries = [
      ...(rankings.byRespect || []),
      ...(rankings.byCash || []),
      ...(rankings.byHeists || []),
      ...(rankings.byCasino || []),
    ];
    if (!rankingEntries.some((entry) => entry.name === login)) {
      throw new Error("Gracz nie pojawia sie w rankingach.");
    }

    if (!Array.isArray(chat.messages) || !chat.messages.some((entry) => entry.text === chatText)) {
      throw new Error("Wiadomosc chatu nie zostala zapisana.");
    }

    if (midMe.user.profile.attack <= attackBeforeGym) {
      throw new Error("Trening na silowni nie podniosl statystyki ataku.");
    }

    const attackTarget = players.players.find((entry) => entry.name === noEmailLoginTwo);
    if (!attackTarget?.id) {
      throw new Error("Nie znaleziono celu do testu ataku gracza.");
    }

    const attackResult = await request(`/social/players/${attackTarget.id}/attack`, {
      method: "POST",
      token,
    });

    if (!attackResult?.result?.message) {
      throw new Error("Atak na gracza nie zwrocil wyniku akcji.");
    }

    const syncResult = await request("/sync/client-state", {
      method: "POST",
      token,
      body: {
        game: {
          ui: {
            screen: "fake-screen",
          },
          player: {
            cash: 999999999,
            respect: 999999999,
            attack: 999999999,
          },
        },
      },
    });

    if (!syncResult.ok || syncResult.authoritative !== true) {
      throw new Error("Sync klienta nie zwrocil potwierdzenia autorytatywnego backendu.");
    }

    const postSyncMe = await request("/me", { token });
    if (postSyncMe.user.profile.cash !== midMe.user.profile.cash) {
      throw new Error("Sync klienta nadpisal gotowke na backendzie.");
    }
    if (postSyncMe.user.profile.attack !== midMe.user.profile.attack) {
      throw new Error("Sync klienta nadpisal statystyki na backendzie.");
    }
    if (postSyncMe.user.clientState?.screen !== "fake-screen") {
      throw new Error("Backend nie zachowal bezpiecznego podsumowania stanu klienta.");
    }

    await stopServer(server);
    server = startServer(dataDir);
    await waitForHealth();

    const relogin = await request("/auth/login", {
      method: "POST",
      body: { login, password },
    });

    const persistedMe = await request("/me", { token: relogin.token });
    const persistedChat = await request("/chat/global", { token: relogin.token });

    if (persistedMe.user.profile.attack !== midMe.user.profile.attack) {
      throw new Error("Atak po restarcie backendu nie zostal zachowany.");
    }

    if (persistedMe.user.profile.cash === cashBeforeHeist) {
      throw new Error("Stan gotowki wyglada jakby napad nie zostal zapisany.");
    }

    if (persistedMe.user.profile.avatarId !== "boss") {
      throw new Error("Avatar gracza nie przetrwal restartu backendu.");
    }

    if (persistedMe.user.clientState?.screen !== "fake-screen") {
      throw new Error("Bezpieczne podsumowanie client state nie przetrwalo restartu backendu.");
    }

    if (!persistedChat.messages.some((entry) => entry.text === chatText)) {
      throw new Error("Chat nie przetrwal restartu backendu.");
    }

    const summary = {
      register: "ok",
      registerWithoutEmail: "ok",
      login: "ok",
      heist: heistResult.result,
      chat: "ok",
      gym: "ok",
      avatar: "ok",
      playerAttack: attackResult.result.success ? "ok-success" : "ok-failed",
      clientStateAuthority: "ok",
      persistenceAfterRestart: "ok",
      socialPlayers: players.players.length,
      rankingsVisible: true,
    };

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    await stopServer(server);
    await rm(dataDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
