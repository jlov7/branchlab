"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Field, Input, Page } from "@/components/ui";

interface CausalPayload {
  fingerprint?: { fingerprint: string; eventCount: number } | null;
  graph?: {
    nodes: Array<{ spanId: string; eventKind: string; sequence: number; hash: string }>;
    edges: Array<{ from: string; to: string; kind: string }>;
    byEventKind: Record<string, number>;
  };
  branches?: Array<{ branchRunId: string; forkEventId: string; createdAt: string }>;
  compare?: {
    firstDivergenceSpanId: string | null;
    firstDivergenceSequence: number;
    heatmap: Record<string, number>;
    changes: Array<{ spanId: string; kind: string }>;
  } | null;
  candidates?: Array<{ spanId: string; eventKind: string; confidence: number; rationale: string }>;
  investigations?: Array<{
    id: string;
    title: string;
    hypothesis: string;
    pinnedSpanIds: string[];
    evidenceHash: string;
    status: string;
    updatedAt: string;
  }>;
  annotations?: Array<{
    id: string;
    investigationId?: string;
    spanId: string;
    note: string;
    tags: string[];
    updatedAt: string;
  }>;
  tracePhysics?: {
    fingerprint: string;
    diagnostics: Array<{ code: string; spanId: string; severity: string; message: string }>;
    evidence: {
      evidenceHash: string;
      eventCount: number;
      roots: string[];
      toolCallCount: number;
      policyDecisionCount: number;
    };
  };
}

type InvestigationStatusFilter = "all" | "open" | "resolved" | "rejected";

