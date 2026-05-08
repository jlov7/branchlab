import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (!process.env.BRANCHLAB_ROOT) {
  process.env.BRANCHLAB_ROOT = mkdtempSync(join(tmpdir(), "branchlab-vitest-"));
}
