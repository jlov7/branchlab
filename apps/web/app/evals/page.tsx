"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Page, Select } from "@/components/ui";

interface EvalDataset {
  id: string;
  name: string;
  runIds: string[];
}

interface EvalRun {
  id: string;
  datasetId: string;
  name: string;
  status: "pass" | "fail" | "warn";
  summary: { total: number; pass: number; fail: number; warn: number; successRate: number; regressionCount: number };
  createdAt: string;
}

export default function EvalsPage() {
  const [datasets, setDatasets] = useState<EvalDataset[]>([]);
  const [evalRuns, setEvalRuns] = useState<EvalRun[]>([]);
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");

  async function load(): Promise<void> {
    const response = await fetch("/api/evals");
    const payload = (await response.json()) as { datasets: EvalDataset[]; evalRuns: EvalRun[] };
    setDatasets(payload.datasets);
    setEvalRuns(payload.evalRuns);
    setSelected((current) => current || payload.datasets[0]?.id || "");
  }

  useEffect(() => {
    void load();
  }, []);

  async function createDefault(): Promise<void> {
    const response = await fetch("/api/evals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-default" }),
    });
    setMessage(response.ok ? "Dataset created" : "Dataset creation failed");
    await load();
  }

  async function runSelected(): Promise<void> {
    if (!selected) {
      setMessage("Select a dataset first");
      return;
    }
    const response = await fetch("/api/evals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", datasetId: selected }),
    });
    setMessage(response.ok ? "Eval run complete" : "Eval run failed");
    await load();
  }

  return (
    <Page aria-label="Eval Lab">
      <section className="lab-workbench">
        <Card>
          <div className="ui-section-header">
            <div>
              <p className="eyebrow">Eval Lab</p>
              <h1>Local regression gates from real traces</h1>
            </div>
            <Badge>Deterministic</Badge>
          </div>
          <div className="ui-stack">
            <Select value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Eval dataset">
              <option value="">No dataset</option>
              {datasets.map((dataset) => (
                <option key={dataset.id} value={dataset.id}>
                  {dataset.name} ({dataset.runIds.length})
                </option>
              ))}
            </Select>
            <div className="ui-inline">
              <Button onClick={() => void createDefault()}>Create from runs</Button>
              <Button variant="primary" onClick={() => void runSelected()}>Run gate</Button>
            </div>
            {message ? <p className="subtle">{message}</p> : null}
          </div>
        </Card>

        <Card>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Dataset Surface</p>
              <h2 style={{ margin: 0 }}>Trace-derived datasets</h2>
            </div>
          </div>
          <div className="ui-stack">
            {datasets.length === 0 ? (
              <div className="empty-table">No datasets yet.</div>
            ) : (
              datasets.map((dataset) => (
                <div key={dataset.id} className="panel-inset">
                  <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                    <strong>{dataset.name}</strong>
                    <span className="mono subtle">{dataset.runIds.length} runs</span>
                  </div>
                  <div className="bar-meter" style={{ marginTop: 10 }}>
                    <div className="bar-meter-fill" style={{ width: `${Math.min(100, dataset.runIds.length * 20)}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Gate Health</p>
              <h2 style={{ margin: 0 }}>Latest signal</h2>
            </div>
          </div>
          {evalRuns[0] ? (
            <div className="ui-stack">
              <Badge tone={evalRuns[0].status === "pass" ? "success" : evalRuns[0].status === "fail" ? "danger" : "warning"}>
                {evalRuns[0].status}
              </Badge>
              <div className="metric-card">
                <span>success rate</span>
                <strong>{Math.round(evalRuns[0].summary.successRate * 100)}%</strong>
              </div>
              <div className="metric-card">
                <span>regressions</span>
                <strong>{evalRuns[0].summary.regressionCount}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-table">Run a gate to establish drift signal.</div>
          )}
        </Card>
      </section>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">History</p>
            <h2 style={{ margin: 0 }}>Recent eval runs</h2>
          </div>
        </div>
        <div className="record-table">
          {evalRuns.map((run) => (
            <div key={run.id} className="record-row">
              <Badge tone={run.status === "pass" ? "success" : run.status === "fail" ? "danger" : "warning"}>{run.status}</Badge>
              <span>{run.name}</span>
              <span className="subtle">{run.summary.total} cases</span>
              <span className="subtle">pass {run.summary.pass}</span>
              <span className="subtle">fail {run.summary.fail}</span>
              <span className="subtle">regressions {run.summary.regressionCount}</span>
            </div>
          ))}
          {evalRuns.length === 0 ? <div className="empty-table">No eval runs yet.</div> : null}
        </div>
      </Card>
    </Page>
  );
}
