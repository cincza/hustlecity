import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
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
  addGlobalChatMessage,
  clearAllUsers,
  clearGlobalChatMessages,
  createAvailableUsername,
  createUserRecord,
  deleteUserByLogin,
  findUserById,
  findUserByLogin,
  getGlobalChatMessages,
  initUserStore,
  listUsers,
  saveUserPlayerData,
} from "./repositories/userRepository.js";
import {
  logMutationFailure,
  logMutationSuccess,
} from "./services/actionLogService.js";
import {
  bribePlayerOutOfJail,
  buyGymPassForPlayer,
  buyRestaurantItemForPlayer,
  healPlayer,
  trainPlayerAtGym,
  updatePlayerAvatar,
} from "./services/playerActionService.js";
import {
  addFriendForPlayer,
  appendPlayerMessage,
  buyDrugFromDealerForPlayer,
  consumeDrugForPlayer,
  fightClubRoundForPlayer,
  placeBountyOnPlayer,
  searchEscortInClubForPlayer,
  sellDrugToDealerForPlayer,
  sendPlayerMessageBetweenPlayers,
  sendQuickMessageBetweenPlayers,
} from "./services/socialActionService.js";
import { sendError, sendOk } from "./utils/http.js";
import { applyXpProgression, getXpRequirementForRespect } from "../../shared/progression.js";
import {
  createAuthMiddleware,
  getBearerToken,
  signAuthToken,
  verifyAuthToken,
} from "./middleware/auth.js";
import { logError, logInfo, logWarn } from "./utils/logger.js";
import {
  createDealerInventory,
  createDrugCounterMap,
  createOnlineSocialState,
  normalizeDealerInventory,
  normalizeDrugInventory,
} from "../../shared/socialGameplay.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRootDir = path.resolve(__dirname, "..");
const configuredEnvFile = String(process.env.BACKEND_ENV_FILE || "").trim();

// Keep backend env resolution stable no matter whether we start from root or backend/.
dotenv.config({
  path: configuredEnvFile
    ? path.resolve(configuredEnvFile)
    : path.join(backendRootDir, ".env"),
});

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
const ALPHA_TEST_STARTING_CASH = 5000;
const ALPHA_TEST_STARTING_BANK = 10000;
const ALPHA_TEST_STARTING_RESPECT = 1;
const RESET_GAME_ENABLED =
  process.env.ALLOW_TEST_RESET === "1" || process.env.NODE_ENV !== "production";
