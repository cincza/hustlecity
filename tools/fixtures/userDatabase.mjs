import { DatabaseSync } from "node:sqlite";
import path from "node:path";

// Test fixtures only. Call after stopping the isolated test server.
export async function readFixtureUsers(dataDir) {
  const db = new DatabaseSync(path.join(dataDir, "game.sqlite"), { readOnly: true });
  try { return db.prepare("SELECT document FROM users").all().map((row) => JSON.parse(row.document)); }
  finally { db.close(); }
}

export async function writeFixtureUsers(dataDir, records) {
  const db = new DatabaseSync(path.join(dataDir, "game.sqlite"));
  try {
    db.exec("BEGIN IMMEDIATE");
    for (const record of records) {
      const before = db.prepare("SELECT revision, document FROM users WHERE id = ?").get(record._id);
      if (!before) throw new Error("Fixture cannot replace an unknown user");
      if (JSON.stringify(record) === before.document) continue;
      record.playerData.stateRevision = before.revision + 1;
      db.prepare("UPDATE users SET revision = ?, document = ? WHERE id = ?")
        .run(record.playerData.stateRevision, JSON.stringify(record), record._id);
    }
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  finally { db.close(); }
}
