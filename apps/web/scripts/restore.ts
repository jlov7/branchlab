import { cpSync, existsSync, mkdirSync, mkdtempSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { ATL_DIR, ensureAtlDirs } from "@/lib/paths";

function run(): void {
  const args = process.argv.slice(2).filter((arg) => arg !== "--");
  const backupPath = args[0];
  if (!backupPath) {
    throw new Error("Usage: tsx scripts/restore.ts <backup-folder>");
  }
  const normalizedBackupPath = resolve(backupPath);

  const manifest = join(normalizedBackupPath, "backup.manifest.json");
  if (!existsSync(manifest)) {
    throw new Error(`Invalid backup: missing ${manifest}`);
  }

  let sourceBackupPath = normalizedBackupPath;
  const atlRoot = resolve(ATL_DIR);
  if (normalizedBackupPath.startsWith(`${atlRoot}/`)) {
    const tempDir = mkdtempSync(join(tmpdir(), "branchlab-restore-"));
    const copied = join(tempDir, "backup");
    cpSync(normalizedBackupPath, copied, { recursive: true });
    sourceBackupPath = copied;
  }

  if (existsSync(ATL_DIR)) {
    const moved = join(dirname(ATL_DIR), `.atl-pre-restore-${Date.now()}`);
    renameSync(ATL_DIR, moved);
  }

  ensureAtlDirs();
  rmSync(ATL_DIR, { recursive: true, force: true });
  mkdirSync(ATL_DIR, { recursive: true });
  cpSync(sourceBackupPath, ATL_DIR, { recursive: true });

  process.stdout.write(`restored:${normalizedBackupPath}\n`);
}

run();
