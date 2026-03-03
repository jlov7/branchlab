import { mkdirSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export function writeFileAtomic(targetPath: string, content: string): void {
  mkdirSync(dirname(targetPath), { recursive: true });
  const tempPath = join(
    dirname(targetPath),
    `.${Date.now()}-${Math.random().toString(16).slice(2)}.${process.pid}.tmp`,
  );

  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, targetPath);
}