const RESET_GAME_TOKEN = String(process.env.RESET_GAME_TOKEN || "").trim();
const ADMIN_ACCOUNT = {
  username: "czincza11",
  email: "czincza11@hustle-city.local",
  password: "1234",
  cash: 5000000,
  bank: 5000000,
};
const SPECIAL_PROFILE_FLOORS = {
  czincza11: {
    cash: 5000000,
    bank: 5000000,
    respect: 1,
    level: 1,
  },
};
const VERBOSE_SERVER_LOGS = process.env.VERBOSE_SERVER_LOGS === "1";

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
  if (VERBOSE_SERVER_LOGS) {
    const requester = req.ip || "unknown";
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} :: ${requester}`);
  }
  next();
});

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatMoney(value) {
  return `$${Math.max(0, Math.floor(Number(value) || 0))}`;
}

function createDeck() {
  const baseCards = [
    { label: "A", value: 11, suit: "S" },
    { label: "K", value: 10, suit: "S" },
    { label: "Q", value: 10, suit: "S" },
    { label: "J", value: 10, suit: "S" },
    { label: "10", value: 10, suit: "S" },
    { label: "9", value: 9, suit: "S" },
    { label: "8", value: 8, suit: "S" },
    { label: "7", value: 7, suit: "S" },
    { label: "6", value: 6, suit: "S" },
    { label: "5", value: 5, suit: "S" },
    { label: "4", value: 4, suit: "S" },
    { label: "3", value: 3, suit: "S" },
    { label: "2", value: 2, suit: "S" },
  ];

  const suits = ["S", "H", "D", "C"];
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
  return Math.max(1, Math.floor(Number(respect) || 1));
}

function normalizePlayerLogin(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isResetAuthorized(req) {
  if (!RESET_GAME_ENABLED) return false;
  if (!RESET_GAME_TOKEN) return true;
  return req.get("x-reset-token") === RESET_GAME_TOKEN;
}

function createInitialPlayerData(username = "gracz") {
  const now = Date.now();
  return {
    profile: {
      name: username,
      avatarId: "ghost",
      avatarCustomUri: null,
      rank: "Swiezak",
      level: ALPHA_TEST_STARTING_RESPECT,
      respect: ALPHA_TEST_STARTING_RESPECT,
      xp: 0,
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
      bounty: 0,
      cash: ALPHA_TEST_STARTING_CASH,
      bank: ALPHA_TEST_STARTING_BANK,
    },
    stats: {
      heistsDone: 0,
      heistsWon: 0,
      totalEarned: 0,
      casinoWins: 0,
    },
    inventory: Object.fromEntries(MARKET_PRODUCTS.map((item) => [item.id, 0])),
    activeBoosts: [],
    drugInventory: createDrugCounterMap(),
    dealerInventory: createDealerInventory(),
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
      "Backend liczy energie i rewardy. Klient tylko to pokazuje.",
    ],
    flags: {
      alphaTestGrantApplied: false,
    },
    online: createOnlineSocialState(),
    escortsOwned: [],
    club: {
      owned: false,
      name: "Velvet Static",
      sourceId: null,
      visitId: null,
      ownerLabel: null,
      popularity: 0,
      mood: 60,
      policeBase: 0,
      note: null,
      lastRunAt: 0,
      stash: createDrugCounterMap(),
    },
  };
}

function createAdminPlayerData() {
  const playerData = createInitialPlayerData(ADMIN_ACCOUNT.username);
  playerData.profile.cash = ADMIN_ACCOUNT.cash;
  playerData.profile.bank = ADMIN_ACCOUNT.bank;
  playerData.profile.respect = 1;
  playerData.profile.level = 1;
  playerData.profile.rank = "Swiezak";
  playerData.flags.alphaTestGrantApplied = true;
  playerData.log = [
    "Konto administratora gotowe do testow.",
    "Masz gruby bankroll do sprawdzania systemow.",
  ];
  return playerData;
}

const state = {
  activeUsers: new Map(),
  market: createMarketState(),
  routeRateLimit: new Map(),
  actionLocks: new Map(),
};

await initUserStore();
await deleteUserByLogin("boss");

const existingAdmin = await findUserByLogin(ADMIN_ACCOUNT.username);
if (!existingAdmin) {
  const passwordHash = await bcrypt.hash(ADMIN_ACCOUNT.password, 10);
  await createUserRecord({
    username: ADMIN_ACCOUNT.username,
    email: ADMIN_ACCOUNT.email,
    passwordHash,
    playerData: createAdminPlayerData(),
  });
}

function pushLog(player, message) {
  player.log = [message, ...player.log].slice(0, 16);
}

function ensurePlayerExtendedState(player) {
  if (!player || typeof player !== "object") return;
  if (!player.profile || typeof player.profile !== "object") {
    player.profile = {};
  }
  if (!player.stats || typeof player.stats !== "object") {
    player.stats = {};
  }
  if (!player.inventory || typeof player.inventory !== "object" || Array.isArray(player.inventory)) {
    player.inventory = Object.fromEntries(MARKET_PRODUCTS.map((item) => [item.id, 0]));
  } else {
    for (const item of MARKET_PRODUCTS) {
      player.inventory[item.id] = Math.max(0, Math.floor(Number(player.inventory[item.id] || 0)));
    }
  }
  if (!Array.isArray(player.activeBoosts)) {
    player.activeBoosts = [];
  } else {
    player.activeBoosts = player.activeBoosts
      .filter((entry) => entry && typeof entry === "object")
      .map((entry) => ({
        id: typeof entry.id === "string" ? entry.id : `boost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof entry.name === "string" ? entry.name : "Boost",
        effect: entry.effect && typeof entry.effect === "object" && !Array.isArray(entry.effect) ? { ...entry.effect } : {},
        expiresAt: Math.max(0, Math.floor(Number(entry.expiresAt || 0))),
      }))
      .filter((entry) => entry.expiresAt > 0);
  }
  player.drugInventory = normalizeDrugInventory(player.drugInventory);
  player.dealerInventory = normalizeDealerInventory(player.dealerInventory);
  if (!player.online || typeof player.online !== "object" || Array.isArray(player.online)) {
    player.online = createOnlineSocialState();
  } else {
    if (!Array.isArray(player.online.friends)) player.online.friends = [];
    if (!Array.isArray(player.online.messages)) player.online.messages = [];
  }
  if (!Array.isArray(player.escortsOwned)) {
    player.escortsOwned = [];
  } else {
    player.escortsOwned = player.escortsOwned
      .filter((entry) => entry && typeof entry === "object" && typeof entry.id === "string")
      .map((entry) => ({
        id: entry.id,
        count: Math.max(0, Math.floor(Number(entry.count || 0))),
        working: Math.max(0, Math.floor(Number(entry.working || 0))),
        routes: entry.routes && typeof entry.routes === "object" && !Array.isArray(entry.routes)
          ? { ...entry.routes }
          : {},
      }))
      .filter((entry) => entry.count > 0);
  }
  if (!player.club || typeof player.club !== "object" || Array.isArray(player.club)) {
    player.club = {
      owned: false,
      name: "Velvet Static",
      sourceId: null,
      visitId: null,
      ownerLabel: null,
      popularity: 0,
      mood: 60,
      policeBase: 0,
      note: null,
      lastRunAt: 0,
      stash: createDrugCounterMap(),
    };
  } else {
    player.club = {
      owned: Boolean(player.club.owned),
      name: typeof player.club.name === "string" ? player.club.name : "Velvet Static",
      sourceId: player.club.sourceId ?? null,
      visitId: player.club.visitId ?? null,
      ownerLabel: player.club.ownerLabel ?? null,
      popularity: Math.max(0, Math.floor(Number(player.club.popularity || 0))),
      mood: Math.max(0, Math.floor(Number(player.club.mood || 60))),
      policeBase: Math.max(0, Math.floor(Number(player.club.policeBase || 0))),
      note: player.club.note ?? null,
      lastRunAt: Math.max(0, Math.floor(Number(player.club.lastRunAt || 0))),
      stash: normalizeDrugInventory(player.club.stash),
    };
  }
  player.profile.bounty = Math.max(0, Math.floor(Number(player.profile.bounty || 0)));
}

