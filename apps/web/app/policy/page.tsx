"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { Badge, Button, Card, Field, Input, Page, Select } from "@/components/ui";

interface Policy {
  id: string;
  name: string;
  description: string;
  backend: "yaml" | "rego_wasm";
  createdAt: string;
}

interface RunSummary {
  id: string;
  source: string;
  status: "success" | "fail" | "unknown";
}

const YAML_TEMPLATE = `version: 1
rules:
  - id: deny_http
    when:
      tool: ["http.get", "browser.open"]
    then:
      decision: deny
      severity: high
      reason: "Network tools blocked in local replay"
`;

const REGO_TEMPLATE = `package branchlab

default allow := {"decision": "deny", "reason": "default deny"}

allow := {
  "decision": "allow",
  "reason": "tool allowed"
} if {
  input.event.type == "tool.request"
  input.event.data.tool == "pricing.lookup"
}
`;

export default function PolicyPage() {
  const [backend, setBackend] = useState<"yaml" | "rego_wasm">("yaml");
  const [name, setName] = useState("block-network");
  const [description, setDescription] = useState("Policy for local replay safety");
  const [content, setContent] = useState(YAML_TEMPLATE);
  const [entrypoint, setEntrypoint] = useState("branchlab/allow");
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState("");
  const [result, setResult] = useState<string>("");
  const [analytics, setAnalytics] = useState<{
    summary: {
      violations: number;
      totalCalls: number;
      bySeverity: Record<string, number>;
      byRule: Record<string, number>;
      byTool: Record<string, number>;
      blockedSuccessEstimate: number;
    };
  } | null>(null);
  const [asyncMode, setAsyncMode] = useState(true);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobHistory, setJobHistory] = useState<string[]>([]);

  async function load(): Promise<void> {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/policies"),
      fetch("/api/runs?limit=200"),
    ]);
    const pPayload = (await pRes.json()) as { policies: Policy[] };
    const rPayload = (await rRes.json()) as { runs: RunSummary[] };
    setPolicies(pPayload.policies);
    setRuns(rPayload.runs);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, backend, content, entrypoint }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setResult(payload.error ?? "Failed to save policy");
      return;
    }

    setResult("Policy saved");
    await load();
  }

  async function evaluate(): Promise<void> {
    setAnalytics(null);
    const response = await fetch("/api/policy-evals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policyId: selectedPolicy, runIds: selectedRuns, async: asyncMode }),
    });

    const payload = (await response.json()) as {
      error?: string;
      summary?: {
        violations: number;
        totalCalls: number;
        bySeverity: Record<string, number>;
        byRule: Record<string, number>;
        byTool: Record<string, number>;
        blockedSuccessEstimate: number;
      };
      decisions?: unknown;
      jobId?: string;
    };
    if (!response.ok) {
      setResult(payload.error ?? "Policy evaluation failed");
      return;
    }

    if (payload.jobId) {
      setActiveJobId(payload.jobId);
      setJobHistory([`queued (${payload.jobId})`]);
      setResult(`Policy evaluation queued: ${payload.jobId}`);
      return;
    }

    if (payload.summary) {
      setAnalytics({ summary: payload.summary });
    }
    setResult(JSON.stringify(payload, null, 2));
  }

  useEffect(() => {
    if (!activeJobId) {
      return;
    }
    const timer = setInterval(() => {
      fetch(`/api/jobs/${activeJobId}`)
        .then((res) => res.json())
        .then(
          (payload: {
            job?: {
              id: string;
              status: "queued" | "running" | "succeeded" | "failed" | "canceled";
              progress: number;
              message: string;
              result: {
                summary?: {
                  violations: number;
                  totalCalls: number;
                  bySeverity: Record<string, number>;
                  byRule: Record<string, number>;
                  byTool: Record<string, number>;
                  blockedSuccessEstimate: number;
                };
              } | null;
              error: { message: string } | null;
            };
          },
        ) => {
          if (!payload.job) {
            return;
          }
          setResult(
            `Job ${payload.job.id}: ${payload.job.status} (${payload.job.progress}%) ${payload.job.message}`,
          );
          setJobHistory((previous) => [
            ...previous,
            `${payload.job?.status} (${payload.job?.progress}%) ${payload.job?.message}`,
          ].slice(-8));
          if (
            payload.job.status === "succeeded" ||
            payload.job.status === "failed" ||
            payload.job.status === "canceled"
          ) {
            if (payload.job.result?.summary) {
              setAnalytics({ summary: payload.job.result.summary });
              setResult(JSON.stringify(payload.job.result, null, 2));
            }
            if (payload.job.error) {
              setResult(payload.job.error.message);
            }
            setActiveJobId(null);
          }
        },
      )
      .catch(() => undefined);
    }, 800);

    return () => clearInterval(timer);
  }, [activeJobId]);

  async function cancelActiveJob(): Promise<void> {
    if (!activeJobId) {
      return;
    }
    await fetch(`/api/jobs/${activeJobId}/cancel`, { method: "POST" });
  }

  const severityEntries = useMemo(
    () => Object.entries(analytics?.summary.bySeverity ?? {}),
    [analytics],
  );
  const toolEntries = useMemo(
    () => Object.entries(analytics?.summary.byTool ?? {}),
    [analytics],
  );
  const ruleEntries = useMemo(
    () => Object.entries(analytics?.summary.byRule ?? {}).slice(0, 8),
    [analytics],
  );

  return (
    <Page aria-label="Policy lab">
      <Card className="page-header">
        <div className="ui-section-header">
          <div>
            <p className="eyebrow">Policy Lab</p>
            <h1 style={{ margin: 0 }}>Policy Lab</h1>
          </div>
          <Badge>what-if analysis</Badge>
        </div>
        <p className="subtle">
          Author YAML or Rego policies, version them, and run impact simulations across traces.
        </p>
        <div className="ui-inline">
          <Badge tone="success">YAML enabled</Badge>
          <Badge tone="warning">Rego/WASM enabled</Badge>
          <Badge>Async jobs supported</Badge>
        </div>
      </Card>

      <Card className="ui-stack">
        <div className="ui-grid ui-grid-cols-2">
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Backend">
            <Select
              value={backend}
              onChange={(event) => {
                const next = event.target.value as "yaml" | "rego_wasm";
                setBackend(next);
                setContent(next === "yaml" ? YAML_TEMPLATE : REGO_TEMPLATE);
              }}
            >
              <option value="yaml">YAML rules</option>
              <option value="rego_wasm">Rego/WASM</option>
            </Select>
          </Field>
        </div>

        <Field label="Description">
          <Input value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>

        {backend === "rego_wasm" ? (
          <Field label="Entrypoint (e.g., branchlab/allow)">
            <Input value={entrypoint} onChange={(event) => setEntrypoint(event.target.value)} />
          </Field>
        ) : null}

        <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
          <Editor
            height="360px"
            language={backend === "yaml" ? "yaml" : "rego"}
            value={content}
            onChange={(value) => setContent(value ?? "")}
            theme="vs-dark"
            options={{ minimap: { enabled: false }, fontSize: 13 }}
          />
        </div>

        <div className="ui-inline">
          <Button variant="primary" onClick={() => void save()}>
            Save policy version
          </Button>
          <Button
            variant="ghost"
            onClick={() => setContent(backend === "yaml" ? YAML_TEMPLATE : REGO_TEMPLATE)}
          >
            Reset template
          </Button>
        </div>
      </Card>

      <Card className="ui-stack">
        <h2 style={{ margin: 0 }}>Run policy on selected traces</h2>

        <Field label="Policy version">
          <Select value={selectedPolicy} onChange={(event) => setSelectedPolicy(event.target.value)}>
            <option value="">Select policy</option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name} ({policy.backend})
              </option>
            ))}
          </Select>
        </Field>

        <div className="panel-inset">
          <div className="subtle mono" style={{ marginBottom: 8 }}>
            Select traces
          </div>
          <div style={{ display: "grid", gap: 6, maxHeight: 220, overflow: "auto" }}>
            {runs.map((run) => (
              <label key={run.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={selectedRuns.includes(run.id)}
                  onChange={(event) => {
                    setSelectedRuns((prev) => {
                      if (event.target.checked) {
                        return [...prev, run.id];
                      }
                      return prev.filter((id) => id !== run.id);
                    });
                  }}
                />
                <span className="mono">{run.id}</span>
                <span className="subtle">{run.status}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="ui-inline">
          <Button onClick={() => void evaluate()} disabled={!selectedPolicy || selectedRuns.length === 0}>
            Run on selected traces
          </Button>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={asyncMode}
              onChange={(event) => setAsyncMode(event.target.checked)}
            />
            Run asynchronously with progress
          </label>
          {activeJobId ? (
            <Button variant="danger" onClick={() => void cancelActiveJob()}>
              Cancel active job
            </Button>
          ) : null}
        </div>

        {jobHistory.length > 0 ? (
          <div className="panel-inset" role="status" aria-live="polite">
            <div className="subtle mono">Job timeline</div>
            <ol className="mono" style={{ marginBottom: 0 }}>
              {jobHistory.map((entry, index) => (
                <li key={`${entry}_${index}`}>{entry}</li>
              ))}
            </ol>
          </div>
        ) : null}
      </Card>

      {analytics ? (
        <Card>
          <h2 style={{ marginTop: 0 }}>Impact analytics</h2>
          <div className="subtle mono" style={{ marginBottom: 10 }}>
            violations={analytics.summary.violations} totalCalls={analytics.summary.totalCalls} blockedSuccessEstimate=
            {analytics.summary.blockedSuccessEstimate}
          </div>
          <div className="ui-grid ui-grid-cols-3">
            <ChartCard title="By severity" values={severityEntries} />
            <ChartCard title="By tool" values={toolEntries} />
            <ChartCard title="Top rules" values={ruleEntries} />
          </div>
        </Card>
      ) : null}

      <Card>
        <h2 style={{ marginTop: 0 }}>Results</h2>
        <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }} aria-live="polite">
          {result || "No evaluation yet."}
        </pre>
      </Card>
    </Page>
  );
}

function ChartCard({ title, values }: { title: string; values: Array<[string, number]> }) {
  const max = Math.max(1, ...values.map((entry) => entry[1]));
  return (
    <div className="panel-inset">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {values.length === 0 ? (
        <p className="subtle">No data</p>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {values.map(([label, count]) => (
            <div key={label}>
              <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                <span className="mono">{label}</span>
                <span className="mono">{count}</span>
              </div>
              <div style={{ border: "1px solid var(--line)", borderRadius: 999, height: 8, marginTop: 4 }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(count / max) * 100}%`,
                    background: "var(--accent)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
