"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { VirtualList } from "@/components/VirtualList";
import { Button, Card, EmptyState, Field, Input, Page, Select } from "@/components/ui";

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

interface SavedRunView {
  id: string;
  name: string;
  search: string;
  status: "all" | "success" | "fail" | "unknown";
  mode?: "all" | "replay" | "reexec";
  tool?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
}

export default function RunsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const urlSearch = useSearchParams();
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [search, setSearch] = useState(urlSearch.get("search") ?? "");
  const [status, setStatus] = useState(urlSearch.get("status") ?? "all");
  const [mode, setMode] = useState(urlSearch.get("mode") ?? "all");
  const [tool, setTool] = useState(urlSearch.get("tool") ?? "");
  const [tag, setTag] = useState(urlSearch.get("tag") ?? "");
  const [dateFrom, setDateFrom] = useState(urlSearch.get("dateFrom") ?? "");
  const [dateTo, setDateTo] = useState(urlSearch.get("dateTo") ?? "");
  const [savedViews, setSavedViews] = useState<SavedRunView[]>([]);

  const loadRuns = useCallback(async (): Promise<void> => {
    const params = new URLSearchParams();
    if (search) {
      params.set("search", search);
    }
    if (status !== "all") {
      params.set("status", status);
    }
    if (mode !== "all") {
      params.set("mode", mode);
    }
    if (tool.trim()) {
      params.set("tool", tool.trim());
    }
    if (tag.trim()) {
      params.set("tag", tag.trim());
    }
    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    }
    if (dateTo) {
      params.set("dateTo", dateTo);
    }

    router.replace(`${pathname}?${params.toString()}`);

    const response = await fetch(`/api/runs?${params.toString()}`);
    const payload = (await response.json()) as { runs: RunSummary[] };
    setRuns(payload.runs);
  }, [search, status, mode, tool, tag, dateFrom, dateTo, router, pathname]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((payload: { settings?: { savedRunViews?: SavedRunView[] } }) => {
        setSavedViews(payload.settings?.savedRunViews ?? []);
      })
      .catch(() => setSavedViews([]));
  }, []);

  const filtered = useMemo(() => runs, [runs]);

  async function persistViews(next: SavedRunView[]): Promise<void> {
    setSavedViews(next);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        settings: {
          savedRunViews: next,
        },
      }),
    });
  }

  async function saveCurrentView(): Promise<void> {
    const name = window.prompt("Preset name");
    if (!name) {
      return;
    }

    const next = [
      ...savedViews,
      {
        id: `view_${Date.now()}`,
        name,
        search,
        status: status as SavedRunView["status"],
        mode: mode as SavedRunView["mode"],
        tool,
        tag,
        dateFrom,
        dateTo,
      },
    ];
    await persistViews(next);
  }

  return (
    <Page aria-label="Runs list">
      <Card>
        <div className="ui-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}>
          <Field label="Search">
            <Input
              aria-label="Search runs"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="run id, source, tool, tag"
            />
          </Field>
          <Field label="Status">
            <Select
              aria-label="Filter by run status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All status</option>
              <option value="success">Success</option>
              <option value="fail">Fail</option>
              <option value="unknown">Unknown</option>
            </Select>
          </Field>
          <Field label="Mode">
            <Select value={mode} onChange={(event) => setMode(event.target.value)}>
              <option value="all">All modes</option>
              <option value="replay">Replay</option>
              <option value="reexec">Re-exec</option>
            </Select>
          </Field>
          <Field label="Tool">
            <Input value={tool} onChange={(event) => setTool(event.target.value)} placeholder="pricing.lookup" />
          </Field>
          <Field label="Tag">
            <Input value={tag} onChange={(event) => setTag(event.target.value)} placeholder="incident-42" />
          </Field>
          <Field label="From date">
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </Field>
          <Field label="To date">
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </Field>
          <Field label="Saved views">
            <Select
              aria-label="Saved views"
              defaultValue=""
              onChange={(event) => {
                const id = event.target.value;
                if (!id) {
                  return;
                }
                const view = savedViews.find((item) => item.id === id);
                if (!view) {
                  return;
                }
                setSearch(view.search);
                setStatus(view.status);
                setMode(view.mode ?? "all");
                setTool(view.tool ?? "");
                setTag(view.tag ?? "");
                setDateFrom(view.dateFrom ?? "");
                setDateTo(view.dateTo ?? "");
              }}
            >
              <option value="">Apply saved view</option>
              {savedViews.map((view) => (
                <option key={view.id} value={view.id}>
                  {view.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="ui-inline" style={{ marginTop: 12 }}>
          <Button onClick={() => void loadRuns()}>Apply filters</Button>
          <Button variant="ghost" onClick={() => void saveCurrentView()}>
            Save view
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setMode("all");
              setTool("");
              setTag("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      <Card>
        <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <h1 style={{ margin: 0 }}>Runs</h1>
          <span className="subtle">{filtered.length} loaded</span>
        </header>
        <div className="subtle mono" style={{ display: "grid", gridTemplateColumns: "210px 110px 1fr", padding: "8px 10px" }}>
          <span>Time</span>
          <span>Status / Mode</span>
          <span>Source / Metrics</span>
        </div>
        <div className="ui-divider" />
        {filtered.length === 0 ? (
          <EmptyState>
            <strong>No runs found</strong>
            <span>Adjust filters or import a trace to begin analysis.</span>
            <Link className="ui-button" href="/">
              Import trace
            </Link>
          </EmptyState>
        ) : (
          <VirtualList
            items={filtered}
            estimateSize={82}
            height={560}
            render={(run) => (
              <Link
                href={`/runs/${run.id}`}
                data-testid={`run-link-${run.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "210px 110px 1fr",
                  gap: 12,
                  padding: "14px 10px",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div className="mono">{new Date(run.createdAt).toLocaleString()}</div>
                  <div className="subtle mono">{run.id}</div>
                </div>
                <div>
                  <StatusBadge status={run.status} />
                  <div className="subtle mono" style={{ marginTop: 4 }}>
                    {run.mode}
                  </div>
                </div>
                <div>
                  <div>{run.source}</div>
                  <div className="subtle mono">
                    {Math.round(run.durationMs)} ms · ${run.costUsd.toFixed(4)} · {run.tools.join(", ") || "no tools"}
                  </div>
                  {run.tags.length > 0 ? <div className="subtle mono">tags: {run.tags.join(", ")}</div> : null}
                </div>
              </Link>
            )}
          />
        )}
      </Card>
    </Page>
  );
}
