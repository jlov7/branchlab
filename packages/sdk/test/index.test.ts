import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { emitEvent, endRun, startRun } from "../src";

describe("sdk", () => {
  it("writes trace events as jsonl", () => {
    const dir = mkdtempSync(join(tmpdir(), "branchlab-sdk-"));
    const filePath = join(dir, "trace.jsonl");

    startRun({ runId: "run_1", filePath });
    emitEvent(filePath, {
      schema: "branchlab.trace.v1",
      run_id: "run_1",
      event_id: "e1",
      ts: new Date().toISOString(),
      type: "note",
      data: { hello: "world" },
    });
    endRun({ runId: "run_1", filePath }, "success");

    const lines = readFileSync(filePath, "utf8").trim().split("\n");
    expect(lines.length).toBe(3);

    rmSync(dir, { recursive: true, force: true });
  });
});
