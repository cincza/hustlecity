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
  addPrisonChatMessage,
  clearAllUsers,
  clearGlobalChatMessages,
  clearPrisonChatMessages,
  createAvailableUsername,
  createUserRecord,
  deleteUserByLogin,
  findUserById,
  findUserByLogin,
  getGlobalChatMessages,
  getPrisonChatMessages,
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
  applyClubVisitDeltaToOwnerClub,
  addFriendForPlayer,
  appendPlayerMessage,
  buyDrugFromDealerForPlayer,
  consumeDrugForPlayer,
  fightClubRoundForPlayer,
  placeBountyOnPlayer,
  performClubActionForPlayer,
  sellDrugToDealerForPlayer,
  sendPlayerMessageBetweenPlayers,
  sendQuickMessageBetweenPlayers,
} from "./services/socialActionService.js";
import {
  assignEscortToStreetForPlayer,
  buyBusinessForPlayer,
  buyEscortForPlayer,
  buyFactoryForPlayer,
  buyFactorySupplyForPlayer,
  claimTaskForPlayer,
  collectBusinessIncomeForPlayer,
  collectEscortIncomeForPlayer,
  ensurePlayerEmpireState,
  pullEscortFromStreetForPlayer,
  produceDrugForPlayer,
  sellEscortForPlayer,
  syncBusinessCollections,
  syncEscortCollections,
  upgradeBusinessForPlayer,
} from "./services/empireActionService.js";
import {
  applyGangGoalRewardToPlayer,
  claimClubVenueForPlayer,
  applyHeistDistrictOutcome,
  applyClubActionDistrictOutcome,
  applyOperationDistrictOutcome,
  collectClubSafeForPlayer,
  enterClubVenueForPlayer,
  ensurePlayerCityState,
  foundClubForPlayer,
  fortifyClubForPlayer,
  consumeClubStashDrugForPlayer,
  leaveClubVenueForPlayer,
  moveDrugToClubForPlayer,
  resolveClubDistrictId,
  runClubNightForPlayer,
  setClubEntryFeeForPlayer,
  setClubNightPlanForPlayer,
  settleClubPassiveReportForPlayer,
  syncCityStateForPlayer,
} from "./services/districtService.js";
import {
  claimGangWeeklyGoalForPlayer,
  contributeGangVaultForPlayer,
  createGangForPlayer,
  ensurePlayerGangState,
  investGangProjectForPlayer,
  joinGangForPlayer,
  leaveGangForPlayer,
  setGangFocusForPlayer,
  syncGangDerivedState,
  updateGangMemberRoleForPlayers,
  updateGangSettingsForPlayer,
} from "./services/gangProjectService.js";
import {
  joinGangHeistLobbyForGang,
  leaveGangHeistLobbyForGang,
  openGangHeistLobbyForGang,
  rescueGangHeistCrewForGang,
  startGangHeistForGang,
  upgradeGangCapacityForGang,
} from "./services/gangHeistService.js";
import {
  buildGangRaidPreview,
  executeGangRaidForPlayers,
  sendGangAllianceOfferForPlayers,
} from "./services/gangPvpService.js";
import {
  advanceOperationForPlayer,
  ensurePlayerOperationState,
  executeOperationForPlayer,
  startOperationForPlayer,
} from "./services/operationService.js";
import {
  buildContractBoardForPlayer,
  buyContractCarForPlayer,
  buyContractItemForPlayer,
  ensurePlayerContractState,
  equipContractLoadoutForPlayer,
  executeContractForPlayer,
} from "./services/contractService.js";
import {
  applyAdminProfileFloors,
  buildAdminPublicState,
  grantCashToPlayerByAdmin,
  grantRespectToPlayerByAdmin,
} from "./services/adminActionService.js";
import { sendError, sendOk } from "./utils/http.js";
import { applyXpProgression, getXpRequirementForRespect } from "../../shared/progression.js";
import {
  clampGangInviteRespectMin,
  GANG_INVITE_RESPECT_MIN,
  normalizeGangState,
  getGangProjectEffects,
} from "../../shared/gangProjects.js";
import { GANG_HEISTS, getGangHeistById } from "../../shared/gangHeists.js";
import {
  createAuthMiddleware,
  getBearerToken,
  signAuthToken,
  verifyAuthToken,
} from "./middleware/auth.js";
import { logError, logInfo, logWarn } from "./utils/logger.js";
import {
  CLUB_MARKET,
  createClubState,
  createDealerInventory,
  createDrugCounterMap,
  createOnlineSocialState,
  findClubVenueById,
  getDefaultClubEntryFee,
  getClubNightPlan,
  getClubPressureAfterDecay,
  getClubTrafficAfterDecay,
  normalizeDealerInventory,
  normalizeDrugInventory,
  normalizeClubState,
} from "../../shared/socialGameplay.js";
import { createBusinessCollections, createSupplyCounterMap } from "../../shared/empire.js";
import { normalizeEscortsOwned } from "../../shared/street.js";
import { createCityState, findDistrictById, getDistrictSummaries } from "../../shared/districts.js";
import { createGangState } from "../../shared/gangProjects.js";
import { createOperationsState, getOperationById, OPERATION_CATALOG } from "../../shared/operations.js";
import { createContractState } from "../../shared/contracts.js";
import {
  ADMIN_CASH_GRANT_MAX,
  ADMIN_DEFAULT_USERNAME,
  ADMIN_PROFILE_FLOORS,
  ADMIN_RESPECT_GRANT_MAX,
} from "../../shared/admin.js";

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
const ALPHA_TEST_STARTING_CASH = Math.max(0, Math.floor(Number(process.env.ALPHA_TEST_STARTING_CASH || 5000)));
const ALPHA_TEST_STARTING_BANK = Math.max(0, Math.floor(Number(process.env.ALPHA_TEST_STARTING_BANK || 10000)));
const ALPHA_TEST_STARTING_RESPECT = Math.max(1, Math.floor(Number(process.env.ALPHA_TEST_STARTING_RESPECT || 1)));
const RESET_GAME_ENABLED =
  process.env.ALLOW_TEST_RESET === "1" || process.env.NODE_ENV !== "production";
const RESET_GAME_TOKEN = String(process.env.RESET_GAME_TOKEN || "").trim();
const ADMIN_ACCOUNT = {
  username: ADMIN_DEFAULT_USERNAME,
  email: "czincza11@hustle-city.local",
  password: "1234",
  cash: ADMIN_PROFILE_FLOORS.cash,
  bank: ADMIN_PROFILE_FLOORS.bank,
};
const ADMIN_USERNAMES = new Set(
  [
    ADMIN_ACCOUNT.username,
    ...String(process.env.ADMIN_USERNAMES || "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  ]
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean)
);
const VERBOSE_SERVER_LOGS = process.env.VERBOSE_SERVER_LOGS === "1";

function isPrivateIpv4Host(hostname) {
  if (typeof hostname !== "string" || !hostname) {
    return false;
  }

  if (/^10(?:\.\d{1,3}){3}$/i.test(hostname)) {
    return true;
  }

  if (/^192\.168(?:\.\d{1,3}){2}$/i.test(hostname)) {
    return true;
  }

  const match172 = hostname.match(/^172\.(\d{1,3})(?:\.\d{1,3}){2}$/i);
  if (match172) {
    const secondOctet = Number(match172[1]);
    return Number.isFinite(secondOctet) && secondOctet >= 16 && secondOctet <= 31;
  }

  return false;
}

function isImplicitlyAllowedOrigin(origin) {
  if (typeof origin !== "string" || !origin.trim()) {
    return false;
  }

  let parsed;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return true;
  }

  if (isPrivateIpv4Host(hostname)) {
    return true;
  }

  return hostname.endsWith(".netlify.app");
}

function asyncHandler(handler) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function normalizeRuntimeUsername(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : "";
}

function isAdminUsername(username) {
  return ADMIN_USERNAMES.has(normalizeRuntimeUsername(username));
}

function requireAdminRequest(req, res) {
  if (isAdminUsername(req?.user?.username)) {
    return true;
  }

  res.status(403).json({ error: "Admin only" });
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.length === 0 ||
        allowedOrigins.includes(origin) ||
        isImplicitlyAllowedOrigin(origin)
      ) {
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
      gangHeistsWon: 0,
      totalEarned: 0,
      casinoWins: 0,
      drugBatches: 0,
    },
    inventory: Object.fromEntries(MARKET_PRODUCTS.map((item) => [item.id, 0])),
    activeBoosts: [],
    drugInventory: createDrugCounterMap(),
    dealerInventory: createDealerInventory(),
    cooldowns: {
      heists: {},
      casinoActionUntil: 0,
      playerAttackUntil: 0,
      playerAttackTargets: {},
      gangAttackUntil: 0,
      gangAttackTargets: {},
    },
    timers: {
      energyUpdatedAt: now,
      hpUpdatedAt: now,
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
    gang: createGangState(),
    club: createClubState(),
    city: createCityState(),
    operations: createOperationsState(),
    contracts: createContractState(),
    businessesOwned: [],
    businessUpgrades: {},
    factoriesOwned: {},
    supplies: createSupplyCounterMap(0),
    tasksClaimed: [],
    collections: createBusinessCollections(),
  };
}

