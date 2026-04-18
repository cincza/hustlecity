import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Datastore from "@seald-io/nedb";
import { logError, logInfo } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configuredDataDir = String(process.env.DATA_DIR || "").trim();
const dataDir = configuredDataDir
  ? path.resolve(configuredDataDir)
  : path.resolve(__dirname, "../../data");
const userDbPath = path.join(dataDir, "users.db");
const globalChatDbPath = path.join(dataDir, "global-chat.db");

let usersDb;
let globalChatDb;
let userStoreInitLogged = false;
const VERBOSE_USER_STORE_LOGS = process.env.VERBOSE_USER_STORE_LOGS === "1";

function logUserStore(message, level = "log") {
  if (!VERBOSE_USER_STORE_LOGS) return;
  logInfo("user-store", level, { message, dataDir });
}

function normalizeEmail(email) {
  if (typeof email !== "string") return undefined;
  const normalized = email.trim().toLowerCase();
  return normalized || undefined;
}

function normalizeUsername(username) {
  return typeof username === "string" ? username.trim().toLowerCase() : null;
}

function sanitizeUsernameSeed(rawValue) {
  const cleaned = String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return cleaned.slice(0, 18) || `gracz${crypto.randomInt(1000, 9999)}`;
}

async function ensureUsersDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(userDbPath);
  } catch (_error) {
    await fs.writeFile(userDbPath, "", "utf8");
    logUserStore(`created database file at ${userDbPath}`);
  }
}

async function ensureGlobalChatDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(globalChatDbPath);
  } catch (_error) {
    await fs.writeFile(globalChatDbPath, "", "utf8");
    logUserStore(`created global chat database file at ${globalChatDbPath}`);
  }
}

function clonePlayerData(playerData) {
  if (!playerData || typeof playerData !== "object" || Array.isArray(playerData)) {
    return null;
  }
  return JSON.parse(JSON.stringify(playerData));
}

async function getDb() {
  if (usersDb) return usersDb;
  await ensureUsersDbFile();
  usersDb = new Datastore({ filename: userDbPath });
  try {
    await usersDb.loadDatabaseAsync();
  } catch (error) {
    const corruptPath = path.join(
      dataDir,
      `users.db.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}`
    );
    logError("persistence", "users-db-load-failed", {
      userDbPath,
      corruptPath,
      reason: error?.message || "unknown",
    });
    await fs.rename(userDbPath, corruptPath);
    await fs.writeFile(userDbPath, "", "utf8");
    usersDb = new Datastore({ filename: userDbPath });
    await usersDb.loadDatabaseAsync();
  }
  await migrateOptionalEmailFields(usersDb);
  await usersDb.ensureIndexAsync({ fieldName: "usernameLower", unique: true });
  await usersDb.ensureIndexAsync({ fieldName: "emailLower", sparse: true, unique: true });
  if (!userStoreInitLogged) {
    logUserStore(`database ready at ${userDbPath}`);
    userStoreInitLogged = true;
  }
  return usersDb;
}

async function migrateOptionalEmailFields(db) {
  const docs = await db.findAsync({
    $or: [{ email: null }, { email: "" }, { emailLower: null }, { emailLower: "" }],
  });

  if (!docs.length) return;

  for (const doc of docs) {
    const trimmedEmail = typeof doc.email === "string" ? doc.email.trim() : "";
    const normalizedEmail = normalizeEmail(trimmedEmail);
    const update = {};

    if (normalizedEmail) {
      update.$set = {
        email: trimmedEmail,
        emailLower: normalizedEmail,
      };
    } else {
      update.$unset = {
        email: true,
        emailLower: true,
      };
    }

    await db.updateAsync({ _id: doc._id }, update, {});
  }

  logInfo("persistence", "optional-email-migration", {
    cleanedUsers: docs.length,
    dataDir,
  });
}

async function getGlobalChatDb() {
  if (globalChatDb) return globalChatDb;
  await ensureGlobalChatDbFile();
  globalChatDb = new Datastore({ filename: globalChatDbPath });
  await globalChatDb.loadDatabaseAsync();
  await globalChatDb.ensureIndexAsync({ fieldName: "createdAt" });
  return globalChatDb;
}

export async function initUserStore() {
  await getDb();
  await getGlobalChatDb();
  logInfo("persistence", "store-initialized", {
    dataDir,
    userDbPath,
    globalChatDbPath,
  });
}

export async function findUserById(userId) {
  const db = await getDb();
  const user = await db.findOneAsync({ _id: userId });
  logUserStore(`read by id ${userId} -> ${user ? "hit" : "miss"}`);
  return user;
}

