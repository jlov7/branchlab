"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { VirtualList } from "@/components/VirtualList";
import { JsonDiffView } from "@/components/JsonDiffView";
import {
  Badge,
  Button,
  Card,
  Field,
  Inline,
  Input,
  Page,
  Select,
  SplitPane,
  TabButton,
  Tabs,
  Textarea,
} from "@/components/ui";

interface RunSummary {
  id: string;
  createdAt: string;
  source: string;
  mode: "replay" | "reexec";
  status: "success" | "fail" | "unknown";
  durationMs: number;
  costUsd: number;
  tools: string[];
  tags: string[];
  partialParse: boolean;
}

interface EventItem {
  schema: "branchlab.trace.v1";
  run_id: string;
  event_id: string;
  ts: string;
  type:
    | "run.start"
    | "run.end"
    | "llm.request"
    | "llm.response"
    | "tool.request"
    | "tool.response"
    | "memory.read"
    | "memory.write"
    | "policy.decision"
    | "error"
    | "note";
  parent_event_id?: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface RunAnnotation {
  runId: string;
  tags: string[];
  note: string;
  updatedAt: string;
}

type Tab = "rendered" | "raw" | "diff";

type TimelineRow =
  | { kind: "phase"; phase: string; count: number }
  | { kind: "event"; event: EventItem; index: number };

export function RunReportClient({ runId }: { runId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [run, setRun] = useState<RunSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("rendered");
  const [showFork, setShowFork] = useState(false);
  const [branchRunId, setBranchRunId] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<string[]>([]);
  const [forkError, setForkError] = useState<string | null>(null);
  const [annotation, setAnnotation] = useState<RunAnnotation | null>(null);
  const [annotationDraft, setAnnotationDraft] = useState<{ tagsText: string; note: string }>({
    tagsText: "",
    note: "",
  });
  const [annotationMessage, setAnnotationMessage] = useState<string | null>(null);
  const [runNav, setRunNav] = useState<{ prevId: string | null; nextId: string | null }>({
    prevId: null,
    nextId: null,
  });

  const load = useCallback(async (): Promise<void> => {
    const [runRes, eventsRes, annotationRes] = await Promise.all([
      fetch(`/api/runs/${runId}`),
      fetch(`/api/runs/${runId}/events?limit=100000`),
      fetch(`/api/runs/${runId}/annotations`),
    ]);

    const runPayload = (await runRes.json()) as { run: RunSummary };
    const eventsPayload = (await eventsRes.json()) as { events: EventItem[] };
    const annotationPayload = (await annotationRes.json()) as {
      annotation: RunAnnotation;
    };

    setRun(runPayload.run);
    setEvents(eventsPayload.events);
    setSelectedEventId(eventsPayload.events[0]?.event_id ?? null);
    setAnnotation(annotationPayload.annotation);
    setAnnotationDraft({
      tagsText: annotationPayload.annotation.tags.join(", "),
      note: annotationPayload.annotation.note,
    });
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    fetch("/api/runs?limit=500")
      .then((response) => response.json())
      .then((payload: { runs?: Array<{ id: string }> }) => {
        const ids = (payload.runs ?? []).map((run) => run.id);
        const index = ids.indexOf(runId);
        if (index < 0) {
          setRunNav({ prevId: null, nextId: null });
          return;
        }
        setRunNav({
          prevId: ids[index + 1] ?? null,
          nextId: ids[index - 1] ?? null,
        });
      })
      .catch(() => setRunNav({ prevId: null, nextId: null }));
  }, [runId]);

  const filtered = useMemo(() => {
    if (!search.trim()) {
      return events;
    }

    const needle = search.toLowerCase();
    return events.filter((event) => {
      return (
        event.type.toLowerCase().includes(needle) ||
        event.event_id.toLowerCase().includes(needle) ||
        JSON.stringify(event.data).toLowerCase().includes(needle)
      );
    });
  }, [events, search]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (search.trim()) {
      params.set("q", search.trim());
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [search, pathname, router]);

  useEffect(() => {
    if (selectedEventId && filtered.some((event) => event.event_id === selectedEventId)) {
      return;
    }
    setSelectedEventId(filtered[0]?.event_id ?? null);
  }, [filtered, selectedEventId]);

  const selectedIndex = useMemo(
    () => filtered.findIndex((event) => event.event_id === selectedEventId),
    [filtered, selectedEventId],
  );
  const selected = selectedIndex >= 0 ? filtered[selectedIndex] : undefined;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "j" || event.key === "J") {
        const next = Math.min(selectedIndex + 1, Math.max(filtered.length - 1, 0));
        setSelectedEventId(filtered[next]?.event_id ?? null);
      }
      if (event.key === "k" || event.key === "K") {
        const previous = Math.max(selectedIndex - 1, 0);
        setSelectedEventId(filtered[previous]?.event_id ?? null);
      }
      if (event.key === "Enter") {
        setTab((previous) => (previous === "rendered" ? "raw" : "rendered"));
      }
      if (event.key === "f" || event.key === "F") {
        setShowFork(true);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtered, selectedIndex]);

  const policyCounts = useMemo(() => {
    const decisions = events.filter((event) => event.type === "policy.decision");
    return {
      total: decisions.length,
      deny: decisions.filter((event) => event.data.decision === "deny").length,
      hold: decisions.filter((event) => event.data.decision === "hold").length,
    };
  }, [events]);

  const relatedEventIds = useMemo(() => {
    if (!selected) {
      return new Set<string>();
    }
    const callId = typeof selected.data.call_id === "string" ? selected.data.call_id : null;
    if (!callId) {
      return new Set<string>();
    }
    const ids = filtered
      .filter((event) => event.data.call_id === callId)
      .map((event) => event.event_id);
    return new Set(ids);
  }, [filtered, selected]);

  const timelineRows = useMemo(() => {
    const grouped = new Map<string, Array<{ event: EventItem; index: number }>>();
    filtered.forEach((event, index) => {
      const phase = phaseForType(event.type);
      const rows = grouped.get(phase) ?? [];
      rows.push({ event, index });
      grouped.set(phase, rows);
    });

    const order = ["Plan", "Act", "Observe", "Summarize"];
    const rows: TimelineRow[] = [];
    for (const phase of order) {
      const items = grouped.get(phase);
      if (!items || items.length === 0) {
        continue;
      }
      rows.push({ kind: "phase", phase, count: items.length });
      for (const item of items) {
        rows.push({ kind: "event", event: item.event, index: item.index });
      }
    }
    return rows;
  }, [filtered]);

  const pairedDiff = useMemo(() => {
    if (!selected) {
      return null;
    }
    const callId = typeof selected.data.call_id === "string" ? selected.data.call_id : null;
    if (!callId) {
      return null;
    }

    const find = (type: EventItem["type"]) =>
      filtered.find((event) => event.type === type && event.data.call_id === callId);

    if (selected.type === "tool.request" || selected.type === "tool.response") {
      return {
        before: find("tool.request")?.data,
        after: find("tool.response")?.data,
      };
    }

    if (selected.type === "llm.request" || selected.type === "llm.response") {
      return {
        before: find("llm.request")?.data,
        after: find("llm.response")?.data,
      };
    }

    return null;
  }, [filtered, selected]);

  async function createFork(payload: {
    mode: "replay" | "reexec";
    allowLiveTools?: boolean;
    liveToolAllowlist?: string[];
    intervention:
      | { kind: "prompt_edit"; newPrompt: string }
      | { kind: "tool_output_override"; callId: string; result: Record<string, unknown> }
      | { kind: "policy_override"; callId: string; decision: "allow" | "deny" | "hold"; reason?: string }
      | { kind: "memory_removal"; memoryId: string };
    providerId?: string;
  }): Promise<void> {
    setForkError(null);
    setProgress(["Validating fork payload"]);

    const step = (message: string) =>
      new Promise<void>((resolve) => {
        setTimeout(() => {
          setProgress((previous) => [...previous, message]);
          resolve();
        }, 120);
      });

    try {
      await step("Applying intervention overlay");
      await step("Persisting branch run");

      const response = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentRunId: runId,
          forkEventId: selected?.event_id ?? events[0]?.event_id,
          mode: payload.mode,
          intervention: payload.intervention,
          providerId: payload.providerId,
          allowLiveTools: payload.allowLiveTools ?? false,
          liveToolAllowlist: payload.liveToolAllowlist,
        }),
      });

      const result = (await response.json()) as { branchRunId?: string; error?: string };
      if (!response.ok || !result.branchRunId) {
        throw new Error(result.error ?? "Branch creation failed");
      }

      await step("Branch ready");
      setBranchRunId(result.branchRunId);
      setShowFork(false);
    } catch (error) {
      setForkError(error instanceof Error ? error.message : String(error));
    }
  }

  async function exportCurrent(redacted: boolean): Promise<void> {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runId,
        branchRunId: branchRunId ?? undefined,
        redacted,
      }),
    });
    const payload = (await response.json()) as { bundle?: { id: string }; error?: string };
    if (!response.ok || !payload.bundle) {
      setExportMessage(payload.error ?? "Export failed");
      return;
    }
    setExportMessage(`Export created: ${payload.bundle.id}`);
  }

  async function saveAnnotation(): Promise<void> {
    const response = await fetch(`/api/runs/${runId}/annotations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tags: annotationDraft.tagsText
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
        note: annotationDraft.note,
      }),
    });

    const payload = (await response.json()) as { annotation?: RunAnnotation; error?: string };
    if (!response.ok || !payload.annotation) {
      setAnnotationMessage(payload.error ?? "Failed to save annotation");
      return;
    }

    setAnnotation(payload.annotation);
    setAnnotationMessage("Annotation saved");
  }

  return (
    <Page aria-label="Run report">
      {!run ? (
        <Card>Loading run…</Card>
      ) : (
        <>
          <Card>
            <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
              <Inline>
                <StatusBadge status={run.status} />
                <Badge tone={run.mode === "replay" ? "success" : "warning"}>
                  {run.mode === "replay" ? "Replay: deterministic" : "Re-exec: model reruns"}
                </Badge>
                {run.partialParse ? <Badge tone="warning">Partial parse</Badge> : null}
              </Inline>
              <Inline>
                {runNav.prevId ? (
                  <Link className="ui-button" href={`/runs/${runNav.prevId}`}>
                    Previous run
                  </Link>
                ) : null}
                {runNav.nextId ? (
                  <Link className="ui-button" href={`/runs/${runNav.nextId}`}>
                    Next run
                  </Link>
                ) : null}
                <Input
                  data-testid="run-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search in run"
                  style={{ width: 260 }}
                />
                <Button data-testid="fork-button" onClick={() => setShowFork(true)}>
                  Fork from selected (F)
                </Button>
                {branchRunId ? (
                  <Link data-testid="compare-link" className="ui-button" href={`/compare?parent=${run.id}&branch=${branchRunId}`}>
                    Compare
                  </Link>
                ) : null}
                <Button data-testid="export-redacted-button" onClick={() => void exportCurrent(true)}>
                  Export (redacted)
                </Button>
                <Button
                  data-testid="export-unredacted-button"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm("Export without redaction warning banner?")) {
                      void exportCurrent(false);
                    }
                  }}
                >
                  Export (unredacted)
                </Button>
              </Inline>
            </div>
            <div className="ui-kpi-grid" style={{ marginTop: 12 }}>
              <div className="ui-kpi">
                <div className="ui-kpi-label">Duration</div>
                <div className="ui-kpi-value mono">{run.durationMs} ms</div>
              </div>
              <div className="ui-kpi">
                <div className="ui-kpi-label">Cost</div>
                <div className="ui-kpi-value mono">${run.costUsd.toFixed(4)}</div>
              </div>
              <div className="ui-kpi">
                <div className="ui-kpi-label">Tools</div>
                <div className="ui-kpi-value mono">{run.tools.length}</div>
              </div>
              <div className="ui-kpi">
                <div className="ui-kpi-label">Policy decisions</div>
                <div className="ui-kpi-value mono">{policyCounts.total}</div>
              </div>
              <div className="ui-kpi">
                <div className="ui-kpi-label">Policy deny/hold</div>
                <div className="ui-kpi-value mono">{policyCounts.deny}/{policyCounts.hold}</div>
              </div>
            </div>
            {run.tags.length > 0 ? (
              <div className="ui-chip-list" style={{ marginTop: 12 }}>
                {run.tags.map((tag) => (
                  <span key={tag} className="ui-chip">{tag}</span>
                ))}
              </div>
            ) : null}
          </Card>

          {branchRunId ? (
            <Card>
              <div className="ui-inline" style={{ justifyContent: "space-between", width: "100%" }}>
                <div>
                  <strong>Branch created:</strong> <span className="mono">{branchRunId}</span>
                </div>
                <Inline>
                  <Link className="ui-button" href={`/runs/${branchRunId}`}>Open branch run</Link>
                  <Link className="ui-button" href={`/compare?parent=${run.id}&branch=${branchRunId}`}>Compare now</Link>
                </Inline>
              </div>
            </Card>
          ) : null}

          {exportMessage ? <Card className="mono">{exportMessage}</Card> : null}

          <Card className="ui-stack">
            <h2 style={{ margin: 0 }}>Analyst annotation</h2>
            <div className="ui-grid ui-grid-cols-2">
              <Field label="Tags (comma-separated)">
                <Input
                  value={annotationDraft.tagsText}
                  onChange={(event) =>
                    setAnnotationDraft((previous) => ({
                      ...previous,
                      tagsText: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Updated">
                <Input disabled value={annotation ? new Date(annotation.updatedAt).toLocaleString() : "n/a"} />
              </Field>
            </div>
            <Field label="Note">
              <Textarea
                value={annotationDraft.note}
                onChange={(event) =>
                  setAnnotationDraft((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
                rows={3}
              />
            </Field>
            <Inline>
              <Button onClick={() => void saveAnnotation()}>Save annotation</Button>
              {annotationMessage ? <span className="subtle">{annotationMessage}</span> : null}
            </Inline>
          </Card>

          <SplitPane leftMin={540} rightWidth={380}>
            <Card>
              <h2 style={{ marginTop: 0 }}>Timeline</h2>
              <VirtualList
                items={timelineRows}
                estimateSize={54}
                height={580}
                render={(row) => {
                  if (row.kind === "phase") {
                    return (
                      <div className="mono subtle" style={{ padding: "10px 8px", background: "rgba(255,255,255,0.04)", borderBottom: "1px solid var(--line)" }}>
                        {row.phase} ({row.count})
                      </div>
                    );
                  }

                  const event = row.event;
                  const selectedActive = event.event_id === selected?.event_id;
                  const related = relatedEventIds.has(event.event_id) && !selectedActive;

                  return (
                    <button
                      data-testid={`timeline-event-${event.event_id}`}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        borderBottom: "1px solid var(--line)",
                        borderRadius: 0,
                        padding: "10px 8px",
                        background: selectedActive
                          ? "rgba(65,212,194,0.16)"
                          : related
                            ? "rgba(125,200,255,0.14)"
                            : "transparent",
                      }}
                      onClick={() => setSelectedEventId(event.event_id)}
                      aria-label={`Select ${event.type} ${event.event_id}`}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <strong>{event.type}</strong>
                        <span className="mono subtle">{new Date(event.ts).toLocaleTimeString()}</span>
                      </div>
                      <div className="mono subtle">{event.event_id}</div>
                    </button>
                  );
                }}
              />
            </Card>

            <Card>
              <Tabs>
                <TabButton onClick={() => setTab("rendered")} active={tab === "rendered"}>
                  Rendered
                </TabButton>
                <TabButton onClick={() => setTab("raw")} active={tab === "raw"}>
                  Raw JSON
                </TabButton>
                <TabButton onClick={() => setTab("diff")} active={tab === "diff"}>
                  Diff
                </TabButton>
              </Tabs>

              {!selected ? (
                <p className="subtle">No selected event.</p>
              ) : tab === "rendered" ? (
                <div className="ui-stack" style={{ marginTop: 10 }}>
                  <p style={{ margin: 0 }}>
                    <strong>{selected.type}</strong>
                  </p>
                  <p className="mono subtle" style={{ margin: 0 }}>
                    {selected.event_id}
                  </p>
                  <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                    {JSON.stringify(selected.data, null, 2)}
                  </pre>
                  <Inline>
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(selected, null, 2)).catch(() => undefined);
                      }}
                    >
                      Copy JSON
                    </Button>
                    {selected.type === "tool.request" ? (
                      <Button
                        onClick={() => {
                          const tool = selected.data.tool;
                          const args = selected.data.args;
                          const curl = `curl -X POST http://localhost:3000/tools/${String(tool)} -d '${JSON.stringify(args)}'`;
                          navigator.clipboard.writeText(curl).catch(() => undefined);
                        }}
                      >
                        Copy as cURL
                      </Button>
                    ) : null}
                  </Inline>
                </div>
              ) : tab === "raw" ? (
                <pre className="mono" style={{ whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(selected, null, 2)}
                </pre>
              ) : pairedDiff ? (
                <div style={{ marginTop: 10 }}>
                  <JsonDiffView before={pairedDiff.before} after={pairedDiff.after} />
                </div>
              ) : (
                <p className="subtle" style={{ marginTop: 10 }}>
                  No request/response pair available for semantic diff.
                </p>
              )}
            </Card>
          </SplitPane>
        </>
      )}

      {showFork && selected ? (
        <ForkModal
          selected={selected}
          progress={progress}
          error={forkError}
          onClose={() => setShowFork(false)}
          onSubmit={createFork}
        />
      ) : null}
    </Page>
  );
}

