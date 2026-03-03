import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ATL_DIR, BLOBS_DIR, DB_PATH, EXPORTS_DIR, ensureAtlDirs } from "@/lib/paths";

function run(): void {
  ensureAtlDirs();
  const backupsDir = join(ATL_DIR, "backups");
  mkdirSync(backupsDir, { recursive: true });

  const stamp = new Date().toISOString().replaceAll(":", "-");
  const target = join(backupsDir, `backup-${stamp}`);
  mkdirSync(target, { recursive: true });

  const copied: string[] = [];
  if (existsSync(DB_PATH)) {
    cpSync(DB_PATH, join(target, basename(DB_PATH)));
    copied.push("branchlab.sqlite");
  }
  if (existsSync(BLOBS_DIR)) {
    cpSync(BLOBS_DIR, join(target, "blobs"), { recursive: true });
    copied.push("blobs/");
  }
  if (existsSync(EXPORTS_DIR)) {
    cpSync(EXPORTS_DIR, join(target, "exports"), { recursive: true });
    copied.push("exports/");
  }

  writeFileSync(
    join(target, "backup.manifest.json"),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        source: ATL_DIR,
        files: copied,
      },
      null,
      2,
    ),
    "utf8",
  );

  process.stdout.write(`${target}\n`);
}

run();
