import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "@/lib/paths";
import { run as runPerf } from "./profile_harness_impl";

async function main(): Promise<void> {
  const profile = await runPerf();
  mkdirSync(join(REPO_ROOT, "artifacts"), { recursive: true });
  writeFileSync(join(REPO_ROOT, "artifacts", "profile-harness.json"), `${JSON.stringify(profile, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(profile)}\n`);
}

void main();
