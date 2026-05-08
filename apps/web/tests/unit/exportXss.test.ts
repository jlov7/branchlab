import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { NormalizedEvent } from "@branchlab/core";
import { exportBundle } from "@/lib/exportService";
import { saveInvestigation } from "@/lib/investigationService";
import { EXPORTS_DIR } from "@/lib/paths";
import { resetAllData, saveRun } from "@/lib/runsRepo";
import { createSpanAnnotation } from "@/lib/spanAnnotationService";

describe("export service security", () => {
  beforeEach(() => {
    resetAllData();
  });

  it("escapes HTML in report output", () => {
    const runId = `<script>alert('xss')</script>`;
    const events: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: "e1",
        ts: "2026-02-27T10:00:00Z",
        type: "run.start",
        data: {},
      },
      {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: "e2",
        ts: "2026-02-27T10:00:01Z",
        type: "run.end",
        data: { status: "success" },
      },
    ];

    saveRun({
      source: "xss-test",
      mode: "replay",
      events,
      partialParse: false,
      issues: [],
    });

    const bundle = exportBundle({ runId, redacted: false });
    const html = readFileSync(join(EXPORTS_DIR, bundle.id, "report.html"), "utf8");

    expect(html).not.toContain("<script>alert('xss')</script>");
    expect(html).toContain("&lt;script&gt;alert");
  });

  it("redacts sensitive strings in run export", () => {
    const runId = "run_redaction";
    const events: NormalizedEvent[] = [
      {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: "e1",
        ts: "2026-02-27T10:00:00Z",
        type: "llm.response",
        data: { text: "Contact alice@example.com or +1 (555) 123-4567 with key sk_abcdef1234567890" },
      },
      {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: "e2",
        ts: "2026-02-27T10:00:01Z",
        type: "run.end",
        data: { status: "success" },
      },
    ];

    saveRun({
      source: "redaction-test",
      mode: "replay",
      events,
      partialParse: false,
      issues: [],
    });
    saveInvestigation({
      runId,
      title: "Contact alice@example.com",
      hypothesis: "Tool output leaked key sk_abcdef1234567890",
      pinnedSpanIds: ["span_secret"],
      evidenceHash: "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    });
    createSpanAnnotation({
      runId,
      spanId: "e1",
      note: "Reviewer saw alice@example.com in span output with key sk_abcdef1234567890",
      tags: ["review"],
    });

    const bundle = exportBundle({ runId, redacted: true });
    const runJson = readFileSync(join(EXPORTS_DIR, bundle.id, "run.json"), "utf8");
    const investigationsJson = readFileSync(join(EXPORTS_DIR, bundle.id, "investigations.json"), "utf8");
    const spanAnnotationsJson = readFileSync(join(EXPORTS_DIR, bundle.id, "span_annotations.json"), "utf8");
    const provenanceJson = readFileSync(join(EXPORTS_DIR, bundle.id, "provenance.json"), "utf8");

    expect(runJson).toContain("[REDACTED_EMAIL]");
    expect(runJson).toContain("[REDACTED_PHONE]");
    expect(runJson).toContain("[REDACTED_KEY]");
    expect(investigationsJson).toContain("[REDACTED_EMAIL]");
    expect(investigationsJson).toContain("[REDACTED_KEY]");
    expect(spanAnnotationsJson).toContain("[REDACTED_EMAIL]");
    expect(spanAnnotationsJson).toContain("[REDACTED_KEY]");
    expect(bundle.files).toContain("trace_ir.json");
    expect(bundle.files).toContain("investigations.json");
    expect(bundle.files).toContain("span_annotations.json");
    expect(bundle.files).toContain("causal_diff.json");
    expect(provenanceJson).toContain("runFingerprint");
    expect(provenanceJson).toContain("investigationCount");
    expect(provenanceJson).toContain("spanAnnotationCount");
  });
});