export default function CausalityPage() {
  const [runId, setRunId] = useState("run_demo_fail");
  const [branchRunId, setBranchRunId] = useState("");
  const [payload, setPayload] = useState<CausalPayload | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [investigationTitle, setInvestigationTitle] = useState("Pricing root cause");
  const [hypothesis, setHypothesis] = useState("The first divergent span caused the downstream outcome change.");
  const [investigationMessage, setInvestigationMessage] = useState("");
  const [selectedSpanId, setSelectedSpanId] = useState("");
  const [annotationNote, setAnnotationNote] = useState("Reviewer note for the selected causal span.");
  const [annotationTags, setAnnotationTags] = useState("causal, review");
  const [annotationMessage, setAnnotationMessage] = useState("");
  const [annotationFilter, setAnnotationFilter] = useState<"all" | "selected">("all");
  const [investigationStatusFilter, setInvestigationStatusFilter] = useState<InvestigationStatusFilter>("all");
  const [selectedInvestigationId, setSelectedInvestigationId] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    const params = new URLSearchParams({ runId });
    if (branchRunId.trim()) {
      params.set("branchRunId", branchRunId.trim());
    }
    try {
      const response = await fetch(`/api/causal?${params.toString()}`);
      const data = (await response.json()) as CausalPayload & { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Failed to load causal graph");
        setPayload(null);
        return;
      }
      setMessage("");
      setPayload(data);
    } finally {
      setLoading(false);
    }
  }, [branchRunId, runId]);

  async function saveInvestigation(): Promise<void> {
    if (!payload?.tracePhysics?.evidence.evidenceHash) {
      setInvestigationMessage("Load trace physics evidence before saving.");
      return;
    }
    const pinnedSpanIds = [
      selectedSpanId,
      payload.compare?.firstDivergenceSpanId,
      ...(payload.candidates ?? []).slice(0, 3).map((candidate) => candidate.spanId),
    ].filter((item): item is string => Boolean(item));

    const response = await fetch("/api/investigations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId,
        branchRunId: branchRunId.trim() || undefined,
        title: investigationTitle,
        hypothesis,
        pinnedSpanIds,
        evidenceHash: payload.tracePhysics.evidence.evidenceHash,
      }),
    });
    setInvestigationMessage(response.ok ? "Investigation saved" : "Investigation save failed");
    if (response.ok) {
      await load();
    }
  }

  async function updateInvestigationStatus(id: string, status: "open" | "resolved" | "rejected"): Promise<void> {
    const response = await fetch("/api/investigations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setInvestigationMessage(response.ok ? `Investigation marked ${status}` : "Investigation update failed");
    if (response.ok) {
      await load();
    }
  }

  async function saveSpanAnnotation(): Promise<void> {
    if (!selectedSpanId) {
      setAnnotationMessage("Select a span before saving a note.");
      return;
    }
    const response = await fetch("/api/span-annotations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId,
        investigationId: selectedInvestigation?.id,
        spanId: selectedSpanId,
        note: annotationNote,
        tags: annotationTags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      }),
    });
    setAnnotationMessage(response.ok ? "Span annotation saved" : "Span annotation save failed");
    if (response.ok) {
      await load();
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  const annotations = payload?.annotations ?? [];
  const investigations = useMemo(() => payload?.investigations ?? [], [payload?.investigations]);
  const visibleInvestigations = useMemo(
    () =>
      investigationStatusFilter === "all"
        ? investigations
        : investigations.filter((investigation) => investigation.status === investigationStatusFilter),
    [investigationStatusFilter, investigations],
  );
  const selectedInvestigation =
    investigations.find((investigation) => investigation.id === selectedInvestigationId) ?? visibleInvestigations[0] ?? null;
  const investigationCounts = useMemo(
    () => ({
      all: investigations.length,
      open: investigations.filter((investigation) => investigation.status === "open").length,
      resolved: investigations.filter((investigation) => investigation.status === "resolved").length,
      rejected: investigations.filter((investigation) => investigation.status === "rejected").length,
    }),
    [investigations],
  );
  const visibleAnnotations =
    annotationFilter === "selected" && selectedSpanId
      ? annotations.filter((annotation) => annotation.spanId === selectedSpanId)
      : annotations;

  return (
    <Page aria-label="Causal debugger">
      <section className="lab-workbench">
        <Card>
        <div className="ui-section-header">
          <div>
            <p className="eyebrow">Causal Debugger</p>
            <h1>Trace graph, fingerprints, and divergence candidates</h1>
          </div>
          <Badge>Trace IR v2</Badge>
        </div>
        <div className="ui-stack">
          <Field label="Run ID">
            <Input value={runId} onChange={(event) => setRunId(event.target.value)} />
          </Field>
          <Field label="Branch run ID">
            <Input value={branchRunId} onChange={(event) => setBranchRunId(event.target.value)} placeholder="optional" />
          </Field>
          <Button variant="primary" onClick={() => void load()} disabled={loading}>
            {loading ? "Loading..." : "Load causality"}
          </Button>
          {message ? <p className="subtle">{message}</p> : null}
        </div>
        <div className="panel-inset" style={{ marginTop: 14 }}>
          <p className="eyebrow">Replay fingerprint</p>
          <p className="mono subtle" style={{ overflowWrap: "anywhere" }}>
            {payload?.fingerprint?.fingerprint ?? "No fingerprint loaded"}
          </p>
          <p className="subtle">Events: {payload?.fingerprint?.eventCount ?? 0}</p>
        </div>
        <div className="panel-inset" style={{ marginTop: 10 }}>
          <p className="eyebrow">Trace physics evidence</p>
          <p className="mono subtle" style={{ overflowWrap: "anywhere" }}>
            {payload?.tracePhysics?.evidence.evidenceHash ?? "No evidence hash loaded"}
          </p>
          <p className="subtle">Diagnostics: {payload?.tracePhysics?.diagnostics.length ?? 0}</p>
        </div>
        </Card>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Branch DAG</p>
            <h2 style={{ margin: 0 }}>Causal structure</h2>
          </div>
          <Badge tone={payload?.compare?.firstDivergenceSpanId ? "warning" : "success"}>
            {payload?.compare?.firstDivergenceSpanId ? "diverged" : "stable"}
          </Badge>
        </div>
        <div
          className={(payload?.graph?.nodes.length ?? 0) > 0 ? "graph-stage" : "graph-stage empty"}
          aria-label="Causal graph visualization"
        >
          {(payload?.graph?.nodes.length ?? 0) === 0 ? (
            <div className="graph-empty-state">
              <strong>{loading ? "Loading causal graph..." : "No graph loaded"}</strong>
              <span className="subtle">
                Seed demo traces or enter a run id with Trace IR events to populate the DAG.
              </span>
            </div>
          ) : null}
          {(payload?.graph?.nodes ?? []).slice(0, 6).map((node, index) => {
            const positions = [
              { left: "8%", top: "18%" },
              { left: "33%", top: "30%" },
              { left: "58%", top: "18%" },
              { left: "20%", top: "62%" },
              { left: "48%", top: "68%" },
              { left: "72%", top: "56%" },
            ];
            return (
              <button
                type="button"
                key={node.spanId}
                aria-label={`Select span ${node.spanId}`}
                className={
                  node.spanId === selectedSpanId || node.spanId === payload?.compare?.firstDivergenceSpanId
                    ? "graph-node active"
                    : "graph-node"
                }
                onClick={() => setSelectedSpanId(node.spanId)}
                style={positions[index]}
              >
                <span className="mono">{node.spanId}</span>
                <strong>{node.eventKind}</strong>
                <span className="mono subtle">seq {node.sequence}</span>
              </button>
            );
          })}
        </div>
        <div className="panel-inset" style={{ marginTop: 12 }}>
          <span className="subtle">Selected pin </span>
          <span className="mono">{selectedSpanId || "none"}</span>
        </div>
        <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", marginTop: 12 }}>
            {Object.entries(payload?.graph?.byEventKind ?? {}).map(([kind, count]) => (
              <div key={kind} className="metric-card">
                <span>{kind}</span>
                <strong>{count}</strong>
              </div>
            ))}
            <div className="metric-card">
              <span>roots</span>
              <strong>{payload?.tracePhysics?.evidence.roots.length ?? 0}</strong>
            </div>
            <div className="metric-card">
              <span>tools</span>
              <strong>{payload?.tracePhysics?.evidence.toolCallCount ?? 0}</strong>
            </div>
        </div>
      </Card>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Inspector</p>
            <h2 style={{ margin: 0 }}>Divergence evidence</h2>
          </div>
        </div>
        <div className="panel-inset">
          <div className="subtle">First divergence:</div>
          <div className="mono">{payload?.compare?.firstDivergenceSpanId ?? "none"}</div>
        </div>
        <div className="ui-stack" style={{ marginTop: 12 }}>
          {Object.entries(payload?.compare?.heatmap ?? {}).map(([kind, count]) => (
            <div key={kind}>
              <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                <span className="mono subtle">{kind}</span>
                <span className="mono">{count}</span>
              </div>
              <div className="heatmap-bar">
                <div className="heatmap-fill" style={{ width: `${Math.min(100, count * 18)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="ui-stack" style={{ marginTop: 14 }}>
          <p className="eyebrow">Branches</p>
          {(payload?.branches ?? []).slice(0, 6).map((branch) => (
            <div key={branch.branchRunId} className="branch-row">
              <span className="mono subtle">{branch.forkEventId}</span>
              <span className="mono">{branch.branchRunId}</span>
            </div>
          ))}
        </div>
      </Card>
      </section>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Counterfactual Candidates</p>
            <h2 style={{ margin: 0 }}>Top causal candidates</h2>
          </div>
        </div>
        {(payload?.candidates ?? []).map((candidate) => (
          <button
            key={candidate.spanId}
            type="button"
            className="list-row"
            onClick={() => setSelectedSpanId(candidate.spanId)}
            aria-label={`Select candidate span ${candidate.spanId}`}
          >
            <span className="mono">{candidate.spanId}</span>
            <span>{candidate.eventKind}</span>
            <strong>{Math.round(candidate.confidence * 100)}%</strong>
            <span className="subtle">{candidate.rationale}</span>
            <span className="confidence-bar" aria-hidden="true">
              <span className="confidence-fill" style={{ width: `${Math.round(candidate.confidence * 100)}%` }} />
            </span>
          </button>
        ))}
      </Card>

      <Card>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Investigation Ledger</p>
            <h2 style={{ margin: 0 }}>Saved hypotheses</h2>
          </div>
          <Badge>{investigations.length} saved</Badge>
        </div>
        <div className="ui-grid ui-grid-cols-2">
          <Field label="Investigation title">
            <Input value={investigationTitle} onChange={(event) => setInvestigationTitle(event.target.value)} />
          </Field>
          <Field label="Hypothesis">
            <Input value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} />
          </Field>
        </div>
        <div className="panel-inset" style={{ marginTop: 14 }}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Saved Views</p>
              <h3 style={{ margin: 0 }}>Investigation filters</h3>
            </div>
            <Badge>{visibleInvestigations.length} visible</Badge>
          </div>
          <div className="ui-inline" style={{ marginTop: 12 }}>
            {(["all", "open", "resolved", "rejected"] as const).map((status) => (
              <Button
                key={status}
                variant={investigationStatusFilter === status ? "primary" : "ghost"}
                aria-pressed={investigationStatusFilter === status}
                onClick={() => {
                  setInvestigationStatusFilter(status);
                  setSelectedInvestigationId("");
                }}
              >
                {status} {investigationCounts[status]}
              </Button>
            ))}
          </div>
          <div className="panel-inset" style={{ marginTop: 12 }}>
            <span className="subtle">Selected investigation </span>
            <span className="mono">{selectedInvestigation?.title ?? "none"}</span>
            {selectedInvestigation ? (
              <div className="ui-inline" style={{ marginTop: 10 }}>
                <Button
                  onClick={() => {
                    setInvestigationTitle(selectedInvestigation.title);
                    setHypothesis(selectedInvestigation.hypothesis);
                  }}
                >
                  Load text
                </Button>
                <Button
                  onClick={() => setSelectedSpanId(selectedInvestigation.pinnedSpanIds[0] ?? "")}
                  disabled={selectedInvestigation.pinnedSpanIds.length === 0}
                >
                  Use first pin
                </Button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="ui-inline" style={{ marginTop: 12 }}>
          <Button onClick={() => void saveInvestigation()} disabled={!payload?.tracePhysics?.evidence.evidenceHash}>
            Save investigation
          </Button>
          {investigationMessage ? <span className="subtle">{investigationMessage}</span> : null}
        </div>
        <div className="record-table" style={{ marginTop: 14 }}>
          {visibleInvestigations.map((investigation) => (
            <div key={investigation.id} className="record-row">
              <span>{investigation.title}</span>
              <Badge tone={investigation.status === "resolved" ? "success" : investigation.status === "rejected" ? "danger" : "warning"}>
                {investigation.status}
              </Badge>
              <span className="subtle">{investigation.hypothesis}</span>
              <span className="mono subtle">{investigation.evidenceHash.slice(0, 12)}</span>
              <span className="mono subtle">{investigation.pinnedSpanIds.join(", ") || "no pins"}</span>
              <span className="ui-inline">
                <Button
                  aria-label={`Select investigation ${investigation.title}`}
                  variant={selectedInvestigation?.id === investigation.id ? "primary" : "ghost"}
                  onClick={() => setSelectedInvestigationId(investigation.id)}
                >
                  Select
                </Button>
                <Button
                  aria-label={`Resolve ${investigation.title}`}
                  onClick={() => void updateInvestigationStatus(investigation.id, "resolved")}
                >
                  Resolve
                </Button>
                <Button
                  aria-label={`Reject ${investigation.title}`}
                  onClick={() => void updateInvestigationStatus(investigation.id, "rejected")}
                >
                  Reject
                </Button>
                {investigation.status !== "open" ? (
                  <Button
                    aria-label={`Reopen ${investigation.title}`}
                    onClick={() => void updateInvestigationStatus(investigation.id, "open")}
                  >
                    Reopen
                  </Button>
                ) : null}
              </span>
            </div>
          ))}
          {visibleInvestigations.length === 0 ? (
            <div className="empty-table">
              {investigations.length === 0 ? "No saved investigations yet." : "No investigations match this saved view."}
            </div>
          ) : null}
        </div>
        <div className="panel-inset" style={{ marginTop: 14 }}>
          <div className="panel-header">
            <div>
              <p className="eyebrow">Span Annotation</p>
              <h3 style={{ margin: 0 }}>Reviewer note</h3>
            </div>
            <Badge>{selectedSpanId || "no span"}</Badge>
          </div>
          <div className="ui-grid ui-grid-cols-2">
            <Field label="Note">
              <Input value={annotationNote} onChange={(event) => setAnnotationNote(event.target.value)} />
            </Field>
            <Field label="Tags">
              <Input value={annotationTags} onChange={(event) => setAnnotationTags(event.target.value)} />
            </Field>
          </div>
          <div className="ui-inline" style={{ marginTop: 12 }}>
            <Button onClick={() => void saveSpanAnnotation()} disabled={!selectedSpanId}>
              Save span annotation
            </Button>
            {annotationMessage ? <span className="subtle">{annotationMessage}</span> : null}
          </div>
        </div>
        <div className="record-table" style={{ marginTop: 14 }}>
          <div className="record-row">
            <span>Annotation filter</span>
            <span className="subtle">{annotationFilter === "selected" ? selectedSpanId || "no selected span" : "all spans"}</span>
            <span className="mono subtle">{visibleAnnotations.length} visible</span>
            <span className="ui-inline">
              <Button onClick={() => setAnnotationFilter("all")}>All notes</Button>
              <Button onClick={() => setAnnotationFilter("selected")} disabled={!selectedSpanId}>
                Selected span
              </Button>
            </span>
          </div>
          {visibleAnnotations.map((annotation) => (
            <div key={annotation.id} className="record-row">
              <span className="mono">{annotation.spanId}</span>
              <span>{annotation.note}</span>
              <span className="mono subtle">{annotation.tags.join(", ") || "no tags"}</span>
              <span className="mono subtle">{annotation.investigationId?.slice(0, 18) ?? "no investigation"}</span>
              <span className="subtle">{new Date(annotation.updatedAt).toLocaleString()}</span>
            </div>
          ))}
          {visibleAnnotations.length === 0 ? (
            <div className="empty-table">No span annotations yet.</div>
          ) : null}
        </div>
      </Card>
    </Page>
  );
}
