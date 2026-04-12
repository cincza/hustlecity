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

async function getDb() {
  if (usersDb) return usersDb;
  await fs.mkdir(dataDir, { recursive: true });
  usersDb = new Datastore({ filename: userDbPath });
  await usersDb.loadDatabaseAsync();
  await usersDb.ensureIndexAsync({ fieldName: "usernameLower", unique: true });
  await usersDb.ensureIndexAsync({ fieldName: "emailLower", sparse: true, unique: true });
  return usersDb;
}

export async function initUserStore() {
  await getDb();
}

export async function findUserById(userId) {
  const db = await getDb();
  return db.findOneAsync({ _id: userId });
}

export async function findUserByLogin(login) {
  const db = await getDb();
  const rawLogin = String(login || "").trim();
  if (!rawLogin) return null;

  const emailLower = normalizeEmail(rawLogin);
  const usernameLower = normalizeUsername(rawLogin);
  return (
    (await db.findOneAsync({ emailLower })) ||
    (await db.findOneAsync({ usernameLower })) ||
    null
  );
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
  const doc = {
    _id: crypto.randomUUID(),
    username,
    usernameLower: normalizeUsername(username),
    email: email || null,
    emailLower: normalizeEmail(email),
    passwordHash,
    playerData,
    createdAt: now,
    updatedAt: now,
  };
  return db.insertAsync(doc);
}

export async function saveUserPlayerData(userId, playerData) {
  const db = await getDb();
  const updatedAt = new Date().toISOString();
  await db.updateAsync(
    { _id: userId },
    {
      $set: {
        playerData,
        updatedAt,
      },
    },
    {}
  );
  return findUserById(userId);
}
