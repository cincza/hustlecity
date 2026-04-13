import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Datastore from "@seald-io/nedb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../../data");
const userDbPath = path.join(dataDir, "users.db");

let usersDb;
let userStoreInitLogged = false;

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : null;
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
    console.log(`[userStore] created database file at ${userDbPath}`);
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
    console.error(`[userStore] failed to load users.db, moving broken file to ${corruptPath}`);
    await fs.rename(userDbPath, corruptPath);
    await fs.writeFile(userDbPath, "", "utf8");
    usersDb = new Datastore({ filename: userDbPath });
    await usersDb.loadDatabaseAsync();
  }
  await usersDb.ensureIndexAsync({ fieldName: "usernameLower", unique: true });
  await usersDb.ensureIndexAsync({ fieldName: "emailLower", sparse: true, unique: true });
  if (!userStoreInitLogged) {
    console.log(`[userStore] database ready at ${userDbPath}`);
    userStoreInitLogged = true;
  }
  return usersDb;
}

export async function initUserStore() {
  await getDb();
}

export async function findUserById(userId) {
  const db = await getDb();
  const user = await db.findOneAsync({ _id: userId });
  console.log(`[userStore] read by id ${userId} -> ${user ? "hit" : "miss"}`);
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
  console.log(`[userStore] read by login ${rawLogin} -> ${user ? "hit" : "miss"}`);
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
  const doc = {
    _id: crypto.randomUUID(),
    username,
    usernameLower: normalizeUsername(username),
    email: email || null,
    emailLower: normalizeEmail(email),
    passwordHash,
    playerData: safePlayerData,
    createdAt: now,
    updatedAt: now,
  };
  const inserted = await db.insertAsync(doc);
  console.log(`[userStore] created user ${inserted.username} (${inserted._id})`);
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
  console.log(`[userStore] saved playerData for ${userId} at ${updatedAt}`);
  return findUserById(userId);
}