function createAdminPlayerData() {
  const playerData = createInitialPlayerData(ADMIN_ACCOUNT.username);
  applyAdminProfileFloors(playerData);
  playerData.profile.cash = ADMIN_ACCOUNT.cash;
  playerData.profile.bank = ADMIN_ACCOUNT.bank;
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
  player.stats.gangHeistsWon = Math.max(0, Math.floor(Number(player.stats.gangHeistsWon || 0)));
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
  if (!player.timers || typeof player.timers !== "object" || Array.isArray(player.timers)) {
    player.timers = {};
  }
  const now = Date.now();
  player.timers.energyUpdatedAt = Math.max(0, Math.floor(Number(player.timers.energyUpdatedAt || now)));
  player.timers.hpUpdatedAt = Math.max(0, Math.floor(Number(player.timers.hpUpdatedAt || now)));
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
    player.escortsOwned = normalizeEscortsOwned(player.escortsOwned);
  }
  player.club = normalizeClubState(player.club);
  ensurePlayerGangState(player);
  ensurePlayerCityState(player);
  ensurePlayerOperationState(player);
  ensurePlayerContractState(player);
  if (player.club?.owned && !player.club.districtId) {
    player.club.districtId = resolveClubDistrictId(player, player.club.sourceId);
  }
  ensurePlayerEmpireState(player);
  if (!player.cooldowns || typeof player.cooldowns !== "object" || Array.isArray(player.cooldowns)) {
    player.cooldowns = {};
  }
  if (!player.cooldowns.heists || typeof player.cooldowns.heists !== "object" || Array.isArray(player.cooldowns.heists)) {
    player.cooldowns.heists = {};
  }
  player.cooldowns.casinoActionUntil = Math.max(0, Number(player.cooldowns.casinoActionUntil || 0));
  player.cooldowns.playerAttackUntil = Math.max(0, Number(player.cooldowns.playerAttackUntil || 0));
  player.cooldowns.gangAttackUntil = Math.max(0, Number(player.cooldowns.gangAttackUntil || 0));
  player.cooldowns.playerAttackTargets =
    player.cooldowns.playerAttackTargets && typeof player.cooldowns.playerAttackTargets === "object" && !Array.isArray(player.cooldowns.playerAttackTargets)
      ? Object.fromEntries(
          Object.entries(player.cooldowns.playerAttackTargets)
            .map(([targetUserId, until]) => [String(targetUserId || "").trim(), Math.max(0, Number(until || 0))])
            .filter(([targetUserId, until]) => targetUserId && until > Date.now())
        )
      : {};
  player.cooldowns.gangAttackTargets =
    player.cooldowns.gangAttackTargets && typeof player.cooldowns.gangAttackTargets === "object" && !Array.isArray(player.cooldowns.gangAttackTargets)
      ? Object.fromEntries(
          Object.entries(player.cooldowns.gangAttackTargets)
            .map(([targetKey, until]) => [String(targetKey || "").trim().toLowerCase(), Math.max(0, Number(until || 0))])
            .filter(([targetKey, until]) => targetKey && until > Date.now())
        )
      : {};
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

  if (isAdminUsername(authUser?.username || player.username || player.profile?.name)) {
    changed = applyAdminProfileFloors(player, { includeEconomy: false }) || changed;
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
    avatarId:
      typeof profile.avatarId === "string" && profile.avatarId.trim()
        ? profile.avatarId.trim()
        : "ghost",
    avatarCustomUri:
      typeof profile.avatarCustomUri === "string" && profile.avatarCustomUri.trim()
        ? profile.avatarCustomUri.trim()
        : null,
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

function slugifyGangName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function getGangRoleWeight(role) {
  switch (String(role || "").trim()) {
    case "Boss":
      return 0;
    case "Vice Boss":
      return 1;
    case "Zaufany":
      return 2;
    default:
      return 3;
  }
}

function isGangTrustedRole(role) {
  return getGangRoleWeight(role) <= 2;
}

function buildGangDescription(gangName, canonicalGang) {
  const district = findDistrictById(canonicalGang?.focusDistrictId || "");
  if (district) {
    return `${gangName} trzyma fokus na ${district.name} i cisnie o teren bez rozbijania calego miasta.`;
  }
  return `${gangName} trzyma ekipe, skarbiec i szybkie wejscia pod kolejne akcje.`;
}

function buildGangDirectoryEntry(gangName, memberRecords, now = Date.now()) {
  const members = memberRecords
    .map((userRecord) => {
      const player = userRecord?.playerData;
      if (!player) return null;
      syncPlayerState(player, now);
      const profile = player.profile || {};
      const role = String(player.gang?.role || "Czlonek").trim() || "Czlonek";
      return {
        id: userRecord._id,
        name: profile.name || userRecord.username || "Gracz",
        role,
        trusted: isGangTrustedRole(role),
        respect: Math.max(0, Math.floor(Number(profile.respect || 0))),
        online: isUserOnline(userRecord._id, now),
        userRecord,
      };
    })
    .filter(Boolean)
    .sort((left, right) => {
      const roleDelta = getGangRoleWeight(left.role) - getGangRoleWeight(right.role);
      if (roleDelta !== 0) return roleDelta;
      if (right.respect !== left.respect) return right.respect - left.respect;
      return left.name.localeCompare(right.name, "pl");
    });

  if (!members.length) {
    return null;
  }

  const bossMember = members.find((member) => member.role === "Boss") || members[0];
  const viceBossMember = members.find((member) => member.role === "Vice Boss") || null;
  const canonicalGang = bossMember.userRecord?.playerData?.gang || members[0].userRecord?.playerData?.gang || createGangState();
  const territory = Math.max(0, Math.floor(Number(canonicalGang?.territory || 0)));
  const influence = Math.max(0, Math.floor(Number(canonicalGang?.influence || 0)));
  const vault = Math.max(0, Math.floor(Number(canonicalGang?.vault || 0)));
  const respectPeak = members.reduce((best, member) => Math.max(best, Number(member.respect || 0)), 0);
  const trustedCount = members.filter((member) => member.role === "Zaufany").length;
  const focusDistrictId = String(canonicalGang?.focusDistrictId || "").trim() || "oldtown";
  const protectedClub =
    bossMember.userRecord?.playerData?.club?.owned &&
    String(bossMember.userRecord.playerData.club.sourceId || "").trim()
      ? {
          id: String(bossMember.userRecord.playerData.club.sourceId || "").trim(),
          name: bossMember.userRecord.playerData.club.name || "Klub",
          districtId: bossMember.userRecord.playerData.club.districtId || focusDistrictId,
          threat: Math.max(0, Math.floor(Number(bossMember.userRecord.playerData.club.threatLevel || 0))),
          stability: Math.max(0, Math.floor(Number(bossMember.userRecord.playerData.club.defenseReadiness || 0))),
          influenceBonus: Number(getGangProjectEffects(canonicalGang).influenceGain || 0),
        }
      : null;

  return {
    id: `gang-${slugifyGangName(gangName) || bossMember.id}`,
    name: gangName,
    boss: bossMember.name,
    bossUserId: bossMember.id,
    viceBoss: viceBossMember?.name || "-",
    viceBossUserId: viceBossMember?.id || null,
    trusted: trustedCount,
    members: members.length,
    memberCapLevel: Math.max(0, Math.floor(Number(canonicalGang?.memberCapLevel || 0))),
    maxMembers: Math.max(members.length, Math.floor(Number(canonicalGang?.maxMembers || 8))),
    respect: respectPeak,
    territory,
    influence,
    vault,
    ranking: 0,
    description: buildGangDescription(gangName, canonicalGang),
    inviteRespectMin: clampGangInviteRespectMin(
      canonicalGang?.inviteRespectMin ?? GANG_INVITE_RESPECT_MIN
    ),
    focusDistrictId,
    projects:
      canonicalGang?.projects && typeof canonicalGang.projects === "object" && !Array.isArray(canonicalGang.projects)
        ? { ...canonicalGang.projects }
        : {},
    weeklyGoal:
      canonicalGang?.weeklyGoal && typeof canonicalGang.weeklyGoal === "object" && !Array.isArray(canonicalGang.weeklyGoal)
        ? { ...canonicalGang.weeklyGoal }
        : null,
    weeklyProgress:
      canonicalGang?.weeklyProgress && typeof canonicalGang.weeklyProgress === "object" && !Array.isArray(canonicalGang.weeklyProgress)
        ? { ...canonicalGang.weeklyProgress }
        : {},
    weeklyGoalClaimedAt: Number.isFinite(canonicalGang?.weeklyGoalClaimedAt) ? canonicalGang.weeklyGoalClaimedAt : null,
    jobBoard:
      Array.isArray(canonicalGang?.jobBoard) && canonicalGang.jobBoard.length
        ? canonicalGang.jobBoard.map((entry) => ({ ...entry }))
        : [],
    jobProgress:
      canonicalGang?.jobProgress && typeof canonicalGang.jobProgress === "object" && !Array.isArray(canonicalGang.jobProgress)
        ? { ...canonicalGang.jobProgress }
        : {},
    jobRewardedAt:
      canonicalGang?.jobRewardedAt && typeof canonicalGang.jobRewardedAt === "object" && !Array.isArray(canonicalGang.jobRewardedAt)
        ? { ...canonicalGang.jobRewardedAt }
        : {},
    activeHeistLobby:
      canonicalGang?.activeHeistLobby && typeof canonicalGang.activeHeistLobby === "object" && !Array.isArray(canonicalGang.activeHeistLobby)
        ? { ...canonicalGang.activeHeistLobby }
        : null,
    lastHeistReport:
      canonicalGang?.lastHeistReport && typeof canonicalGang.lastHeistReport === "object" && !Array.isArray(canonicalGang.lastHeistReport)
        ? { ...canonicalGang.lastHeistReport }
        : null,
    protectedClub,
    membersList: members.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      trusted: member.trusted,
      respect: member.respect,
      online: member.online,
    })),
    eventLog: Array.isArray(canonicalGang?.chat) && canonicalGang.chat.length
      ? canonicalGang.chat.slice(0, 20)
      : [
          {
            id: `gang-log-${slugifyGangName(gangName)}-${now}`,
            author: "System",
            text: `${gangName} trzyma ${members.length} ludzi i ${influence} wplywu.`,
            time: new Date(now).toISOString(),
          },
        ],
  };
}

async function buildGangDirectorySnapshot(now = Date.now()) {
  const users = await listUsers();
  const groups = new Map();

  users.forEach((userRecord) => {
    const player = userRecord?.playerData;
    const gangName = String(player?.gang?.name || "").trim();
    if (!player?.gang?.joined || !gangName) return;
    const key = gangName.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { gangName, members: [] });
    }
    groups.get(key).members.push(userRecord);
  });

  const gangs = [...groups.values()]
    .map((entry) => buildGangDirectoryEntry(entry.gangName, entry.members, now))
    .filter(Boolean)
    .sort((left, right) => {
      if (right.influence !== left.influence) return right.influence - left.influence;
      if (right.territory !== left.territory) return right.territory - left.territory;
      if (right.members !== left.members) return right.members - left.members;
      return left.name.localeCompare(right.name, "pl");
    })
    .map((gang, index) => ({
      ...gang,
      ranking: index + 1,
    }));

  return gangs;
}

function buildGangInviteFromGangEntry(gangEntry, now = Date.now()) {
  return {
    id: `gang-invite-${slugifyGangName(gangEntry?.name)}-${now}`,
    gangName: gangEntry?.name || "Gang",
    leader: gangEntry?.boss || "Boss",
    members: Math.max(1, Math.floor(Number(gangEntry?.members || 1))),
    territory: Math.max(0, Math.floor(Number(gangEntry?.territory || 0))),
    inviteRespectMin: clampGangInviteRespectMin(
      gangEntry?.inviteRespectMin ?? GANG_INVITE_RESPECT_MIN
    ),
  };
}

function syncResponseGangEntryWithPlayerState(gangs, user) {
  if (!Array.isArray(gangs)) return [];
  if (!user?.gang?.joined || !user.gang?.name) return gangs;

  return gangs.map((gangEntry) => {
    if (gangEntry?.name !== user.gang.name) {
      return gangEntry;
    }

    return {
      ...gangEntry,
      memberCapLevel: Math.max(0, Math.floor(Number(user.gang.memberCapLevel || gangEntry.memberCapLevel || 0))),
      maxMembers: Math.max(
        Number(gangEntry.members || 0),
        Math.floor(Number(user.gang.maxMembers || gangEntry.maxMembers || 8))
      ),
      vault: Math.max(0, Math.floor(Number(user.gang.vault || gangEntry.vault || 0))),
      inviteRespectMin: clampGangInviteRespectMin(
        user.gang.inviteRespectMin ?? gangEntry.inviteRespectMin ?? GANG_INVITE_RESPECT_MIN
      ),
      focusDistrictId: user.gang.focusDistrictId || gangEntry.focusDistrictId,
      projects:
        user.gang.projects && typeof user.gang.projects === "object" && !Array.isArray(user.gang.projects)
          ? { ...user.gang.projects }
          : gangEntry.projects,
      weeklyGoal:
        user.gang.weeklyGoal && typeof user.gang.weeklyGoal === "object" && !Array.isArray(user.gang.weeklyGoal)
          ? { ...user.gang.weeklyGoal }
          : gangEntry.weeklyGoal,
      weeklyProgress:
        user.gang.weeklyProgress &&
        typeof user.gang.weeklyProgress === "object" &&
        !Array.isArray(user.gang.weeklyProgress)
          ? { ...user.gang.weeklyProgress }
          : gangEntry.weeklyProgress,
      weeklyGoalClaimedAt: user.gang.weeklyGoalClaimedAt ?? gangEntry.weeklyGoalClaimedAt ?? null,
      jobBoard:
        Array.isArray(user.gang.jobBoard) && user.gang.jobBoard.length
          ? user.gang.jobBoard.map((entry) => ({ ...entry }))
          : gangEntry.jobBoard,
      jobProgress:
        user.gang.jobProgress && typeof user.gang.jobProgress === "object" && !Array.isArray(user.gang.jobProgress)
          ? { ...user.gang.jobProgress }
          : gangEntry.jobProgress,
      jobRewardedAt:
        user.gang.jobRewardedAt && typeof user.gang.jobRewardedAt === "object" && !Array.isArray(user.gang.jobRewardedAt)
          ? { ...user.gang.jobRewardedAt }
          : gangEntry.jobRewardedAt,
      activeHeistLobby:
        user.gang.activeHeistLobby && typeof user.gang.activeHeistLobby === "object" && !Array.isArray(user.gang.activeHeistLobby)
          ? { ...user.gang.activeHeistLobby }
          : gangEntry.activeHeistLobby,
      lastHeistReport:
        user.gang.lastHeistReport && typeof user.gang.lastHeistReport === "object" && !Array.isArray(user.gang.lastHeistReport)
          ? { ...user.gang.lastHeistReport }
          : gangEntry.lastHeistReport,
      protectedClub:
        user.gang.protectedClub && typeof user.gang.protectedClub === "object" && !Array.isArray(user.gang.protectedClub)
          ? { ...user.gang.protectedClub }
          : gangEntry.protectedClub,
      eventLog: Array.isArray(user.gang.chat) && user.gang.chat.length ? user.gang.chat.slice(0, 20) : gangEntry.eventLog,
    };
  });
}

function syncGangInvitesWithLiveDirectory(invites, gangs) {
  if (!Array.isArray(invites) || !Array.isArray(gangs)) {
    return [];
  }

  const gangsByName = new Map(
    gangs.map((entry) => [String(entry?.name || "").trim().toLowerCase(), entry]).filter(([name]) => name)
  );

  return invites
    .map((invite) => {
      const gangName = String(invite?.gangName || "").trim();
      if (!gangName) return null;
      const liveGang = gangsByName.get(gangName.toLowerCase());
      if (!liveGang) return null;
      return {
        ...invite,
        gangName: liveGang.name,
        leader: liveGang.boss || invite.leader || "Boss",
        members: Math.max(1, Math.floor(Number(liveGang.members || invite.members || 1))),
        territory: Math.max(0, Math.floor(Number(liveGang.territory || invite.territory || 0))),
        inviteRespectMin: clampGangInviteRespectMin(
          liveGang.inviteRespectMin ?? invite.inviteRespectMin ?? GANG_INVITE_RESPECT_MIN
        ),
      };
    })
    .filter(Boolean);
}