function ensureAlphaTestGrant(player, authUser = null) {
  if (!player || typeof player !== "object") return false;

  let changed = false;

  if (!player.flags?.alphaTestGrantApplied) {
    player.flags = {
      ...(player.flags || {}),
      alphaTestGrantApplied: true,
    };
    player.profile.cash = Math.max(Number(player.profile?.cash || 0), ALPHA_TEST_STARTING_CASH);
    player.profile.bank = Math.max(Number(player.profile?.bank || 0), ALPHA_TEST_STARTING_BANK);
    player.profile.respect = Math.max(Number(player.profile?.respect || 0), ALPHA_TEST_STARTING_RESPECT);
    player.profile.level = Math.max(Number(player.profile?.level || 0), ALPHA_TEST_STARTING_RESPECT);
    pushLog(player, "Alpha test boost wbity. Masz gruby bankroll na sprawdzanie drozszych rzeczy.");
    changed = true;
  }

  const usernameLower = normalizePlayerLogin(
    authUser?.username || player.username || player.profile?.name || ""
  );
  const specialFloors = usernameLower ? SPECIAL_PROFILE_FLOORS[usernameLower] : null;

  if (specialFloors) {
    if (Number(player.profile?.cash || 0) < specialFloors.cash) {
      player.profile.cash = specialFloors.cash;
      changed = true;
    }
    if (Number(player.profile?.bank || 0) < specialFloors.bank) {
      player.profile.bank = specialFloors.bank;
      changed = true;
    }
    if (Number(player.profile?.respect || 0) < specialFloors.respect) {
      player.profile.respect = specialFloors.respect;
      changed = true;
    }
    if (Number(player.profile?.level || 0) < specialFloors.level) {
      player.profile.level = specialFloors.level;
      changed = true;
    }
    if (changed) {
      pushLog(player, "Specjalny bankroll testowy wbity do profilu.");
    }
  }

  return changed;
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

function isUserOnline(userId, now = Date.now()) {
  const lastSeenAt = state.activeUsers.get(userId) || 0;
  return now - lastSeenAt <= 30 * 60 * 1000;
}

function buildDirectoryEntry(userRecord, now = Date.now()) {
  const profile = userRecord?.playerData?.profile || {};
  const stats = userRecord?.playerData?.stats || {};
  return {
    id: userRecord._id,
    name: profile.name || userRecord.username,
    gang: userRecord?.playerData?.gang?.name || "No gang",
    respect: Number(profile.respect || 0),
    cash: Number(profile.cash || 0) + Number(profile.bank || 0),
    attack: Number(profile.attack || 0),
    defense: Number(profile.defense || 0),
    dexterity: Number(profile.dexterity || 0),
    charisma: Number(profile.charisma || 0),
    bounty: Math.max(
      0,
      Number(profile.bounty || 0) || Math.round(Number(profile.heat || 0) * 140)
    ),
    online: isUserOnline(userRecord._id, now),
    heists: Number(stats.heistsWon || 0),
    casino: Number(stats.casinoWins || 0),
  };
}

async function buildSocialSnapshot(now = Date.now()) {
  const users = await listUsers();
  const roster = users.map((userRecord) => buildDirectoryEntry(userRecord, now));
  roster.sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1;
    if (b.respect !== a.respect) return b.respect - a.respect;
    return a.name.localeCompare(b.name, "pl");
  });
  const globalChat = (await getGlobalChatMessages(40)).map((entry) => ({
    id: entry._id,
    author: entry.author,
    text: entry.text,
    time: new Date(entry.createdAt).toISOString(),
  }));
  return { roster, globalChat };
}

async function buildFriendEntries(player, now = Date.now()) {
  ensurePlayerExtendedState(player);
  if (!player.online.friends.length) {
    return [];
  }
  const users = await listUsers();
  const directoryById = new Map(users.map((entry) => [entry._id, buildDirectoryEntry(entry, now)]));
  return player.online.friends.map((friend) => {
    const live = directoryById.get(friend.id);
    return {
      id: friend.id,
      name: live?.name || friend.name || "Gracz",
      gang: live?.gang || friend.gang || "No gang",
      online: typeof live?.online === "boolean" ? live.online : Boolean(friend.online),
      respect: Number.isFinite(live?.respect) ? live.respect : Number(friend.respect || 0),
    };
  });
}

