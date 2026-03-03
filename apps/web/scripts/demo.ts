import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTraceLines } from "@branchlab/core";
import { REPO_ROOT } from "../lib/paths";
import { saveRun } from "../lib/runsRepo";

const files = [
  "examples/traces/demo_run_fail.jsonl",
  "examples/traces/demo_run_success.jsonl",
];

for (const relativePath of files) {
  const content = readFileSync(join(REPO_ROOT, relativePath), "utf8");
  const parsed = parseTraceLines(content.split(/\r?\n/));

  const result = saveRun({
    source: relativePath,
    mode: "replay",
    events: parsed.events,
    partialParse: parsed.partialParse,
    issues: parsed.issues,
  });

  console.log(`Imported ${relativePath} -> ${result.runId} (${result.insertedEvents} events)`);
}

console.log("Demo traces are available. Start app with `make dev` and open http://localhost:3000/runs");

if (process.argv.includes("--open") && process.platform === "darwin") {
  execFileSync("open", ["http://localhost:3000/runs"]);
}