function phaseForType(type: EventItem["type"]): string {
  if (type === "run.start" || type === "llm.request") {
    return "Plan";
  }
  if (type === "tool.request" || type === "tool.response") {
    return "Act";
  }
  if (type === "memory.read" || type === "memory.write" || type === "policy.decision") {
    return "Observe";
  }
  return "Summarize";
}

function ForkModal({
  selected,
  progress,
  error,
  onClose,
  onSubmit,
}: {
  selected: EventItem;
  progress: string[];
  error: string | null;
  onClose: () => void;
  onSubmit: (payload: {
    mode: "replay" | "reexec";
    allowLiveTools?: boolean;
    liveToolAllowlist?: string[];
    intervention:
      | { kind: "prompt_edit"; newPrompt: string }
      | { kind: "tool_output_override"; callId: string; result: Record<string, unknown> }
      | { kind: "policy_override"; callId: string; decision: "allow" | "deny" | "hold"; reason?: string }
      | { kind: "memory_removal"; memoryId: string };
    providerId?: string;
  }) => Promise<void>;
}) {
  const [mode, setMode] = useState<"replay" | "reexec">("replay");
  const [kind, setKind] = useState<"prompt_edit" | "tool_output_override" | "policy_override" | "memory_removal">(
    "tool_output_override",
  );
  const [prompt, setPrompt] = useState("Rewrite the task intent with clearer constraints.");
  const [callId, setCallId] = useState(String(selected.data.call_id ?? ""));
  const [result, setResult] = useState('{"product":"ACME Widget","price":100.0,"currency":"USD","as_of":"2026-02-27"}');
  const [decision, setDecision] = useState<"allow" | "deny" | "hold">("deny");
  const [memoryId, setMemoryId] = useState("mem_pref_tone");
  const [providerId, setProviderId] = useState("provider_openai");
  const [allowLiveTools, setAllowLiveTools] = useState(false);
  const [liveToolAllowlistText, setLiveToolAllowlistText] = useState("");
  const [templates, setTemplates] = useState<
    Array<{
      id: string;
      name: string;
      payload: {
        mode: "replay" | "reexec";
        kind: "prompt_edit" | "tool_output_override" | "policy_override" | "memory_removal";
        prompt: string;
        callId: string;
        result: string;
        decision: "allow" | "deny" | "hold";
        memoryId: string;
        providerId: string;
        allowLiveTools: boolean;
        liveToolAllowlistText: string;
      };
    }>
  >([]);

  useEffect(() => {
    const raw = window.localStorage.getItem("branchTemplates");
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as typeof templates;
      if (Array.isArray(parsed)) {
        setTemplates(parsed);
      }
    } catch {
      // ignore malformed local state
    }
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function saveTemplate(): void {
    const name = window.prompt("Template name");
    if (!name) {
      return;
    }
    const next = [
      ...templates,
      {
        id: `template_${Date.now()}`,
        name,
        payload: {
          mode,
          kind,
          prompt,
          callId,
          result,
          decision,
          memoryId,
          providerId,
          allowLiveTools,
          liveToolAllowlistText,
        },
      },
    ];
    setTemplates(next);
    window.localStorage.setItem("branchTemplates", JSON.stringify(next));
  }

  return (
    <div
      data-testid="fork-modal"
      className="dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Fork modal"
    >
      <div className="ui-card dialog-panel">
        <h2 style={{ marginTop: 0 }}>Fork from {selected.event_id}</h2>
        <p className="subtle mono">{selected.type}</p>

        <div className="ui-grid" style={{ gap: 10 }}>
          <Field label="Intervention type">
            <Select
              data-testid="fork-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as typeof kind)}
            >
              <option value="prompt_edit">Prompt edit</option>
              <option value="tool_output_override">Tool output override</option>
              <option value="policy_override">Policy override</option>
              <option value="memory_removal">Remove memory</option>
            </Select>
          </Field>

          {kind === "prompt_edit" ? (
            <Field label="Prompt">
              <Textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} />
            </Field>
          ) : null}

          {kind === "tool_output_override" ? (
            <>
              <Field label="Call ID">
                <Input value={callId} onChange={(event) => setCallId(event.target.value)} />
              </Field>
              <Field label="Result JSON">
                <Textarea
                  data-testid="fork-result-json"
                  value={result}
                  onChange={(event) => setResult(event.target.value)}
                  rows={6}
                />
              </Field>
            </>
          ) : null}

          {kind === "policy_override" ? (
            <>
              <Field label="Call ID">
                <Input value={callId} onChange={(event) => setCallId(event.target.value)} />
              </Field>
              <Field label="Decision">
                <Select value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
                  <option value="allow">allow</option>
                  <option value="deny">deny</option>
                  <option value="hold">hold</option>
                </Select>
              </Field>
            </>
          ) : null}

          {kind === "memory_removal" ? (
            <Field label="Memory ID">
              <Input value={memoryId} onChange={(event) => setMemoryId(event.target.value)} />
            </Field>
          ) : null}

          <Field label="Branch mode">
            <Select value={mode} onChange={(event) => setMode(event.target.value as "replay" | "reexec")}>
              <option value="replay">Replay-only</option>
              <option value="reexec">Re-execution</option>
            </Select>
          </Field>

          <div className="ui-grid" style={{ gap: 8, gridTemplateColumns: "1fr auto auto" }}>
            <Select
              aria-label="Apply branch template"
              defaultValue=""
              onChange={(event) => {
                const template = templates.find((item) => item.id === event.target.value);
                if (!template) {
                  return;
                }
                setMode(template.payload.mode);
                setKind(template.payload.kind);
                setPrompt(template.payload.prompt);
                setCallId(template.payload.callId);
                setResult(template.payload.result);
                setDecision(template.payload.decision);
                setMemoryId(template.payload.memoryId);
                setProviderId(template.payload.providerId);
                setAllowLiveTools(template.payload.allowLiveTools);
                setLiveToolAllowlistText(template.payload.liveToolAllowlistText);
              }}
            >
              <option value="">Apply branch template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </Select>
            <Button onClick={saveTemplate}>Save template</Button>
            <Button
              onClick={() => {
                setTemplates([]);
                window.localStorage.removeItem("branchTemplates");
              }}
            >
              Clear templates
            </Button>
          </div>

          {mode === "reexec" ? (
            <>
              <Field label="Provider">
                <Input value={providerId} onChange={(event) => setProviderId(event.target.value)} />
              </Field>
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--warning)" }}>
                <input
                  type="checkbox"
                  checked={allowLiveTools}
                  onChange={(event) => setAllowLiveTools(event.target.checked)}
                />
                Allow live tool calls (danger)
              </label>
              {allowLiveTools ? (
                <Field label="Live tool allowlist (comma-separated)">
                  <Input
                    value={liveToolAllowlistText}
                    onChange={(event) => setLiveToolAllowlistText(event.target.value)}
                  />
                </Field>
              ) : null}
            </>
          ) : null}

          <Card className="ui-card-plain">
            <p style={{ marginTop: 0 }}>Intervention preview</p>
            <pre className="mono" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {JSON.stringify(
                {
                  mode,
                  kind,
                  callId,
                  decision,
                  allowLiveTools,
                },
                null,
                2,
              )}
            </pre>
          </Card>

          <Card className="ui-card-plain" style={{ margin: 0 }}>
            <p style={{ marginTop: 0 }}>Activity timeline</p>
            <ol className="mono" style={{ margin: 0, paddingLeft: 18 }}>
              {progress.map((item) => (
                <li key={item}>{item}</li>
              ))}
              {progress.length === 0 ? <li>Waiting to start</li> : null}
            </ol>
          </Card>

          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            data-testid="fork-create-button"
            variant="primary"
            onClick={() => {
              if (kind === "prompt_edit") {
                void onSubmit({
                  mode,
                  providerId,
                  allowLiveTools,
                  liveToolAllowlist: liveToolAllowlistText
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  intervention: { kind, newPrompt: prompt },
                });
                return;
              }

              if (kind === "tool_output_override") {
                let parsed: Record<string, unknown> = {};
                try {
                  parsed = JSON.parse(result) as Record<string, unknown>;
                } catch {
                  parsed = { raw: result };
                }
                void onSubmit({
                  mode,
                  providerId,
                  allowLiveTools,
                  liveToolAllowlist: liveToolAllowlistText
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  intervention: { kind, callId, result: parsed },
                });
                return;
              }

              if (kind === "policy_override") {
                void onSubmit({
                  mode,
                  providerId,
                  allowLiveTools,
                  liveToolAllowlist: liveToolAllowlistText
                    .split(",")
                    .map((item) => item.trim())
                    .filter(Boolean),
                  intervention: { kind, callId, decision },
                });
                return;
              }

              void onSubmit({
                mode,
                providerId,
                allowLiveTools,
                liveToolAllowlist: liveToolAllowlistText
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
                intervention: { kind, memoryId },
              });
            }}
          >
            Create branch
          </Button>
        </div>
      </div>
    </div>
  );
}
