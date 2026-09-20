import { DatabaseSync } from "node:sqlite";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import "../bootstrapEnv.js";
import { currentTransaction } from "./transactionContext.js";
import { logInfo } from "../utils/logger.js";
import { OPERATION_RETENTION_MS } from "../../../shared/transactions.js";

export const gameDataDir = process.env.DATA_DIR?.trim()
  ? path.resolve(process.env.DATA_DIR.trim())
  : path.resolve(import.meta.dirname, "../../data");
export const gameDatabasePath = path.join(gameDataDir, "game.sqlite");
let database;
let initialization;
let lastReceiptCleanup = 0;

export function withPlayerIdentity(user) {
  if (user?.playerData) {
    user.playerData.id = user._id;
    user.playerData.username = user.username;
  }
  return user;
}

// Read the NeDB append log without loading/compacting or modifying its source file.
export async function readLegacyUsers(filename) {
  let source;
  try { source = await fs.readFile(filename, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return { records: [], checksum: null }; throw error; }
  const records = new Map();
  try {
    for (const line of source.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const record = JSON.parse(line);
      if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("Invalid record");
      if (record.$$indexCreated || record.$$indexRemoved) continue;
      if (typeof record._id !== "string" || !record._id) throw new Error("Missing record id");
      if (record.$$deleted === true) { records.delete(record._id); continue; }
      if (typeof record.username !== "string" || !record.username.trim() || typeof record.passwordHash !== "string" || !record.passwordHash || !record.playerData || typeof record.playerData !== "object" || Array.isArray(record.playerData)) throw new Error("Incomplete user record");
      records.set(record._id, record);
    }
  } catch (error) {
    throw new Error("User database could not be migrated. Original file preserved; restore a verified backup before restarting.", { cause: error });
  }
  return { records: [...records.values()], checksum: crypto.createHash("sha256").update(source).digest("hex") };
}

function normalizeRecord(record) {
  const user = withPlayerIdentity(structuredClone(record));
  user.usernameLower = user.username.trim().toLowerCase();
  if (typeof user.email === "string" && user.email.trim()) {
    user.email = user.email.trim();
    user.emailLower = user.email.toLowerCase();
  } else { delete user.email; delete user.emailLower; }
  user.playerData.stateRevision = Number(user.playerData.stateRevision || 0);
  if (!Number.isSafeInteger(user.playerData.stateRevision) || user.playerData.stateRevision < 0) throw new Error("Invalid player revision");
  return user;
}

function insertUser(db, record) {
  const user = normalizeRecord(record);
  db.prepare("INSERT INTO users (id, username_lower, email_lower, revision, document) VALUES (?, ?, ?, ?, ?)")
    .run(user._id, user.usernameLower, user.emailLower || null, user.playerData.stateRevision, JSON.stringify(user));
  return user;
}

async function initialize() {
  await fs.mkdir(gameDataDir, { recursive: true });
  const db = new DatabaseSync(gameDatabasePath, { timeout: 5000 });
  try {
    // Keep commit durability enabled. SQLite owns rollback/recovery after interrupted writes.
    db.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL; PRAGMA foreign_keys = ON;");
    db.exec(`CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, username_lower TEXT NOT NULL UNIQUE, email_lower TEXT UNIQUE,
        revision INTEGER NOT NULL CHECK (revision >= 0), document TEXT NOT NULL CHECK (json_valid(document))
      );
      CREATE TABLE IF NOT EXISTS operation_receipts (
        actor_id TEXT NOT NULL, operation_key TEXT NOT NULL, request_hash TEXT NOT NULL,
        status INTEGER NOT NULL, response BLOB NOT NULL, created_at INTEGER NOT NULL,
        PRIMARY KEY (actor_id, operation_key), FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS receipts_created_at ON operation_receipts(created_at);
      CREATE TABLE IF NOT EXISTS admin_audit (
        id TEXT PRIMARY KEY, admin_id TEXT NOT NULL, admin_username TEXT NOT NULL,
        target_id TEXT, target_username TEXT, operation TEXT NOT NULL,
        before_document TEXT NOT NULL CHECK (json_valid(before_document)),
        after_document TEXT NOT NULL CHECK (json_valid(after_document)),
        reason TEXT, created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS admin_audit_created_at ON admin_audit(created_at DESC);
      CREATE INDEX IF NOT EXISTS admin_audit_target_id ON admin_audit(target_id, created_at DESC);
      CREATE TABLE IF NOT EXISTS world_documents (id TEXT PRIMARY KEY, revision INTEGER NOT NULL, document TEXT NOT NULL CHECK (json_valid(document)));`);
    const imported = db.prepare("SELECT value FROM metadata WHERE key = 'legacy-users-import'").get();
    if (!imported) {
      const legacy = await readLegacyUsers(path.join(gameDataDir, "users.db"));
      db.exec("BEGIN IMMEDIATE");
      try {
        // A second process may have finished the import while this one read the source.
        if (!db.prepare("SELECT value FROM metadata WHERE key = 'legacy-users-import'").get()) {
          if (db.prepare("SELECT COUNT(*) AS count FROM users").get().count !== 0) throw new Error("Database contains users but has no migration marker");
          for (const record of legacy.records) insertUser(db, record);
          db.prepare("INSERT INTO metadata (key, value) VALUES ('legacy-users-import', ?)")
            .run(JSON.stringify({ importedAt: new Date().toISOString(), count: legacy.records.length, sha256: legacy.checksum }));
        }
        db.exec("COMMIT");
        logInfo("persistence", "sqlite-users-ready", { count: legacy.records.length, gameDatabasePath });
      } catch (error) { db.exec("ROLLBACK"); throw error; }
    }
    db.prepare("DELETE FROM operation_receipts WHERE created_at < ?").run(Date.now() - OPERATION_RETENTION_MS);
    lastReceiptCleanup = Date.now();
    database = db;
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

export async function getGameDatabase() {
  if (database) return database;
  initialization ||= initialize().catch((error) => { initialization = null; throw error; });
  return initialization;
}

export function closeGameDatabase() {
  database?.close();
  database = undefined;
  initialization = undefined;
}

export async function readUser(id) {
  const db = await getGameDatabase();
  const staged = currentTransaction()?.players.get(id);
  if (staged) return structuredClone(staged.record);
  const row = db.prepare("SELECT document FROM users WHERE id = ?").get(id);
  return row ? withPlayerIdentity(JSON.parse(row.document)) : null;
}

export async function readUsers() {
  const db = await getGameDatabase();
  const users = new Map(db.prepare("SELECT id, document FROM users ORDER BY rowid").all().map((row) => [row.id, withPlayerIdentity(JSON.parse(row.document))]));
  for (const [id, change] of currentTransaction()?.players || []) users.set(id, structuredClone(change.record));
  for (const id of currentTransaction()?.deletedUsers?.keys() || []) users.delete(id);
  return [...users.values()];
}

export async function readUserByLogin(login) {
  const db = await getGameDatabase();
  const lower = String(login || "").trim().toLowerCase();
  if (!lower) return null;
  const row = db.prepare("SELECT id FROM users WHERE email_lower = ? OR username_lower = ? ORDER BY CASE WHEN email_lower = ? THEN 0 ELSE 1 END LIMIT 1").get(lower, lower, lower);
  return row ? readUser(row.id) : null;
}

export async function insertUserRecord(record) { return insertUser(await getGameDatabase(), record); }

export async function stageAuthenticationUpdate(userId, changes) {
  const context = currentTransaction();
  const existing = await readUser(userId);
  if (!existing) return null;
  const next = {};
  if (typeof changes?.passwordHash === "string" && changes.passwordHash) next.passwordHash = changes.passwordHash;
  if (typeof changes?.authDisabled === "boolean") next.authDisabled = changes.authDisabled;
  if (!Object.keys(next).length) return existing;
  if (!context) {
    const db = await getGameDatabase();
    const current = db.prepare("SELECT document FROM users WHERE id = ?").get(userId);
    if (!current) return null;
    const record = JSON.parse(current.document);
    Object.assign(record, next, { authVersion: Number(record.authVersion || 0) + 1, updatedAt: new Date().toISOString() });
    db.prepare("UPDATE users SET document = ? WHERE id = ?").run(JSON.stringify(record), userId);
    return withPlayerIdentity(record);
  }
  context.authentication.set(userId, {
    expectedAuthVersion: Number(existing.authVersion || 0),
    changes: next,
  });
  return withPlayerIdentity({
    ...existing,
    ...next,
    authVersion: Number(existing.authVersion || 0) + 1,
    updatedAt: new Date().toISOString(),
  });
}

export async function stageUserDelete(userId) {
  const existing = await readUser(userId);
  if (!existing) return false;
  const context = currentTransaction();
  if (!context) return Boolean((await getGameDatabase()).prepare("DELETE FROM users WHERE id = ?").run(userId).changes);
  context.players.delete(userId);
  context.authentication.delete(userId);
  context.deletedUsers.set(userId, { expectedAuthVersion: Number(existing.authVersion || 0) });
  return true;
}

export function stageAdminAudit(entry) {
  const context = currentTransaction();
  const record = {
    id: entry?.id || crypto.randomUUID(),
    adminId: String(entry?.adminId || ""),
    adminUsername: String(entry?.adminUsername || ""),
    targetId: entry?.targetId ? String(entry.targetId) : null,
    targetUsername: entry?.targetUsername ? String(entry.targetUsername) : null,
    operation: String(entry?.operation || ""),
    before: structuredClone(entry?.before ?? null),
    after: structuredClone(entry?.after ?? null),
    reason: typeof entry?.reason === "string" && entry.reason.trim() ? entry.reason.trim().slice(0, 500) : null,
    createdAt: Number(entry?.createdAt || Date.now()),
  };
  if (!record.adminId || !record.adminUsername || !record.operation) throw new Error("Complete admin audit entry required");
  if (context) context.adminAudits.push(record);
  else return writeAdminAudit(record);
  return record;
}

async function writeAdminAudit(record) {
  const db = await getGameDatabase();
  db.prepare("INSERT INTO admin_audit (id, admin_id, admin_username, target_id, target_username, operation, before_document, after_document, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(record.id, record.adminId, record.adminUsername, record.targetId, record.targetUsername, record.operation, JSON.stringify(record.before), JSON.stringify(record.after), record.reason, record.createdAt);
  return record;
}

export async function readAdminAudits({ limit = 100, targetId = null } = {}) {
  const db = await getGameDatabase();
  const safeLimit = Math.max(1, Math.min(250, Math.floor(Number(limit) || 100)));
  const rows = targetId
    ? db.prepare("SELECT * FROM admin_audit WHERE target_id = ? ORDER BY created_at DESC LIMIT ?").all(String(targetId), safeLimit)
    : db.prepare("SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT ?").all(safeLimit);
  return rows.map((row) => ({
    id: row.id,
    adminId: row.admin_id,
    adminUsername: row.admin_username,
    targetId: row.target_id,
    targetUsername: row.target_username,
    operation: row.operation,
    before: JSON.parse(row.before_document),
    after: JSON.parse(row.after_document),
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

function conflict() {
  return Object.assign(new Error("Stan gracza zmienił się. Odśwież profil i ponów akcję."), { statusCode: 409 });
}

export async function stagePlayerSave(userId, playerData) {
  if (!userId || !playerData || typeof playerData !== "object" || Array.isArray(playerData)) throw new Error("Valid user id and player data required");
  const context = currentTransaction();
  const existing = await readUser(userId);
  const expected = Number(playerData.stateRevision || 0);
  if (!existing || !Number.isSafeInteger(expected) || expected !== Number(existing.playerData.stateRevision || 0)) throw conflict();
  const prior = context?.players.get(userId);
  if (prior && expected !== prior.record.playerData.stateRevision) throw conflict();
  const record = withPlayerIdentity({ ...existing, playerData: structuredClone(playerData), updatedAt: new Date().toISOString() });
  record.playerData.stateRevision = expected + 1;
  const change = { expectedRevision: prior?.expectedRevision ?? expected, record };
  if (context) context.players.set(userId, change);
  else await commitGameTransaction({ players: new Map([[userId, change]]) });
  playerData.stateRevision = expected + 1;
  return structuredClone(record);
}

export async function readOperationReceipt(actorId, operationKey) {
  const db = await getGameDatabase();
  const row = db.prepare("SELECT request_hash, status, response FROM operation_receipts WHERE actor_id = ? AND operation_key = ?").get(actorId, operationKey);
  return row ? { hash: row.request_hash, status: row.status, body: JSON.parse(gunzipSync(row.response).toString("utf8")) } : null;
}

export async function readWorldDocument(id) {
  const staged = currentTransaction()?.documents?.get(id);
  if (staged) return { revision: staged.expectedRevision + 1, value: structuredClone(staged.value) };
  const row = (await getGameDatabase()).prepare("SELECT revision, document FROM world_documents WHERE id = ?").get(id);
  return row ? { revision: row.revision, value: JSON.parse(row.document) } : null;
}

export async function saveWorldDocument(id, value, expectedRevision = 0) {
  const context = currentTransaction();
  const previous = context?.documents?.get(id);
  const change = { expectedRevision: previous?.expectedRevision ?? expectedRevision, value: structuredClone(value) };
  if (context) context.documents.set(id, change);
  else await commitGameTransaction({ players: new Map(), documents: new Map([[id, change]]) });
}

export async function commitGameTransaction(context, receipt = null) {
  const db = await getGameDatabase();
  // No await or externally supplied callback is allowed between BEGIN and COMMIT.
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const [id, change] of context.players) {
      if (context.deletedUsers?.has(id)) continue;
      const row = db.prepare("SELECT revision, document FROM users WHERE id = ?").get(id);
      if (!row || row.revision !== change.expectedRevision) throw conflict();
      const current = JSON.parse(row.document);
      // Preserve current authentication fields if they changed while the action was calculated.
      const next = { ...current, playerData: change.record.playerData, updatedAt: change.record.updatedAt };
      const club = next.playerData.club;
      const previousClub = current.playerData.club;
      if (club?.owned && club.sourceId && (!previousClub?.owned || previousClub.sourceId !== club.sourceId)) {
        const owner = db.prepare("SELECT id FROM users WHERE id <> ? AND json_extract(document, '$.playerData.club.owned') = 1 AND json_extract(document, '$.playerData.club.sourceId') = ? LIMIT 1").get(id, club.sourceId);
        if (owner) throw Object.assign(new Error("Ten lokal jest już zajęty przez innego gracza."), { statusCode: 409 });
      }
      db.prepare("UPDATE users SET revision = ?, document = ? WHERE id = ?")
        .run(next.playerData.stateRevision, JSON.stringify(next), id);
    }
    for (const [id, change] of context.authentication || []) {
      if (context.deletedUsers?.has(id)) continue;
      const row = db.prepare("SELECT document FROM users WHERE id = ?").get(id);
      if (!row) throw conflict();
      const record = JSON.parse(row.document);
      if (Number(record.authVersion || 0) !== change.expectedAuthVersion) throw conflict();
      Object.assign(record, change.changes, {
        authVersion: Number(record.authVersion || 0) + 1,
        updatedAt: new Date().toISOString(),
      });
      db.prepare("UPDATE users SET document = ? WHERE id = ?").run(JSON.stringify(record), id);
    }
    for (const [id, change] of context.documents || []) {
      const row = db.prepare("SELECT revision FROM world_documents WHERE id = ?").get(id);
      if ((row?.revision || 0) !== change.expectedRevision) throw conflict();
      db.prepare("INSERT INTO world_documents (id, revision, document) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, document = excluded.document")
        .run(id, change.expectedRevision + 1, JSON.stringify(change.value));
    }
    for (const [id, change] of context.deletedUsers || []) {
      const row = db.prepare("SELECT document FROM users WHERE id = ?").get(id);
      if (!row || Number(JSON.parse(row.document).authVersion || 0) !== change.expectedAuthVersion) throw conflict();
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
    }
    for (const audit of context.adminAudits || []) {
      db.prepare("INSERT INTO admin_audit (id, admin_id, admin_username, target_id, target_username, operation, before_document, after_document, reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(audit.id, audit.adminId, audit.adminUsername, audit.targetId, audit.targetUsername, audit.operation, JSON.stringify(audit.before), JSON.stringify(audit.after), audit.reason, audit.createdAt);
    }
    if (receipt) db.prepare("INSERT INTO operation_receipts (actor_id, operation_key, request_hash, status, response, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(receipt.actorId, receipt.key, receipt.hash, receipt.status, gzipSync(JSON.stringify(receipt.body)), Date.now());
    const cleanupAt = Date.now();
    const cleanupDue = cleanupAt - lastReceiptCleanup >= 60 * 60 * 1000;
    if (cleanupDue) db.prepare("DELETE FROM operation_receipts WHERE created_at < ?").run(cleanupAt - OPERATION_RETENTION_MS);
    db.exec("COMMIT");
    if (cleanupDue) lastReceiptCleanup = cleanupAt;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
