import { beforeEach, describe, expect, it } from "vitest";
import { listInvestigations, saveInvestigation, updateInvestigation } from "@/lib/investigationService";
import { resetAllData, saveRun } from "@/lib/runsRepo";

describe("investigationService", () => {
  beforeEach(() => {
    resetAllData();
    saveRun({
      runId: "run_investigation",
      source: "investigation-test",
      mode: "replay",
      partialParse: false,
      issues: [],
      events: [
        {
          schema: "branchlab.trace.v1",
          run_id: "run_investigation",
          event_id: "e1",
          ts: "2026-05-08T00:00:00Z",
          type: "run.start",
          data: {},
        },
      ],
    });
  });

  it("saves local hypotheses keyed by evidence hash", () => {
    const saved = saveInvestigation({
      runId: "run_investigation",
      title: "Pricing tool anomaly",
      hypothesis: "The tool result changed the final quote.",
      pinnedSpanIds: ["tool_result", "tool_result", "final"],
      evidenceHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });

    expect(saved.id).toMatch(/^investigation_/);
    expect(saved.pinnedSpanIds).toEqual(["final", "tool_result"]);
    expect(listInvestigations("run_investigation")[0]?.evidenceHash).toBe(
      "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    );
  });

  it("rejects invalid evidence hashes", () => {
    expect(() =>
      saveInvestigation({
        runId: "run_investigation",
        title: "Bad hash",
        hypothesis: "This should fail.",
        pinnedSpanIds: [],
        evidenceHash: "not-a-hash",
      }),
    ).toThrow("evidenceHash must be a 64-character hex string");
  });

  it("updates lifecycle status, hypothesis, and pinned spans", () => {
    const saved = saveInvestigation({
      runId: "run_investigation",
      title: "Pricing tool anomaly",
      hypothesis: "The tool result changed the final quote.",
      pinnedSpanIds: ["tool_result"],
      evidenceHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    });

    const updated = updateInvestigation({
      id: saved.id,
      title: "Resolved pricing anomaly",
      hypothesis: "The selected tool result is the causal span.",
      pinnedSpanIds: ["final", "tool_result", "final"],
      status: "resolved",
    });

    expect(updated.status).toBe("resolved");
    expect(updated.title).toBe("Resolved pricing anomaly");
    expect(updated.hypothesis).toBe("The selected tool result is the causal span.");
    expect(updated.pinnedSpanIds).toEqual(["final", "tool_result"]);
    expect(listInvestigations("run_investigation")[0]?.status).toBe("resolved");
  });
});