export async function findUserByLogin(login) {
  const db = await getDb();
  const rawLogin = String(login || "").trim();
  if (!rawLogin) return null;

  const emailLower = normalizeEmail(rawLogin);
  const usernameLower = normalizeUsername(rawLogin);
  const user =
    (await db.findOneAsync({ emailLower })) ||
    (await db.findOneAsync({ usernameLower })) ||
    null;
  logUserStore(`read by login ${rawLogin} -> ${user ? "hit" : "miss"}`);
  return user;
}

export async function usernameExists(username) {
  const db = await getDb();
  const usernameLower = normalizeUsername(username);
  if (!usernameLower) return false;
  const existing = await db.findOneAsync({ usernameLower });
  return Boolean(existing);
}

export async function createAvailableUsername(login, preferredUsername) {
  const db = await getDb();
  const preferred = sanitizeUsernameSeed(
    preferredUsername || (String(login || "").includes("@") ? String(login).split("@")[0] : login)
  );

  let candidate = preferred;
  let counter = 1;
  while (await db.findOneAsync({ usernameLower: normalizeUsername(candidate) })) {
    counter += 1;
    candidate = `${preferred}${counter}`;
  }

  return candidate;
}

export async function createUserRecord({
  username,
  email,
  passwordHash,
  playerData,
}) {
  const db = await getDb();
  const now = new Date().toISOString();
  const safePlayerData = clonePlayerData(playerData);
  if (!safePlayerData) {
    throw new Error("playerData must be a valid object");
  }
  const trimmedEmail = typeof email === "string" ? email.trim() : "";
  const normalizedEmail = normalizeEmail(trimmedEmail);
  const doc = {
    _id: crypto.randomUUID(),
    username,
    usernameLower: normalizeUsername(username),
    passwordHash,
    playerData: safePlayerData,
    createdAt: now,
    updatedAt: now,
  };
  if (normalizedEmail) {
    doc.email = trimmedEmail;
    doc.emailLower = normalizedEmail;
  }
  const inserted = await db.insertAsync(doc);
  logUserStore(`created user ${inserted.username} (${inserted._id})`);
  return inserted;
}

export async function saveUserPlayerData(userId, playerData) {
  const db = await getDb();
  const safePlayerData = clonePlayerData(playerData);
  if (!userId) {
    throw new Error("saveUserPlayerData requires userId");
  }
  if (!safePlayerData) {
    throw new Error("saveUserPlayerData requires playerData object");
  }
  const updatedAt = new Date().toISOString();
  await db.updateAsync(
    { _id: userId },
    {
      $set: {
        playerData: safePlayerData,
        updatedAt,
      },
    },
    {}
  );
  logUserStore(`saved playerData for ${userId} at ${updatedAt}`);
  logInfo("persistence", "player-saved", {
    userId,
    updatedAt,
    dataDir,
  });
  return findUserById(userId);
}

export async function deleteUserByLogin(login) {
  const db = await getDb();
  const rawLogin = String(login || "").trim();
  if (!rawLogin) return 0;

  const emailLower = normalizeEmail(rawLogin);
  const usernameLower = normalizeUsername(rawLogin);
  const result = await db.removeAsync(
    {
      $or: [{ emailLower }, { usernameLower }],
    },
    { multi: true }
  );
  logUserStore(`deleted by login ${rawLogin} -> ${result}`);
  return result;
}

export async function listUsers() {
  const db = await getDb();
  return db.findAsync({});
}

export async function clearAllUsers() {
  const db = await getDb();
  const removed = await db.removeAsync({}, { multi: true });
  logUserStore(`cleared users -> ${removed}`);
  return removed;
}

export async function getGlobalChatMessages(limit = 40) {
  const db = await getGlobalChatDb();
  const safeLimit = Math.max(1, Math.min(80, Number(limit) || 40));
  const entries = await db.findAsync({}).sort({ createdAt: -1 }).limit(safeLimit);
  return entries;
}

export async function clearGlobalChatMessages() {
  const db = await getGlobalChatDb();
  const removed = await db.removeAsync({}, { multi: true });
  logUserStore(`cleared global chat -> ${removed}`);
  return removed;
}

export async function addGlobalChatMessage({ userId, author, text }) {
  const db = await getGlobalChatDb();
  const now = Date.now();
  return db.insertAsync({
    _id: crypto.randomUUID(),
    userId,
    author,
    text,
    createdAt: now,
  });
}
