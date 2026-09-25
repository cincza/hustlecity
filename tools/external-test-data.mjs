import { DatabaseSync, backup as sqliteBackup } from "node:sqlite";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const mode = args[0];
const value = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; };
const has = (name) => args.includes(name);
const dataDir = path.resolve(value("--data-dir") || path.join(ROOT, "data"));
const dbPath = path.join(dataDir, "game.sqlite");
const ADMIN_LOGIN = "czincza11";

async function sha256(filename) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

function worldHash(db) {
  const rows = db.prepare("SELECT id, revision, document FROM world_documents WHERE id NOT LIKE 'premium-order:%' ORDER BY id").all();
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}

function inspectDatabase(filename = dbPath) {
  const db = new DatabaseSync(filename, { readOnly: true });
  try {
    const scalar = (sql) => Number(db.prepare(sql).get()?.count || 0);
    const tableExists = (name) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name));
    const accounts = db.prepare("SELECT id, username_lower AS username FROM users ORDER BY rowid").all();
    return {
      database: filename,
      users: accounts.length,
      accounts,
      operationReceipts: scalar("SELECT COUNT(*) AS count FROM operation_receipts"),
      adminAudits: scalar("SELECT COUNT(*) AS count FROM admin_audit"),
      pendingDeletionCleanups: tableExists("account_deletion_cleanup") ? scalar("SELECT COUNT(*) AS count FROM account_deletion_cleanup WHERE completed_at IS NULL") : 0,
      worldDocuments: scalar("SELECT COUNT(*) AS count FROM world_documents"),
      preservedWorldHash: worldHash(db),
      orphanReceipts: scalar("SELECT COUNT(*) AS count FROM operation_receipts r LEFT JOIN users u ON u.id = r.actor_id WHERE u.id IS NULL"),
    };
  } finally { db.close(); }
}

