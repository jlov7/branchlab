import { DatabaseSync } from "node:sqlite";
import { applyMigrations, rollbackLatestMigration } from "@/lib/migrations";
import { DB_PATH, ensureAtlDirs } from "@/lib/paths";

type Command = "up" | "down" | "status";

function run(): void {
  const command = (process.argv[2] ?? "up") as Command;
  if (command !== "up" && command !== "down" && command !== "status") {
    throw new Error("Usage: tsx scripts/migrate.ts <up|down|status>");
  }

  ensureAtlDirs();
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA foreign_keys = ON;");

  try {
    if (command === "up") {
      applyMigrations(db);
      process.stdout.write("migrations:up:ok\n");
      return;
    }

    if (command === "down") {
      const rolled = rollbackLatestMigration(db);
      process.stdout.write(`migrations:down:${rolled ?? "none"}\n`);
      return;
    }

    db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`);
    const rows = db
      .prepare(`SELECT id, applied_at FROM schema_migrations ORDER BY applied_at ASC`)
      .all() as Array<{ id: string; applied_at: string }>;
    process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
  } finally {
    db.close();
  }
}

run();