async function persistPlayerForUser(userId, playerData) {
  if (!userId) {
    throw new Error("Cannot persist player without user id");
  }
  if (!playerData || typeof playerData !== "object" || Array.isArray(playerData)) {
    throw new Error("Cannot persist empty player data");
  }
  const updated = await saveUserPlayerData(userId, playerData);
  if (VERBOSE_SERVER_LOGS) {
    console.log(`[persist] saved player state for ${userId}`);
  }
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

async function withPlayerActionLock(req, actionKey, handler) {
  if (!req?.user?.id) {
    throw new Error("Authenticated user id missing for action lock");
  }

  return withUserMutationLocks([req.user.id], actionKey, handler);
}

async function withUserMutationLocks(userIds, actionKey, handler) {
  const keys = Array.from(
    new Set(
      (Array.isArray(userIds) ? userIds : [userIds])
        .map((userId) => String(userId || "").trim())
        .filter(Boolean)
        .map((userId) => `${userId}:mutation`)
    )
  ).sort();

  if (!keys.length) {
    throw new Error("At least one user id is required for mutation lock");
  }

  const conflictingKey = keys.find((key) => state.actionLocks.has(key));
  if (conflictingKey) {
    const error = new Error(`Another action is already in progress (${actionKey})`);
    error.statusCode = 409;
    throw error;
  }

  keys.forEach((key) => {
    state.actionLocks.set(key, true);
  });
  try {
    return await handler();
  } finally {
    keys.forEach((key) => {
      state.actionLocks.delete(key);
    });
  }
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
  ensurePlayerExtendedState(player);
  syncPlayerEnergy(player, now);
  player.activeBoosts = player.activeBoosts.filter((entry) => Number(entry?.expiresAt || 0) > now);
  player.profile.level = getLevelFromRespect(player.profile.respect);
  player.profile.xp = Math.max(0, Math.floor(Number(player.profile.xp) || 0));
  player.profile.xp = Math.min(player.profile.xp, getXpRequirementForRespect(player.profile.respect));
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

function isPlayerJailed(player, now = Date.now()) {
  return Number.isFinite(player?.profile?.jailUntil) && player.profile.jailUntil > now;
}

function getHeistJailChance(player, heist) {
  const heatFactor = (Number(player?.profile?.heat) || 0) * 0.0025;
  const defenseReduction = (Number(player?.profile?.defense) || 0) * 0.004;
  const dexterityReduction = (Number(player?.profile?.dexterity) || 0) * 0.006;

  return clamp(
    0.08 + heist.risk * 0.48 + heist.energy * 0.018 + heatFactor - defenseReduction - dexterityReduction,
    0.06,
    0.72
  );
}

function getHeistJailSentenceSeconds(player, heist) {
  const heatBonus = Math.round((Number(player?.profile?.heat) || 0) * 1.5);
  return Math.max(
    75,
    Math.round(90 + heist.energy * 55 + heist.risk * 360 + heist.respect * 4 + heatBonus)
  );
}

function logHeistEvent(message, level = "log") {
  if (!VERBOSE_SERVER_LOGS && level === "log") return;
  console[level](`[heists] ${message}`);
}

function publicPlayer(player, now = Date.now()) {
  syncPlayerState(player, now);
  return {
    id: player.id,
    username: player.username,
    profile: player.profile,
    stats: player.stats,
    inventory: player.inventory,
    activeBoosts: player.activeBoosts,
    drugInventory: player.drugInventory,
    dealerInventory: player.dealerInventory,
    escortsOwned: player.escortsOwned,
    club: player.club,
    online: {
      friends: player.online?.friends || [],
      messages: player.online?.messages || [],
    },
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

function createClientStateSummary(game) {
  const screen =
    typeof game?.ui?.screen === "string"
      ? game.ui.screen
      : typeof game?.ui?.activeSection === "string"
        ? game.ui.activeSection
        : null;

  return {
    updatedAt: new Date().toISOString(),
    screen,
  };
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
  try {
    const result = await mutator(req.player);
    const updatedRecord = await persistPlayerForUser(req.user.id, req.player);
    if (updatedRecord?.playerData) {
      req.userRecord = updatedRecord;
      req.player = updatedRecord.playerData;
    }
    const after = snapshotPlayerMutationState(req.player);
    logMutationSuccess({
      actionName,
      userId: req.user.id,
      before,
      after,
    });
    return result;
  } catch (error) {
    logMutationFailure({
      actionName,
      userId: req.user.id,
      before,
      reason: error?.message || "unknown",
    });
    throw error;
  }
}

const auth = createAuthMiddleware({
  findUserById,
  syncPlayerState,
  syncCasinoDay,
  markUserActive,
});

app.get("/health", (_req, res) => {
  sendOk(res, {
    ok: true,
    app: process.env.APP_NAME || "Hustle City API",
    economyVersion: ECONOMY_RULES.version,
    time: new Date().toISOString(),
  });
});

app.get("/api/meta", (_req, res) => {
  sendOk(res, {
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

app.post("/reset-game", asyncHandler(async (req, res) => {
  if (!isResetAuthorized(req)) {
    res.status(403).json({ error: "Reset endpoint is disabled" });
    return;
  }

  const [usersCleared, globalChatCleared] = await Promise.all([
    clearAllUsers(),
    clearGlobalChatMessages(),
  ]);

  state.activeUsers.clear();
  state.routeRateLimit.clear();
  state.actionLocks.clear();
  state.market = createMarketState();

  console.log(
    `[reset-game] cleared runtime data :: users=${usersCleared}, globalChat=${globalChatCleared}`
  );

  sendOk(res, {
    ok: true,
    testingOnly: true,
    usersCleared,
    globalChatCleared,
    gangsCleared: true,
    rankingsCleared: true,
    marketReset: true,
  });
}));

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
  const requestedUsername = sanitizeAuthInput(username || (!rawLogin.includes("@") ? rawLogin : ""));

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

  if (requestedUsername && !isValidUsername(requestedUsername)) {
    res.status(400).json({ error: "Username must be 3-18 chars and use only letters, numbers, dot, dash or underscore" });
    return;
  }

  const existingByLogin = await findUserByLogin(rawLogin);
  const existingByEmail = rawEmail ? await findUserByLogin(rawEmail) : null;
  if (existingByLogin || existingByEmail) {
    res.status(409).json({ error: "Login or email already exists" });
    return;
  }

  const nextUsername = await createAvailableUsername(rawLogin, requestedUsername);
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
  logInfo("auth", "register", {
    userId: userRecord._id,
    username: userRecord.username,
    email: userRecord.email || null,
  });
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

  if (ensureAlphaTestGrant(userRecord.playerData, userRecord)) {
    await persistPlayerForUser(userRecord._id, userRecord.playerData);
  }

  markUserActive(userRecord._id);
  logInfo("auth", "login", {
    userId: userRecord._id,
    username: userRecord.username,
  });
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
  ensureAlphaTestGrant(req.player, req.user);
  req.player.online.friends = await buildFriendEntries(req.player);
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

app.get("/social/players", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "social-players",
      800,
      "Player directory rate limit active"
    )
  ) {
    return;
  }

  const query = String(req.query?.q || "").trim().toLowerCase();
  const { roster } = await buildSocialSnapshot();
  const filtered = query
    ? roster.filter((entry) =>
        entry.name.toLowerCase().includes(query) ||
        entry.gang.toLowerCase().includes(query)
      )
    : roster;

  res.json({
    players: filtered.slice(0, 40),
  });
}));

app.post("/social/players/:id/attack", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "social-player-attack",
      1800,
      "Player attack rate limit active"
    )
  ) {
    return;
  }

  const targetUserId = String(req.params?.id || "").trim();
  if (!targetUserId) {
    res.status(400).json({ error: "Target player id is required" });
    return;
  }
  if (targetUserId === req.user.id) {
    res.status(400).json({ error: "You cannot attack yourself" });
    return;
  }

  await withUserMutationLocks([req.user.id, targetUserId], "social-player-attack", async () => {
    const [attackerRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!attackerRecord?.playerData) {
      const error = new Error("Authenticated attacker not found");
      error.statusCode = 401;
      throw error;
    }
    if (!targetRecord?.playerData) {
      const error = new Error("Target player not found");
      error.statusCode = 404;
      throw error;
    }

    const now = Date.now();
    const attacker = attackerRecord.playerData;
    const target = targetRecord.playerData;
    const targetIsOnline = isUserOnline(targetRecord._id, now);

    syncPlayerState(attacker, now);
    syncPlayerState(target, now);
    syncCasinoDay(attacker, now);
    syncCasinoDay(target, now);

    if (isPlayerJailed(attacker, now)) {
      const error = new Error("Nie odpalisz ataku zza krat.");
      error.statusCode = 409;
      throw error;
    }
    if (Number(attacker.profile?.energy || 0) < 2) {
      const error = new Error("Za malo energii na atak gracza.");
      error.statusCode = 409;
      throw error;
    }
    if (!targetIsOnline) {
      const error = new Error("Ten gracz nie jest teraz online.");
      error.statusCode = 409;
      throw error;
    }

    const attackerName =
      attacker?.profile?.name || attackerRecord.username || "Gracz";
    const targetName =
      target?.profile?.name || targetRecord.username || "Gracz";

    const attackerPower =
      Number(attacker.profile?.attack || 0) * 1.1 +
      Number(attacker.profile?.defense || 0) * 0.7 +
      Number(attacker.profile?.dexterity || 0) * 1.3 +
      Number(attacker.profile?.respect || 0) * 0.35;
    const defenderPower =
      Number(target.profile?.attack || 0) * 1.05 +
      Number(target.profile?.defense || 0) * 0.8 +
      Number(target.profile?.dexterity || 0) * 1.15 +
      Number(target.profile?.respect || 0) * 0.32;
    const successChance = clamp(
      0.4 + (attackerPower - defenderPower) / 120 - Number(attacker.profile?.heat || 0) * 0.002,
      0.08,
      0.9
    );

    const attackSucceeded = Math.random() < successChance;
    let steal = 0;
    let damage = 0;
    let message = "";

    attacker.profile.energy = Math.max(0, Number(attacker.profile.energy || 0) - 2);

    if (attackSucceeded) {
      steal = Math.min(
        Number(target.profile?.cash || 0),
        Math.max(250, randomBetween(400, 2400))
      );
      attacker.profile.cash = Number(attacker.profile.cash || 0) + steal;
      attacker.profile.heat = clamp(Number(attacker.profile.heat || 0) + 6, 0, 100);
      target.profile.cash = Math.max(0, Number(target.profile.cash || 0) - steal);

      message = `Udany atak na ${targetName}. Zgarniete ${formatMoney(steal)}.`;
      pushLog(attacker, message);
      pushLog(target, `${attackerName} zaatakowal Cie i zabral ${formatMoney(steal)}.`);
    } else {
      damage = randomBetween(8, 18);
      attacker.profile.hp = clamp(Number(attacker.profile.hp || 0) - damage, 0, Number(attacker.profile.maxHp || 0));
      attacker.profile.heat = clamp(Number(attacker.profile.heat || 0) + 3, 0, 100);

      message = `Atak na ${targetName} nie wyszedl. Dostales po lapach.`;
      pushLog(attacker, message);
      pushLog(target, `${attackerName} probowal Cie zaatakowac, ale nie dowiozl akcji.`);
    }

    const [updatedAttackerRecord, updatedTargetRecord] = await Promise.all([
      persistPlayerForUser(attackerRecord._id, attacker),
      persistPlayerForUser(targetRecord._id, target),
    ]);

    req.userRecord = updatedAttackerRecord;
    req.player = updatedAttackerRecord?.playerData || attacker;

    logInfo("pvp", "player-attack", {
      attackerId: attackerRecord._id,
      targetUserId: targetRecord._id,
      success: attackSucceeded,
      chance: Number(successChance.toFixed(4)),
      steal,
      damage,
    });

    res.json({
      user: publicPlayer(req.player, now),
      target: buildDirectoryEntry(updatedTargetRecord || targetRecord, now),
      result: {
        success: attackSucceeded,
        chance: Number(successChance.toFixed(4)),
        steal,
        damage,
        message,
      },
    });
  });
}));