function buildClubVenueFromPlayer(player) {
  const club = normalizeClubState(player?.club);
  const protectorActive = Boolean(
    club?.owned &&
      player?.gang?.joined &&
      String(player?.gang?.role || "").trim() === "Boss" &&
      String(player?.gang?.name || "").trim()
  );
  const protectorEffects = protectorActive ? getGangProjectEffects(player?.gang) : null;
  const ownerLabel =
    club.ownerLabel ||
    (typeof player?.profile?.name === "string" && player.profile.name.trim()
      ? player.profile.name
      : "Gracz");

  return {
    id: club.sourceId,
    name: club.name,
    ownerLabel,
    districtId: club.districtId || resolveClubDistrictId({ club }),
    respect: Math.max(0, Math.floor(Number(player?.profile?.respect || 0))),
    takeoverCost: Math.max(0, Math.floor(Number(club.takeoverCost || ECONOMY_RULES.empire.clubTakeoverCost))),
    popularity: club.popularity,
    mood: club.mood,
    policeBase: Math.max(club.policeBase, Math.round(Number(club.policePressure || 0) / 8)),
    policePressure: Number(club.policePressure || 0),
    traffic: Number(club.traffic || 0),
    nightPlanId: club.nightPlanId,
    entryFee: Math.max(0, Math.floor(Number(club.entryFee || 0))),
    safeCash: Math.max(0, Math.floor(Number(club.safeCash || 0))),
    lastReportSummary:
      club.lastReportSummary && typeof club.lastReportSummary === "object" && !Array.isArray(club.lastReportSummary)
        ? { ...club.lastReportSummary }
        : null,
    securityLevel: Number(club.securityLevel || 0),
    defenseReadiness: Number(club.defenseReadiness || 0),
    threatLevel: Number(club.threatLevel || 0),
    protectorGangName: protectorActive ? String(player.gang.name || "").trim() : null,
    protectorFocusDistrictId: protectorActive ? player.gang.focusDistrictId || null : null,
    protectorEffects: protectorEffects
      ? {
          clubSecurity: Number(protectorEffects.clubSecurity || 0),
          clubThreatMitigation: Number(protectorEffects.clubThreatMitigation || 0),
          pressureMitigation: Number(protectorEffects.pressureMitigation || 0),
          influenceGain: Number(protectorEffects.influenceGain || 0),
        }
      : null,
    stash: { ...(club.stash || {}) },
    note: club.note || "Prywatny lokal gracza. Ruch i presja licza sie z wizyt.",
  };
}

async function findClubOwnerRecordByVenueId(venueId) {
  const safeVenueId = String(venueId || "").trim();
  if (!safeVenueId) return null;
  const users = await listUsers();
  return (
    users.find(
      (entry) =>
        entry?.playerData?.club?.owned &&
        String(entry.playerData.club.sourceId || "").trim() === safeVenueId
    ) || null
  );
}

function resolveClubVenueSnapshot(venueId, { ownerRecord = null, fallbackPlayer = null } = {}) {
  const safeVenueId = String(venueId || "").trim();
  if (!safeVenueId) return null;

  if (ownerRecord?.playerData?.club?.owned) {
    return buildClubVenueFromPlayer(ownerRecord.playerData);
  }

  if (
    fallbackPlayer?.club?.owned &&
    String(fallbackPlayer.club.sourceId || "").trim() === safeVenueId
  ) {
    return buildClubVenueFromPlayer(fallbackPlayer);
  }

  const staticVenue = findClubVenueById(safeVenueId);
  if (!staticVenue) return null;

  return {
    ...staticVenue,
    nightPlanId: getClubNightPlan().id,
    entryFee: getDefaultClubEntryFee(staticVenue.respect || 0),
    safeCash: 0,
    lastReportSummary: null,
    traffic: 0,
    policePressure: Math.max(0, Number(staticVenue.policeBase || 0) * 3),
    securityLevel: 0,
    defenseReadiness: 44,
    threatLevel: 0,
    protectorGangName: null,
    protectorFocusDistrictId: null,
    protectorEffects: null,
  };
}

