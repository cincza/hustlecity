import test, { after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = await mkdtemp(path.join(os.tmpdir(), "hustle-migration-"));
after(async () => {
  assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
  await rm(root, { recursive: true, force: true });
});
let count = 0;
async function fixture(source) {
  const directory = await mkdtemp(path.join(root, "case-"));
  process.env.DATA_DIR = directory;
  process.env.BACKEND_ENV_FILE = path.join(directory, "no-env");
  const filename = path.join(directory, "users.db");
  await writeFile(filename, source);
  const database = await import(`../../backend/src/lib/gameDatabase.js?migration=${++count}`);
  return { directory, filename, database };
}
const account = (id, cash = 100) => ({ _id: id, username: id, passwordHash: "$original-hash", email: null, authVersion: 3, playerData: { profile: { cash }, inventory: { smoke: 7 }, stateRevision: 4 } });
const lines = (...records) => records.map((record) => JSON.stringify(record)).join("\n") + "\n";

test("legacy append log imports latest records, deletions, indexes and optional emails without changing the source", async () => {
  const source = lines({ $$indexCreated: { fieldName: "emailLower", unique: true, sparse: true } }, account("first"), account("deleted"), account("first", 250), { _id: "deleted", $$deleted: true }, account("second"));
  const { filename, database } = await fixture(source);
  try {
    const users = await database.readUsers();
    assert.equal(users.length, 2);
    const first = await database.readUserByLogin("FIRST");
    assert.equal(first.playerData.profile.cash, 250);
    assert.equal(first.passwordHash, "$original-hash");
    assert.equal(first.authVersion, 3);
    assert.equal(first.playerData.stateRevision, 4);
    assert.equal(first.playerData.inventory.smoke, 7);
    assert.equal(first.playerData.id, "first");
    assert.equal(await readFile(filename, "utf8"), source);
    const db = await database.getGameDatabase();
    db.prepare("DELETE FROM users WHERE id = ?").run("first");
    database.closeGameDatabase();
    assert.equal(await database.readUser("first"), null, "restart must not resurrect a deleted account from legacy backup");
  } finally { database.closeGameDatabase(); }
});

test("duplicate usernames roll back the entire import and leave no completed migration marker", async () => {
  const source = lines(account("same"), { ...account("second"), username: "SAME" });
  const { filename, directory, database } = await fixture(source);
  await assert.rejects(database.getGameDatabase(), /UNIQUE/);
  const db = new DatabaseSync(path.join(directory, "game.sqlite"));
  try {
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM users").get().n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM metadata").get().n, 0);
    assert.equal(await readFile(filename, "utf8"), source);
  } finally { db.close(); database.closeGameDatabase(); }
});

test("malformed legacy records and a corrupt SQLite database fail closed and preserve source bytes", async () => {
  for (const source of [lines(account("one")) + "{broken", lines({ ...account("one"), playerData: "invalid" })]) {
    const { filename, database } = await fixture(source);
    await assert.rejects(database.getGameDatabase(), /Original file preserved/);
    assert.equal(await readFile(filename, "utf8"), source);
    database.closeGameDatabase();
  }
  const { directory, database } = await fixture(lines(account("legacy")));
  const filename = path.join(directory, "game.sqlite");
  const corrupt = Buffer.from("corrupt existing sqlite file: do not overwrite".repeat(100));
  await writeFile(filename, corrupt);
  await assert.rejects(database.getGameDatabase(), /not a database/);
  assert.deepEqual(await readFile(filename), corrupt);
  database.closeGameDatabase();
});
