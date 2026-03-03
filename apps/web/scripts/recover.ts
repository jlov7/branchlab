import { DatabaseSync } from "node:sqlite";
import { existsSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "@/lib/db";
import { ATL_DIR, DB_PATH } from "@/lib/paths";

function run(): void {
  if (!existsSync(DB_PATH)) {
    getDb();
    process.stdout.write("status:created-new-db\n");
    return;
  }

  let integrity = "unknown";
  const db = new DatabaseSync(DB_PATH);
  try {
    const row = db.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
    integrity = row.integrity_check;
  } finally {
    db.close();
  }

  if (integrity === "ok") {
    process.stdout.write("status:ok\n");
    return;
  }

  const recoveryDir = join(ATL_DIR, "recovery");
  mkdirSync(recoveryDir, { recursive: true });
  const moved = join(recoveryDir, `corrupt-${Date.now()}.sqlite`);
  renameSync(DB_PATH, moved);
  rmSync(DB_PATH, { force: true });
  getDb();
  process.stdout.write(`status:recovered moved:${moved}\n`);
}

run();
