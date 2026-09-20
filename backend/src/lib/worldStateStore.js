import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "../bootstrapEnv.js";
import Datastore from "@seald-io/nedb";
import { createDealerInventory, normalizeDealerInventory } from "../../../shared/socialGameplay.js";
import { logError, logInfo } from "../utils/logger.js";
import { readWorldDocument, saveWorldDocument } from "./gameDatabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configuredDataDir = String(process.env.DATA_DIR || "").trim();
const dataDir = configuredDataDir
  ? path.resolve(configuredDataDir)
  : path.resolve(__dirname, "../../data");
const worldStateDbPath = path.join(dataDir, "world-state.db");
const WORLD_STATE_ID = "world-state";

let worldStateDb;

async function ensureWorldStateDbFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(worldStateDbPath);
  } catch (_error) {
    await fs.writeFile(worldStateDbPath, "", "utf8");
  }
}

async function getWorldStateDb() {
  if (worldStateDb) return worldStateDb;
  await ensureWorldStateDbFile();
  worldStateDb = new Datastore({ filename: worldStateDbPath });
  try {
    await worldStateDb.loadDatabaseAsync();
  } catch (error) {
    logError("persistence", "world-state-db-load-failed", {
      worldStateDbPath,
      reason: error?.message || "unknown",
    });
    worldStateDb = undefined;
    throw new Error("World database could not be loaded. Original file preserved; restore a verified backup before restarting.", { cause: error });
  }
  await worldStateDb.ensureIndexAsync({ fieldName: "_id", unique: true });
  return worldStateDb;
}

function buildDefaultWorldState(now = new Date().toISOString()) {
  return {
    _id: WORLD_STATE_ID,
    dealerInventory: createDealerInventory(),
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureWorldStateDoc() {
  const db = await getWorldStateDb();
  const existing = await db.findOneAsync({ _id: WORLD_STATE_ID });
  if (existing) {
    return {
      ...existing,
      dealerInventory: normalizeDealerInventory(existing.dealerInventory),
    };
  }

  const created = buildDefaultWorldState();
  await db.insertAsync(created);
  logInfo("persistence", "world-state-created", {
    worldStateDbPath,
    dataDir,
  });
  return created;
}

export async function initWorldStateStore() {
  await getWorldStateDb();
  const legacy = await ensureWorldStateDoc();
  if (!await readWorldDocument(WORLD_STATE_ID)) await saveWorldDocument(WORLD_STATE_ID, legacy);
  logInfo("persistence", "world-state-ready", {
    worldStateDbPath,
    dataDir,
  });
}

export async function getWorldState() {
  const saved = await readWorldDocument(WORLD_STATE_ID);
  return saved?.value || ensureWorldStateDoc();
}

export async function saveDealerInventory(dealerInventory) {
  const saved = await readWorldDocument(WORLD_STATE_ID);
  const current = saved?.value || await ensureWorldStateDoc();
  const updatedAt = new Date().toISOString();
  const safeDealerInventory = normalizeDealerInventory(dealerInventory);
  await saveWorldDocument(WORLD_STATE_ID, { ...current, dealerInventory: safeDealerInventory, updatedAt }, saved?.revision || 0);
  return {
    ...current,
    dealerInventory: safeDealerInventory,
    updatedAt,
  };
}

export async function resetWorldState() {
  const next = buildDefaultWorldState();
  await saveDealerInventory(next.dealerInventory);
  return next;
}
