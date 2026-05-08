"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { JsonDiffView } from "@/components/JsonDiffView";
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Page,
  Select,
  TabButton,
  Tabs,
} from "@/components/ui";

interface RunSummary {
  id: string;
  source: string;
  status: "success" | "fail" | "unknown";
}

interface ComparePreset {
  id: string;
  name: string;
  parentRunId: string;
  branchRunId: string;
}

interface ComparePayload {
  compare: {
    divergence: {
      firstDivergenceEventId: string | null;
      firstDivergenceIndex: number;
    };
    changes: Array<{
      eventId: string;
      kind: "added" | "removed" | "modified";
      before?: unknown;
      after?: unknown;
    }>;
    stats: {
      added: number;
      removed: number;
      modified: number;
    };
    deltas: {
      costUsd: number;
      policyViolations: number;
      toolErrorRate: number;
      outcome: {
        from: "success" | "fail" | "unknown";
        to: "success" | "fail" | "unknown";
      };
    };
  };
  blame: Array<{
    eventId: string;
    type: string;
    rationale: string;
    confidence: number;
  }>;
  tracePhysics?: {
    firstDivergenceSpanId: string | null;
    firstDivergenceSequence: number;
    heatmap: Record<string, number>;
    diagnostics: Array<{ code: string; spanId: string; severity: string; message: string }>;
    candidates: Array<{ spanId: string; eventKind: string; confidence: number; rationale: string }>;
    parent: {
      evidence: { evidenceHash: string; eventCount: number; roots: string[] };
    };
    branch: {
      evidence: { evidenceHash: string; eventCount: number; roots: string[] };
    };
  } | null;
}

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <Page>
          <Card>Loading compare view…</Card>
        </Page>
      }
    >
      <ComparePageContent />
    </Suspense>
  );
}

