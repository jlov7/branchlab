import { beforeEach, describe, expect, it } from "vitest";
import { createSpanAnnotation, listSpanAnnotations } from "@/lib/spanAnnotationService";
import { resetAllData, saveRun } from "@/lib/runsRepo";

describe("spanAnnotationService", () => {
  beforeEach(() => {
    resetAllData();
    saveRun({
      runId: "run_span_notes",
      source: "span-note-test",
      mode: "replay",
      partialParse: false,
      issues: [],
      events: [
        {
          schema: "branchlab.trace.v1",
          run_id: "run_span_notes",
          event_id: "span_a",
          ts: "2026-05-08T00:00:00Z",
          type: "llm.response",
          data: { text: "hello" },
        },
      ],
    });
  });

  it("saves span-level reviewer notes with normalized tags", () => {
    const saved = createSpanAnnotation({
      runId: "run_span_notes",
      spanId: "span_a",
      note: "This span changed the answer.",
      tags: ["causal", "causal", " review "],
    });

    expect(saved.id).toMatch(/^span_note_/);
    expect(saved.tags).toEqual(["causal", "review"]);
    expect(listSpanAnnotations({ runId: "run_span_notes", spanId: "span_a" })[0]?.note).toBe(
      "This span changed the answer.",
    );
  });

  it("rejects empty notes", () => {
    expect(() =>
      createSpanAnnotation({
        runId: "run_span_notes",
        spanId: "span_a",
        note: " ",
      }),
    ).toThrow("note is required");
  });
});
