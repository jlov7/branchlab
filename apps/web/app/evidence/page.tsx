"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, Input, Page } from "@/components/ui";

interface EvidencePack {
  id: string;
  runId: string;
  branchRunId?: string;
  exportId?: string;
  provenance: {
    runFingerprint?: { fingerprint?: string };
    causalFirstDivergence?: string | null;
    tracePhysicsEvidence?: { evidenceHash?: string; eventCount?: number };
    tracePhysicsDiagnostics?: unknown[];
    investigationCount?: number;
    investigationEvidenceHashes?: string[];
    spanAnnotationCount?: number;
  };
  createdAt: string;
}

export default function EvidencePage() {
  const [packs, setPacks] = useState<EvidencePack[]>([]);
  const [runId, setRunId] = useState("run_demo_fail");
  const [branchRunId, setBranchRunId] = useState("");
  const [message, setMessage] = useState("");

  async function load(): Promise<void> {
    const response = await fetch("/api/evidence");
    const payload = (await response.json()) as { packs?: EvidencePack[] };
    setPacks(payload.packs ?? []);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createPack(): Promise<void> {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId, branchRunId: branchRunId || undefined, redacted: true }),
    });
    setMessage(response.ok ? "Evidence pack exported" : "Evidence export failed");
    await load();
  }

  return (
    <Page aria-label="Evidence Packs">
      <section className="lab-workbench">
        <Card>
          <div className="ui-section-header">
            <div>
              <p className="eyebrow">Evidence Packs</p>
              <h1>Redacted exports with provenance hashes</h1>
            </div>
            <Badge>Local files</Badge>
          </div>
          <div className="ui-stack">
            <Field label="Run ID">
              <Input value={runId} onChange={(event) => setRunId(event.target.value)} />
            </Field>
            <Field label="Branch run ID">
              <Input value={branchRunId} onChange={(event) => setBranchRunId(event.target.value)} placeholder="optional" />
            </Field>
            <Button variant="primary" onClick={() => void createPack()}>Create redacted evidence pack</Button>
            {message ? <p className="subtle">{message}</p> : null}
          </div>
        </Card>

        <Card>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Pack Contents</p>
              <h2 style={{ margin: 0 }}>Export contract</h2>
            </div>
          </div>
          <div className="ui-stack">
            {[
              "Redacted HTML",
              "Normalized Trace IR",
              "Trace physics summary",
              "Investigation ledger",
              "Span annotations",
              "Causal diff",
              "Eval results",
              "Policy results",
              "Provenance hashes",
            ].map((item) => (
              <div key={item} className="panel-inset">
                <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                  <span>{item}</span>
                  <Badge tone="success">included</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Latest Provenance</p>
              <h2 style={{ margin: 0 }}>Hash signal</h2>
            </div>
          </div>
          {packs[0] ? (
            <div className="ui-stack">
              <div className="metric-card">
                <span>fingerprint</span>
                <strong className="mono">{packs[0].provenance.runFingerprint?.fingerprint?.slice(0, 12) ?? "missing"}</strong>
              </div>
              <div className="panel-inset">
                <span className="subtle">divergence </span>
                <span className="mono">{packs[0].provenance.causalFirstDivergence ?? "none"}</span>
              </div>
              <div className="metric-card">
                <span>trace physics</span>
                <strong className="mono">
                  {packs[0].provenance.tracePhysicsEvidence?.evidenceHash?.slice(0, 12) ?? "missing"}
                </strong>
              </div>
              <div className="panel-inset">
                <span className="subtle">diagnostics </span>
                <span className="mono">{packs[0].provenance.tracePhysicsDiagnostics?.length ?? 0}</span>
              </div>
              <div className="metric-card">
                <span>investigations</span>
                <strong className="mono">{packs[0].provenance.investigationCount ?? 0}</strong>
              </div>
              <div className="metric-card">
                <span>span annotations</span>
                <strong className="mono">{packs[0].provenance.spanAnnotationCount ?? 0}</strong>
              </div>
            </div>
          ) : (
            <div className="empty-table">No exported packs yet.</div>
          )}
        </Card>
      </section>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Export Ledger</p>
            <h2 style={{ margin: 0 }}>Recent packs</h2>
          </div>
        </div>
        <div className="record-table">
          {packs.map((pack) => (
            <div key={pack.id} className="record-row">
              <span className="mono">{pack.exportId ?? pack.id}</span>
              <span>{pack.runId}</span>
              <span className="subtle">{pack.branchRunId ?? "no branch"}</span>
              <span className="subtle">divergence {pack.provenance.causalFirstDivergence ?? "none"}</span>
              <span className="mono subtle">{pack.provenance.runFingerprint?.fingerprint?.slice(0, 12) ?? "missing"}</span>
              <span className="mono subtle">
                physics {pack.provenance.tracePhysicsEvidence?.evidenceHash?.slice(0, 12) ?? "missing"}
              </span>
              <span className="subtle">investigations {pack.provenance.investigationCount ?? 0}</span>
              <span className="subtle">span notes {pack.provenance.spanAnnotationCount ?? 0}</span>
            </div>
          ))}
          {packs.length === 0 ? <div className="empty-table">No evidence packs yet.</div> : null}
        </div>
      </Card>
    </Page>
  );
}
