import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseTraceLines } from "@branchlab/core";
import { ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { REPO_ROOT } from "@/lib/paths";
import { saveRun } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    const files = [
      "examples/traces/demo_run_fail.jsonl",
      "examples/traces/demo_run_success.jsonl",
    ];

    const imported = await withLock("runs:seed-demo", async () =>
      files.map((relativePath) => {
        const content = readFileSync(join(REPO_ROOT, relativePath), "utf8");
        const parsed = parseTraceLines(content.split(/\r?\n/));
        const saved = saveRun({
          source: relativePath,
          mode: "replay",
          events: parsed.events,
          partialParse: parsed.partialParse,
          issues: parsed.issues,
        });

        return {
          path: relativePath,
          runId: saved.runId,
          insertedEvents: saved.insertedEvents,
        };
      }),
    );

    return ok({ imported });
  } catch (error) {
    return serverError("Failed to seed demo traces", error);
  }
}