app.get("/social/friends", auth, asyncHandler(async (req, res) => {
  const friends = await buildFriendEntries(req.player);
  res.json({ friends });
}));

app.post("/social/friends/:id", auth, asyncHandler(async (req, res) => {
  const targetUserId = String(req.params?.id || "").trim();
  if (!targetUserId) {
    res.status(400).json({ error: "Target player id is required" });
    return;
  }
  if (targetUserId === req.user.id) {
    res.status(400).json({ error: "Nie dodasz siebie do znajomych." });
    return;
  }

  await withUserMutationLocks([req.user.id, targetUserId], "social-friend-add", async () => {
    const [actorRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    const now = Date.now();
    const actor = actorRecord.playerData;
    const target = targetRecord.playerData;
    syncPlayerState(actor, now);
    syncPlayerState(target, now);
    syncCasinoDay(actor, now);
    syncCasinoDay(target, now);

    const targetEntry = buildDirectoryEntry(targetRecord, now);
    const actorName = actor.profile?.name || actorRecord.username || "Gracz";
    const result = addFriendForPlayer(actor, targetEntry, now);
    appendPlayerMessage(target, {
      from: actorName,
      subject: "Nowe zaproszenie do znajomych",
      preview: `${actorName} chce dodac Cie do znajomych.`,
      time: new Date(now).toISOString(),
    });
    pushLog(actor, result.logMessage);
    pushLog(target, `${actorName} wysyla Ci zaproszenie do znajomych.`);

    const [updatedActorRecord, updatedTargetRecord] = await Promise.all([
      persistPlayerForUser(actorRecord._id, actor),
      persistPlayerForUser(targetRecord._id, target),
    ]);

    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;

    logInfo("social", "friend-add", {
      userId: actorRecord._id,
      targetUserId: targetRecord._id,
    });

    res.json({
      user: publicPlayer(req.player, now),
      target: buildDirectoryEntry(updatedTargetRecord || targetRecord, now),
      result: {
        message: result.logMessage,
      },
    });
  });
}));

app.get("/social/messages", auth, asyncHandler(async (req, res) => {
  ensurePlayerExtendedState(req.player);
  res.json({
    messages: req.player.online.messages || [],
  });
}));

app.post("/social/messages/:id", auth, asyncHandler(async (req, res) => {
  const targetUserId = String(req.params?.id || "").trim();
  const rawMessage = typeof req.body?.message === "string" ? req.body.message.trim() : "";
  if (!targetUserId) {
    res.status(400).json({ error: "Target player id is required" });
    return;
  }
  if (targetUserId === req.user.id) {
    res.status(400).json({ error: "Nie wysylasz prywatnej wiadomosci do siebie." });
    return;
  }
  if (typeof req.body?.message === "string" && !rawMessage) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  if (rawMessage.length > 280) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  await withUserMutationLocks([req.user.id, targetUserId], "social-message-send", async () => {
    const [actorRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    const now = Date.now();
    const actor = actorRecord.playerData;
    const target = targetRecord.playerData;
    syncPlayerState(actor, now);
    syncPlayerState(target, now);
    syncCasinoDay(actor, now);
    syncCasinoDay(target, now);

    const actorName = actor.profile?.name || actorRecord.username || "Gracz";
    const targetName = target.profile?.name || targetRecord.username || "Gracz";
    const result = rawMessage
      ? sendPlayerMessageBetweenPlayers(actor, target, {
          senderName: actorName,
          targetName,
          message: rawMessage,
          now,
        })
      : sendQuickMessageBetweenPlayers(actor, target, actorName, targetName, now);
    pushLog(actor, result.logMessage);
    pushLog(target, rawMessage ? `${actorName} wysyla Ci prywatna wiadomosc.` : `${actorName} zostawia Ci szybka wiadomosc.`);

    const [updatedActorRecord, updatedTargetRecord] = await Promise.all([
      persistPlayerForUser(actorRecord._id, actor),
      persistPlayerForUser(targetRecord._id, target),
    ]);

    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;

    logInfo("social", "direct-message", {
      userId: actorRecord._id,
      targetUserId: targetRecord._id,
      length: rawMessage.length || 0,
    });

    res.json({
      user: publicPlayer(req.player, now),
      target: buildDirectoryEntry(updatedTargetRecord || targetRecord, now),
      result: {
        message: result.logMessage,
        preview: result.preview,
      },
    });
  });
}));

app.post("/social/players/:id/bounty", auth, asyncHandler(async (req, res) => {
  const targetUserId = String(req.params?.id || "").trim();
  if (!targetUserId) {
    res.status(400).json({ error: "Target player id is required" });
    return;
  }
  if (targetUserId === req.user.id) {
    res.status(400).json({ error: "Nie wystawisz bounty na siebie." });
    return;
  }

  await withUserMutationLocks([req.user.id, targetUserId], "social-bounty-place", async () => {
    const [actorRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    const now = Date.now();
    const actor = actorRecord.playerData;
    const target = targetRecord.playerData;
    syncPlayerState(actor, now);
    syncPlayerState(target, now);
    syncCasinoDay(actor, now);
    syncCasinoDay(target, now);

    const targetName = target.profile?.name || targetRecord.username || "Gracz";
    const result = placeBountyOnPlayer(actor, target, targetName, now);
    pushLog(actor, result.logMessage);
    pushLog(target, `Na Twoja glowe wjezdza dodatkowe bounty: ${formatMoney(result.increment)}.`);

    const [updatedActorRecord, updatedTargetRecord] = await Promise.all([
      persistPlayerForUser(actorRecord._id, actor),
      persistPlayerForUser(targetRecord._id, target),
    ]);

    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;

    logInfo("social", "bounty-place", {
      userId: actorRecord._id,
      targetUserId: targetRecord._id,
      increment: result.increment,
    });

    res.json({
      user: publicPlayer(req.player, now),
      target: buildDirectoryEntry(updatedTargetRecord || targetRecord, now),
      result: {
        message: result.logMessage,
        increment: result.increment,
      },
    });
  });
}));

app.get("/social/rankings", auth, asyncHandler(async (_req, res) => {
  const { roster } = await buildSocialSnapshot();
  res.json({
    byRespect: [...roster].sort((a, b) => b.respect - a.respect).slice(0, 12),
    byCash: [...roster].sort((a, b) => b.cash - a.cash).slice(0, 12),
    byHeists: [...roster].sort((a, b) => b.heists - a.heists).slice(0, 12),
    byCasino: [...roster].sort((a, b) => b.casino - a.casino).slice(0, 12),
  });
}));

app.get("/chat/global", auth, asyncHandler(async (_req, res) => {
  const { globalChat } = await buildSocialSnapshot();
  res.json({ messages: globalChat });
}));

app.post("/chat/global", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "chat-global",
      1200,
      "Global chat rate limit active"
    )
  ) {
    return;
  }

  const text = String(req.body?.text || "").trim();
  if (!text) {
    res.status(400).json({ error: "Message is required" });
    return;
  }
  if (text.length > 280) {
    res.status(400).json({ error: "Message too long" });
    return;
  }

  const author = req.player?.profile?.name || req.user?.username || "Gracz";
  await addGlobalChatMessage({
    userId: req.user.id,
    author,
    text,
  });
  logInfo("chat", "global-message", {
    userId: req.user.id,
    author,
    textLength: text.length,
  });

  const { globalChat } = await buildSocialSnapshot();
  res.json({ messages: globalChat });
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

  req.player.clientState = createClientStateSummary(safeGame);
  await commitPlayerMutation(req, "sync-client-state", async () => ({ ok: true }));
  res.json({
    ok: true,
    authoritative: true,
    user: publicPlayer(req.player),
  });
}));