async function backupData(outputDir) {
  if (!outputDir) throw new Error("backup requires --output <directory>");
  const destination = path.resolve(outputDir);
  await fs.mkdir(destination, { recursive: true });
  const source = new DatabaseSync(dbPath, { readOnly: true });
  const sqliteTarget = path.join(destination, "game.sqlite");
  try { await sqliteBackup(source, sqliteTarget); } finally { source.close(); }
  const files = ["global-chat.db", "prison-chat.db", "users.db", "world-state.db"];
  for (const name of files) {
    try { await fs.copyFile(path.join(dataDir, name), path.join(destination, name)); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  const snapshot = inspectDatabase(sqliteTarget);
  const backedFiles = await fs.readdir(destination);
  const hashes = {};
  for (const name of backedFiles.filter((name) => name !== "manifest.json")) hashes[name] = await sha256(path.join(destination, name));
  const manifest = { createdAt: new Date().toISOString(), sourceDataDir: dataDir, snapshot, hashes };
  await fs.writeFile(path.join(destination, "manifest.json"), JSON.stringify(manifest, null, 2));
  return { destination, manifest };
}

async function readSecretFromStdin() {
  let secret = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) secret += chunk;
  return secret.replace(/[\r\n]+$/g, "");
}

async function bootstrapAdmin(password) {
  if (password.length < 16) throw new Error("Admin password must contain at least 16 characters");
  const serverPath = path.join(ROOT, "backend", "src", "server.js");
  const child = spawn(process.execPath, [
    "--input-type=module",
    "--eval",
    `await import(${JSON.stringify(pathToFileURL(serverPath).href)}); process.exit(0);`,
  ], {
    cwd: ROOT,
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      PORT: "0",
      HOST: "127.0.0.1",
      BACKEND_ENV_FILE: path.join(dataDir, ".maintenance-no-env"),
      ADMIN_BOOTSTRAP_PASSWORD: password,
      ADMIN_BOOTSTRAP_ROTATE_PASSWORD: "0",
      JWT_SECRET: "maintenance-bootstrap-process-secret",
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let logs = "";
  child.stdout.on("data", (chunk) => { logs += String(chunk); });
  child.stderr.on("data", (chunk) => { logs += String(chunk); });
  try {
    const exitCode = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out while creating the administrator account")), 15000);
      child.once("error", reject);
      child.once("exit", (code) => { clearTimeout(timeout); resolve(code); });
    });
    if (exitCode !== 0) throw new Error(`Admin bootstrap failed: ${logs.slice(-2000)}`);
    const db = new DatabaseSync(dbPath, { readOnly: true });
    const ready = db.prepare("SELECT COUNT(*) AS count FROM users WHERE username_lower = ?").get(ADMIN_LOGIN).count === 1;
    db.close();
    if (!ready) throw new Error(`Admin bootstrap did not create ${ADMIN_LOGIN}`);
  } finally {
    if (child.exitCode === null) {
      child.kill("SIGKILL");
      await new Promise((resolve) => {
        const timeout = setTimeout(resolve, 3000);
        child.once("exit", () => { clearTimeout(timeout); resolve(); });
      });
    }
  }
}

async function cleanData(backupDir, password) {
  if (!has("--apply")) throw new Error("clean requires --apply");
  if (password.length < 16) throw new Error("Admin password must contain at least 16 characters");
  if (!backupDir) throw new Error("clean requires --backup <directory>");
  const manifest = JSON.parse(await fs.readFile(path.join(path.resolve(backupDir), "manifest.json"), "utf8"));
  if (!manifest.hashes?.["game.sqlite"]) throw new Error("Backup has no database checksum");
  for (const [name, expected] of Object.entries(manifest.hashes)) {
    if (path.basename(name) !== name) throw new Error("Invalid backup filename");
    if (await sha256(path.join(path.resolve(backupDir), name)) !== expected) throw new Error(`Backup checksum mismatch: ${name}`);
  }
  const before = inspectDatabase();
  if (manifest.snapshot?.preservedWorldHash !== before.preservedWorldHash) throw new Error("Backup does not match the current preserved world state");
  const db = new DatabaseSync(dbPath);
  try {
    db.exec("PRAGMA foreign_keys = ON; BEGIN IMMEDIATE");
    try {
      db.exec("DELETE FROM users; DELETE FROM operation_receipts; DELETE FROM admin_audit; DELETE FROM world_documents WHERE id LIKE 'premium-order:%';");
      if (db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'account_deletion_cleanup'").get()) db.exec("DELETE FROM account_deletion_cleanup;");
      db.exec("COMMIT");
    } catch (error) { db.exec("ROLLBACK"); throw error; }
  } finally { db.close(); }
  for (const name of ["global-chat.db", "prison-chat.db", "users.db"]) await fs.writeFile(path.join(dataDir, name), "");
  await bootstrapAdmin(password);
  const after = inspectDatabase();
  if (after.users !== 1 || after.accounts[0]?.username !== ADMIN_LOGIN) throw new Error("Clean database does not contain exactly the expected administrator");
  if (after.preservedWorldHash !== before.preservedWorldHash) throw new Error("Preserved world state changed during cleanup");
  return { before, after };
}

if (!mode || !["inspect", "backup", "clean", "verify"].includes(mode)) {
  throw new Error("Usage: node tools/external-test-data.mjs <inspect|backup|clean|verify> --data-dir <path> [--output <path>] [--backup <path> --apply --password-stdin]");
}

if (mode === "inspect") console.log(JSON.stringify(inspectDatabase(), null, 2));
if (mode === "backup") console.log(JSON.stringify(await backupData(value("--output")), null, 2));
if (mode === "verify") {
  const state = inspectDatabase();
  if (state.users !== 1 || state.accounts[0]?.username !== ADMIN_LOGIN || state.orphanReceipts || state.pendingDeletionCleanups) process.exitCode = 1;
  console.log(JSON.stringify(state, null, 2));
}
if (mode === "clean") {
  if (!has("--password-stdin")) throw new Error("clean requires --password-stdin");
  const password = await readSecretFromStdin();
  console.log(JSON.stringify(await cleanData(value("--backup"), password), null, 2));
}
