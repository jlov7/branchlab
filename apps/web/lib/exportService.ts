import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { analyzeTracePhysics, type ExportBundleManifest, type TracePhysicsSummary } from "@branchlab/core";
import { compareRunsById } from "./compareService";
import { getDb } from "./db";
import { listEvalRuns } from "./evalService";
import { writeFileAtomic } from "./fsAtomic";
import { newId } from "./ids";
import { listInvestigations } from "./investigationService";
import { EXPORTS_DIR } from "./paths";
import { getAllRunEvents, getRun, getRunTraceIrEvents, getTraceFingerprint } from "./runsRepo";
import { listSpanAnnotations } from "./spanAnnotationService";

export interface ExportInput {
  runId: string;
  branchRunId?: string;
  redacted: boolean;
}

export function exportBundle(input: ExportInput): ExportBundleManifest {
  const now = new Date().toISOString();
  const id = newId("export");
  const folder = join(EXPORTS_DIR, id);
  mkdirSync(folder, { recursive: true });

  const run = getRun(input.runId);
  if (!run) {
    throw new Error("Run not found");
  }

  const runEvents = getAllRunEvents(input.runId);
  const traceIr = getRunTraceIrEvents(input.runId);
  const tracePhysics = analyzeTracePhysics(traceIr, { trustExistingHashes: true });
  const maybeCompare = input.branchRunId ? compareRunsById(input.runId, input.branchRunId) : null;
  const investigations = listInvestigations(input.runId, 100);
  const spanAnnotations = listSpanAnnotations({ runId: input.runId, limit: 250 });
  const tracePhysicsArtifact = {
    run: compactTracePhysics(tracePhysics),
    compare: maybeCompare?.tracePhysics
      ? {
          parent: compactTracePhysics(maybeCompare.tracePhysics.parent),
          branch: compactTracePhysics(maybeCompare.tracePhysics.branch),
          firstDivergenceSpanId: maybeCompare.tracePhysics.firstDivergenceSpanId,
          firstDivergenceSequence: maybeCompare.tracePhysics.firstDivergenceSequence,
          heatmap: maybeCompare.tracePhysics.heatmap,
          candidates: maybeCompare.tracePhysics.candidates,
          diagnostics: maybeCompare.tracePhysics.diagnostics,
        }
      : null,
  };
  const provenance = {
    runId: input.runId,
    branchRunId: input.branchRunId,
    runFingerprint: getTraceFingerprint(input.runId),
    branchFingerprint: input.branchRunId ? getTraceFingerprint(input.branchRunId) : null,
    causalFirstDivergence: maybeCompare?.causal.firstDivergenceSpanId ?? null,
    tracePhysicsEvidence: tracePhysics.evidence,
    tracePhysicsDiagnostics: tracePhysics.diagnostics,
    investigationCount: investigations.length,
    investigationEvidenceHashes: [...new Set(investigations.map((investigation) => investigation.evidenceHash))].sort(),
    spanAnnotationCount: spanAnnotations.length,
    generatedAt: now,
    redacted: input.redacted,
    files: [
      "report.html",
      "run.json",
      "trace_ir.json",
      "trace_physics.json",
      "investigations.json",
      "span_annotations.json",
      "diff.json",
      "causal_diff.json",
      "policy_results.json",
      "eval_results.json",
      "provenance.json",
    ],
  };
  const payload = input.redacted ? redactObject(runEvents) : runEvents;
  const traceIrPayload = input.redacted ? redactObject(traceIr) : traceIr;
  const investigationsPayload = input.redacted ? redactObject(investigations) : investigations;
  const spanAnnotationsPayload = input.redacted ? redactObject(spanAnnotations) : spanAnnotations;

  const reportHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>BranchLab Run Report</title>
<style>
body { font-family: ui-sans-serif, system-ui; margin: 40px; background: #0d1016; color: #f3f5f7; }
.card { border: 1px solid #2b3341; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
.warn { color: #fbbf24; }
code { color: #93c5fd; }
</style>
</head>
<body>
<h1>BranchLab Report</h1>
${input.redacted ? "" : '<p class="warn">Warning: export is unredacted.</p>'}
<div class="card">
  <p><strong>Run:</strong> ${escapeHtml(run.id)}</p>
  <p><strong>Status:</strong> ${escapeHtml(run.status)}</p>
  <p><strong>Mode:</strong> ${escapeHtml(run.mode)}</p>
  <p><strong>Created:</strong> ${escapeHtml(run.createdAt)}</p>
</div>
<div class="card">
  <h2>Files</h2>
  <ul>
    <li><code>run.json</code></li>
    <li><code>trace_ir.json</code></li>
    <li><code>trace_physics.json</code></li>
    <li><code>investigations.json</code></li>
    <li><code>span_annotations.json</code></li>
    ${input.branchRunId ? "<li><code>diff.json</code></li>" : ""}
    <li><code>causal_diff.json</code></li>
    <li><code>policy_results.json</code></li>
    <li><code>eval_results.json</code></li>
    <li><code>provenance.json</code></li>
  </ul>
</div>
<div class="card">
  <h2>Evidence</h2>
  <p><strong>Run fingerprint:</strong> <code>${escapeHtml(provenance.runFingerprint?.fingerprint ?? "missing")}</code></p>
  <p><strong>Trace physics evidence:</strong> <code>${escapeHtml(provenance.tracePhysicsEvidence.evidenceHash)}</code></p>
  <p><strong>First causal divergence:</strong> ${escapeHtml(provenance.causalFirstDivergence ?? "none")}</p>
  <p><strong>Saved investigations:</strong> ${provenance.investigationCount}</p>
  <p><strong>Span annotations:</strong> ${provenance.spanAnnotationCount}</p>
</div>
</body>
</html>`;

  writeFileAtomic(join(folder, "report.html"), reportHtml);
  writeFileAtomic(join(folder, "run.json"), JSON.stringify(payload, null, 2));
  writeFileAtomic(join(folder, "trace_ir.json"), JSON.stringify(traceIrPayload, null, 2));
  writeFileAtomic(join(folder, "trace_physics.json"), JSON.stringify(tracePhysicsArtifact, null, 2));
  writeFileAtomic(join(folder, "investigations.json"), JSON.stringify(investigationsPayload, null, 2));
  writeFileAtomic(join(folder, "span_annotations.json"), JSON.stringify(spanAnnotationsPayload, null, 2));
  writeFileAtomic(
    join(folder, "diff.json"),
    JSON.stringify(maybeCompare?.compare ?? { message: "No branch selected" }, null, 2),
  );
  writeFileAtomic(
    join(folder, "causal_diff.json"),
    JSON.stringify(maybeCompare?.causal ?? { message: "No branch selected" }, null, 2),
  );
  writeFileAtomic(join(folder, "policy_results.json"), JSON.stringify(getLatestPolicySummaries(input.runId), null, 2));
  writeFileAtomic(join(folder, "eval_results.json"), JSON.stringify(listEvalRuns().slice(0, 10), null, 2));
  writeFileAtomic(join(folder, "provenance.json"), JSON.stringify(provenance, null, 2));

  const files = provenance.files;
  const manifest: ExportBundleManifest = {
    id,
    runId: input.runId,
    branchRunId: input.branchRunId,
    redacted: input.redacted,
    createdAt: now,
    files,
  };

  const db = getDb();
  db.prepare(
    `
    INSERT INTO exports (id, run_id, branch_run_id, folder_path, redacted, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(id, input.runId, input.branchRunId ?? null, folder, input.redacted ? 1 : 0, now);
  db.prepare(
    `
    INSERT INTO evidence_packs (id, run_id, branch_run_id, export_id, provenance_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(newId("evidence"), input.runId, input.branchRunId ?? null, id, JSON.stringify(provenance), now);

  return manifest;
}

function compactTracePhysics(summary: TracePhysicsSummary) {
  return {
    fingerprint: summary.fingerprint,
    diagnostics: summary.diagnostics,
    evidence: summary.evidence,
    graph: {
      nodeCount: summary.graph.nodes.length,
      edgeCount: summary.graph.edges.length,
      roots: summary.graph.roots,
      byEventKind: summary.graph.byEventKind,
    },
  };
}

function getLatestPolicySummaries(runId: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, policy_id, summary_json, created_at
      FROM policy_evals
      WHERE run_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `,
    )
    .all(runId) as Array<{ id: string; policy_id: string; summary_json: string; created_at: string }>;

  return rows.map((row) => ({
    id: row.id,
    policyId: row.policy_id,
    createdAt: row.created_at,
    summary: JSON.parse(row.summary_json),
  }));
}

function redactObject(value: unknown): unknown {
  if (typeof value === "string") {
    return redactString(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactObject(item));
  }

  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      out[key] = redactObject(nested);
    }
    return out;
  }

  return value;
}

function redactString(input: string): string {
  return input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[REDACTED_EMAIL]")
    .replace(/\b\+?\d[\d\s().-]{7,}\d\b/g, "[REDACTED_PHONE]")
    .replace(/\b(?:sk|rk|pk)_[A-Za-z0-9]{12,}\b/g, "[REDACTED_KEY]");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
