"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState, Page } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<string | null>(null);
  const [validationReportId, setValidationReportId] = useState<string | null>(null);
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

  async function clearAllData(): Promise<void> {
    if (!window.confirm("Delete all local runs, policies, and exports under .atl/?")) {
      return;
    }

    await fetch("/api/settings/delete-all", { method: "POST" });
    window.location.reload();
  }

  return (
    <Page aria-label="Landing page">
      <Card className="page-header">
        <h1 className="title">Replay and fork agent runs</h1>
        <p className="subtle">
          BranchLab is a local-first analysis studio for deterministic replay, counterfactual branching, and policy
          simulation.
        </p>
        <div className="ui-inline">
          <Button variant="primary" onClick={seedDemo} disabled={loading}>
            {loading ? "Preparing demo..." : "Try demo trace (30 sec)"}
          </Button>
          <label className="ui-button ui-inline">
            Import JSONL file
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
            Open runs list
          </Button>
          <Badge tone="success">Local-first</Badge>
          <Badge tone="warning">Deterministic by default</Badge>
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
      </Card>

      <Card
        role="region"
        aria-label="Trace import drop zone"
        style={{
          borderStyle: "dashed",
          borderColor: dropActive ? "var(--accent)" : "var(--line)",
          background: dropActive ? "rgba(65,212,194,0.12)" : undefined,
        }}
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
        <div className="ui-stack" style={{ placeItems: "center", textAlign: "center" }}>
          <strong>Drop a JSONL trace here to import</strong>
          <span className="subtle">
            Large files are imported asynchronously with tracked progress and cancellation support.
          </span>
        </div>
      </Card>

      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card>
          <h2>Replay</h2>
          <p className="subtle">Inspect exactly what happened with raw event JSON and hashes.</p>
        </Card>
        <Card>
          <h2>Fork</h2>
          <p className="subtle">Branch from any event with prompt/tool/policy/memory interventions.</p>
        </Card>
        <Card>
          <h2>Compare</h2>
          <p className="subtle">See first divergence, semantic payload diffs, and outcome deltas.</p>
        </Card>
      </div>

      <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div>
          <strong>Local-first.</strong> Stored under <code className="mono">.atl/</code>
        </div>
        <Button variant="danger" onClick={clearAllData}>
          Delete all data
        </Button>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0 }}>Guided first run</h2>
        <p className="subtle">Goal: import traces, inspect timeline, and complete one compare flow.</p>
        <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6 }}>
          <li>
            Seed demo traces. {guided.seededDemo ? <Badge tone="success">Done</Badge> : <Badge>Pending</Badge>}
          </li>
          <li>
            <Link
              href="/runs"
              onClick={() => updateGuide({ openedRuns: true })}
              style={{ textDecoration: "underline" }}
            >
              Open runs list
            </Link>{" "}
            ({guided.openedRuns ? "Done" : "Pending"})
          </li>
          <li>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={guided.completedCompare}
                onChange={(event) => updateGuide({ completedCompare: event.target.checked })}
              />
              Completed first compare workflow
            </label>
          </li>
        </ol>
      </Card>

      <Card>
        <EmptyState>
          <strong>Need a quick start?</strong>
          <span>Use demo traces to run replay, fork a branch, and compare outcomes in under five minutes.</span>
          <Button onClick={seedDemo}>Start guided demo</Button>
        </EmptyState>
      </Card>
    </Page>
  );
}
