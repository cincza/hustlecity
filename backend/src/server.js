import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import {
  applyMarketBuy,
  applyMarketSell,
  BACKEND_RULES,
  CASINO_RULES,
  clamp,
  createMarketState,
  ECONOMY_RULES,
  getBankDepositFee,
  getBankWithdrawFee,
  getCasinoBetLimits,
  getCasinoDailyLossCap,
  getCasinoRtpPreview,
  getClubAttackScore,
  getClubDefenseScore,
  getClubRaidChance,
  getClubRaidLoss,
  getClubSecurityUpkeep,
  getHeistById,
  getMarketPublicView,
  HEIST_DEFINITIONS,
  MARKET_PRODUCTS,
  rebalanceMarketState,
} from "./config/economy.js";
import {
  createAvailableUsername,
  createUserRecord,
  findUserById,
  findUserByLogin,
  initUserStore,
  saveUserPlayerData,
} from "./lib/userStore.js";
import {
  createAuthMiddleware,
  getBearerToken,
  signAuthToken,
  verifyAuthToken,
} from "./middleware/auth.js";

const app = express();
const port = process.env.PORT || 4000;
const host = process.env.HOST || "0.0.0.0";
const allowedOriginsFromEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(
  new Set([
    ...allowedOriginsFromEnv,
    "http://localhost:8081",
    "http://localhost:8090",
    "http://127.0.0.1:8081",
    "http://127.0.0.1:8090",
  ])
);
const ALPHA_TEST_STARTING_CASH = 5000000;
const ALPHA_TEST_STARTING_BANK = 250000;

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS blocked"));
    },
  })
);
app.use(express.json({ limit: "1mb" }));
app.use((req, _res, next) => {
  const requester = req.ip || "unknown";
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} :: ${requester}`);
  next();
});

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createDeck() {
  const baseCards = [
    { label: "A", value: 11, suit: "♠" },
    { label: "K", value: 10, suit: "♠" },
    { label: "Q", value: 10, suit: "♠" },
    { label: "J", value: 10, suit: "♠" },
    { label: "10", value: 10, suit: "♠" },
    { label: "9", value: 9, suit: "♠" },
    { label: "8", value: 8, suit: "♠" },
    { label: "7", value: 7, suit: "♠" },
    { label: "6", value: 6, suit: "♠" },
    { label: "5", value: 5, suit: "♠" },
    { label: "4", value: 4, suit: "♠" },
    { label: "3", value: 3, suit: "♠" },
    { label: "2", value: 2, suit: "♠" },
  ];

  const suits = ["♠", "♥", "♦", "♣"];
  const deck = [];
  suits.forEach((suit) => {
    baseCards.forEach((card) => {
      deck.push({ ...card, suit });
    });
  });

  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

function drawDeckCard(deck) {
  return deck.shift();
}

function getBlackjackHandValue(cards = []) {
  let total = cards.reduce((sum, card) => sum + (Number(card?.value) || 0), 0);
  let aces = cards.filter((card) => card?.label === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}

function getLevelFromRespect(respect) {
  return 1 + Math.floor(respect / 14);
}

function createInitialPlayerData(username = "boss") {
  const now = Date.now();
  return {
    profile: {
      name: username === "boss" ? "Vin Blaze" : username,
      avatarId: "ghost",
      avatarCustomUri: null,
      rank: "Mlody wilk",
      level: 1,
      respect: 7,
      heat: 6,
      hp: 100,
      maxHp: 100,
      energy: ECONOMY_RULES.energy.baseMax,
      maxEnergy: ECONOMY_RULES.energy.baseMax,
      attack: 11,
      defense: 8,
      dexterity: 7,
      charisma: 6,
      stamina: 7,
      cash: 5000000,
      bank: 250000,
    },
    stats: {
      heistsDone: 0,
      heistsWon: 0,
      totalEarned: 0,
      casinoWins: 0,
    },
    inventory: Object.fromEntries(MARKET_PRODUCTS.map((item) => [item.id, 0])),
    cooldowns: {
      heists: {},
      casinoActionUntil: 0,
    },
    timers: {
      energyUpdatedAt: now,
    },
    casino: {
      lossDayKey: new Date(now).toISOString().slice(0, 10),
      dailyLoss: 0,
      totalWagered: 0,
      totalWon: 0,
      blackjackSession: null,
    },
    log: [
      "Miasto wrze. Lokalne ekipy obserwuja kazdy ruch.",
      "Backend liczy energie, cooldowny i rewardy. Klient tylko to pokazuje.",
    ],
    flags: {
      alphaTestGrantApplied: true,
    },
  };
}

const state = {
  activeUsers: new Map(),
  market: createMarketState(),
  routeRateLimit: new Map(),
};

await initUserStore();

const existingSeed = await findUserByLogin("boss");
if (!existingSeed) {
  const passwordHash = await bcrypt.hash("1234", 10);
  const seedUsername = await createAvailableUsername("boss", "boss");
  await createUserRecord({
    username: seedUsername,
    email: "boss@hustle-city.local",
    passwordHash,
    playerData: createInitialPlayerData(seedUsername),
  });
}

function pushLog(player, message) {
  player.log = [message, ...player.log].slice(0, 16);
}

function ensureAlphaTestGrant(player) {
  if (!player || typeof player !== "object") return false;
  if (player.flags?.alphaTestGrantApplied) return false;

  player.flags = {
    ...(player.flags || {}),
    alphaTestGrantApplied: true,
  };
  player.profile.cash = Math.max(Number(player.profile?.cash || 0), ALPHA_TEST_STARTING_CASH);
  player.profile.bank = Math.max(Number(player.profile?.bank || 0), ALPHA_TEST_STARTING_BANK);
  pushLog(player, "Alpha test boost wbity. Masz gruby bankroll na sprawdzanie drozszych rzeczy.");
  return true;
}

function markUserActive(userId, now = Date.now()) {
  state.activeUsers.set(userId, now);
}

function getRequesterId(req) {
  const token = getBearerToken(req.headers.authorization || "");
  if (token) {
    try {
      const payload = verifyAuthToken(token);
      return payload.sub || payload.username || req.ip || "anon";
    } catch (_error) {
      return token;
    }
  }
  return req.ip || "anon";
}

function getActiveUserCount(now = Date.now()) {
  const activeWindowMs = 30 * 60 * 1000;
  for (const [userId, lastSeenAt] of state.activeUsers.entries()) {
    if (now - lastSeenAt > activeWindowMs) {
      state.activeUsers.delete(userId);
    }
  }
  return state.activeUsers.size;
}

async function persistPlayerForUser(userId, playerData) {
  if (!userId) {
    throw new Error("Cannot persist player without user id");
  }
  if (!playerData || typeof playerData !== "object" || Array.isArray(playerData)) {
    throw new Error("Cannot persist empty player data");
  }
  const updated = await saveUserPlayerData(userId, playerData);
  console.log(`[persist] saved player state for ${userId}`);
  return updated;
}

function enforceRateLimit(req, res, scope, minIntervalMs, message) {
  const key = `${scope}:${getRequesterId(req)}`;
  const now = Date.now();
  const lastAt = state.routeRateLimit.get(key) || 0;
  if (now - lastAt < minIntervalMs) {
    res.status(429).json({ error: message || "Too many requests" });
    return false;
  }
  state.routeRateLimit.set(key, now);
  return true;
}

function parsePositiveInteger(rawValue, { min = 1, max = Number.MAX_SAFE_INTEGER, field = "value" } = {}) {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return { error: `${field} must be an integer` };
  }
  if (parsed < min) {
    return { error: `${field} must be >= ${min}` };
  }
  if (parsed > max) {
    return { error: `${field} must be <= ${max}` };
  }
  return { value: parsed };
}

function refreshMarket(now = Date.now()) {
  state.market = rebalanceMarketState(state.market, now, getActiveUserCount(now));
}

function syncPlayerEnergy(player, now = Date.now()) {
  if (!player.timers) player.timers = { energyUpdatedAt: now };
  const regenMs = ECONOMY_RULES.energy.regenSeconds * 1000;
  const lastEnergyAt = player.timers.energyUpdatedAt || now;

  if (player.profile.energy >= player.profile.maxEnergy) {
    player.timers.energyUpdatedAt = now;
    return;
  }

  const elapsed = now - lastEnergyAt;
  if (elapsed < regenMs) return;

  const recovered = Math.floor(elapsed / regenMs);
  player.profile.energy = Math.min(player.profile.maxEnergy, player.profile.energy + recovered);
  player.timers.energyUpdatedAt = lastEnergyAt + recovered * regenMs;

  if (player.profile.energy >= player.profile.maxEnergy) {
    player.timers.energyUpdatedAt = now;
  }
}

function syncPlayerState(player, now = Date.now()) {
  syncPlayerEnergy(player, now);
}

function getHeistSuccessChance(player, heist) {
  const statScore =
    player.profile.attack * 1.2 +
    player.profile.defense * 0.65 +
    player.profile.dexterity * 1.1 +
    player.profile.stamina * 0.5;
  const heatPenalty = player.profile.heat * 0.0045;
  const hpPenalty = player.profile.hp < player.profile.maxHp * 0.4 ? 0.05 : 0;

  return clamp(
    heist.baseSuccess + (statScore - heist.difficultyScore) / 100 - heatPenalty - hpPenalty,
    heist.minSuccess,
    heist.maxSuccess
  );
}

function getHeistCooldownRemaining(player, heistId, now = Date.now()) {
  const until = player.cooldowns?.heists?.[heistId] || 0;
  return Math.max(0, until - now);
}

function publicPlayer(player, now = Date.now()) {
  syncPlayerState(player, now);
  return {
    id: player.id,
    username: player.username,
    profile: player.profile,
    stats: player.stats,
    inventory: player.inventory,
    cooldowns: player.cooldowns,
    casino: player.casino
      ? {
          ...player.casino,
          blackjackSession: buildBlackjackPublicSession(player.casino.blackjackSession),
        }
      : null,
    log: player.log,
    clientState: player.clientState || null,
  };
}

function sanitizeClientGamePayload(game) {
  if (!game || typeof game !== "object" || Array.isArray(game)) {
    return null;
  }

  const serialized = JSON.stringify(game);
  if (serialized.length > 350000) {
    return null;
  }

  return JSON.parse(serialized);
}

function applyClientGameSnapshotToPlayerData(player, game) {
  if (!player || !game || typeof game !== "object") {
    return;
  }

  const profile = game.player || {};
  const stats = game.stats || {};
  const inventory = game.inventory || {};

  player.profile = {
    ...player.profile,
    name: typeof profile.name === "string" && profile.name.trim() ? profile.name.trim() : player.profile.name,
    avatarId: typeof profile.avatarId === "string" ? profile.avatarId : player.profile.avatarId,
    avatarCustomUri: typeof profile.avatarCustomUri === "string" ? profile.avatarCustomUri : player.profile.avatarCustomUri,
    rank: typeof profile.rank === "string" ? profile.rank : player.profile.rank,
    cash: Number.isFinite(profile.cash) ? profile.cash : player.profile.cash,
    bank: Number.isFinite(profile.bank) ? profile.bank : player.profile.bank,
    premiumTokens: Number.isFinite(profile.premiumTokens) ? profile.premiumTokens : player.profile.premiumTokens,
    energy: Number.isFinite(profile.energy) ? profile.energy : player.profile.energy,
    maxEnergy: Number.isFinite(profile.maxEnergy) ? profile.maxEnergy : player.profile.maxEnergy,
    hp: Number.isFinite(profile.hp) ? profile.hp : player.profile.hp,
    maxHp: Number.isFinite(profile.maxHp) ? profile.maxHp : player.profile.maxHp,
    respect: Number.isFinite(profile.respect) ? profile.respect : player.profile.respect,
    attack: Number.isFinite(profile.attack) ? profile.attack : player.profile.attack,
    defense: Number.isFinite(profile.defense) ? profile.defense : player.profile.defense,
    dexterity: Number.isFinite(profile.dexterity) ? profile.dexterity : player.profile.dexterity,
    charisma: Number.isFinite(profile.charisma) ? profile.charisma : player.profile.charisma,
    heat: Number.isFinite(profile.heat) ? profile.heat : player.profile.heat,
    stamina: Number.isFinite(profile.stamina) ? profile.stamina : player.profile.stamina,
    level: Number.isFinite(profile.level) ? profile.level : getLevelFromRespect(Number.isFinite(profile.respect) ? profile.respect : player.profile.respect),
    gymPassTier: profile.gymPassTier ?? player.profile.gymPassTier,
    gymPassUntil: profile.gymPassUntil ?? player.profile.gymPassUntil,
    jailUntil: profile.jailUntil ?? player.profile.jailUntil,
  };

  player.stats = {
    ...player.stats,
    ...Object.fromEntries(Object.entries(stats).filter(([, value]) => Number.isFinite(value))),
  };

  player.inventory = {
    ...player.inventory,
    ...Object.fromEntries(Object.entries(inventory).filter(([, value]) => Number.isFinite(value))),
  };

  if (Array.isArray(game.log)) {
    player.log = game.log.slice(0, 16);
  }

  player.clientState = { game };
}

function syncCasinoDay(player, now = Date.now()) {
  const todayKey = new Date(now).toISOString().slice(0, 10);
  if (!player.casino) {
    player.casino = {
      lossDayKey: todayKey,
      dailyLoss: 0,
      totalWagered: 0,
      totalWon: 0,
    };
    return;
  }

  if (player.casino.lossDayKey !== todayKey) {
    player.casino.lossDayKey = todayKey;
    player.casino.dailyLoss = 0;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function isValidUsername(username) {
  return /^[a-zA-Z0-9._-]{3,18}$/.test(String(username || "").trim());
}

function sanitizeAuthInput(value) {
  return String(value || "").trim();
}

function getCasinoCooldownRemaining(player, now = Date.now()) {
  return Math.max(0, Number(player.cooldowns?.casinoActionUntil || 0) - now);
}

function requireCasinoActionAllowed(player, gameId, bet, now = Date.now()) {
  syncCasinoDay(player, now);
  const limits = getCasinoBetLimits(gameId, {
    respect: player.profile.respect,
    level: player.profile.level,
  });

  if (!limits) {
    return { error: "Casino game not available" };
  }

  const parsedBet = parsePositiveInteger(bet, {
    min: 1,
    max: BACKEND_RULES.validation.maxCasinoBet,
    field: "bet",
  });
  if (parsedBet.error) {
    return { error: parsedBet.error, limits };
  }
  const amount = parsedBet.value;
  if (amount < limits.minBet) {
    return { error: `Minimum bet is $${limits.minBet}.`, limits };
  }
  if (amount > limits.maxBet) {
    return { error: `Maximum bet right now is $${limits.maxBet}.`, limits };
  }
  if (player.profile.cash < amount) {
    return { error: "Not enough wallet cash.", limits };
  }
  if (player.casino.dailyLoss >= limits.dailyLossCap) {
    return { error: `Daily casino loss cap reached ($${limits.dailyLossCap}).`, limits };
  }
  if (player.casino.dailyLoss + amount > limits.dailyLossCap) {
    const allowedStake = Math.max(0, limits.dailyLossCap - player.casino.dailyLoss);
    return { error: `Daily loss cap would be exceeded. Max safe stake: $${allowedStake}.`, limits };
  }

  const cooldownRemaining = getCasinoCooldownRemaining(player, now);
  if (cooldownRemaining > 0) {
    return { error: `Casino cooldown active for ${Math.ceil(cooldownRemaining / 1000)}s.`, limits };
  }

  return { ok: true, amount, limits };
}

function rollWeightedOutcome(outcomes) {
  const totalWeight = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  const roll = crypto.randomInt(1, totalWeight + 1);
  let cursor = 0;

  for (const outcome of outcomes) {
    cursor += outcome.weight;
    if (roll <= cursor) {
      return outcome;
    }
  }

  return outcomes[outcomes.length - 1];
}

function settleCasinoResult(player, { gameId, stake, totalReturn = 0, message }) {
  const net = totalReturn - stake;
  player.profile.cash += net;
  player.cooldowns.casinoActionUntil = Date.now() + CASINO_RULES.actionCooldownSeconds * 1000;
  player.casino.totalWagered += stake;
  player.casino.totalWon += Math.max(0, totalReturn);
  if (net < 0) {
    player.casino.dailyLoss += Math.abs(net);
  } else {
    player.stats.casinoWins += 1;
  }
  pushLog(player, message);

  return {
    net,
    user: publicPlayer(player),
  };
}

function buildBlackjackPublicSession(session) {
  if (!session) return null;
  return {
    stage: session.stage,
    bet: session.bet,
    playerCards: session.playerCards || [],
    dealerCards: session.dealerCards || [],
    message: session.message || "",
    playerValue: getBlackjackHandValue(session.playerCards || []),
    dealerValue:
      session.stage === "player"
        ? Number(session.dealerCards?.[0]?.value || 0)
        : getBlackjackHandValue(session.dealerCards || []),
  };
}

function snapshotPlayerMutationState(player) {
  return {
    cash: Number(player?.profile?.cash || 0),
    bank: Number(player?.profile?.bank || 0),
    energy: Number(player?.profile?.energy || 0),
    hp: Number(player?.profile?.hp || 0),
    heat: Number(player?.profile?.heat || 0),
    respect: Number(player?.profile?.respect || 0),
  };
}

async function commitPlayerMutation(req, actionName, mutator) {
  if (!req?.user?.id || !req?.player) {
    throw new Error("Authenticated player context missing");
  }

  const before = snapshotPlayerMutationState(req.player);
  const result = await mutator(req.player);
  await persistPlayerForUser(req.user.id, req.player);
  const after = snapshotPlayerMutationState(req.player);
  console.log(
    `[mutation] ${actionName} user=${req.user.id} cash=${before.cash}->${after.cash} bank=${before.bank}->${after.bank} energy=${before.energy}->${after.energy} hp=${before.hp}->${after.hp} heat=${before.heat}->${after.heat} respect=${before.respect}->${after.respect} save=ok`
  );
  return result;
}

const auth = createAuthMiddleware({
  findUserById,
  syncPlayerState,
  syncCasinoDay,
  markUserActive,
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    app: process.env.APP_NAME || "Hustle City API",
    economyVersion: ECONOMY_RULES.version,
    time: new Date().toISOString(),
  });
});

app.get("/api/meta", (_req, res) => {
  res.json({
    name: "Hustle City",
    status: "vertical-slice",
    economyVersion: ECONOMY_RULES.version,
    features: ["auth", "profile", "heists", "bank", "market", "casino", "server-energy", "server-cooldowns", "club-pvp-rules"],
    auth: {
      register: true,
      login: true,
      identifier: "username-or-email",
    },
  });
});

app.post("/auth/register", asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "auth-register",
      BACKEND_RULES.rateLimitsMs.authRegister,
      "Register rate limit active"
    )
  ) {
    return;
  }
  const { login, username, email, password } = req.body || {};
  const rawLogin = sanitizeAuthInput(login || username || email);
  const rawEmail = sanitizeAuthInput(email || (rawLogin.includes("@") ? rawLogin : ""));
  const rawPassword = String(password || "");

  if (!rawLogin || !rawPassword) {
    res.status(400).json({ error: "Login/email and password are required" });
    return;
  }
  if (rawPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters long" });
    return;
  }

  if (rawEmail && !isValidEmail(rawEmail)) {
    res.status(400).json({ error: "Invalid email format" });
    return;
  }

  const existingByLogin = await findUserByLogin(rawLogin);
  const existingByEmail = rawEmail ? await findUserByLogin(rawEmail) : null;
  if (existingByLogin || existingByEmail) {
    res.status(409).json({ error: "Login or email already exists" });
    return;
  }

  const nextUsername = await createAvailableUsername(rawLogin, username);
  if (!isValidUsername(nextUsername)) {
    res.status(400).json({ error: "Username must be 3-18 chars and use only letters, numbers, dot, dash or underscore" });
    return;
  }

  const passwordHash = await bcrypt.hash(rawPassword, 10);
  const playerData = createInitialPlayerData(nextUsername);
  playerData.profile.name = nextUsername;
  const userRecord = await createUserRecord({
    username: nextUsername,
    email: rawEmail || null,
    passwordHash,
    playerData,
  });

  markUserActive(userRecord._id);
  const token = signAuthToken(userRecord);
  res.status(201).json({
    token,
    user: publicPlayer(userRecord.playerData),
    authUser: {
      id: userRecord._id,
      username: userRecord.username,
      email: userRecord.email || null,
    },
  });
}));

app.post("/auth/login", asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "auth-login",
      BACKEND_RULES.rateLimitsMs.authLogin,
      "Login rate limit active"
    )
  ) {
    return;
  }
  const { login, username, password } = req.body || {};
  const identifier = sanitizeAuthInput(login || username);
  const rawPassword = String(password || "");
  const userRecord = await findUserByLogin(identifier);

  if (!userRecord || !rawPassword) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const passwordOk = await bcrypt.compare(rawPassword, userRecord.passwordHash);
  if (!passwordOk) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  if (ensureAlphaTestGrant(userRecord.playerData)) {
    await persistPlayerForUser(userRecord._id, userRecord.playerData);
  }

  markUserActive(userRecord._id);
  const token = signAuthToken(userRecord);
  res.json({
    token,
    user: publicPlayer(userRecord.playerData),
    authUser: {
      id: userRecord._id,
      username: userRecord.username,
      email: userRecord.email || null,
    },
  });
}));

app.get("/me", auth, asyncHandler(async (req, res) => {
  refreshMarket();
  ensureAlphaTestGrant(req.player);
  await persistPlayerForUser(req.user.id, req.player);
  const marketView = getMarketPublicView(state.market, getActiveUserCount());
  res.json({
    user: publicPlayer(req.player),
    market: marketView.prices,
    marketState: marketView.products,
    heists: HEIST_DEFINITIONS,
    economy: {
      version: ECONOMY_RULES.version,
      energy: ECONOMY_RULES.energy,
      bank: ECONOMY_RULES.bank,
      market: ECONOMY_RULES.market,
      casino: ECONOMY_RULES.casino,
      factories: ECONOMY_RULES.factories,
      boosts: ECONOMY_RULES.boosts,
      clubs: ECONOMY_RULES.clubs,
      clubPvp: ECONOMY_RULES.clubPvp,
      loopControl: ECONOMY_RULES.loopControl,
      streetIncome: ECONOMY_RULES.streetIncome,
      },
    });
}));

app.post("/sync/client-state", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "sync-client-state",
      800,
      "Client state sync rate limit active"
    )
  ) {
    return;
  }

  const safeGame = sanitizeClientGamePayload(req.body?.game);
  if (!safeGame) {
    res.status(400).json({ error: "Invalid game snapshot payload" });
    return;
  }

  applyClientGameSnapshotToPlayerData(req.player, safeGame);
  await commitPlayerMutation(req, "sync-client-state", async () => ({ ok: true }));
  res.json({
    ok: true,
    user: publicPlayer(req.player),
  });
}));

app.post("/club-pvp/preview", auth, (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "club-pvp-preview",
      BACKEND_RULES.rateLimitsMs.clubPvpPreview,
      "Club PvP preview rate limit active"
    )
  ) {
    return;
  }
  const attacker = req.body?.attacker || {};
  const defender = req.body?.defender || {};

  const attackScore = getClubAttackScore(attacker);
  const defenseScore = getClubDefenseScore(defender);
  const targetExposure = clamp(
    (Number(defender.popularity) || 0) / 100 + (Number(defender.recentTraffic) || 0) / 14 + (Number(defender.ownerHeat) || 0) / 220,
    0,
    1
  );
  const raidChance = getClubRaidChance({
    attackerPower: attackScore,
    defenderPower: defenseScore,
    attackerRespect: attacker.respect || 0,
    defenderRespect: defender.ownerRespect || 0,
    targetExposure,
    recentIncomingAttacks: defender.recentIncomingAttacks || 0,
    recentIncomingFromSameAttacker: defender.recentIncomingFromSameAttacker || 0,
    clubAgeHours: defender.clubAgeHours || 999,
    defenderShieldSeconds: defender.defenderShieldSeconds || 0,
  });
  const attackRollMargin = clamp((attackScore - defenseScore) / Math.max(80, defenseScore), 0, 0.45);
  const lossPreview = getClubRaidLoss({
    successChance: raidChance.chance || 0,
    attackRollMargin,
    targetClubCash: defender.clubCash || 0,
    targetUnclaimedIncome: defender.targetUnclaimedIncome || 0,
    targetNetWorth: defender.targetNetWorth || 0,
    targetSecurityLevel: defender.clubSecurityLevel || 0,
    defenderProtected: raidChance.protection?.griefProtected || raidChance.protection?.starterShield || false,
    defenderRespect: defender.ownerRespect || 0,
    attackerPower: attackScore,
    defenderPower: defenseScore,
  });
  const securityUpkeep = getClubSecurityUpkeep({
    clubSecurityLevel: defender.clubSecurityLevel || 0,
    baseNet: defender.baseNet || 0,
  });

  res.json({
    attackScore,
    defenseScore,
    targetExposure,
    raidChance,
    lossPreview,
    securityUpkeep,
    cooldowns: {
      playerAttackCooldownSeconds: ECONOMY_RULES.clubPvp.playerAttackCooldownSeconds,
      gangAttackCooldownSeconds: ECONOMY_RULES.clubPvp.gangAttackCooldownSeconds,
      defenderShieldAfterAttackSeconds: ECONOMY_RULES.clubPvp.defenderShieldAfterAttackSeconds,
      sameTargetRepeatCooldownSeconds: ECONOMY_RULES.clubPvp.sameTargetRepeatCooldownSeconds,
    },
  });
});

app.get("/market", auth, asyncHandler(async (req, res) => {
  refreshMarket();
  await persistPlayerForUser(req.user.id, req.player);
  const marketView = getMarketPublicView(state.market, getActiveUserCount());
  res.json({
    products: MARKET_PRODUCTS,
    prices: marketView.prices,
    supply: marketView.products,
    refreshedAt: marketView.refreshedAt,
    sellRate: ECONOMY_RULES.market.sellRate,
    npcFallbackMarkup: ECONOMY_RULES.market.npcFallbackMarkup,
    orderRules: {
      maxBuyPerOrder: ECONOMY_RULES.market.maxBuyPerOrder,
      maxSellPerOrder: ECONOMY_RULES.market.maxSellPerOrder,
      maxSharePerOrder: ECONOMY_RULES.market.maxSharePerOrder,
    },
  });
}));

app.post("/market/buy", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "market-buy",
      BACKEND_RULES.rateLimitsMs.marketTrade,
      "Market buy rate limit active"
    )
  ) {
    return;
  }
  refreshMarket();
  const { productId } = req.body || {};
  const product = MARKET_PRODUCTS.find((item) => item.id === productId);
  const parsedQuantity = parsePositiveInteger(req.body?.quantity ?? 1, {
    min: 1,
    max: BACKEND_RULES.validation.maxMarketQuantity,
    field: "quantity",
  });
  if (parsedQuantity.error) {
    res.status(400).json({ error: parsedQuantity.error });
    return;
  }
  const qty = parsedQuantity.value;

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if (req.player.profile.respect < product.unlockRespect) {
    res.status(400).json({ error: "Respect too low" });
    return;
  }

  const quote = applyMarketBuy(state.market, product.id, qty, getActiveUserCount());
  if (quote.error) {
    res.status(400).json({ error: quote.error, buyLimit: quote.buyLimit, available: quote.available });
    return;
  }

  if (req.player.profile.cash < quote.total) {
    res.status(400).json({ error: "Not enough cash" });
    return;
  }

  await commitPlayerMutation(req, "market-buy", async (player) => {
    player.profile.cash -= quote.total;
    player.inventory[product.id] += qty;
    pushLog(
      player,
      `Kupiono ${qty}x ${product.name} za $${quote.total}. Rynek: ${quote.streetUnits}, fallback NPC: ${quote.fallbackUnits}.`
    );
    return null;
  });

  res.json({
    user: publicPlayer(req.player),
    total: quote.total,
    breakdown: {
      streetUnits: quote.streetUnits,
      fallbackUnits: quote.fallbackUnits,
      streetPrice: state.market.products[product.id].streetPrice,
      fallbackPrice: state.market.products[product.id].fallbackPrice,
    },
    market: getMarketPublicView(state.market, getActiveUserCount()),
  });
}));

app.post("/market/sell", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "market-sell",
      BACKEND_RULES.rateLimitsMs.marketTrade,
      "Market sell rate limit active"
    )
  ) {
    return;
  }
  refreshMarket();
  const { productId } = req.body || {};
  const product = MARKET_PRODUCTS.find((item) => item.id === productId);
  const parsedQuantity = parsePositiveInteger(req.body?.quantity ?? 1, {
    min: 1,
    max: BACKEND_RULES.validation.maxMarketQuantity,
    field: "quantity",
  });
  if (parsedQuantity.error) {
    res.status(400).json({ error: parsedQuantity.error });
    return;
  }
  const qty = parsedQuantity.value;

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  if ((req.player.inventory[product.id] || 0) < qty) {
    res.status(400).json({ error: "Not enough product" });
    return;
  }

  const sale = applyMarketSell(state.market, product.id, qty, getActiveUserCount());
  if (sale.error) {
    res.status(400).json({ error: sale.error, sellLimit: sale.sellLimit });
    return;
  }

  await commitPlayerMutation(req, "market-sell", async (player) => {
    player.inventory[product.id] -= qty;
    player.profile.cash += sale.total;
    player.stats.totalEarned += sale.total;
    pushLog(player, `Sprzedano ${qty}x ${product.name} za $${sale.total}. Towar zasila uliczna podaz.`);
    return null;
  });

  res.json({
    user: publicPlayer(req.player),
    total: sale.total,
    payoutPerUnit: sale.payoutPerUnit,
    market: getMarketPublicView(state.market, getActiveUserCount()),
  });
}));

app.post("/bank/deposit", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "bank-deposit",
      BACKEND_RULES.rateLimitsMs.bankOperation,
      "Bank operation rate limit active"
    )
  ) {
    return;
  }
  const parsedAmount = parsePositiveInteger(req.body?.amount, {
    min: 1,
    max: BACKEND_RULES.validation.maxBankTransaction,
    field: "amount",
  });
  if (parsedAmount.error) {
    res.status(400).json({ error: parsedAmount.error });
    return;
  }
  const amount = parsedAmount.value;

  const fee = getBankDepositFee(amount);
  const totalCost = amount + fee;
  if (req.player.profile.cash < totalCost) {
    res.status(400).json({ error: `Not enough wallet cash for deposit and fee ($${fee})` });
    return;
  }

  await commitPlayerMutation(req, "bank-deposit", async (player) => {
    player.profile.cash -= totalCost;
    player.profile.bank += amount;
    pushLog(player, `Wplacono do banku $${amount}. Fee: $${fee}.`);
    return null;
  });
  res.json({ user: publicPlayer(req.player), amount, fee });
}));

app.post("/bank/withdraw", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "bank-withdraw",
      BACKEND_RULES.rateLimitsMs.bankOperation,
      "Bank operation rate limit active"
    )
  ) {
    return;
  }
  const parsedAmount = parsePositiveInteger(req.body?.amount, {
    min: 1,
    max: BACKEND_RULES.validation.maxBankTransaction,
    field: "amount",
  });
  if (parsedAmount.error) {
    res.status(400).json({ error: parsedAmount.error });
    return;
  }
  const amount = parsedAmount.value;

  const fee = getBankWithdrawFee(amount);
  const totalDebit = amount + fee;
  if (req.player.profile.bank < totalDebit) {
    res.status(400).json({ error: `Not enough bank cash for withdrawal and fee ($${fee})` });
    return;
  }

  await commitPlayerMutation(req, "bank-withdraw", async (player) => {
    player.profile.bank -= totalDebit;
    player.profile.cash += amount;
    pushLog(player, `Wyplacono z banku $${amount}. Fee: $${fee}.`);
    return null;
  });
  res.json({ user: publicPlayer(req.player), amount, fee });
}));

app.get("/casino/meta", auth, asyncHandler(async (req, res) => {
  await commitPlayerMutation(req, "casino-meta-touch", async () => ({ ok: true }));
  const limits = {
    slot: getCasinoBetLimits("slot", req.player.profile),
    highRisk: getCasinoBetLimits("highRisk", req.player.profile),
    blackjack: getCasinoBetLimits("blackjack", req.player.profile),
  };

  res.json({
    rules: ECONOMY_RULES.casino,
    rtp: {
      slot: getCasinoRtpPreview("slot"),
      highRisk: getCasinoRtpPreview("highRisk"),
      blackjack: getCasinoRtpPreview("blackjack"),
    },
    limits,
    dailyLossCap: getCasinoDailyLossCap(req.player.profile),
    dailyLoss: req.player.casino.dailyLoss,
    cooldownRemainingSeconds: Math.ceil(getCasinoCooldownRemaining(req.player) / 1000),
    blackjackSession: buildBlackjackPublicSession(req.player.casino?.blackjackSession),
  });
}));

app.post("/casino/slot", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "casino-slot",
      BACKEND_RULES.rateLimitsMs.casinoOperation,
      "Casino rate limit active"
    )
  ) {
    return;
  }
  const guard = requireCasinoActionAllowed(req.player, "slot", req.body?.bet);
  if (guard.error) {
    res.status(400).json({ error: guard.error, limits: guard.limits });
    return;
  }

  const outcome = rollWeightedOutcome(CASINO_RULES.slot.outcomes);
  const totalReturn = Math.floor(guard.amount * outcome.multiplier);
  const settled = await commitPlayerMutation(req, "casino-slot", async (player) =>
    settleCasinoResult(player, {
      gameId: "slot",
      stake: guard.amount,
      totalReturn,
      message:
        totalReturn > 0
          ? `Slot: ${outcome.label}. Wraca $${totalReturn} przy stawce $${guard.amount}.`
          : `Slot: pudlo. Automat bierze $${guard.amount}.`,
    })
  );

  res.json({
    game: "slot",
    stake: guard.amount,
    outcome: {
      id: outcome.id,
      label: outcome.label,
      symbols: outcome.symbols,
      multiplier: outcome.multiplier,
    },
    totalReturn,
    net: settled.net,
    limits: guard.limits,
    rtp: getCasinoRtpPreview("slot"),
    user: settled.user,
  });
}));

app.post("/casino/high-risk", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "casino-high-risk",
      BACKEND_RULES.rateLimitsMs.casinoOperation,
      "Casino rate limit active"
    )
  ) {
    return;
  }
  const guard = requireCasinoActionAllowed(req.player, "highRisk", req.body?.bet);
  if (guard.error) {
    res.status(400).json({ error: guard.error, limits: guard.limits });
    return;
  }

  const win = crypto.randomInt(0, 10000) < Math.floor(CASINO_RULES.highRisk.winChance * 10000);
  const totalReturn = win ? Math.floor(guard.amount * CASINO_RULES.highRisk.winMultiplier) : 0;
  const settled = await commitPlayerMutation(req, "casino-high-risk", async (player) =>
    settleCasinoResult(player, {
      gameId: "highRisk",
      stake: guard.amount,
      totalReturn,
      message: win
        ? `High-risk bet: ${CASINO_RULES.highRisk.winMessage} Wraca $${totalReturn}.`
        : `High-risk bet: ${CASINO_RULES.highRisk.lossMessage} Tracisz $${guard.amount}.`,
    })
  );

  res.json({
    game: "highRisk",
    stake: guard.amount,
    win,
    winChance: CASINO_RULES.highRisk.winChance,
    multiplier: CASINO_RULES.highRisk.winMultiplier,
    totalReturn,
    net: settled.net,
    limits: guard.limits,
    rtp: getCasinoRtpPreview("highRisk"),
    user: settled.user,
  });
}));

app.post("/casino/blackjack/start", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "casino-blackjack-start",
      BACKEND_RULES.rateLimitsMs.casinoOperation,
      "Casino rate limit active"
    )
  ) {
    return;
  }

  const player = req.player;
  if (player.casino?.blackjackSession?.stage === "player") {
    res.status(400).json({ error: "Blackjack session already active" });
    return;
  }

  const guard = requireCasinoActionAllowed(player, "blackjack", req.body?.bet);
  if (guard.error) {
    res.status(400).json({ error: guard.error, limits: guard.limits });
    return;
  }

  const deck = createDeck();
  const playerCards = [drawDeckCard(deck), drawDeckCard(deck)];
  const dealerCards = [drawDeckCard(deck), drawDeckCard(deck)];
  const playerValue = getBlackjackHandValue(playerCards);
  const dealerValue = getBlackjackHandValue(dealerCards);

  let responsePayload = null;
  await commitPlayerMutation(req, "casino-blackjack-start", async (currentPlayer) => {
    currentPlayer.profile.cash -= guard.amount;
    currentPlayer.casino.totalWagered += guard.amount;
    currentPlayer.cooldowns.casinoActionUntil = Date.now() + CASINO_RULES.actionCooldownSeconds * 1000;

    if (playerValue === 21 || dealerValue === 21) {
      let totalReturn = 0;
      let message = "Push. Wrzuta wraca.";
      if (playerValue === 21 && dealerValue !== 21) {
        totalReturn = Math.floor(guard.amount * 2.5);
        currentPlayer.stats.casinoWins += 1;
        currentPlayer.casino.totalWon += totalReturn;
        message = "Blackjack. Stolik placi 3:2.";
      } else if (dealerValue === 21 && playerValue !== 21) {
        currentPlayer.casino.dailyLoss += guard.amount;
        message = "Krupier ma blackjacka. Stolik bierze pule.";
      } else {
        totalReturn = guard.amount;
      }

      currentPlayer.profile.cash += totalReturn;
      currentPlayer.casino.blackjackSession = {
        stage: "done",
        bet: guard.amount,
        playerCards,
        dealerCards,
        message,
      };
      pushLog(currentPlayer, `Blackjack: ${message}`);
      responsePayload = {
        resolved: true,
        result: totalReturn > guard.amount ? "win" : totalReturn === guard.amount ? "push" : "loss",
        totalReturn,
        net: totalReturn - guard.amount,
      };
      return null;
    }

    currentPlayer.casino.blackjackSession = {
      stage: "player",
      bet: guard.amount,
      deck,
      playerCards,
      dealerCards,
      message: "Twoj ruch: dobieraj albo pas.",
    };
    pushLog(currentPlayer, `Blackjack start za $${guard.amount}.`);
    responsePayload = {
      resolved: false,
      result: "ongoing",
      totalReturn: 0,
      net: -guard.amount,
    };
    return null;
  });

  res.json({
    game: "blackjack",
    ...responsePayload,
    session: buildBlackjackPublicSession(req.player.casino.blackjackSession),
    limits: guard.limits,
    rtp: getCasinoRtpPreview("blackjack"),
    user: publicPlayer(req.player),
  });
}));

app.post("/casino/blackjack/hit", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "casino-blackjack-hit",
      BACKEND_RULES.rateLimitsMs.casinoOperation,
      "Casino rate limit active"
    )
  ) {
    return;
  }

  const session = req.player.casino?.blackjackSession;
  if (!session || session.stage !== "player") {
    res.status(400).json({ error: "No active blackjack session" });
    return;
  }

  let responsePayload = null;
  await commitPlayerMutation(req, "casino-blackjack-hit", async (player) => {
    const currentSession = player.casino.blackjackSession;
    const nextCard = drawDeckCard(currentSession.deck);
    currentSession.playerCards.push(nextCard);
    const playerValue = getBlackjackHandValue(currentSession.playerCards);

    if (playerValue > 21) {
      currentSession.stage = "bust";
      currentSession.message = "Spaliles sie.";
      player.casino.dailyLoss += currentSession.bet;
      pushLog(player, "Blackjack: spaliles sie. Kasyno bierze pule.");
      responsePayload = { resolved: true, result: "loss", totalReturn: 0, net: -currentSession.bet };
      return null;
    }

    currentSession.message = "Dobierasz kolejna karte.";
    responsePayload = { resolved: false, result: "ongoing", totalReturn: 0, net: 0 };
    return null;
  });

  res.json({
    game: "blackjack",
    ...responsePayload,
    session: buildBlackjackPublicSession(req.player.casino.blackjackSession),
    user: publicPlayer(req.player),
  });
}));

app.post("/casino/blackjack/stand", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "casino-blackjack-stand",
      BACKEND_RULES.rateLimitsMs.casinoOperation,
      "Casino rate limit active"
    )
  ) {
    return;
  }

  const session = req.player.casino?.blackjackSession;
  if (!session || session.stage !== "player") {
    res.status(400).json({ error: "No active blackjack session" });
    return;
  }

  let responsePayload = null;
  await commitPlayerMutation(req, "casino-blackjack-stand", async (player) => {
    const currentSession = player.casino.blackjackSession;
    currentSession.stage = "dealer";
    while (getBlackjackHandValue(currentSession.dealerCards) < 17) {
      currentSession.dealerCards.push(drawDeckCard(currentSession.deck));
    }

    const playerValue = getBlackjackHandValue(currentSession.playerCards);
    const dealerValue = getBlackjackHandValue(currentSession.dealerCards);
    let totalReturn = 0;
    let message = "Push. Wrzuta wraca.";
    let result = "push";

    if (dealerValue > 21 || playerValue > dealerValue) {
      totalReturn = currentSession.bet * 2;
      player.stats.casinoWins += 1;
      player.casino.totalWon += totalReturn;
      message = "Wygrana. Stolik oddaje dubel.";
      result = "win";
    } else if (playerValue === dealerValue) {
      totalReturn = currentSession.bet;
    } else {
      player.casino.dailyLoss += currentSession.bet;
      message = "Krupier bierze pulę.";
      result = "loss";
    }

    player.profile.cash += totalReturn;
    currentSession.stage = "done";
    currentSession.message = message;
    pushLog(player, `Blackjack: ${message} ${totalReturn ? `Wraca $${totalReturn}.` : ""}`.trim());
    responsePayload = {
      resolved: true,
      result,
      totalReturn,
      net: totalReturn - currentSession.bet,
    };
    return null;
  });

  res.json({
    game: "blackjack",
    ...responsePayload,
    session: buildBlackjackPublicSession(req.player.casino.blackjackSession),
    user: publicPlayer(req.player),
  });
}));

app.get("/heists", auth, asyncHandler(async (req, res) => {
  await commitPlayerMutation(req, "heists-touch", async () => ({ ok: true }));
  res.json({ heists: HEIST_DEFINITIONS });
}));

app.post("/heists/:id/execute", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "heist-execute",
      BACKEND_RULES.rateLimitsMs.heistExecute,
      "Heist action rate limit active"
    )
  ) {
    return;
  }
  const heist = getHeistById(req.params.id);
  if (!heist) {
    res.status(404).json({ error: "Heist not found" });
    return;
  }

  const now = Date.now();
  const player = req.player;
  syncPlayerState(player, now);

  if (player.profile.respect < heist.respect) {
    res.status(400).json({ error: "Respect too low" });
    return;
  }
  if (player.profile.energy < heist.energy) {
    res.status(400).json({ error: "Not enough energy" });
    return;
  }

  const cooldownRemaining = getHeistCooldownRemaining(player, heist.id, now);
  if (cooldownRemaining > 0) {
    res.status(429).json({ error: `Heist cooldown active for ${Math.ceil(cooldownRemaining / 1000)}s` });
    return;
  }

  const chance = getHeistSuccessChance(player, heist);
  player.profile.energy -= heist.energy;
  player.timers.energyUpdatedAt = now;
  player.stats.heistsDone += 1;
  player.cooldowns.heists[heist.id] = now + heist.cooldownSeconds * 1000;

  if (Math.random() < chance) {
    const gain = randomBetween(heist.reward[0], heist.reward[1]);
    const respectGain = randomBetween(heist.respectGain[0], heist.respectGain[1]);
    await commitPlayerMutation(req, "heist-success", async (currentPlayer) => {
      currentPlayer.profile.cash += gain;
      currentPlayer.profile.respect += respectGain;
      currentPlayer.profile.level = getLevelFromRespect(currentPlayer.profile.respect);
      currentPlayer.profile.heat = clamp(currentPlayer.profile.heat + heist.heatOnSuccess, 0, 100);
      currentPlayer.stats.heistsWon += 1;
      currentPlayer.stats.totalEarned += gain;
      pushLog(currentPlayer, `Napad udany: ${heist.name}. Wpada $${gain} i +${respectGain} respektu.`);
      return null;
    });
    res.json({
      result: "success",
      reward: gain,
      respectGain,
      cooldownUntil: player.cooldowns.heists[heist.id],
      chance,
      user: publicPlayer(player, now),
    });
    return;
  }

  const loss = randomBetween(heist.failCashLoss[0], heist.failCashLoss[1]);
  const damage = randomBetween(heist.hpLoss[0], heist.hpLoss[1]);
  await commitPlayerMutation(req, "heist-failure", async (currentPlayer) => {
    currentPlayer.profile.cash = Math.max(0, currentPlayer.profile.cash - loss);
    currentPlayer.profile.hp = Math.max(1, currentPlayer.profile.hp - damage);
    currentPlayer.profile.heat = clamp(currentPlayer.profile.heat + heist.heatOnFailure, 0, 100);
    pushLog(currentPlayer, `Wtopa na akcji: ${heist.name}. Tracisz $${loss} i ${damage} HP.`);
    return null;
  });
  res.json({
    result: "failure",
    loss,
    damage,
    cooldownUntil: player.cooldowns.heists[heist.id],
    chance,
    user: publicPlayer(player, now),
  });
}));

app.use((error, _req, res, _next) => {
  console.error("[api-error]", error?.message || error);
  if (error?.type === "entity.parse.failed") {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }
  if (error?.message === "CORS blocked") {
    res.status(403).json({ error: "CORS blocked" });
    return;
  }
  res.status(error?.statusCode || 500).json({ error: error?.message || "Internal server error" });
});

app.listen(port, host, () => {
  console.log(`Hustle City API listening on ${host}:${port}`);
  console.log(`CORS origins: ${allowedOrigins.length ? allowedOrigins.join(", ") : "all (dev default)"}`);
});
