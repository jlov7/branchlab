import { DatabaseSync } from "node:sqlite";
import { applyMigrations } from "./migrations";
import { ensureAtlDirs, DB_PATH } from "./paths";

type DbGlobal = {
  db?: DatabaseSync;
};

const globalDb = globalThis as unknown as DbGlobal;

export function getDb(): DatabaseSync {
  if (!globalDb.db) {
    ensureAtlDirs();
    const db = new DatabaseSync(DB_PATH);
    db.exec("PRAGMA journal_mode = WAL;");
    db.exec("PRAGMA synchronous = NORMAL;");
    db.exec("PRAGMA foreign_keys = ON;");
    db.exec("PRAGMA temp_store = MEMORY;");
    db.exec("PRAGMA cache_size = -200000;");
    applyMigrations(db);

    globalDb.db = db;
  }

  return globalDb.db;
}

export function resetDbConnection(): void {
  if (globalDb.db) {
    globalDb.db.close();
    globalDb.db = undefined;
  }
}