app.post("/player/profile/avatar", auth, asyncHandler(async (req, res) => {
  const avatarId = String(req.body?.avatarId || "").trim();

  await withPlayerActionLock(req, "player-profile-avatar", async () => {
    await commitPlayerMutation(req, "player-profile-avatar", async (player) => {
      const { logMessage } = updatePlayerAvatar(player, avatarId);
      pushLog(player, logMessage);
      return null;
    });
  });

  res.json({ user: publicPlayer(req.player) });
}));

app.post("/player/gym/pass", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const passId = String(req.body?.passId || "").trim();

  await withPlayerActionLock(req, "player-gym-pass", async () => {
    await commitPlayerMutation(req, "player-gym-pass", async (player) => {
      const { logMessage } = buyGymPassForPlayer(player, passId, now);
      pushLog(player, logMessage);
      return null;
    });
  });

  res.json({ user: publicPlayer(req.player, now) });
}));

app.post("/player/gym/train", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const exerciseId = String(req.body?.exerciseId || "").trim();

  await withPlayerActionLock(req, "player-gym-train", async () => {
    await commitPlayerMutation(req, "player-gym-train", async (player) => {
      const { logMessage } = trainPlayerAtGym(player, exerciseId, now);
      pushLog(player, logMessage);
      return null;
    });
  });

  res.json({ user: publicPlayer(req.player, now) });
}));

app.post("/player/restaurant/eat", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const itemId = String(req.body?.itemId || "").trim();

  await withPlayerActionLock(req, "player-restaurant-eat", async () => {
    await commitPlayerMutation(req, "player-restaurant-eat", async (player) => {
      const { logMessage } = buyRestaurantItemForPlayer(player, itemId, now);
      pushLog(player, logMessage);
      return null;
    });
  });

  res.json({ user: publicPlayer(req.player, now) });
}));

