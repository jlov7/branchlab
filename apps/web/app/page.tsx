"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Page } from "@/components/ui";

interface RunSummary {
  id: string;
  source: string;
  status: "success" | "fail" | "unknown";
  mode: "replay" | "reexec";
  durationMs: number;
  costUsd: number;
  tools: string[];
}

interface CausalPayload {
  fingerprint?: { fingerprint: string; eventCount: number } | null;
  graph?: {
    nodes: Array<{ spanId: string; eventKind: string; sequence: number; hash: string }>;
    byEventKind: Record<string, number>;
  };
  compare?: { firstDivergenceSpanId: string | null; heatmap: Record<string, number> } | null;
  candidates?: Array<{ spanId: string; eventKind: string; confidence: number; rationale: string }>;
}

interface WorkbenchSnapshot {
  runs: RunSummary[];
  causal: CausalPayload | null;
  evalRuns: number;
  evidencePacks: number;
  runtimeExecutions: number;
  jobs: JobRecord[];
}

interface JobRecord {
  id: string;
  type: "import" | "policy_eval" | "export";
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  progress: number;
  message: string;
  payload: { fileName?: string; byteLength?: number } | null;
  result: {
    runId?: string;
    insertedEvents?: number;
    telemetry?: {
      parsedEvents?: number;
      insertedEvents?: number;
      issueCount?: number;
      durationMs?: number;
      byteLength?: number;
    };
  } | null;
  error: { message: string } | null;
  cancelRequested: boolean;
  updatedAt: string;
}

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [validationReportId, setValidationReportId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WorkbenchSnapshot>({
    runs: [],
    causal: null,
    evalRuns: 0,
    evidencePacks: 0,
    runtimeExecutions: 0,
    jobs: [],
  });
  const [guided, setGuided] = useState({
    seededDemo: false,
    openedRuns: false,
    completedCompare: false,
  });

  useEffect(() => {
    const raw = window.localStorage.getItem("onboardingGuide");
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as typeof guided;
      if (parsed && typeof parsed === "object") {
        setGuided({
          seededDemo: Boolean(parsed.seededDemo),
          openedRuns: Boolean(parsed.openedRuns),
          completedCompare: Boolean(parsed.completedCompare),
        });
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  useEffect(() => {
    async function loadSnapshot(): Promise<void> {
      try {
        const [runsRes, evalsRes, evidenceRes, runtimeRes, jobsRes] = await Promise.all([
          fetch("/api/runs?limit=20"),
          fetch("/api/evals"),
          fetch("/api/evidence"),
          fetch("/api/runtime"),
          fetch("/api/jobs"),
        ]);

        const runsPayload = (await runsRes.json()) as { runs?: RunSummary[] };
        const evalsPayload = (await evalsRes.json()) as { evalRuns?: unknown[] };
        const evidencePayload = (await evidenceRes.json()) as { packs?: unknown[] };
        const runtimePayload = (await runtimeRes.json()) as { executions?: unknown[] };
        const jobsPayload = (await jobsRes.json()) as { jobs?: JobRecord[] };
        const runs = runsPayload.runs ?? [];
        const primary = runs.find((run) => run.id === "run_demo_fail") ?? runs[0];
        let causal: CausalPayload | null = null;

        if (primary) {
          const causalRes = await fetch(`/api/causal?runId=${encodeURIComponent(primary.id)}`);
          if (causalRes.ok) {
            causal = (await causalRes.json()) as CausalPayload;
          }
        }

        setSnapshot({
          runs,
          causal,
          evalRuns: evalsPayload.evalRuns?.length ?? 0,
          evidencePacks: evidencePayload.packs?.length ?? 0,
          runtimeExecutions: runtimePayload.executions?.length ?? 0,
          jobs: jobsPayload.jobs ?? [],
        });
      } catch {
        setSnapshot((current) => current);
      }
    }

    void loadSnapshot();
  }, []);

  function updateGuide(next: Partial<typeof guided>): void {
    setGuided((previous) => {
      const merged = { ...previous, ...next };
      window.localStorage.setItem("onboardingGuide", JSON.stringify(merged));
      return merged;
    });
  }

  async function seedDemo(): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/demo/seed", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to seed demo traces");
      }
      updateGuide({ seededDemo: true });
      router.push("/runs");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  async function uploadTrace(formData: FormData): Promise<void> {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/runs/import", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        runId?: string;
        error?: string;
        jobId?: string;
        validationReportId?: string;
      };
      if (response.status === 202 && payload.jobId) {
        setJobProgress(`Import queued: ${payload.jobId}`);
        await pollImportJob(payload.jobId);
        return;
      }
      if (!response.ok || !payload.runId) {
        throw new Error(payload.error ?? "Import failed");
      }

      setValidationReportId(payload.validationReportId ?? null);
      router.push(`/runs/${payload.runId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }

  async function pollImportJob(jobId: string): Promise<void> {
    while (true) {
      const response = await fetch(`/api/jobs/${jobId}`);
      const payload = (await response.json()) as {
        job?: {
          status: "queued" | "running" | "succeeded" | "failed" | "canceled";
          progress: number;
          message: string;
          result: { runId?: string; validationReportId?: string } | null;
          error: { message: string } | null;
        };
      };

      if (!payload.job) {
        throw new Error("Import job status unavailable");
      }
      setJobProgress(`${payload.job.status} (${payload.job.progress}%) ${payload.job.message}`);

      if (payload.job.status === "succeeded") {
        const runId = payload.job.result?.runId;
        if (!runId) {
          throw new Error("Import job succeeded without run id");
        }
        setValidationReportId(payload.job.result?.validationReportId ?? null);
        router.push(`/runs/${runId}`);
        return;
      }

      if (payload.job.status === "failed" || payload.job.status === "canceled") {
        throw new Error(payload.job.error?.message ?? `Import job ${payload.job.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 700));
    }
  }

  async function uploadFile(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    if (file.size >= 2_000_000) {
      formData.append("async", "1");
    }
    await uploadTrace(formData);
  }

  async function cancelJob(jobId: string): Promise<void> {
    const response = await fetch(`/api/jobs/${jobId}/cancel`, { method: "POST" });
    if (!response.ok) {
      setError("Failed to request job cancellation");
      return;
    }
    const jobsRes = await fetch("/api/jobs");
    const jobsPayload = (await jobsRes.json()) as { jobs?: JobRecord[] };
    setSnapshot((current) => ({ ...current, jobs: jobsPayload.jobs ?? current.jobs }));
  }

  async function clearAllData(): Promise<void> {
    if (!window.confirm("Delete all local runs, policies, and exports under .atl/?")) {
      return;
    }

    await fetch("/api/settings/delete-all", { method: "POST" });
    window.location.reload();
  }

  const primaryRun = snapshot.runs.find((run) => run.id === "run_demo_fail") ?? snapshot.runs[0];
  const failureCount = snapshot.runs.filter((run) => run.status === "fail").length;
  const causalNodes = snapshot.causal?.graph?.nodes ?? [];
  const eventCount = snapshot.causal?.fingerprint?.eventCount ?? 0;
  const fingerprint = snapshot.causal?.fingerprint?.fingerprint;
  const firstDivergence = snapshot.causal?.compare?.firstDivergenceSpanId ?? "none";
  const topCandidate = snapshot.causal?.candidates?.[0];
  const timelineNodes = primaryRun && eventCount > 0 ? causalNodes.slice(0, 8) : [];
  const maxSequence = Math.max(1, ...timelineNodes.map((node) => node.sequence));
  const importJobs = snapshot.jobs.filter((job) => job.type === "import").slice(0, 5);

  function eventTone(kind: string, index: number): string {
    if (kind.includes("error") || kind.includes("fail")) {
      return "danger";
    }
    if (kind.includes("tool") || index === 2) {
      return "warning";
    }
    return "";
  }

  return (
    <Page aria-label="Workbench">
      <section className="cockpit-grid" aria-label="BranchLab operational cockpit">
        <div className="cockpit-panel">
          <div className="cockpit-title">
            <p className="eyebrow">Local Workbench</p>
            <h1 className="title">Replayable agent reliability.</h1>
            <p className="subtle">
              Local traces, causal diffs, eval gates, policy impact, runtime guardrails, and evidence packs in one
              inspectable loop.
            </p>
          </div>
          <div className="ui-stack">
            <Button variant="primary" onClick={seedDemo} disabled={loading}>
              {loading ? "Preparing demo..." : "Seed demo trace"}
            </Button>
            <label className="ui-button ui-inline">
              Import JSONL / JSON
              <input
                type="file"
                accept=".jsonl,application/json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void uploadFile(file);
                }}
              />
            </label>
            <Button variant="ghost" onClick={() => router.push("/runs")}>
              Open run library
            </Button>
          </div>
          <div className="ui-inline" style={{ marginTop: 14 }}>
            <Badge tone="success">Trace IR v2</Badge>
            <Badge tone="warning">Live tools off</Badge>
            <Badge>Local .atl</Badge>
          </div>
          {error ? <p style={{ color: "var(--danger)", marginTop: 12 }}>{error}</p> : null}
          {jobProgress ? (
            <p className="subtle mono" style={{ marginTop: 10 }} aria-live="polite">
              {jobProgress}
            </p>
          ) : null}
          {validationReportId ? (
            <p className="subtle mono" style={{ marginTop: 10 }}>
              Validation report:{" "}
              <Link href={`/api/import-reports/${validationReportId}`} style={{ textDecoration: "underline" }}>
                {validationReportId}
              </Link>
            </p>
          ) : null}
        </div>

        <div className="cockpit-panel primary">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Investigation Surface</p>
              <h2 style={{ margin: 0 }}>Live local state</h2>
            </div>
            <Badge tone={primaryRun ? "success" : "warning"}>{primaryRun ? "ready" : "empty"}</Badge>
          </div>
          <div className="cockpit-metrics" aria-label="Local workspace metrics">
            <div>
              <span>runs</span>
              <strong>{snapshot.runs.length}</strong>
            </div>
            <div>
              <span>failures</span>
              <strong>{failureCount}</strong>
            </div>
            <div>
              <span>events</span>
              <strong>{eventCount}</strong>
            </div>
            <div>
              <span>evals</span>
              <strong>{snapshot.evalRuns}</strong>
            </div>
          </div>
          <div className="timeline-minimap" aria-label="Example trace minimap">
            <div className="trace-lane-label">
              <span>{primaryRun?.id ?? "no local run"}</span>
              <span>{eventCount > 0 ? `span tree / ${eventCount} events` : "seed or import to inspect"}</span>
            </div>
            <div className="timeline-lane">
              {timelineNodes.length === 0 ? (
                <span className="timeline-empty-label">No timeline events loaded</span>
              ) : (
                timelineNodes.map((node, index) => (
                  <span
                    key={`${node.spanId}_${index}`}
                    className={`event-dot ${eventTone(node.eventKind, index)}`}
                    title={`${node.spanId} ${node.eventKind}`}
                    style={{ left: `${8 + (node.sequence / maxSequence) * 84}%` }}
                  />
                ))
              )}
            </div>
            <div className="trace-lane-label">
              <span>{topCandidate?.spanId ?? "candidate ledger"}</span>
              <span>{topCandidate ? `${Math.round(topCandidate.confidence * 100)}% confidence` : "no candidates yet"}</span>
            </div>
            <div className="timeline-lane">
              {timelineNodes.length === 0 ? (
                <span className="timeline-empty-label">No counterfactual candidates loaded</span>
              ) : (
                timelineNodes.slice(0, 6).map((node, index) => (
                  <span
                    key={`${node.spanId}_branch_${index}`}
                    className={`event-dot ${index === 3 ? "warning" : eventTone(node.eventKind, index)}`}
                    title={`${node.spanId} ${node.eventKind}`}
                    style={{ left: `${8 + ((node.sequence + (index === 3 ? 0.35 : 0)) / maxSequence) * 84}%` }}
                  />
                ))
              )}
            </div>
          </div>
          <div className="hash-strip" aria-label="Replay evidence">
            <div className="hash-row">
              <span className="mono">fingerprint</span>
              <span className="hash-value">{fingerprint?.slice(0, 24) ?? "not generated"}</span>
            </div>
            <div className="hash-row">
              <span className="mono">divergence</span>
              <span className="hash-value">{firstDivergence}</span>
            </div>
            <div className="hash-row">
              <span className="mono">runtime</span>
              <span className="hash-value">{snapshot.runtimeExecutions} execution records</span>
            </div>
          </div>
        </div>

        <div className="cockpit-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Evidence Stack</p>
              <h2 style={{ margin: 0 }}>Artifacts</h2>
            </div>
          </div>
          <div className="evidence-stack-list">
            <div className="evidence-row">
              <span>Normalized trace</span>
              <strong className="mono">{primaryRun?.status ?? "none"}</strong>
            </div>
            <div className="evidence-row">
              <span>Causal graph</span>
              <strong className="mono">{causalNodes.length} nodes</strong>
            </div>
            <div className="evidence-row">
              <span>Eval runs</span>
              <strong className="mono">{snapshot.evalRuns}</strong>
            </div>
            <div className="evidence-row">
              <span>Evidence packs</span>
              <strong className="mono">{snapshot.evidencePacks}</strong>
            </div>
            <div className="evidence-row">
              <span>Tool surface</span>
              <strong className="mono">{primaryRun?.tools.length ?? 0} tools</strong>
            </div>
            <div className="evidence-row">
              <span>Import jobs</span>
              <strong className="mono">{importJobs.length}</strong>
            </div>
          </div>
        </div>
      </section>

      <section
        className={dropActive ? "dropzone active" : "dropzone"}
        role="region"
        aria-label="Trace import drop zone"
        onDragOver={(event) => {
          event.preventDefault();
          setDropActive(true);
        }}
        onDragLeave={() => setDropActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDropActive(false);
          const file = event.dataTransfer.files?.[0];
          if (!file) {
            return;
          }
          void uploadFile(file);
        }}
      >
        <div className="ui-stack" style={{ placeItems: "center" }}>
          <strong>Drop a trace file to import</strong>
          <span className="subtle">Large files are queued with progress, cancellation, and validation reports.</span>
        </div>
      </section>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Import Telemetry</p>
            <h2 style={{ margin: 0 }}>Recent large-trace jobs</h2>
          </div>
          <Badge>{importJobs.length} tracked</Badge>
        </div>
        <div className="record-table">
          {importJobs.map((job) => (
            <div key={job.id} className="record-row">
              <span className="mono">{job.id}</span>
              <Badge tone={job.status === "succeeded" ? "success" : job.status === "failed" ? "danger" : "warning"}>
                {job.status}
              </Badge>
              <span>{job.payload?.fileName ?? "unknown file"}</span>
              <span className="mono subtle">{job.progress}%</span>
              <span className="subtle">
                {job.result?.telemetry?.insertedEvents ?? job.result?.insertedEvents ?? 0} events
              </span>
              <span className="subtle">{job.result?.telemetry?.issueCount ?? 0} issues</span>
              {job.status === "queued" || job.status === "running" ? (
                <Button onClick={() => void cancelJob(job.id)} disabled={job.cancelRequested}>
                  {job.cancelRequested ? "Canceling" : "Cancel"}
                </Button>
              ) : null}
            </div>
          ))}
          {importJobs.length === 0 ? (
            <div className="empty-table">No import jobs yet. Drop a large trace or import with async mode.</div>
          ) : null}
        </div>
      </Card>

      <section className="lab-grid" aria-label="Reliability labs">
        <Link className="lab-card" href="/causality">
          <span className="eyebrow">Causality</span>
          <strong>Branch DAG and divergence candidates</strong>
          <span className="subtle">Trace graph, intervention ledger, and confidence-ranked candidates.</span>
        </Link>
        <Link className="lab-card" href="/evals">
          <span className="eyebrow">Eval Lab</span>
          <strong>Regression gates from real traces</strong>
          <span className="subtle">Datasets, deterministic scoring, pairwise branch comparison, drift.</span>
        </Link>
        <Link className="lab-card" href="/policy">
          <span className="eyebrow">Policy Lab</span>
          <strong>What would this policy have changed?</strong>
          <span className="subtle">YAML/Rego rules, PII detectors, dataflow warnings, tool risk.</span>
        </Link>
        <Link className="lab-card" href="/evidence">
          <span className="eyebrow">Evidence</span>
          <strong>Redacted packs with provenance</strong>
          <span className="subtle">Normalized trace, causal diff, evals, policy output, hashes.</span>
        </Link>
      </section>

      <Card className="local-data-panel">
        <div>
          <strong>Local-first.</strong> Stored under <code className="mono">.atl/</code>
        </div>
        <Button variant="danger" onClick={clearAllData}>
          Delete all data
        </Button>
      </Card>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Guided First Run</p>
            <h2 style={{ margin: 0 }}>Trace to evidence in one local loop</h2>
          </div>
        </div>
        <ol className="step-list">
          <li>
            <span className="step-index">1</span>
            <span>Seed demo traces</span>
            {guided.seededDemo ? <Badge tone="success">Done</Badge> : <Badge>Pending</Badge>}
          </li>
          <li>
            <span className="step-index">2</span>
            <Link
              href="/runs"
              onClick={() => updateGuide({ openedRuns: true })}
              style={{ textDecoration: "underline" }}
            >
              Open runs list
            </Link>
            {guided.openedRuns ? <Badge tone="success">Done</Badge> : <Badge>Pending</Badge>}
          </li>
          <li>
            <span className="step-index">3</span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={guided.completedCompare}
                onChange={(event) => updateGuide({ completedCompare: event.target.checked })}
              />
              Completed first compare workflow
            </label>
            {guided.completedCompare ? <Badge tone="success">Done</Badge> : <Badge>Pending</Badge>}
          </li>
        </ol>
      </Card>
    </Page>
  );
}
