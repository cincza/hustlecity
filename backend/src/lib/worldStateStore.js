import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Datastore from "@seald-io/nedb";
import { createDealerInventory, normalizeDealerInventory } from "../../../shared/socialGameplay.js";
import { logError, logInfo } from "../utils/logger.js";

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
    const corruptPath = path.join(
      dataDir,
      `world-state.db.corrupt-${new Date().toISOString().replace(/[:.]/g, "-")}`
    );
    logError("persistence", "world-state-db-load-failed", {
      worldStateDbPath,
      corruptPath,
      reason: error?.message || "unknown",
    });
    await fs.rename(worldStateDbPath, corruptPath);
    await fs.writeFile(worldStateDbPath, "", "utf8");
    worldStateDb = new Datastore({ filename: worldStateDbPath });
    await worldStateDb.loadDatabaseAsync();
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
  await ensureWorldStateDoc();
  logInfo("persistence", "world-state-ready", {
    worldStateDbPath,
    dataDir,
  });
}

export async function getWorldState() {
  return ensureWorldStateDoc();
}

export async function saveDealerInventory(dealerInventory) {
  const db = await getWorldStateDb();
  const current = await ensureWorldStateDoc();
  const updatedAt = new Date().toISOString();
  const safeDealerInventory = normalizeDealerInventory(dealerInventory);
  await db.updateAsync(
    { _id: WORLD_STATE_ID },
    {
      $set: {
        dealerInventory: safeDealerInventory,
        updatedAt,
      },
      $setOnInsert: {
        createdAt: current.createdAt || updatedAt,
      },
    },
    { upsert: true }
  );
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