app.post("/player/hospital/heal", auth, asyncHandler(async (req, res) => {
  await withPlayerActionLock(req, "player-hospital-heal", async () => {
    await commitPlayerMutation(req, "player-hospital-heal", async (player) => {
      const { logMessage } = healPlayer(player);
      pushLog(player, logMessage);
      return null;
    });
  });

  res.json({ user: publicPlayer(req.player) });
}));

app.post("/player/jail/bribe", auth, asyncHandler(async (req, res) => {
  const now = Date.now();

  await withPlayerActionLock(req, "player-jail-bribe", async () => {
    await commitPlayerMutation(req, "player-jail-bribe", async (player) => {
      const { logMessage } = bribePlayerOutOfJail(player, now);
      pushLog(player, logMessage);
      return null;
    });
  });

  res.json({ user: publicPlayer(req.player, now) });
}));

app.post("/fightclub/round", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;

  await withPlayerActionLock(req, "fightclub-round", async () => {
    await commitPlayerMutation(req, "fightclub-round", async (player) => {
      result = fightClubRoundForPlayer(player);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("fightclub", "round", {
    userId: req.user.id,
    success: Boolean(result?.success),
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/dealer/buy", auth, asyncHandler(async (req, res) => {
  const drugId = String(req.body?.drugId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "dealer-buy", async () => {
    await commitPlayerMutation(req, "dealer-buy", async (player) => {
      result = buyDrugFromDealerForPlayer(player, drugId);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("dealer", "buy", {
    userId: req.user.id,
    drugId,
    price: result?.price || 0,
  });

  res.json({
    user: publicPlayer(req.player),
    result,
  });
}));

app.post("/dealer/sell", auth, asyncHandler(async (req, res) => {
  const drugId = String(req.body?.drugId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "dealer-sell", async () => {
    await commitPlayerMutation(req, "dealer-sell", async (player) => {
      result = sellDrugToDealerForPlayer(player, drugId);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("dealer", "sell", {
    userId: req.user.id,
    drugId,
    payout: result?.payout || 0,
  });

  res.json({
    user: publicPlayer(req.player),
    result,
  });
}));

app.post("/dealer/consume", auth, asyncHandler(async (req, res) => {
  const drugId = String(req.body?.drugId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "dealer-consume", async () => {
    await commitPlayerMutation(req, "dealer-consume", async (player) => {
      result = consumeDrugForPlayer(player, drugId, Date.now());
      pushLog(player, result.logMessage);
    });
  });

  res.json({
    user: publicPlayer(req.player),
    result,
  });
}));

app.post("/clubs/search-escort", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const venueId = String(req.body?.venueId || req.player?.club?.visitId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "clubs-search-escort", async () => {
    await commitPlayerMutation(req, "clubs-search-escort", async (player) => {
      result = searchEscortInClubForPlayer(player, venueId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("clubs", "search-escort", {
    userId: req.user.id,
    venueId,
    outcome: result?.outcome || "unknown",
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
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

  await withPlayerActionLock(req, "market-buy", async () => {
    await commitPlayerMutation(req, "market-buy", async (player) => {
      player.profile.cash -= quote.total;
      player.inventory[product.id] += qty;
      pushLog(
        player,
        `Kupiono ${qty}x ${product.name} za $${quote.total}. Rynek: ${quote.streetUnits}, fallback NPC: ${quote.fallbackUnits}.`
      );
      return null;
    });
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

  await withPlayerActionLock(req, "market-sell", async () => {
    await commitPlayerMutation(req, "market-sell", async (player) => {
      player.inventory[product.id] -= qty;
      player.profile.cash += sale.total;
      player.stats.totalEarned += sale.total;
      pushLog(player, `Sprzedano ${qty}x ${product.name} za $${sale.total}. Towar zasila uliczna podaz.`);
      return null;
    });
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

  await withPlayerActionLock(req, "bank-deposit", async () => {
    await commitPlayerMutation(req, "bank-deposit", async (player) => {
      player.profile.cash -= totalCost;
      player.profile.bank += amount;
      pushLog(player, `Wplacono do banku $${amount}. Fee: $${fee}.`);
      return null;
    });
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

  await withPlayerActionLock(req, "bank-withdraw", async () => {
    await commitPlayerMutation(req, "bank-withdraw", async (player) => {
      player.profile.bank -= totalDebit;
      player.profile.cash += amount;
      pushLog(player, `Wyplacono z banku $${amount}. Fee: $${fee}.`);
      return null;
    });
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
  const settled = await withPlayerActionLock(req, "casino-slot", async () =>
    commitPlayerMutation(req, "casino-slot", async (player) =>
      settleCasinoResult(player, {
        gameId: "slot",
        stake: guard.amount,
        totalReturn,
        message:
          totalReturn > 0
            ? `Slot: ${outcome.label}. Wraca $${totalReturn} przy stawce $${guard.amount}.`
            : `Slot: pudlo. Automat bierze $${guard.amount}.`,
      })
    )
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
  const settled = await withPlayerActionLock(req, "casino-high-risk", async () =>
    commitPlayerMutation(req, "casino-high-risk", async (player) =>
      settleCasinoResult(player, {
        gameId: "highRisk",
        stake: guard.amount,
        totalReturn,
        message: win
          ? `High-risk bet: ${CASINO_RULES.highRisk.winMessage} Wraca $${totalReturn}.`
          : `High-risk bet: ${CASINO_RULES.highRisk.lossMessage} Tracisz $${guard.amount}.`,
      })
    )
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
  await withPlayerActionLock(req, "casino-blackjack-start", async () => {
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
  await withPlayerActionLock(req, "casino-blackjack-hit", async () => {
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
  await withPlayerActionLock(req, "casino-blackjack-stand", async () => {
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
        message = "Krupier bierze pule.";
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
  logHeistEvent(`catalog requested by ${req.user?.username || req.user?.id || "unknown"} :: ${HEIST_DEFINITIONS.length} entries`);
  res.json({ heists: HEIST_DEFINITIONS });
}));

app.get("/heists/:id", auth, asyncHandler(async (req, res) => {
  const heist = getHeistById(req.params.id);
  if (!heist) {
    logHeistEvent(`invalid catalog id requested: ${req.params.id}`, "warn");
    res.status(404).json({ error: "Heist not found", heistId: req.params.id });
    return;
  }

  await commitPlayerMutation(req, "heist-detail-touch", async () => ({ ok: true }));
  res.json({ heist });
}));

app.post("/heists/:id/execute", auth, asyncHandler(async (req, res) => {
  const heist = getHeistById(req.params.id);
  if (!heist) {
    logHeistEvent(`invalid execute id from ${req.user?.username || req.user?.id || "unknown"} :: ${req.params.id}`, "warn");
    res.status(404).json({ error: "Heist not found", heistId: req.params.id });
    return;
  }

  const now = Date.now();
  const player = req.player;
  syncPlayerState(player, now);

  if (isPlayerJailed(player, now)) {
    res.status(423).json({ error: "Siedzisz w wiezieniu. Najpierw odsiadka albo kaucja." });
    return;
  }

  if (player.profile.respect < heist.respect) {
    res.status(400).json({ error: `Masz za niski szacunek. Wymagany szacunek: ${heist.respect}` });
    return;
  }
  if (player.profile.energy < heist.energy) {
    res.status(400).json({ error: "Not enough energy" });
    return;
  }

  const chance = getHeistSuccessChance(player, heist);

  if (Math.random() < chance) {
    const gain = randomBetween(heist.reward[0], heist.reward[1]);
    const xpGain = randomBetween(heist.xpGain[0], heist.xpGain[1]);
    await withPlayerActionLock(req, `heist:${heist.id}`, async () => {
      await commitPlayerMutation(req, "heist-success", async (currentPlayer) => {
        currentPlayer.profile.energy -= heist.energy;
        currentPlayer.timers.energyUpdatedAt = now;
        currentPlayer.stats.heistsDone += 1;
        currentPlayer.profile.cash += gain;
        const progression = applyXpProgression(
          { respect: currentPlayer.profile.respect, xp: currentPlayer.profile.xp },
          xpGain
        );
        currentPlayer.profile.respect = progression.respect;
        currentPlayer.profile.xp = progression.xp;
        currentPlayer.profile.level = progression.respect;
        currentPlayer.profile.heat = clamp(currentPlayer.profile.heat + heist.heatOnSuccess, 0, 100);
        currentPlayer.stats.heistsWon += 1;
        currentPlayer.stats.totalEarned += gain;
        pushLog(currentPlayer, `Napad udany: ${heist.name}. Wpada $${gain} i +${xpGain} XP.`);
        return null;
      });
    });
    res.json({
      result: "success",
      reward: gain,
      xpGain,
      chance,
      user: publicPlayer(player, now),
    });
    logHeistEvent(
      `${req.user?.username || req.user?.id || "unknown"} -> ${heist.id} :: success reward=$${gain} xp=${xpGain} energy=${player.profile.energy}`
    );
    logInfo("heists", "execute-success", {
      userId: req.user.id,
      heistId: heist.id,
      reward: gain,
      xpGain,
    });
    return;
  }

  const loss = randomBetween(heist.failCashLoss[0], heist.failCashLoss[1]);
  const damage = randomBetween(heist.hpLoss[0], heist.hpLoss[1]);
  const jailChance = getHeistJailChance(player, heist);
  const jailed = Math.random() < jailChance;
  const jailSeconds = jailed ? getHeistJailSentenceSeconds(player, heist) : 0;

  await withPlayerActionLock(req, `heist:${heist.id}`, async () => {
    await commitPlayerMutation(req, "heist-failure", async (currentPlayer) => {
      currentPlayer.profile.energy -= heist.energy;
      currentPlayer.timers.energyUpdatedAt = now;
      currentPlayer.stats.heistsDone += 1;
      currentPlayer.profile.cash = Math.max(0, currentPlayer.profile.cash - loss);
      currentPlayer.profile.hp = Math.max(1, currentPlayer.profile.hp - damage);
      currentPlayer.profile.heat = clamp(currentPlayer.profile.heat + heist.heatOnFailure, 0, 100);
      if (jailed) {
        currentPlayer.profile.jailUntil = Math.max(currentPlayer.profile.jailUntil || 0, now + jailSeconds * 1000);
        pushLog(
          currentPlayer,
          `Wtopa na akcji: ${heist.name}. Tracisz $${loss}, ${damage} HP i siadasz na ${Math.ceil(jailSeconds / 60)} min.`
        );
      } else {
        pushLog(currentPlayer, `Wtopa na akcji: ${heist.name}. Tracisz $${loss} i ${damage} HP.`);
      }
      return null;
    });
  });
  res.json({
    result: "failure",
    loss,
    damage,
    chance,
    jailChance,
    jailed,
    jailSeconds,
    user: publicPlayer(player, now),
  });
  logHeistEvent(
    `${req.user?.username || req.user?.id || "unknown"} -> ${heist.id} :: failure loss=$${loss} damage=${damage} jailed=${jailed ? "yes" : "no"}`
  );
  logWarn("heists", "execute-failure", {
    userId: req.user.id,
    heistId: heist.id,
    loss,
    damage,
    jailed,
    jailSeconds,
  });
}));

app.use((req, res) => {
  sendError(res, "Route not found", 404, {
    method: req.method,
    path: req.path,
  });
});

app.use((error, _req, res, _next) => {
  logError("api", "unhandled-error", {
    message: error?.message || "unknown",
    statusCode: error?.statusCode || 500,
    type: error?.type,
  });
  if (error?.type === "entity.parse.failed") {
    sendError(res, "Invalid JSON body", 400);
    return;
  }
  if (error?.message === "CORS blocked") {
    sendError(res, "CORS blocked", 403);
    return;
  }
  sendError(res, error?.message || "Internal server error", error?.statusCode || 500);
});

app.listen(port, host, () => {
  logInfo("api", "server-started", {
    host,
    port,
    corsOrigins: allowedOrigins.length ? allowedOrigins.join(",") : "all",
  });
});

