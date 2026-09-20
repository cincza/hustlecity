import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../bootstrapEnv.js";
import Datastore from "@seald-io/nedb";
import { gameDatabasePath, getGameDatabase, closeGameDatabase, readUser, readUserByLogin, readUsers, insertUserRecord, stagePlayerSave, stageAuthenticationUpdate, stageUserDelete, stageAdminAudit, readAdminAudits } from "./gameDatabase.js";
import { logInfo } from "../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configuredDataDir = String(process.env.DATA_DIR || "").trim();
const dataDir = configuredDataDir
  ? path.resolve(configuredDataDir)
  : path.resolve(__dirname, "../../data");
const globalChatDbPath = path.join(dataDir, "global-chat.db");
const prisonChatDbPath = path.join(dataDir, "prison-chat.db");

let globalChatDb;
let prisonChatDb;
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



async function ensureGlobalChatDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(globalChatDbPath);
  } catch (_error) {
    await fs.writeFile(globalChatDbPath, "", "utf8");
    logUserStore(`created global chat database file at ${globalChatDbPath}`);
  }
}

async function ensurePrisonChatDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(prisonChatDbPath);
  } catch (_error) {
    await fs.writeFile(prisonChatDbPath, "", "utf8");
    logUserStore(`created prison chat database file at ${prisonChatDbPath}`);
  }
}

function clonePlayerData(playerData) {
  if (!playerData || typeof playerData !== "object" || Array.isArray(playerData)) {
    return null;
  }
  return JSON.parse(JSON.stringify(playerData));
}

function withPlayerIdentity(user) {
  if (user?.playerData) {
    user.playerData.id = user._id;
    user.playerData.username = user.username;
  }
  return user;
}



async function getGlobalChatDb() {
  if (globalChatDb) return globalChatDb;
  await ensureGlobalChatDbFile();
  globalChatDb = new Datastore({ filename: globalChatDbPath });
  await globalChatDb.loadDatabaseAsync();
  await globalChatDb.ensureIndexAsync({ fieldName: "createdAt" });
  return globalChatDb;
}

async function getPrisonChatDb() {
  if (prisonChatDb) return prisonChatDb;
  await ensurePrisonChatDbFile();
  prisonChatDb = new Datastore({ filename: prisonChatDbPath });
  await prisonChatDb.loadDatabaseAsync();
  await prisonChatDb.ensureIndexAsync({ fieldName: "createdAt" });
  return prisonChatDb;
}

export async function initUserStore() {
  await getGameDatabase();
  await getGlobalChatDb();
  await getPrisonChatDb();
  logInfo("persistence", "store-initialized", {
    dataDir,
    userDbPath: gameDatabasePath,
    globalChatDbPath,
    prisonChatDbPath,
  });
}

export async function findUserById(userId) { return readUser(userId); }

export async function findUserByLogin(login) { return readUserByLogin(login); }

export async function usernameExists(username) {
  const db = await getGameDatabase();
  const lower = normalizeUsername(username);
  return Boolean(lower && db.prepare("SELECT id FROM users WHERE username_lower = ?").get(lower));
}

export async function createAvailableUsername(login, preferredUsername) {
  const preferred = sanitizeUsernameSeed(
    preferredUsername || (String(login || "").includes("@") ? String(login).split("@")[0] : login)
  );

  let candidate = preferred;
  let counter = 1;
  while (await usernameExists(candidate)) {
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
    authVersion: 0,
    authDisabled: false,
    playerData: safePlayerData,
    createdAt: now,
    updatedAt: now,
  };
  if (normalizedEmail) {
    doc.email = trimmedEmail;
    doc.emailLower = normalizedEmail;
  }
  withPlayerIdentity(doc);
  const inserted = await insertUserRecord(doc);
  logUserStore(`created user ${inserted.username} (${inserted._id})`);
  return inserted;
}

export async function saveUserPlayerData(userId, playerData) {
  return stagePlayerSave(userId, playerData);
}

export function closeUserStore() { closeGameDatabase(); }

export async function updateUserAuthentication(userId, { passwordHash, authDisabled }) {
  return stageAuthenticationUpdate(userId, { passwordHash, authDisabled });
}

export async function deleteUserByLogin(login) {
  const user = await readUserByLogin(login);
  if (!user) return 0;
  return (await stageUserDelete(user._id)) ? 1 : 0;
}

export async function deleteUserById(userId) { return stageUserDelete(userId); }
export async function appendAdminAudit(entry) { return stageAdminAudit(entry); }
export async function listAdminAudits(options) { return readAdminAudits(options); }

export async function listUsers() { return readUsers(); }

export async function clearAllUsers() {
  const db = await getGameDatabase();
  return db.prepare("DELETE FROM users").run().changes;
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

export async function getPrisonChatMessages(limit = 15) {
  const db = await getPrisonChatDb();
  const safeLimit = Math.max(1, Math.min(30, Number(limit) || 15));
  const entries = await db.findAsync({}).sort({ createdAt: -1 }).limit(safeLimit);
  return entries;
}

export async function clearPrisonChatMessages() {
  const db = await getPrisonChatDb();
  const removed = await db.removeAsync({}, { multi: true });
  logUserStore(`cleared prison chat -> ${removed}`);
  return removed;
}

export async function addPrisonChatMessage({ userId, author, text }) {
  const db = await getPrisonChatDb();
  const now = Date.now();
  return db.insertAsync({
    _id: crypto.randomUUID(),
    userId,
    author,
    text,
    createdAt: now,
  });
}