function ComparePageContent() {
  const search = useSearchParams();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [parent, setParent] = useState(search.get("parent") ?? "");
  const [branch, setBranch] = useState(search.get("branch") ?? "");
  const [result, setResult] = useState<ComparePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<ComparePreset[]>([]);
  const [filterKinds, setFilterKinds] = useState<Array<"added" | "removed" | "modified">>([
    "added",
    "removed",
    "modified",
  ]);
  const [viewMode, setViewMode] = useState<"semantic" | "side-by-side">("semantic");
  const [eventJump, setEventJump] = useState("");

  useEffect(() => {
    Promise.all([fetch("/api/runs?limit=200"), fetch("/api/settings")])
      .then(async ([runsRes, settingsRes]) => ({
        runsPayload: (await runsRes.json()) as { runs: RunSummary[] },
        settingsPayload: (await settingsRes.json()) as {
          settings?: { savedComparePresets?: ComparePreset[] };
        },
      }))
      .then(({ runsPayload, settingsPayload }) => {
        setRuns(runsPayload.runs);
        setPresets(settingsPayload.settings?.savedComparePresets ?? []);
      })
      .catch(() => setRuns([]));
  }, []);

  const changedEvents = useMemo(
    () =>
      (result?.compare.changes ?? []).filter((change) =>
        filterKinds.includes(change.kind),
      ),
    [result, filterKinds],
  );

  async function runCompare(): Promise<void> {
    setError(null);
    const response = await fetch("/api/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentRunId: parent, branchRunId: branch }),
    });

    const payload = (await response.json()) as ComparePayload & { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "Compare failed");
      return;
    }

    setResult(payload);
  }

  async function savePreset(): Promise<void> {
    if (!parent || !branch) {
      return;
    }
    const name = window.prompt("Preset name");
    if (!name) {
      return;
    }

    const next = [
      ...presets,
      {
        id: `compare_${Date.now()}`,
        name,
        parentRunId: parent,
        branchRunId: branch,
      },
    ];
    setPresets(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          savedComparePresets: next,
        },
      }),
    });
  }

  return (
    <Page aria-label="Compare view">
      <Card>
        <div className="ui-section-header">
          <div>
            <p className="eyebrow">Compare</p>
            <h1>First divergence and semantic branch diff</h1>
          </div>
          <Badge>fingerprint aware</Badge>
        </div>
        <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <Field label="Original">
            <Select value={parent} onChange={(event) => setParent(event.target.value)}>
              <option value="">Select run</option>
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.id} · {run.status}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Branch">
            <Select value={branch} onChange={(event) => setBranch(event.target.value)}>
              <option value="">Select run</option>
              {runs.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.id} · {run.status}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Preset">
            <Select
              defaultValue=""
              onChange={(event) => {
                const preset = presets.find((item) => item.id === event.target.value);
                if (!preset) {
                  return;
                }
                setParent(preset.parentRunId);
                setBranch(preset.branchRunId);
              }}
            >
              <option value="">Select preset</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Jump to event">
            <Input
              value={eventJump}
              onChange={(event) => setEventJump(event.target.value)}
              placeholder="e0004"
            />
          </Field>
        </div>
        <div className="ui-inline" style={{ marginTop: 12 }}>
          <Button onClick={() => void runCompare()} disabled={!parent || !branch}>
            Compare
          </Button>
          <Button variant="ghost" onClick={() => void savePreset()} disabled={!parent || !branch}>
            Save preset
          </Button>
        </div>
      </Card>

      {error ? (
        <Card style={{ color: "var(--danger)" }}>{error}</Card>
      ) : null}

      {result ? (
        <>
          <Card>
            <div className="ui-kpi-grid">
              <Metric
                label="Outcome delta"
                value={`${result.compare.deltas.outcome.from} -> ${result.compare.deltas.outcome.to}`}
              />
              <Metric label="Cost delta" value={`$${result.compare.deltas.costUsd.toFixed(4)}`} />
              <Metric label="Policy delta" value={String(result.compare.deltas.policyViolations)} />
              <Metric
                label="Tool error delta"
                value={String(result.compare.deltas.toolErrorRate)}
              />
              <Metric
                label="First divergence"
                value={result.compare.divergence.firstDivergenceEventId ?? "none"}
              />
            </div>
            <p className="subtle" style={{ marginTop: 12 }}>
              Divergence narrative: parent and branch first diverge at
              {" "}
              <code className="mono">{result.compare.divergence.firstDivergenceEventId ?? "n/a"}</code>.
              This is the earliest change likely responsible for downstream outcome differences.
            </p>
          </Card>

          <Card>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Trace Physics</p>
                <h2 style={{ margin: 0 }}>Canonical evidence summary</h2>
              </div>
              <Badge tone={(result.tracePhysics?.diagnostics.length ?? 0) > 0 ? "warning" : "success"}>
                {(result.tracePhysics?.diagnostics.length ?? 0) > 0 ? "diagnostics" : "clean"}
              </Badge>
            </div>
            <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
              <Metric
                label="Parent evidence"
                value={result.tracePhysics?.parent.evidence.evidenceHash.slice(0, 12) ?? "same"}
              />
              <Metric
                label="Branch evidence"
                value={result.tracePhysics?.branch.evidence.evidenceHash.slice(0, 12) ?? "same"}
              />
              <Metric
                label="Physics divergence"
                value={result.tracePhysics?.firstDivergenceSpanId ?? "none"}
              />
              <Metric
                label="Kernel diagnostics"
                value={String(result.tracePhysics?.diagnostics.length ?? 0)}
              />
            </div>
            <div className="ui-stack" style={{ marginTop: 12 }}>
              {(result.tracePhysics?.candidates ?? []).slice(0, 3).map((candidate) => (
                <div key={candidate.spanId} className="panel-inset">
                  <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                    <span className="mono">{candidate.spanId}</span>
                    <span className="mono">{Math.round(candidate.confidence * 100)}%</span>
                  </div>
                  <p className="subtle" style={{ margin: "6px 0 0" }}>{candidate.rationale}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Timeline Minimap</p>
                <h2 style={{ margin: 0 }}>Divergence map</h2>
              </div>
            </div>
            <div style={{ position: "relative", border: "1px solid var(--line)", borderRadius: 10, height: 28 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  background: "linear-gradient(90deg, #1f2937, #374151)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: "var(--accent)",
                  left: `${Math.max(0, Math.min(100, result.compare.divergence.firstDivergenceIndex + 1))}%`,
                }}
              />
              {result.compare.changes.slice(0, 120).map((change, index, all) => (
                <button
                  key={`${change.eventId}_${index}`}
                  aria-label={`Jump to ${change.eventId}`}
                  onClick={() => setEventJump(change.eventId)}
                  style={{
                    position: "absolute",
                    top: 2,
                    bottom: 2,
                    width: 3,
                    border: "none",
                    borderRadius: 4,
                    background:
                      change.kind === "added"
                        ? "var(--success)"
                        : change.kind === "removed"
                          ? "var(--danger)"
                          : "var(--warning)",
                    left: `${(index / Math.max(1, all.length - 1)) * 100}%`,
                    cursor: "pointer",
                  }}
                />
              ))}
            </div>
          </Card>

          <Card>
            <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
              <div>
                <p className="eyebrow">Event Diff</p>
                <h2 style={{ margin: 0 }}>Changed events</h2>
              </div>
              <Tabs>
                <TabButton active={viewMode === "semantic"} onClick={() => setViewMode("semantic")}>Semantic</TabButton>
                <TabButton active={viewMode === "side-by-side"} onClick={() => setViewMode("side-by-side")}>Side-by-side</TabButton>
              </Tabs>
            </div>
            <div className="subtle mono" style={{ marginBottom: 10 }}>
              added={result.compare.stats.added} removed={result.compare.stats.removed} modified={result.compare.stats.modified}
            </div>
            <div className="ui-chip-list" style={{ marginBottom: 12 }}>
              {(["added", "removed", "modified"] as const).map((kind) => {
                const active = filterKinds.includes(kind);
                return (
                  <button
                    key={kind}
                    className="ui-chip"
                    aria-pressed={active}
                    onClick={() => {
                      setFilterKinds((previous) => {
                        if (previous.includes(kind)) {
                          const next = previous.filter((item) => item !== kind);
                          return next.length === 0 ? previous : next;
                        }
                        return [...previous, kind];
                      });
                    }}
                  >
                    {kind}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {changedEvents.slice(0, 120).map((change) => {
                const focus = eventJump.trim() && change.eventId.includes(eventJump.trim());
                return (
                  <div
                    key={`${change.eventId}-${change.kind}`}
                    className="ui-card"
                    style={{
                      margin: 0,
                      borderColor: focus ? "var(--accent)" : undefined,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong>{change.kind}</strong>
                      <span className="mono">{change.eventId}</span>
                    </div>
                    {viewMode === "semantic" ? (
                      <JsonDiffView before={semanticEvent(change.before)} after={semanticEvent(change.after)} />
                    ) : (
                      <div className="ui-grid ui-grid-cols-2">
                        <div>
                          <div className="subtle mono">Before</div>
                          <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                            {JSON.stringify(change.before, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <div className="subtle mono">After</div>
                          <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                            {JSON.stringify(change.after, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="panel-header">
              <div>
                <p className="eyebrow">Confidence</p>
                <h2 style={{ margin: 0 }}>Blame suggestions</h2>
              </div>
            </div>
            <div className="ui-grid" style={{ gap: 10 }}>
              {result.blame.map((candidate) => (
                <div key={candidate.eventId} className="ui-card ui-card-plain" style={{ margin: 0 }}>
                  <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                    <code className="mono">{candidate.eventId}</code>
                    <span className="mono">{candidate.type}</span>
                  </div>
                  <div className="subtle" style={{ marginTop: 4 }}>{candidate.rationale}</div>
                  <div style={{ marginTop: 8 }}>
                    <div className="subtle mono">confidence {candidate.confidence.toFixed(2)}</div>
                    <div style={{ height: 8, border: "1px solid var(--line)", borderRadius: 999, marginTop: 4 }}>
                      <div
                        style={{
                          width: `${Math.max(0, Math.min(100, candidate.confidence * 100))}%`,
                          height: "100%",
                          background: "var(--accent)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : null}
    </Page>
  );
}

function semanticEvent(event: unknown): unknown {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return event;
  }
  const semantic = { ...(event as Record<string, unknown>) };
  delete semantic.run_id;
  return semantic;
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="ui-kpi">
      <div className="ui-kpi-label mono">{label}</div>
      <div className="ui-kpi-value">{value}</div>
    </div>
  );
}
