"use client";

import { useEffect, useState } from "react";
import { Badge, Card, Page } from "@/components/ui";

interface RuntimeExecution {
  id: string;
  branchRunId: string;
  mode: "replay" | "reexec";
  providerId?: string;
  allowLiveTools: boolean;
  status: "success" | "fail" | "unknown";
  budget: { maxCalls: number; maxTokens: number; maxCostUsd: number };
  sideEffects: { liveToolsEnabled: boolean; expectedExternalCalls: number; notes: string[] };
  createdAt: string;
}

export default function RuntimePage() {
  const [executions, setExecutions] = useState<RuntimeExecution[]>([]);

  useEffect(() => {
    fetch("/api/runtime")
      .then((response) => response.json())
      .then((payload: { executions?: RuntimeExecution[] }) => setExecutions(payload.executions ?? []))
      .catch(() => setExecutions([]));
  }, []);

  return (
    <Page aria-label="Runtime Lab">
      <section className="lab-workbench">
        <Card>
          <div className="ui-section-header">
            <div>
              <p className="eyebrow">Runtime Lab</p>
              <h1>Re-execution, budgets, and side-effect evidence</h1>
            </div>
            <Badge>Audit trail</Badge>
          </div>
          <div className="ui-stack">
            <div className="panel-inset">
              <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                <span>Default execution</span>
                <Badge tone="success">replay only</Badge>
              </div>
            </div>
            <div className="panel-inset">
              <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                <span>Live tools</span>
                <Badge tone="warning">allowlisted</Badge>
              </div>
            </div>
            <div className="panel-inset">
              <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                <span>Budgets</span>
                <span className="mono subtle">calls / tokens / cost</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Budget Envelope</p>
              <h2 style={{ margin: 0 }}>Most recent run</h2>
            </div>
          </div>
          {executions[0] ? (
            <div className="ui-grid ui-grid-cols-3">
              <div className="metric-card">
                <span>calls</span>
                <strong>{executions[0].budget.maxCalls}</strong>
              </div>
              <div className="metric-card">
                <span>tokens</span>
                <strong>{executions[0].budget.maxTokens}</strong>
              </div>
              <div className="metric-card">
                <span>cost</span>
                <strong>${executions[0].budget.maxCostUsd}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-table">No execution records yet.</div>
          )}
        </Card>

        <Card>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Side Effects</p>
              <h2 style={{ margin: 0 }}>External surface</h2>
            </div>
          </div>
          {executions[0] ? (
            <div className="ui-stack">
              <div className="metric-card">
                <span>expected external calls</span>
                <strong>{executions[0].sideEffects.expectedExternalCalls}</strong>
              </div>
              <Badge tone={executions[0].allowLiveTools ? "warning" : "success"}>
                live tools {executions[0].allowLiveTools ? "enabled" : "off"}
              </Badge>
            </div>
          ) : (
            <div className="empty-table">Runtime audit trail is empty.</div>
          )}
        </Card>
      </section>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Execution Ledger</p>
            <h2 style={{ margin: 0 }}>Records</h2>
          </div>
        </div>
        <div className="record-table">
          {executions.map((execution) => (
            <div key={execution.id} className="record-row">
              <Badge tone={execution.status === "success" ? "success" : execution.status === "fail" ? "danger" : "default"}>
                {execution.status}
              </Badge>
              <span className="mono">{execution.branchRunId}</span>
              <span>{execution.mode}</span>
              <span>{execution.providerId ?? "recorded"}</span>
              <span className="subtle">calls {execution.budget.maxCalls}</span>
              <span className="subtle">external {execution.sideEffects.expectedExternalCalls}</span>
            </div>
          ))}
          {executions.length === 0 ? <div className="empty-table">No execution records yet.</div> : null}
        </div>
      </Card>
    </Page>
  );
}
