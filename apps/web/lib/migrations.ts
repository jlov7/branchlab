import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { DatabaseSync } from "node:sqlite";
import { REPO_ROOT } from "./paths";

const MIGRATIONS_DIR = join(REPO_ROOT, "apps/web/migrations");

export function applyMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const applied = new Set(
    (db.prepare(`SELECT id FROM schema_migrations ORDER BY id ASC`).all() as Array<{ id: string }>).map(
      (row) => row.id,
    ),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".up.sql"))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      db.prepare(`INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)`).run(
        file,
        new Date().toISOString(),
      );
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw new Error(`Failed migration ${file}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function rollbackLatestMigration(db: DatabaseSync): string | null {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const row = db
    .prepare(`SELECT id FROM schema_migrations ORDER BY applied_at DESC LIMIT 1`)
    .get() as { id: string } | undefined;

  if (!row) {
    return null;
  }

  const downFile = row.id.replace(/\.up\.sql$/, ".down.sql");
  const downPath = join(MIGRATIONS_DIR, downFile);
  const sql = readFileSync(downPath, "utf8");

  db.exec("BEGIN");
  try {
    db.exec(sql);
    db.prepare(`DELETE FROM schema_migrations WHERE id = ?`).run(row.id);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw new Error(`Failed rollback ${downFile}: ${error instanceof Error ? error.message : String(error)}`);
  }

  return downFile;
}
