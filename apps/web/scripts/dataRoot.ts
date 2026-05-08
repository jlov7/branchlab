import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export function ensureIsolatedDataRoot(prefix: string): string {
  if (process.env.BRANCHLAB_ROOT) {
    return process.env.BRANCHLAB_ROOT;
  }

  const root = mkdtempSync(join(tmpdir(), prefix));
  process.env.BRANCHLAB_ROOT = root;
  return root;
}