async function buildClubMarketSnapshot(now = Date.now()) {
  const users = await listUsers();
  const ownedVenueById = new Map();

  for (const userRecord of users) {
    const player = userRecord?.playerData;
    if (!player?.club?.owned || !player.club?.sourceId) continue;
    syncPlayerState(player, now);
    ownedVenueById.set(String(player.club.sourceId).trim(), buildClubVenueFromPlayer(player));
  }

  const baseListings = CLUB_MARKET.map((venue) => {
    const ownedVenue = ownedVenueById.get(String(venue.id).trim());
    if (ownedVenue) {
      return {
        ...venue,
        ...ownedVenue,
        id: venue.id,
      };
    }

    return {
      ...venue,
      nightPlanId: venue.nightPlanId || getClubNightPlan().id,
      traffic: 0,
      policePressure: Math.max(0, Number(venue.policeBase || 0) * 3),
      securityLevel: 0,
      defenseReadiness: 44,
      threatLevel: 0,
    };
  });

  const staticVenueIds = new Set(CLUB_MARKET.map((venue) => String(venue.id).trim()));
  const extraOwnedVenues = [...ownedVenueById.values()].filter(
    (venue) => venue?.id && !staticVenueIds.has(String(venue.id).trim())
  );

  return [...baseListings, ...extraOwnedVenues];
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
      avatarId:
        (typeof live?.avatarId === "string" && live.avatarId.trim()) ||
        (typeof friend.avatarId === "string" && friend.avatarId.trim()) ||
        "ghost",
      avatarCustomUri:
        (typeof live?.avatarCustomUri === "string" && live.avatarCustomUri.trim()
          ? live.avatarCustomUri.trim()
          : null) ||
        (typeof friend.avatarCustomUri === "string" && friend.avatarCustomUri.trim()
          ? friend.avatarCustomUri.trim()
          : null),
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

function buildSharedGangPatch(gangState) {
  const gang = normalizeGangState(gangState);
  return {
    memberCapLevel: gang.memberCapLevel,
    maxMembers: gang.maxMembers,
    territory: gang.territory,
    influence: gang.influence,
    vault: gang.vault,
    inviteRespectMin: gang.inviteRespectMin,
    gearScore: gang.gearScore,
    jailedCrew: gang.jailedCrew,
    crewLockdownUntil: gang.crewLockdownUntil,
    focusDistrictId: gang.focusDistrictId,
    projects: { ...(gang.projects || {}) },
    weeklyGoal: gang.weeklyGoal ? { ...gang.weeklyGoal } : null,
    weeklyProgress: { ...(gang.weeklyProgress || {}) },
    weeklyGoalClaimedAt: gang.weeklyGoalClaimedAt ?? null,
    jobBoard: Array.isArray(gang.jobBoard) ? gang.jobBoard.map((entry) => ({ ...entry })) : [],
    jobProgress: { ...(gang.jobProgress || {}) },
    jobRewardedAt: { ...(gang.jobRewardedAt || {}) },
    activeHeistLobby: gang.activeHeistLobby ? { ...gang.activeHeistLobby } : null,
    lastHeistReport: gang.lastHeistReport ? { ...gang.lastHeistReport } : null,
    protectedClub: gang.protectedClub ? { ...gang.protectedClub } : null,
    chat: Array.isArray(gang.chat) ? gang.chat.slice(0, 20) : [],
  };
}

function syncSharedGangPatchToPlayer(player, sharedPatch, totalMembers, now = Date.now()) {
  const currentGang = normalizeGangState(player?.gang || createGangState());
  player.gang = normalizeGangState({
    ...currentGang,
    ...sharedPatch,
    joined: currentGang.joined,
    role: currentGang.role,
    name: currentGang.name,
    members: Math.max(0, Math.floor(Number(totalMembers || currentGang.members || 0))),
  });
  syncGangDerivedState(player, now);
}

async function loadGangMemberRecordsByName(gangName) {
  const safeGangName = String(gangName || "").trim().toLowerCase();
  if (!safeGangName) return [];
  const users = await listUsers();
  return users.filter((userRecord) => {
    const playerGangName = String(userRecord?.playerData?.gang?.name || "").trim().toLowerCase();
    return Boolean(userRecord?.playerData?.gang?.joined) && playerGangName === safeGangName;
  });
}

async function withGangMutation(req, actionKey, handler) {
  const actorGangName = String(req?.player?.gang?.name || "").trim();
  if (!req?.player?.gang?.joined || !actorGangName) {
    const error = new Error("Najpierw wejdz do gangu.");
    error.statusCode = 400;
    throw error;
  }

  const previewMembers = await loadGangMemberRecordsByName(actorGangName);
  const userIds = previewMembers.map((entry) => entry._id).filter(Boolean);
  if (!userIds.length) {
    const error = new Error("Nie znaleziono zywego skladu tego gangu.");
    error.statusCode = 404;
    throw error;
  }

  return withUserMutationLocks(userIds, actionKey, async () => {
    const liveRecords = (
      await Promise.all(
        userIds.map(async (userId) => {
          const userRecord = await findUserById(userId);
          return userRecord?.playerData ? userRecord : null;
        })
      )
    ).filter(Boolean);

    const entries = liveRecords.map((userRecord) => {
      ensureAlphaTestGrant(userRecord.playerData, userRecord);
      syncPlayerState(userRecord.playerData, Date.now());
      return {
        userId: userRecord._id,
        username: userRecord.username,
        userRecord,
        player: userRecord.playerData,
      };
    });

    const result = await handler(entries);

    await Promise.all(
      entries.map((entry) => persistPlayerForUser(entry.userId, entry.player))
    );

    const actorEntry = entries.find((entry) => entry.userId === req.user.id) || entries[0];
    if (actorEntry?.player) {
      req.player = actorEntry.player;
    }

    return {
      entries,
      actorEntry,
      result,
    };
  });
}

function getGangMutationActor(entries, actorUserId, now = Date.now()) {
  const actorEntry = (Array.isArray(entries) ? entries : []).find(
    (entry) => entry?.userId === actorUserId
  );
  if (!actorEntry?.player) {
    const error = new Error("Nie znaleziono aktywnego czlonka tego gangu.");
    error.statusCode = 404;
    throw error;
  }
  syncPlayerState(actorEntry.player, now);
  ensurePlayerGangState(actorEntry.player, now);
  return actorEntry;
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

function syncPlayerHealth(player, now = Date.now()) {
  if (!player.timers) player.timers = { hpUpdatedAt: now };
  const regenMs = ECONOMY_RULES.health.regenSeconds * 1000;
  const regenAmount = Math.max(1, Math.floor(Number(ECONOMY_RULES.health.regenAmount || 1)));
  const lastHealthAt = player.timers.hpUpdatedAt || now;
  const maxHp = Math.max(0, Number(player.profile?.maxHp || 0));

  if (Number(player.profile?.hp || 0) >= maxHp) {
    player.timers.hpUpdatedAt = now;
    return;
  }

  const elapsed = now - lastHealthAt;
  if (elapsed < regenMs) return;

  const recoveredTicks = Math.floor(elapsed / regenMs);
  player.profile.hp = Math.min(maxHp, Number(player.profile.hp || 0) + recoveredTicks * regenAmount);
  player.timers.hpUpdatedAt = lastHealthAt + recoveredTicks * regenMs;

  if (Number(player.profile.hp || 0) >= maxHp) {
    player.timers.hpUpdatedAt = now;
  }
}

function syncClubState(player, now = Date.now()) {
  if (!player?.club || typeof player.club !== "object") return;
  const referenceAt = Math.max(
    0,
    Math.floor(Number(player.club.lastTrafficAt || player.club.lastRunAt || now))
  );
  const elapsedMs = Math.max(0, now - referenceAt);
  player.club.traffic = getClubTrafficAfterDecay(player.club.traffic, elapsedMs);
  player.club.policePressure = getClubPressureAfterDecay(player.club.policePressure, elapsedMs);
  player.club.lastTrafficAt = now;
}

function syncPlayerState(player, now = Date.now()) {
  ensurePlayerExtendedState(player);
  syncPlayerEnergy(player, now);
  syncPlayerHealth(player, now);
  syncClubState(player, now);
  syncBusinessCollections(player, now);
  syncEscortCollections(player, now);
  syncCityStateForPlayer(player, now);
  syncGangDerivedState(player, now);
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
  const isAdmin = isAdminUsername(player?.username || player?.profile?.name);
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
    gang: player.gang,
    city: player.city,
    operations: player.operations,
    contracts: player.contracts,
    businessesOwned: player.businessesOwned,
    businessUpgrades: player.businessUpgrades,
    factoriesOwned: player.factoriesOwned,
    supplies: player.supplies,
    tasksClaimed: player.tasksClaimed,
    collections: player.collections,
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
    admin: buildAdminPublicState(isAdmin),
    log: player.log,
    clientState: player.clientState || null,
  };
}

async function buildPlayerEnvelope(player, now = Date.now(), extra = {}) {
  const user = publicPlayer(player, now);
  const gangs = syncResponseGangEntryWithPlayerState(await buildGangDirectorySnapshot(now), user);
  const liveGang = user?.gang?.joined
    ? gangs.find((entry) => entry?.name === user.gang.name) || null
    : null;
  if (liveGang) {
    user.gang = {
      ...user.gang,
      members: liveGang.members,
      memberCapLevel: liveGang.memberCapLevel ?? user.gang.memberCapLevel ?? 0,
      maxMembers: liveGang.maxMembers ?? user.gang.maxMembers ?? 8,
      territory: liveGang.territory,
      influence: liveGang.influence,
      vault: liveGang.vault,
      inviteRespectMin: liveGang.inviteRespectMin,
      focusDistrictId: liveGang.focusDistrictId || user.gang.focusDistrictId,
      projects:
        liveGang.projects && typeof liveGang.projects === "object" && !Array.isArray(liveGang.projects)
          ? { ...liveGang.projects }
          : user.gang.projects,
      weeklyGoal:
        liveGang.weeklyGoal && typeof liveGang.weeklyGoal === "object" && !Array.isArray(liveGang.weeklyGoal)
          ? { ...liveGang.weeklyGoal }
          : user.gang.weeklyGoal,
      weeklyProgress:
        liveGang.weeklyProgress && typeof liveGang.weeklyProgress === "object" && !Array.isArray(liveGang.weeklyProgress)
          ? { ...liveGang.weeklyProgress }
          : user.gang.weeklyProgress,
      weeklyGoalClaimedAt: liveGang.weeklyGoalClaimedAt ?? user.gang.weeklyGoalClaimedAt ?? null,
      jobBoard:
        Array.isArray(liveGang.jobBoard) && liveGang.jobBoard.length
          ? liveGang.jobBoard.map((entry) => ({ ...entry }))
          : user.gang.jobBoard,
      jobProgress:
        liveGang.jobProgress && typeof liveGang.jobProgress === "object" && !Array.isArray(liveGang.jobProgress)
          ? { ...liveGang.jobProgress }
          : user.gang.jobProgress,
      jobRewardedAt:
        liveGang.jobRewardedAt && typeof liveGang.jobRewardedAt === "object" && !Array.isArray(liveGang.jobRewardedAt)
          ? { ...liveGang.jobRewardedAt }
          : user.gang.jobRewardedAt,
      activeHeistLobby:
        liveGang.activeHeistLobby && typeof liveGang.activeHeistLobby === "object" && !Array.isArray(liveGang.activeHeistLobby)
          ? { ...liveGang.activeHeistLobby }
          : user.gang.activeHeistLobby,
      lastHeistReport:
        liveGang.lastHeistReport && typeof liveGang.lastHeistReport === "object" && !Array.isArray(liveGang.lastHeistReport)
          ? { ...liveGang.lastHeistReport }
          : user.gang.lastHeistReport,
      protectedClub:
        liveGang.protectedClub && typeof liveGang.protectedClub === "object" && !Array.isArray(liveGang.protectedClub)
          ? { ...liveGang.protectedClub }
          : user.gang.protectedClub,
      membersList: Array.isArray(liveGang.membersList) && liveGang.membersList.length ? liveGang.membersList : user.gang.membersList,
      chat: Array.isArray(liveGang.eventLog) && liveGang.eventLog.length ? liveGang.eventLog : user.gang.chat,
    };
  }
  if (Array.isArray(user?.gang?.invites)) {
    user.gang.invites = syncGangInvitesWithLiveDirectory(user.gang.invites, gangs);
  }
  return {
    user,
    clubMarket: await buildClubMarketSnapshot(now),
    gangs,
    contractsBoard: buildContractBoardForPlayer(player, now),
    ...extra,
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

  const [usersCleared, globalChatCleared, prisonChatCleared] = await Promise.all([
    clearAllUsers(),
    clearGlobalChatMessages(),
    clearPrisonChatMessages(),
  ]);

  state.activeUsers.clear();
  state.routeRateLimit.clear();
  state.actionLocks.clear();
  state.market = createMarketState();

  console.log(
    `[reset-game] cleared runtime data :: users=${usersCleared}, globalChat=${globalChatCleared}, prisonChat=${prisonChatCleared}`
  );

  sendOk(res, {
    ok: true,
    testingOnly: true,
    usersCleared,
    globalChatCleared,
    prisonChatCleared,
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
  const now = Date.now();
  refreshMarket();
  ensureAlphaTestGrant(req.player, req.user);
  settleClubPassiveReportForPlayer(req.player, now);
  req.player.online.friends = await buildFriendEntries(req.player);
  await persistPlayerForUser(req.user.id, req.player);
  const marketView = getMarketPublicView(state.market, getActiveUserCount());
  res.json({
    ...(await buildPlayerEnvelope(req.player, now)),
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

app.post("/admin/players/:targetUserId/grant-cash", auth, asyncHandler(async (req, res) => {
  if (!requireAdminRequest(req, res)) {
    return;
  }

  if (
    !enforceRateLimit(
      req,
      res,
      "admin-player-grant-cash",
      400,
      "Admin action rate limit active"
    )
  ) {
    return;
  }

  const targetUserId = String(req.params?.targetUserId || "").trim();
  if (!targetUserId) {
    res.status(400).json({ error: "targetUserId is required" });
    return;
  }

  const parsedAmount = parsePositiveInteger(req.body?.amount, {
    min: 1,
    max: ADMIN_CASH_GRANT_MAX,
    field: "amount",
  });
  if (parsedAmount.error) {
    res.status(400).json({ error: parsedAmount.error });
    return;
  }

  const targetPreview = await findUserById(targetUserId);
  if (!targetPreview?.playerData) {
    res.status(404).json({ error: "Target player not found" });
    return;
  }

  const now = Date.now();
  let actorRecordSnapshot = null;
  let targetRecordSnapshot = null;
  let result = null;

  await withUserMutationLocks([req.user.id, targetUserId], `admin-grant-cash:${targetUserId}`, async () => {
    const [actorRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    if (!isAdminUsername(actorRecord.username)) {
      const error = new Error("Admin only");
      error.statusCode = 403;
      throw error;
    }

    result = grantCashToPlayerByAdmin({
      actorPlayer: actorRecord.playerData,
      targetPlayer: targetRecord.playerData,
      amount: parsedAmount.value,
      now,
      actorName: actorRecord.username,
    });

    pushLog(actorRecord.playerData, result.adminLogMessage);
    pushLog(targetRecord.playerData, result.targetLogMessage);

    await Promise.all([
      persistPlayerForUser(actorRecord._id, actorRecord.playerData),
      persistPlayerForUser(targetRecord._id, targetRecord.playerData),
    ]);

    actorRecordSnapshot = actorRecord;
    targetRecordSnapshot = targetRecord;
  });

  logInfo("admin", "grant-cash", {
    adminUserId: req.user.id,
    targetUserId,
    amount: result?.amount || parsedAmount.value,
  });

  res.json({
    user: publicPlayer(actorRecordSnapshot?.playerData || req.player, now),
    target: buildDirectoryEntry(targetRecordSnapshot, now),
    result,
  });
}));

app.post("/admin/players/:targetUserId/grant-respect", auth, asyncHandler(async (req, res) => {
  if (!requireAdminRequest(req, res)) {
    return;
  }

  if (
    !enforceRateLimit(
      req,
      res,
      "admin-player-grant-respect",
      400,
      "Admin action rate limit active"
    )
  ) {
    return;
  }

  const targetUserId = String(req.params?.targetUserId || "").trim();
  if (!targetUserId) {
    res.status(400).json({ error: "targetUserId is required" });
    return;
  }

  const parsedAmount = parsePositiveInteger(req.body?.amount, {
    min: 1,
    max: ADMIN_RESPECT_GRANT_MAX,
    field: "amount",
  });
  if (parsedAmount.error) {
    res.status(400).json({ error: parsedAmount.error });
    return;
  }

  const targetPreview = await findUserById(targetUserId);
  if (!targetPreview?.playerData) {
    res.status(404).json({ error: "Target player not found" });
    return;
  }

  const now = Date.now();
  let actorRecordSnapshot = null;
  let targetRecordSnapshot = null;
  let result = null;

  await withUserMutationLocks([req.user.id, targetUserId], `admin-grant-respect:${targetUserId}`, async () => {
    const [actorRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    if (!isAdminUsername(actorRecord.username)) {
      const error = new Error("Admin only");
      error.statusCode = 403;
      throw error;
    }

    result = grantRespectToPlayerByAdmin({
      actorPlayer: actorRecord.playerData,
      targetPlayer: targetRecord.playerData,
      amount: parsedAmount.value,
      now,
      actorName: actorRecord.username,
    });

    pushLog(actorRecord.playerData, result.adminLogMessage);
    pushLog(targetRecord.playerData, result.targetLogMessage);

    await Promise.all([
      persistPlayerForUser(actorRecord._id, actorRecord.playerData),
      persistPlayerForUser(targetRecord._id, targetRecord.playerData),
    ]);

    actorRecordSnapshot = actorRecord;
    targetRecordSnapshot = targetRecord;
  });

  logInfo("admin", "grant-respect", {
    adminUserId: req.user.id,
    targetUserId,
    amount: result?.amount || parsedAmount.value,
  });

  res.json({
    user: publicPlayer(actorRecordSnapshot?.playerData || req.player, now),
    target: buildDirectoryEntry(targetRecordSnapshot, now),
    result,
  });
}));

app.post("/admin/players/delete-account", auth, asyncHandler(async (req, res) => {
  if (!requireAdminRequest(req, res)) {
    return;
  }

  if (
    !enforceRateLimit(
      req,
      res,
      "admin-player-delete-account",
      400,
      "Admin action rate limit active"
    )
  ) {
    return;
  }

  const login = sanitizeAuthInput(req.body?.login);
  if (!isValidUsername(login)) {
    res.status(400).json({ error: "Valid login is required" });
    return;
  }
  if (isAdminUsername(login)) {
    res.status(400).json({ error: "Admin account cannot be deleted" });
    return;
  }

  const targetRecord = await findUserByLogin(login);
  if (!targetRecord?.playerData) {
    res.status(404).json({ error: "Target player not found" });
    return;
  }

  const actorRecord = await findUserById(req.user.id);
  if (!actorRecord?.playerData || !isAdminUsername(actorRecord.username)) {
    res.status(403).json({ error: "Admin only" });
    return;
  }

  await withUserMutationLocks([targetRecord._id], `admin-delete-account:${targetRecord._id}`, async () => {
    await deleteUserByLogin(login);
  });
  state.activeUsers.delete(targetRecord._id);

  logInfo("admin", "delete-account", {
    adminUserId: req.user.id,
    targetUserId: targetRecord._id,
    login,
  });

  res.json({
    user: publicPlayer(actorRecord.playerData, Date.now()),
    result: {
      ok: true,
      login,
      deletedUserId: targetRecord._id,
      message: `Usunieto konto ${login}.`,
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
    const sameTargetAttackCooldownRemaining = Math.max(
      0,
      Number(attacker.cooldowns?.playerAttackTargets?.[targetUserId] || 0) - now
    );
    if (sameTargetAttackCooldownRemaining > 0) {
      const error = new Error(
        `Na tego gracza odpalisz kolejny atak za ${Math.ceil(sameTargetAttackCooldownRemaining / 60000)} min.`
      );
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
    attacker.cooldowns.playerAttackTargets = {
      ...(attacker.cooldowns?.playerAttackTargets || {}),
      [targetUserId]:
        now + ECONOMY_RULES.clubPvp.sameTargetRepeatCooldownSeconds * 1000,
    };

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

function buildPrisonChatView(entries = []) {
  return entries.map((entry) => ({
    id: entry._id,
    author: entry.author,
    text: entry.text,
    time: new Date(entry.createdAt).toISOString(),
  }));
}

app.get("/chat/prison", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  syncPlayerState(req.player, now);
  if (!isPlayerJailed(req.player, now)) {
    res.status(423).json({ error: "Chat celi widza tylko osadzeni." });
    return;
  }

  const messages = buildPrisonChatView(await getPrisonChatMessages(15));
  res.json({ messages });
}));

app.post("/chat/prison", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "chat-prison",
      1200,
      "Prison chat rate limit active"
    )
  ) {
    return;
  }

  const now = Date.now();
  syncPlayerState(req.player, now);
  if (!isPlayerJailed(req.player, now)) {
    res.status(423).json({ error: "Chat celi widza tylko osadzeni." });
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
  await addPrisonChatMessage({
    userId: req.user.id,
    author,
    text,
  });
  logInfo("chat", "prison-message", {
    userId: req.user.id,
    author,
    textLength: text.length,
  });

  const messages = buildPrisonChatView(await getPrisonChatMessages(15));
  res.json({ messages });
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
  const repetitionsParsed = parsePositiveInteger(req.body?.repetitions ?? 1, {
    min: 1,
    max: 20,
    field: "repetitions",
  });

  if (repetitionsParsed.error) {
    res.status(400).json({ error: repetitionsParsed.error });
    return;
  }

  const result = await withPlayerActionLock(req, "player-gym-train", async () =>
    commitPlayerMutation(req, "player-gym-train", async (player) => {
      const { logMessage, repetitions, energySpent, totalGains } = trainPlayerAtGym(
        player,
        exerciseId,
        repetitionsParsed.value,
        now
      );
      pushLog(player, logMessage);
      return {
        repetitions,
        energySpent,
        totalGains,
      };
    })
  );

  res.json({
    user: publicPlayer(req.player, now),
    result: result || null,
  });
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

app.post("/tasks/claim", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const taskId = String(req.body?.taskId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "tasks-claim", async () => {
    await commitPlayerMutation(req, "tasks-claim", async (player) => {
      result = claimTaskForPlayer(player, taskId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/businesses/buy", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const businessId = String(req.body?.businessId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "business-buy", async () => {
    await commitPlayerMutation(req, "business-buy", async (player) => {
      result = buyBusinessForPlayer(player, businessId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/businesses/upgrade", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const businessId = String(req.body?.businessId || "").trim();
  const path = String(req.body?.path || "").trim().toLowerCase();
  let result = null;

  await withPlayerActionLock(req, "business-upgrade", async () => {
    await commitPlayerMutation(req, "business-upgrade", async (player) => {
      result = upgradeBusinessForPlayer(player, businessId, path, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/businesses/collect", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;

  await withPlayerActionLock(req, "business-collect", async () => {
    await commitPlayerMutation(req, "business-collect", async (player) => {
      result = collectBusinessIncomeForPlayer(player, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/escorts/buy", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const escortId = String(req.body?.escortId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "escort-buy", async () => {
    await commitPlayerMutation(req, "escort-buy", async (player) => {
      result = buyEscortForPlayer(player, escortId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/escorts/assign", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const escortId = String(req.body?.escortId || "").trim();
  const districtId = String(req.body?.districtId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "escort-assign", async () => {
    await commitPlayerMutation(req, "escort-assign", async (player) => {
      result = assignEscortToStreetForPlayer(player, escortId, districtId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/escorts/pull", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const escortId = String(req.body?.escortId || "").trim();
  const districtId = String(req.body?.districtId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "escort-pull", async () => {
    await commitPlayerMutation(req, "escort-pull", async (player) => {
      result = pullEscortFromStreetForPlayer(player, escortId, districtId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/escorts/sell", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const escortId = String(req.body?.escortId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "escort-sell", async () => {
    await commitPlayerMutation(req, "escort-sell", async (player) => {
      result = sellEscortForPlayer(player, escortId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/escorts/collect", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;

  await withPlayerActionLock(req, "escort-collect", async () => {
    await commitPlayerMutation(req, "escort-collect", async (player) => {
      result = collectEscortIncomeForPlayer(player, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/factories/buy", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const factoryId = String(req.body?.factoryId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "factory-buy", async () => {
    await commitPlayerMutation(req, "factory-buy", async (player) => {
      result = buyFactoryForPlayer(player, factoryId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/factories/supplies/buy", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const supplyId = String(req.body?.supplyId || "").trim();
  const parsedQuantity = parsePositiveInteger(req.body?.quantity ?? 1, {
    min: 1,
    max: 50,
    field: "quantity",
  });
  if (parsedQuantity.error) {
    res.status(400).json({ error: parsedQuantity.error });
    return;
  }
  let result = null;

  await withPlayerActionLock(req, "factory-supply-buy", async () => {
    await commitPlayerMutation(req, "factory-supply-buy", async (player) => {
      result = buyFactorySupplyForPlayer(player, supplyId, parsedQuantity.value, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
}));

app.post("/factories/produce", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const drugId = String(req.body?.drugId || "").trim();
  let result = null;

  await withPlayerActionLock(req, "factory-produce", async () => {
    await commitPlayerMutation(req, "factory-produce", async (player) => {
      result = produceDrugForPlayer(player, drugId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json({
    user: publicPlayer(req.player, now),
    result,
  });
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
  const parsedQuantity = parsePositiveInteger(req.body?.quantity ?? 1, {
    min: 1,
    max: BACKEND_RULES.validation.maxMarketQuantity,
    field: "quantity",
  });
  if (parsedQuantity.error) {
    res.status(400).json({ error: parsedQuantity.error });
    return;
  }
  let result = null;

  await withPlayerActionLock(req, "dealer-buy", async () => {
    await commitPlayerMutation(req, "dealer-buy", async (player) => {
      result = buyDrugFromDealerForPlayer(player, drugId, parsedQuantity.value);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("dealer", "buy", {
    userId: req.user.id,
    drugId,
    quantity: result?.quantity || parsedQuantity.value,
    price: result?.price || 0,
    totalPrice: result?.totalPrice || 0,
  });

  res.json({
    user: publicPlayer(req.player),
    result,
  });
}));

app.post("/dealer/sell", auth, asyncHandler(async (req, res) => {
  const drugId = String(req.body?.drugId || "").trim();
  const parsedQuantity = parsePositiveInteger(req.body?.quantity ?? 1, {
    min: 1,
    max: BACKEND_RULES.validation.maxMarketQuantity,
    field: "quantity",
  });
  if (parsedQuantity.error) {
    res.status(400).json({ error: parsedQuantity.error });
    return;
  }
  let result = null;

  await withPlayerActionLock(req, "dealer-sell", async () => {
    await commitPlayerMutation(req, "dealer-sell", async (player) => {
      result = sellDrugToDealerForPlayer(player, drugId, parsedQuantity.value);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("dealer", "sell", {
    userId: req.user.id,
    drugId,
    quantity: result?.quantity || parsedQuantity.value,
    payoutPerUnit: result?.payoutPerUnit || 0,
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

app.post("/clubs/visit", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const mode = String(req.body?.mode || req.body?.action || "enter").trim().toLowerCase();
  const venueId = String(req.body?.venueId || "").trim();
  const ownerRecordPreview = mode === "leave" ? null : await findClubOwnerRecordByVenueId(venueId);
  const ownerUserId =
    ownerRecordPreview?._id && ownerRecordPreview._id !== req.user.id ? ownerRecordPreview._id : null;
  let result = null;

  await withUserMutationLocks([req.user.id, ownerUserId].filter(Boolean), `clubs-visit:${mode}:${venueId || "self"}`, async () => {
    const actorRecord = await findUserById(req.user.id);
    const ownerRecord =
      ownerUserId
        ? await findUserById(ownerUserId)
        : ownerRecordPreview?._id === req.user.id
          ? actorRecord
          : null;

    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }

    const actor = actorRecord.playerData;
    syncPlayerState(actor, now);
    if (ownerRecord?.playerData && ownerRecord._id !== actorRecord._id) {
      syncPlayerState(ownerRecord.playerData, now);
      settleClubPassiveReportForPlayer(ownerRecord.playerData, now);
    }

    if (mode === "leave") {
      result = leaveClubVenueForPlayer(actor, now);
      pushLog(actor, result.logMessage);
    } else {
      const venue = resolveClubVenueSnapshot(venueId, { ownerRecord, fallbackPlayer: actor });
      if (!venue) {
        const error = new Error("Nie ma takiego lokalu na mapie miasta.");
        error.statusCode = 404;
        throw error;
      }

      const ownerPlayer =
        ownerRecord?.playerData ||
        (actor?.club?.owned && String(actor.club.sourceId || "").trim() === String(venue.id || "").trim()
          ? actor
          : null);
      if (ownerPlayer?.club?.owned) {
        settleClubPassiveReportForPlayer(ownerPlayer, now);
      }

      result = enterClubVenueForPlayer(actor, venue, ownerPlayer, now);
      pushLog(actor, result.logMessage);
      if (ownerPlayer && ownerPlayer !== actor && result.entryFeePaid > 0) {
        pushLog(ownerPlayer, `${actor.profile?.name || "Gosc"} doklada ${result.entryFeePaid}$ z bramki ${venue.name}.`);
      }
    }

    const persistTasks = [persistPlayerForUser(actorRecord._id, actor)];
    if (ownerRecord?.playerData && ownerRecord._id !== actorRecord._id) {
      persistTasks.push(persistPlayerForUser(ownerRecord._id, ownerRecord.playerData));
    }

    const [updatedActorRecord] = await Promise.all(persistTasks);
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));
app.post("/clubs/action", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const actionId = String(req.body?.actionId || "").trim().toLowerCase();
  const venueId = String(req.body?.venueId || req.player?.club?.visitId || "").trim();
  if (!["scout", "hunt", "laylow"].includes(actionId)) {
    res.status(400).json({ error: "Unknown club action." });
    return;
  }
  if (!venueId) {
    res.status(400).json({ error: "Najpierw wejdz do jakiegos klubu." });
    return;
  }
  const ownerRecordPreview = await findClubOwnerRecordByVenueId(venueId);
  const ownerUserId =
    ownerRecordPreview?._id && ownerRecordPreview._id !== req.user.id ? ownerRecordPreview._id : null;
  let result = null;

  await withUserMutationLocks([req.user.id, ownerUserId].filter(Boolean), `club-action:${venueId}`, async () => {
    const actorRecord = await findUserById(req.user.id);
    const ownerRecord = ownerUserId ? await findUserById(ownerUserId) : null;

    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }

    const actor = actorRecord.playerData;
    syncPlayerState(actor, now);
    if (ownerRecord?.playerData) {
      syncPlayerState(ownerRecord.playerData, now);
      settleClubPassiveReportForPlayer(ownerRecord.playerData, now);
    } else if (actor?.club?.owned && actor.club.sourceId === venueId) {
      settleClubPassiveReportForPlayer(actor, now);
    }

    const venue = resolveClubVenueSnapshot(venueId, {
      ownerRecord,
      fallbackPlayer: actor,
    });
    if (!venue) {
      const error = new Error("Najpierw wejdz do jakiegos klubu.");
      error.statusCode = 404;
      throw error;
    }

    const ownerSelfVisit = Boolean(actor.club?.owned && actor.club.sourceId === venue.id);
    result = performClubActionForPlayer(actor, {
      actionId,
      venue,
      now,
      ownerSelfVisit,
    });
    pushLog(actor, result.logMessage);

    if (ownerRecord?.playerData) {
      applyClubVisitDeltaToOwnerClub(ownerRecord.playerData, venue.id, result.ownerDelta, now);
      applyClubActionDistrictOutcome(ownerRecord.playerData, venue, result, now);
    } else if (ownerSelfVisit) {
      applyClubVisitDeltaToOwnerClub(actor, venue.id, result.ownerDelta, now);
      applyClubActionDistrictOutcome(actor, venue, result, now);
    }

    const persistTasks = [persistPlayerForUser(actorRecord._id, actor)];
    if (ownerRecord?.playerData) {
      persistTasks.push(persistPlayerForUser(ownerRecord._id, ownerRecord.playerData));
    }

    const [updatedActorRecord] = await Promise.all(persistTasks);
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;
  });

  logInfo("clubs", "action", {
    userId: req.user.id,
    venueId,
    actionId,
    outcome: result?.outcome || "unknown",
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));
app.post("/clubs/search-escort", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const venueId = String(req.body?.venueId || req.player?.club?.visitId || "").trim();
  const ownerRecordPreview = await findClubOwnerRecordByVenueId(venueId);
  const ownerUserId =
    ownerRecordPreview?._id && ownerRecordPreview._id !== req.user.id ? ownerRecordPreview._id : null;
  let result = null;

  await withUserMutationLocks([req.user.id, ownerUserId].filter(Boolean), `club-hunt:${venueId}`, async () => {
    const actorRecord = await findUserById(req.user.id);
    const ownerRecord = ownerUserId ? await findUserById(ownerUserId) : null;

    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }

    const actor = actorRecord.playerData;
    syncPlayerState(actor, now);
    if (ownerRecord?.playerData) {
      syncPlayerState(ownerRecord.playerData, now);
      settleClubPassiveReportForPlayer(ownerRecord.playerData, now);
    } else if (actor?.club?.owned && actor.club.sourceId === venueId) {
      settleClubPassiveReportForPlayer(actor, now);
    }

    const venue = resolveClubVenueSnapshot(venueId, {
      ownerRecord,
      fallbackPlayer: actor,
    });
    if (!venue) {
      const error = new Error("Najpierw wejdz do jakiegos klubu.");
      error.statusCode = 404;
      throw error;
    }

    const ownerSelfVisit = Boolean(actor.club?.owned && actor.club.sourceId === venue.id);
    result = performClubActionForPlayer(actor, {
      actionId: "hunt",
      venue,
      now,
      ownerSelfVisit,
    });
    pushLog(actor, result.logMessage);

    if (ownerRecord?.playerData) {
      applyClubVisitDeltaToOwnerClub(ownerRecord.playerData, venue.id, result.ownerDelta, now);
      applyClubActionDistrictOutcome(ownerRecord.playerData, venue, result, now);
    } else if (ownerSelfVisit) {
      applyClubVisitDeltaToOwnerClub(actor, venue.id, result.ownerDelta, now);
      applyClubActionDistrictOutcome(actor, venue, result, now);
    }

    const persistTasks = [persistPlayerForUser(actorRecord._id, actor)];
    if (ownerRecord?.playerData) {
      persistTasks.push(persistPlayerForUser(ownerRecord._id, ownerRecord.playerData));
    }

    const [updatedActorRecord] = await Promise.all(persistTasks);
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;
  });

  logInfo("clubs", "search-escort", {
    userId: req.user.id,
    venueId,
    outcome: result?.outcome || "unknown",
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));
app.get("/districts", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  syncPlayerState(req.player, now);
  res.json({
    city: req.player.city,
    districts: getDistrictSummaries(req.player.city),
  });
}));

app.post("/clubs/claim", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const venueId = String(req.body?.venueId || "").trim();
  if (!venueId) {
    res.status(400).json({ error: "Wybierz lokal do przejecia." });
    return;
  }
  const existingOwner = await findClubOwnerRecordByVenueId(venueId);
  if (existingOwner?._id && existingOwner._id !== req.user.id) {
    res.status(409).json({ error: "Ten lokal jest juz wziety przez innego gracza." });
    return;
  }

  let result = null;
  await withPlayerActionLock(req, "clubs-claim", async () => {
    await commitPlayerMutation(req, "clubs-claim", async (player) => {
      result = claimClubVenueForPlayer(player, venueId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/found", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withPlayerActionLock(req, "clubs-found", async () => {
    await commitPlayerMutation(req, "clubs-found", async (player) => {
      result = foundClubForPlayer(player, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/plan", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const planId = String(req.body?.planId || "").trim();
  let result = null;
  await withPlayerActionLock(req, "clubs-plan", async () => {
    await commitPlayerMutation(req, "clubs-plan", async (player) => {
      settleClubPassiveReportForPlayer(player, now);
      result = setClubNightPlanForPlayer(player, planId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/settings", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const entryFee = Number(req.body?.entryFee ?? 0);
  let result = null;
  await withPlayerActionLock(req, "clubs-settings", async () => {
    await commitPlayerMutation(req, "clubs-settings", async (player) => {
      result = setClubEntryFeeForPlayer(player, entryFee, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/stash/move", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const drugId = String(req.body?.drugId || "").trim();
  const parsedQuantity = parsePositiveInteger(req.body?.quantity ?? 1, {
    min: 1,
    max: BACKEND_RULES.validation.maxMarketQuantity,
    field: "quantity",
  });
  if (parsedQuantity.error) {
    res.status(400).json({ error: parsedQuantity.error });
    return;
  }

  let result = null;
  await withPlayerActionLock(req, "clubs-stash-move", async () => {
    await commitPlayerMutation(req, "clubs-stash-move", async (player) => {
      settleClubPassiveReportForPlayer(player, now);
      result = moveDrugToClubForPlayer(player, drugId, parsedQuantity.value, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });

  logInfo("clubs", "stash-move", {
    userId: req.user.id,
    drugId,
    quantity: result?.quantity || parsedQuantity.value,
    stashCount: result?.stashCount || 0,
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/stash/consume", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const drugId = String(req.body?.drugId || "").trim();
  const venueId = String(req.body?.venueId || req.player?.club?.visitId || "").trim();
  const ownerRecordPreview = await findClubOwnerRecordByVenueId(venueId);
  const ownerUserId =
    ownerRecordPreview?._id && ownerRecordPreview._id !== req.user.id ? ownerRecordPreview._id : null;
  let result = null;

  await withUserMutationLocks([req.user.id, ownerUserId].filter(Boolean), `club-stash-consume:${venueId}`, async () => {
    const actorRecord = await findUserById(req.user.id);
    const ownerRecord = ownerUserId ? await findUserById(ownerUserId) : ownerRecordPreview?._id === req.user.id ? actorRecord : null;

    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }

    const actor = actorRecord.playerData;
    syncPlayerState(actor, now);
    if (ownerRecord?.playerData) {
      syncPlayerState(ownerRecord.playerData, now);
      settleClubPassiveReportForPlayer(ownerRecord.playerData, now);
    } else if (actor?.club?.owned && actor.club.sourceId === venueId) {
      settleClubPassiveReportForPlayer(actor, now);
    }

    result = consumeClubStashDrugForPlayer(actor, ownerRecord?.playerData || null, venueId, drugId, now);
    pushLog(actor, result.logMessage);
    if (ownerRecord?.playerData && result?.ownerLogMessage) {
      pushLog(ownerRecord.playerData, result.ownerLogMessage);
    }

    const persistTasks = [persistPlayerForUser(actorRecord._id, actor)];
    if (ownerRecord?._id && ownerRecord._id !== actorRecord._id && ownerRecord.playerData) {
      persistTasks.push(persistPlayerForUser(ownerRecord._id, ownerRecord.playerData));
    }

    const [updatedActorRecord] = await Promise.all(persistTasks);
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;
  });

  logInfo("clubs", "stash-consume", {
    userId: req.user.id,
    venueId,
    drugId,
    overdose: Boolean(result?.overdose),
    stashCount: Number(result?.stashCount || 0),
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/night", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withPlayerActionLock(req, "clubs-night", async () => {
    await commitPlayerMutation(req, "clubs-night", async (player) => {
      result = runClubNightForPlayer(player, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/safe/collect", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withPlayerActionLock(req, "clubs-safe-collect", async () => {
    await commitPlayerMutation(req, "clubs-safe-collect", async (player) => {
      result = collectClubSafeForPlayer(player, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/clubs/fortify", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withPlayerActionLock(req, "clubs-fortify", async () => {
    await commitPlayerMutation(req, "clubs-fortify", async (player) => {
      settleClubPassiveReportForPlayer(player, now);
      result = fortifyClubForPlayer(player, now);
      pushLog(player, `${result.logMessage} Koszt ${result.cost}$.`);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.get("/gangs", auth, asyncHandler(async (_req, res) => {
  const now = Date.now();
  res.json({
    gangs: await buildGangDirectorySnapshot(now),
  });
}));

app.post("/gang/create", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const gangName = String(req.body?.gangName || req.body?.name || "").trim();
  let result = null;
  await withPlayerActionLock(req, "gang-create", async () => {
    await commitPlayerMutation(req, "gang-create", async (player) => {
      const existingGangNames = (await buildGangDirectorySnapshot(now)).map((gang) => gang.name);
      result = createGangForPlayer(player, gangName, now, { existingGangNames });
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/join", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const invitePayload = req.body?.invite || req.body || {};
  let result = null;
  await withPlayerActionLock(req, "gang-join", async () => {
    await commitPlayerMutation(req, "gang-join", async (player) => {
      ensurePlayerGangState(player, now);
      const inviteId = String(invitePayload?.id || "").trim();
      const liveInvite =
        (Array.isArray(player.gang?.invites) ? player.gang.invites : []).find((entry) => {
          if (!entry) return false;
          if (inviteId) return String(entry.id || "").trim() === inviteId;
          return String(entry.gangName || "").trim().toLowerCase() === String(invitePayload?.gangName || "").trim().toLowerCase();
        }) || null;
      if (!liveInvite) {
        const error = new Error("Zaproszenie wygaslo albo juz go nie ma.");
        error.statusCode = 404;
        throw error;
      }
      const liveGang = (await buildGangDirectorySnapshot(now)).find(
        (entry) => entry.name.toLowerCase() === String(liveInvite.gangName || "").trim().toLowerCase()
      );
      if (!liveGang) {
        const error = new Error("Tego gangu nie ma juz na miescie.");
        error.statusCode = 404;
        throw error;
      }
      result = joinGangForPlayer(player, liveInvite, now, liveGang);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/leave", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withPlayerActionLock(req, "gang-leave", async () => {
    await commitPlayerMutation(req, "gang-leave", async (player) => {
      result = leaveGangForPlayer(player, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/invite", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const targetUserId = String(req.body?.targetUserId || "").trim();
  if (!targetUserId) {
    res.status(400).json({ error: "targetUserId is required" });
    return;
  }
  if (targetUserId === req.user.id) {
    res.status(400).json({ error: "Siebie nie zapraszasz do wlasnego gangu." });
    return;
  }

  let result = null;
  let targetSnapshot = null;
  await withUserMutationLocks([req.user.id, targetUserId], `gang-invite:${targetUserId}`, async () => {
    const [actorRecord, targetRecord] = await Promise.all([
      findUserById(req.user.id),
      findUserById(targetUserId),
    ]);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    const actor = actorRecord.playerData;
    const target = targetRecord.playerData;
    syncPlayerState(actor, now);
    syncPlayerState(target, now);
    ensurePlayerGangState(actor, now);
    ensurePlayerGangState(target, now);

    if (!actor.gang.joined) {
      const error = new Error("Najpierw musisz byc w gangu.");
      error.statusCode = 400;
      throw error;
    }
    if (actor.gang.role !== "Boss") {
      const error = new Error("Tylko boss moze wysylac zaproszenia.");
      error.statusCode = 403;
      throw error;
    }
    if (target.gang.joined) {
      const error = new Error("Ten gracz jest juz w gangu.");
      error.statusCode = 409;
      throw error;
    }
    if (Number(target?.profile?.respect || 0) < clampGangInviteRespectMin(actor.gang.inviteRespectMin)) {
      const error = new Error("Ten kandydat nie dobija do ustawionego progu szacunu.");
      error.statusCode = 400;
      throw error;
    }

    const liveGang = (await buildGangDirectorySnapshot(now)).find(
      (entry) => entry.name.toLowerCase() === String(actor.gang.name || "").trim().toLowerCase()
    );
    if (!liveGang) {
      const error = new Error("Twojego gangu nie widac teraz na miescie.");
      error.statusCode = 404;
      throw error;
    }

    const alreadyInvited = (Array.isArray(target.gang.invites) ? target.gang.invites : []).some(
      (entry) => String(entry?.gangName || "").trim().toLowerCase() === liveGang.name.toLowerCase()
    );
    if (alreadyInvited) {
      const error = new Error("Ten gracz ma juz Twoje zaproszenie.");
      error.statusCode = 409;
      throw error;
    }

    const invite = buildGangInviteFromGangEntry(liveGang, now);
    target.gang.invites = [invite, ...(Array.isArray(target.gang.invites) ? target.gang.invites : [])].slice(0, 12);
    actor.gang.chat = [
      {
        id: `gang-invite-${targetUserId}-${now}`,
        author: "System",
        text: `Wyslano zaproszenie do ${target.profile?.name || targetRecord.username || "gracza"}.`,
        time: new Date(now).toISOString(),
      },
      ...(actor.gang.chat || []),
    ].slice(0, 20);
    appendPlayerMessage(target, {
      from: actor.profile?.name || actorRecord.username || "Boss",
      subject: "Zaproszenie do gangu",
      preview: `${liveGang.name} chce Cie w ekipie. Wejscie od ${liveGang.inviteRespectMin} szacunu.`,
      time: new Date(now).toISOString(),
    });
    pushLog(actor, `Zaproszenie wyslane do ${target.profile?.name || targetRecord.username || "gracza"}.`);
    pushLog(target, `${liveGang.name} wysyla Ci zaproszenie do gangu.`);

    const [updatedActorRecord, updatedTargetRecord] = await Promise.all([
      persistPlayerForUser(actorRecord._id, actor),
      persistPlayerForUser(targetRecord._id, target),
    ]);

    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;
    targetSnapshot = buildDirectoryEntry(updatedTargetRecord || targetRecord, now);
    result = {
      gangName: liveGang.name,
      targetUserId,
      message: `Zaproszenie do ${targetSnapshot.name} poszlo z gangu ${liveGang.name}.`,
    };
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result, target: targetSnapshot }));
}));

app.post("/gang/alliance", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const targetGangName = String(req.body?.targetGangName || "").trim();
  if (!targetGangName) {
    res.status(400).json({ error: "targetGangName is required" });
    return;
  }

  const liveGangs = await buildGangDirectorySnapshot(now);
  const actorGangName = String(req.player?.gang?.name || "").trim().toLowerCase();
  const actorGang = liveGangs.find((entry) => entry.name.toLowerCase() === actorGangName) || null;
  const targetGang = liveGangs.find((entry) => entry.name.toLowerCase() === targetGangName.toLowerCase()) || null;
  const actorBossUserId = actorGang?.bossUserId || req.user.id;
  const targetBossUserId = targetGang?.bossUserId || null;

  let result = null;
  await withUserMutationLocks([req.user.id, actorBossUserId, targetBossUserId].filter(Boolean), `gang-alliance:${targetGangName.toLowerCase()}`, async () => {
    const actorRecord = await findUserById(req.user.id);
    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }

    const gangsSnapshot = await buildGangDirectorySnapshot(now);
    const refreshedActorGangName = String(actorRecord.playerData?.gang?.name || "").trim().toLowerCase();
    const refreshedActorGang =
      gangsSnapshot.find((entry) => entry.name.toLowerCase() === refreshedActorGangName) || null;
    const refreshedTargetGang =
      gangsSnapshot.find((entry) => entry.name.toLowerCase() === targetGangName.toLowerCase()) || null;
    const actorBossRecord =
      refreshedActorGang?.bossUserId && refreshedActorGang.bossUserId !== actorRecord._id
        ? await findUserById(refreshedActorGang.bossUserId)
        : actorRecord;
    const targetBossRecord =
      refreshedTargetGang?.bossUserId ? await findUserById(refreshedTargetGang.bossUserId) : null;

    syncPlayerState(actorRecord.playerData, now);
    if (actorBossRecord?.playerData && actorBossRecord._id !== actorRecord._id) {
      syncPlayerState(actorBossRecord.playerData, now);
    }
    if (targetBossRecord?.playerData) {
      syncPlayerState(targetBossRecord.playerData, now);
    }

    result = sendGangAllianceOfferForPlayers(
      actorRecord.playerData,
      actorBossRecord?.playerData || actorRecord.playerData,
      targetBossRecord?.playerData || null,
      refreshedTargetGang,
      now
    );
    pushLog(actorRecord.playerData, result.logMessage);
    if (targetBossRecord?.playerData) {
      pushLog(targetBossRecord.playerData, `${actorRecord.playerData?.gang?.name || "Gang"} proponuje sojusz.`);
    }

    const persistedRecords = await Promise.all(
      [
        actorRecord,
        actorBossRecord?._id && actorBossRecord._id !== actorRecord._id ? actorBossRecord : null,
        targetBossRecord,
      ]
        .filter((userRecord) => userRecord?.playerData)
        .map((userRecord) => persistPlayerForUser(userRecord._id, userRecord.playerData))
    );

    const updatedActorRecord =
      persistedRecords.find((userRecord) => userRecord?._id === req.user.id) || actorRecord;
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actorRecord.playerData;
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/pvp/preview", auth, asyncHandler(async (req, res) => {
  if (
    !enforceRateLimit(
      req,
      res,
      "gang-pvp-preview",
      BACKEND_RULES.rateLimitsMs.clubPvpPreview,
      "Gang PvP preview rate limit active"
    )
  ) {
    return;
  }

  const now = Date.now();
  syncPlayerState(req.player, now);
  ensurePlayerGangState(req.player, now);
  const targetGangName = String(req.body?.targetGangName || "").trim();
  if (!targetGangName) {
    res.status(400).json({ error: "targetGangName is required" });
    return;
  }

  const gangs = await buildGangDirectorySnapshot(now);
  const actorGangName = String(req.player?.gang?.name || "").trim().toLowerCase();
  const attackerGang =
    gangs.find((entry) => entry.name.toLowerCase() === actorGangName) || {
      name: req.player?.gang?.name || "Gang",
      members: Math.max(1, Number(req.player?.gang?.members || 1)),
      influence: Math.max(0, Number(req.player?.gang?.influence || 0)),
      territory: Math.max(0, Number(req.player?.gang?.territory || 0)),
    };
  const targetGang = gangs.find((entry) => entry.name.toLowerCase() === targetGangName.toLowerCase()) || null;
  const targetBossRecord = targetGang?.bossUserId ? await findUserById(targetGang.bossUserId) : null;
  if (targetBossRecord?.playerData) {
    syncPlayerState(targetBossRecord.playerData, now);
  }

  const preview = buildGangRaidPreview(
    req.player,
    attackerGang,
    targetGang,
    targetBossRecord?.playerData || null,
    now
  );

  res.json(preview);
}));

app.post("/gang/pvp/attack", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const targetGangName = String(req.body?.targetGangName || "").trim();
  if (!targetGangName) {
    res.status(400).json({ error: "targetGangName is required" });
    return;
  }

  const liveGangs = await buildGangDirectorySnapshot(now);
  const actorGangName = String(req.player?.gang?.name || "").trim().toLowerCase();
  const actorGang = liveGangs.find((entry) => entry.name.toLowerCase() === actorGangName) || null;
  const targetGang = liveGangs.find((entry) => entry.name.toLowerCase() === targetGangName.toLowerCase()) || null;
  const actorBossUserId = actorGang?.bossUserId || req.user.id;
  const targetBossUserId = targetGang?.bossUserId || null;

  let result = null;
  await withUserMutationLocks([req.user.id, actorBossUserId, targetBossUserId].filter(Boolean), `gang-pvp-attack:${targetGangName.toLowerCase()}`, async () => {
    const actorRecord = await findUserById(req.user.id);
    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }

    const gangsSnapshot = await buildGangDirectorySnapshot(now);
    const refreshedActorGangName = String(actorRecord.playerData?.gang?.name || "").trim().toLowerCase();
    const refreshedActorGang =
      gangsSnapshot.find((entry) => entry.name.toLowerCase() === refreshedActorGangName) || null;
    const refreshedTargetGang =
      gangsSnapshot.find((entry) => entry.name.toLowerCase() === targetGangName.toLowerCase()) || null;
    const actorBossRecord =
      refreshedActorGang?.bossUserId && refreshedActorGang.bossUserId !== actorRecord._id
        ? await findUserById(refreshedActorGang.bossUserId)
        : actorRecord;
    const targetBossRecord =
      refreshedTargetGang?.bossUserId ? await findUserById(refreshedTargetGang.bossUserId) : null;

    syncPlayerState(actorRecord.playerData, now);
    if (actorBossRecord?.playerData && actorBossRecord._id !== actorRecord._id) {
      syncPlayerState(actorBossRecord.playerData, now);
    }
    if (targetBossRecord?.playerData) {
      syncPlayerState(targetBossRecord.playerData, now);
    }

    result = executeGangRaidForPlayers(
      actorRecord.playerData,
      actorBossRecord?.playerData || actorRecord.playerData,
      targetBossRecord?.playerData || null,
      refreshedActorGang,
      refreshedTargetGang,
      now
    );
    pushLog(actorRecord.playerData, result.logMessage);
    if (targetBossRecord?.playerData) {
      pushLog(
        targetBossRecord.playerData,
        result.success
          ? `${actorRecord.playerData?.profile?.name || "Gracz"} dociska Twoj gang i wyrywa ${result.steal}$.`
          : `${actorRecord.playerData?.profile?.name || "Gracz"} probuje wejsc na Twoj gang, ale odbija sie od obrony.`
      );
    }

    const persistedRecords = await Promise.all(
      [
        actorRecord,
        actorBossRecord?._id && actorBossRecord._id !== actorRecord._id ? actorBossRecord : null,
        targetBossRecord,
      ]
        .filter((userRecord) => userRecord?.playerData)
        .map((userRecord) => persistPlayerForUser(userRecord._id, userRecord.playerData))
    );

    const updatedActorRecord =
      persistedRecords.find((userRecord) => userRecord?._id === req.user.id) || actorRecord;
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actorRecord.playerData;
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/settings", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withGangMutation(req, "gang-settings", async (entries) => {
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    result = updateGangSettingsForPlayer(actorEntry.player, req.body || {}, now);
    const sharedPatch = buildSharedGangPatch(actorEntry.player.gang);
    entries.forEach((entry) => {
      syncSharedGangPatchToPlayer(entry.player, sharedPatch, entries.length, now);
    });
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/members/role", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const targetUserId = String(req.body?.targetUserId || "").trim();
  const nextRole = String(req.body?.role || "").trim();

  if (!targetUserId) {
    res.status(400).json({ error: "targetUserId is required" });
    return;
  }
  if (!nextRole) {
    res.status(400).json({ error: "role is required" });
    return;
  }
  if (targetUserId === req.user.id) {
    res.status(400).json({ error: "Swojej rangi nie przerzucisz tym przyciskiem." });
    return;
  }

  const actorPreview = await findUserById(req.user.id);
  if (!actorPreview?.playerData) {
    res.status(401).json({ error: "Authenticated player not found" });
    return;
  }

  syncPlayerState(actorPreview.playerData, now);
  ensurePlayerGangState(actorPreview.playerData, now);
  if (!actorPreview.playerData.gang?.joined || !actorPreview.playerData.gang?.name) {
    res.status(400).json({ error: "Najpierw wejdz do gangu." });
    return;
  }
  if (actorPreview.playerData.gang.role !== "Boss") {
    res.status(403).json({ error: "Tylko boss ustawia role w ekipie." });
    return;
  }

  const gangName = String(actorPreview.playerData.gang.name || "").trim();
  const gangUserIds = (await listUsers())
    .filter((userRecord) => {
      const player = userRecord?.playerData;
      return (
        player?.gang?.joined &&
        String(player.gang.name || "").trim().toLowerCase() === gangName.toLowerCase()
      );
    })
    .map((userRecord) => userRecord._id);
  const affectedUserIds = [...new Set([...gangUserIds, req.user.id, targetUserId])];

  let result = null;
  await withUserMutationLocks(affectedUserIds, `gang-role:${gangName.toLowerCase()}`, async () => {
    const refreshedUsers = await Promise.all(affectedUserIds.map((userId) => findUserById(userId)));
    const actorRecord = refreshedUsers.find((userRecord) => userRecord?._id === req.user.id);
    const targetRecord = refreshedUsers.find((userRecord) => userRecord?._id === targetUserId);

    if (!actorRecord?.playerData || !targetRecord?.playerData) {
      const error = new Error("Nie znaleziono jednego z graczy.");
      error.statusCode = 404;
      throw error;
    }

    const actor = actorRecord.playerData;
    const target = targetRecord.playerData;
    syncPlayerState(actor, now);
    syncPlayerState(target, now);
    ensurePlayerGangState(actor, now);
    ensurePlayerGangState(target, now);

    if (!actor.gang.joined || actor.gang.role !== "Boss") {
      const error = new Error("Tylko boss ustawia role w ekipie.");
      error.statusCode = 403;
      throw error;
    }
    if (
      !target.gang.joined ||
      String(target.gang.name || "").trim().toLowerCase() !== String(actor.gang.name || "").trim().toLowerCase()
    ) {
      const error = new Error("Ten gracz nie siedzi w Twoim gangu.");
      error.statusCode = 400;
      throw error;
    }

    const currentViceRecord = refreshedUsers.find(
      (userRecord) =>
        userRecord?._id !== targetUserId &&
        userRecord?.playerData?.gang?.joined &&
        String(userRecord.playerData.gang.name || "").trim().toLowerCase() === String(actor.gang.name || "").trim().toLowerCase() &&
        String(userRecord.playerData.gang.role || "").trim() === "Vice Boss"
    ) || null;

    result = updateGangMemberRoleForPlayers(actor, target, nextRole, now, {
      actorUserId: actorRecord._id,
      targetUserId: targetRecord._id,
      currentVice: currentViceRecord?.playerData || null,
      currentViceUserId: currentViceRecord?._id || null,
    });
    pushLog(actor, result.logMessage);
    pushLog(target, result.targetLogMessage);
    if (currentViceRecord?.playerData && result.displacedViceLogMessage) {
      pushLog(currentViceRecord.playerData, result.displacedViceLogMessage);
    }

    const recordsToPersist = [
      actorRecord,
      targetRecord,
      ...(currentViceRecord ? [currentViceRecord] : []),
    ].filter(Boolean);
    const persistedRecords = await Promise.all(
      recordsToPersist.map((userRecord) => persistPlayerForUser(userRecord._id, userRecord.playerData))
    );
    const updatedActorRecord =
      persistedRecords.find((userRecord) => userRecord?._id === req.user.id) || actorRecord;
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actor;
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/delete", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const actorPreview = await findUserById(req.user.id);
  if (!actorPreview?.playerData) {
    res.status(401).json({ error: "Authenticated player not found" });
    return;
  }

  syncPlayerState(actorPreview.playerData, now);
  ensurePlayerGangState(actorPreview.playerData, now);
  if (!actorPreview.playerData.gang?.joined || !actorPreview.playerData.gang?.name) {
    res.status(400).json({ error: "Nie masz gangu do usuniecia." });
    return;
  }
  if (actorPreview.playerData.gang.role !== "Boss") {
    res.status(403).json({ error: "Gang usuwa tylko boss." });
    return;
  }

  const gangName = String(actorPreview.playerData.gang.name || "").trim();
  const users = await listUsers();
  const affectedUsers = users.filter((userRecord) => {
    const player = userRecord?.playerData;
    const sameGang =
      player?.gang?.joined &&
      String(player.gang.name || "").trim().toLowerCase() === gangName.toLowerCase();
    const hasInvite = Array.isArray(player?.gang?.invites)
      ? player.gang.invites.some(
          (invite) => String(invite?.gangName || "").trim().toLowerCase() === gangName.toLowerCase()
        )
      : false;
    return sameGang || hasInvite;
  });
  const affectedUserIds = affectedUsers.map((userRecord) => userRecord._id);

  let result = null;
  await withUserMutationLocks(affectedUserIds.length ? affectedUserIds : [req.user.id], `gang-delete:${gangName.toLowerCase()}`, async () => {
    const refreshedUsers = await Promise.all(affectedUserIds.map((userId) => findUserById(userId)));
    const memberRecords = refreshedUsers.filter(
      (userRecord) =>
        userRecord?.playerData?.gang?.joined &&
        String(userRecord.playerData.gang.name || "").trim().toLowerCase() === gangName.toLowerCase()
    );
    const inviteRecords = refreshedUsers.filter(
      (userRecord) =>
        !(
          userRecord?.playerData?.gang?.joined &&
          String(userRecord.playerData.gang.name || "").trim().toLowerCase() === gangName.toLowerCase()
        ) &&
        Array.isArray(userRecord?.playerData?.gang?.invites) &&
        userRecord.playerData.gang.invites.some(
          (invite) => String(invite?.gangName || "").trim().toLowerCase() === gangName.toLowerCase()
        )
    );
    const actorRecord = refreshedUsers.find((userRecord) => userRecord?._id === req.user.id);

    if (!actorRecord?.playerData) {
      const error = new Error("Authenticated player not found");
      error.statusCode = 401;
      throw error;
    }
    syncPlayerState(actorRecord.playerData, now);
    ensurePlayerGangState(actorRecord.playerData, now);
    if (actorRecord.playerData.gang.role !== "Boss") {
      const error = new Error("Gang usuwa tylko boss.");
      error.statusCode = 403;
      throw error;
    }

    for (const userRecord of memberRecords) {
      const player = userRecord.playerData;
      syncPlayerState(player, now);
      ensurePlayerGangState(player, now);
      const keptInvites = (Array.isArray(player.gang.invites) ? player.gang.invites : []).filter(
        (invite) => String(invite?.gangName || "").trim().toLowerCase() !== gangName.toLowerCase()
      );
      player.gang = createGangState({ invites: keptInvites });
      pushLog(player, `Gang ${gangName} zostal rozwiazany.`);
    }

    for (const userRecord of inviteRecords) {
      const player = userRecord.playerData;
      syncPlayerState(player, now);
      ensurePlayerGangState(player, now);
      player.gang.invites = (Array.isArray(player.gang.invites) ? player.gang.invites : []).filter(
        (invite) => String(invite?.gangName || "").trim().toLowerCase() !== gangName.toLowerCase()
      );
      pushLog(player, `Zaproszenie do ${gangName} wygasa, bo gang juz nie istnieje.`);
    }

    const persistedRecords = await Promise.all(
      refreshedUsers
        .filter((userRecord) => userRecord?.playerData)
        .map((userRecord) => persistPlayerForUser(userRecord._id, userRecord.playerData))
    );
    const updatedActorRecord =
      persistedRecords.find((userRecord) => userRecord?._id === req.user.id) ||
      actorRecord;
    req.userRecord = updatedActorRecord;
    req.player = updatedActorRecord?.playerData || actorRecord.playerData;
    result = {
      gangName,
      removedMembers: memberRecords.length,
      removedInvites: inviteRecords.length,
      message: `Gang ${gangName} zostal usuniety z miasta.`,
    };
  });

  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/tribute", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const amount = Number(req.body?.amount || 0);
  let result = null;
  await withGangMutation(req, "gang-tribute", async (entries) => {
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    result = contributeGangVaultForPlayer(actorEntry.player, amount, now);
    const sharedPatch = buildSharedGangPatch(actorEntry.player.gang);
    entries.forEach((entry) => {
      syncSharedGangPatchToPlayer(entry.player, sharedPatch, entries.length, now);
    });
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/focus", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const districtId = String(req.body?.districtId || "").trim();
  let result = null;
  await withGangMutation(req, "gang-focus", async (entries) => {
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    result = setGangFocusForPlayer(actorEntry.player, districtId, now);
    const sharedPatch = buildSharedGangPatch(actorEntry.player.gang);
    entries.forEach((entry) => {
      syncSharedGangPatchToPlayer(entry.player, sharedPatch, entries.length, now);
    });
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/projects/invest", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const projectId = String(req.body?.projectId || "").trim();
  let result = null;
  await withGangMutation(req, "gang-project-invest", async (entries) => {
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    result = investGangProjectForPlayer(actorEntry.player, projectId, now);
    const sharedPatch = buildSharedGangPatch(actorEntry.player.gang);
    entries.forEach((entry) => {
      syncSharedGangPatchToPlayer(entry.player, sharedPatch, entries.length, now);
    });
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/goals/claim", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withGangMutation(req, "gang-goal-claim", async (entries) => {
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    result = claimGangWeeklyGoalForPlayer(actorEntry.player, now);
    applyGangGoalRewardToPlayer(actorEntry.player, result.rewards, now);
    const sharedPatch = buildSharedGangPatch(actorEntry.player.gang);
    entries.forEach((entry) => {
      syncSharedGangPatchToPlayer(entry.player, sharedPatch, entries.length, now);
    });
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/members/upgrade", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withGangMutation(req, "gang-members-upgrade", async (entries) => {
    result = upgradeGangCapacityForGang(entries, req.user.id, now);
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, { result }));
}));

app.post("/gang/heists/:id/open", auth, asyncHandler(async (req, res) => {
  const heistId = String(req.params?.id || "").trim();
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  const heist = getGangHeistById(heistId);
  if (!heist) {
    res.status(404).json({ error: "Gang heist not found", heistId });
    return;
  }

  const now = Date.now();
  let result = null;
  await withGangMutation(req, `gang-heist-open:${heist.id}`, async (entries) => {
    result = openGangHeistLobbyForGang(entries, req.user.id, heist.id, note, now);
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, {
    result,
    gangHeists: GANG_HEISTS,
  }));
}));

app.post("/gang/heists/:id/join", auth, asyncHandler(async (req, res) => {
  const heistId = String(req.params?.id || "").trim();
  const heist = getGangHeistById(heistId);
  if (!heist) {
    res.status(404).json({ error: "Gang heist not found", heistId });
    return;
  }
  const now = Date.now();
  let result = null;
  await withGangMutation(req, `gang-heist-join:${heist.id}`, async (entries) => {
    result = joinGangHeistLobbyForGang(entries, req.user.id, now);
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, {
    result,
    gangHeists: GANG_HEISTS,
  }));
}));

app.post("/gang/heists/:id/leave", auth, asyncHandler(async (req, res) => {
  const heistId = String(req.params?.id || "").trim();
  const heist = getGangHeistById(heistId);
  if (!heist) {
    res.status(404).json({ error: "Gang heist not found", heistId });
    return;
  }
  const now = Date.now();
  let result = null;
  await withGangMutation(req, `gang-heist-leave:${heist.id}`, async (entries) => {
    result = leaveGangHeistLobbyForGang(entries, req.user.id, now);
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, {
    result,
    gangHeists: GANG_HEISTS,
  }));
}));

app.post("/gang/heists/:id/start", auth, asyncHandler(async (req, res) => {
  const heistId = String(req.params?.id || "").trim();
  const heist = getGangHeistById(heistId);
  if (!heist) {
    res.status(404).json({ error: "Gang heist not found", heistId });
    return;
  }
  const now = Date.now();
  let result = null;
  await withGangMutation(req, `gang-heist-start:${heist.id}`, async (entries) => {
    result = startGangHeistForGang(entries, req.user.id, now);
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, {
    result,
    gangHeists: GANG_HEISTS,
  }));
}));

app.post("/gang/heists/rescue", auth, asyncHandler(async (req, res) => {
  const optionId = String(req.body?.optionId || "").trim();
  const now = Date.now();
  let result = null;
  await withGangMutation(req, "gang-heist-rescue", async (entries) => {
    result = rescueGangHeistCrewForGang(entries, req.user.id, optionId, now);
    const actorEntry = getGangMutationActor(entries, req.user.id, now);
    pushLog(actorEntry.player, result.logMessage);
  });
  res.json(await buildPlayerEnvelope(req.player, now, {
    result,
    gangHeists: GANG_HEISTS,
  }));
}));

app.post("/gang/heists/:id/execute", auth, asyncHandler(async (_req, res) => {
  res.status(409).json({ error: "Napady gangu ida teraz przez lobby: otworz, dolacz i wystartuj sklad." });
}));

app.get("/contracts", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  syncPlayerState(req.player, now);
  res.json(buildContractBoardForPlayer(req.player, now));
}));

app.post("/contracts/items/buy", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const itemId = String(req.body?.itemId || "").trim();
  let result = null;
  await withPlayerActionLock(req, "contracts-item-buy", async () => {
    await commitPlayerMutation(req, "contracts-item-buy", async (player) => {
      result = buyContractItemForPlayer(player, itemId);
      pushLog(player, result.logMessage);
      return result;
    });
  });
  res.json({
    user: publicPlayer(req.player, now),
    result,
    contractsBoard: buildContractBoardForPlayer(req.player, now),
  });
}));

app.post("/contracts/cars/buy", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const carId = String(req.body?.carId || "").trim();
  let result = null;
  await withPlayerActionLock(req, "contracts-car-buy", async () => {
    await commitPlayerMutation(req, "contracts-car-buy", async (player) => {
      result = buyContractCarForPlayer(player, carId);
      pushLog(player, result.logMessage);
      return result;
    });
  });
  res.json({
    user: publicPlayer(req.player, now),
    result,
    contractsBoard: buildContractBoardForPlayer(req.player, now),
  });
}));

app.post("/contracts/loadout/equip", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const slotId = String(req.body?.slotId || "").trim();
  const assetId = typeof req.body?.assetId === "string" ? req.body.assetId.trim() : null;
  let result = null;
  await withPlayerActionLock(req, "contracts-loadout-equip", async () => {
    await commitPlayerMutation(req, "contracts-loadout-equip", async (player) => {
      result = equipContractLoadoutForPlayer(player, slotId, assetId);
      pushLog(player, result.logMessage);
      return result;
    });
  });
  res.json({
    user: publicPlayer(req.player, now),
    result,
    contractsBoard: buildContractBoardForPlayer(req.player, now),
  });
}));

app.post("/contracts/execute", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const contractId = String(req.body?.contractId || "").trim();
  let result = null;
  await withPlayerActionLock(req, "contracts-execute", async () => {
    await commitPlayerMutation(req, "contracts-execute", async (player) => {
      result = executeContractForPlayer(player, contractId, now);
      pushLog(player, result.logMessage);
      return result;
    });
  });
  res.json({
    user: publicPlayer(req.player, now),
    result,
    contractsBoard: buildContractBoardForPlayer(req.player, now),
  });
}));

app.get("/operations", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  syncPlayerState(req.player, now);
  res.json({
    catalog: OPERATION_CATALOG,
    active: req.player.operations?.active || null,
    history: req.player.operations?.history || [],
    districts: getDistrictSummaries(req.player.city),
  });
}));

app.post("/operations/start", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const operationId = String(req.body?.operationId || "").trim();
  let result = null;
  await withPlayerActionLock(req, "operations-start", async () => {
    await commitPlayerMutation(req, "operations-start", async (player) => {
      result = startOperationForPlayer(player, operationId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json({ user: publicPlayer(req.player, now), result });
}));

app.post("/operations/advance", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  const choiceId = String(req.body?.choiceId || "").trim();
  let result = null;
  await withPlayerActionLock(req, "operations-advance", async () => {
    await commitPlayerMutation(req, "operations-advance", async (player) => {
      result = advanceOperationForPlayer(player, choiceId, now);
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json({ user: publicPlayer(req.player, now), result });
}));

app.post("/operations/execute", auth, asyncHandler(async (req, res) => {
  const now = Date.now();
  let result = null;
  await withPlayerActionLock(req, "operations-execute", async () => {
    await commitPlayerMutation(req, "operations-execute", async (player) => {
      result = executeOperationForPlayer(player, now);
      applyOperationDistrictOutcome(player, result.districtId, { success: result.success, now });
      pushLog(player, result.logMessage);
      return null;
    });
  });
  res.json({ user: publicPlayer(req.player, now), result });
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
    res.status(400).json({ error: "Not enough wallet cash for deposit" });
    return;
  }

  await withPlayerActionLock(req, "bank-deposit", async () => {
    await commitPlayerMutation(req, "bank-deposit", async (player) => {
      player.profile.cash -= totalCost;
      player.profile.bank += amount;
      pushLog(player, `Wplacono do banku $${amount}.`);
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
    res.status(400).json({ error: "Not enough bank cash for withdrawal" });
    return;
  }

  await withPlayerActionLock(req, "bank-withdraw", async () => {
    await commitPlayerMutation(req, "bank-withdraw", async (player) => {
      player.profile.bank -= totalDebit;
      player.profile.cash += amount;
      pushLog(player, `Wyplacono z banku $${amount}.`);
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
        applyHeistDistrictOutcome(currentPlayer, heist, { success: true, now });
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
      applyHeistDistrictOutcome(currentPlayer, heist, { success: false, now });
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


