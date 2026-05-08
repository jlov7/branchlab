import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureIsolatedDataRoot } from "./dataRoot";

async function main(): Promise<void> {
  ensureIsolatedDataRoot("branchlab-profile-");
  const { REPO_ROOT } = await import("@/lib/paths");
  const { run: runPerf } = await import("./profile_harness_impl");

  const profile = await runPerf();
  mkdirSync(join(REPO_ROOT, "artifacts"), { recursive: true });
  writeFileSync(join(REPO_ROOT, "artifacts", "profile-harness.json"), `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(profile)}\n`);
}

void main();
