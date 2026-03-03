"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Command,
  FlaskConical,
  GitBranchPlus,
  HelpCircle,
  Home,
  ListTree,
  Menu,
  Moon,
  Scale,
  Search,
  Settings,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Input } from "@/components/ui";

interface RunSearchResult {
  id: string;
  source: string;
  status: "success" | "fail" | "unknown";
}

interface JobSummary {
  id: string;
  type: string;
  status: "queued" | "running" | "succeeded" | "failed" | "canceled";
  progress: number;
  message: string;
}

interface Toast {
  id: string;
  tone: "info" | "success" | "warning" | "error";
  message: string;
}

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/runs", label: "Runs", icon: ListTree },
  { href: "/compare", label: "Compare", icon: GitBranchPlus },
  { href: "/policy", label: "Policy Lab", icon: Scale },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [runMatches, setRunMatches] = useState<RunSearchResult[]>([]);
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const next = stored === "light" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/jobs")
        .then((response) => response.json())
        .then((payload: { jobs?: JobSummary[] }) => {
          setJobs(payload.jobs ?? []);
        })
        .catch(() => undefined);
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const runningJobs = useMemo(
    () => jobs.filter((job) => job.status === "queued" || job.status === "running"),
    [jobs],
  );

  function pushToast(toast: Omit<Toast, "id">): void {
    setToasts((previous) => {
      const exists = previous.some(
        (item) => item.message === toast.message && item.tone === toast.tone,
      );
      if (exists) {
        return previous;
      }
      const next = [...previous, { ...toast, id: `${Date.now()}_${Math.random()}` }];
      return next.slice(-5);
    });
    setTimeout(() => {
      setToasts((previous) => previous.slice(1));
    }, 4200);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((previous) => !previous);
      }
      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setHelpOpen(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!commandOpen) {
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/runs?limit=8&search=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((payload: { runs?: RunSearchResult[] }) => {
          setRunMatches(payload.runs ?? []);
        })
        .catch(() => setRunMatches([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [commandOpen, query]);

  async function importTrace(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    if (file.size >= 2_000_000) {
      formData.append("async", "1");
    }

    try {
      const response = await fetch("/api/runs/import", { method: "POST", body: formData });
      const payload = (await response.json()) as {
        runId?: string;
        jobId?: string;
        error?: string;
      };

      if (response.status === 202 && payload.jobId) {
        pushToast({ tone: "info", message: `Import queued (${payload.jobId})` });
        router.push("/runs");
        return;
      }

      if (!response.ok || !payload.runId) {
        pushToast({ tone: "error", message: payload.error ?? "Import failed" });
        return;
      }
      pushToast({ tone: "success", message: `Imported ${payload.runId}` });
      router.push(`/runs/${payload.runId}`);
    } catch {
      pushToast({ tone: "error", message: "Import request failed" });
    }
  }

  const crumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((part, index, array) => ({
      label: part,
      href: `/${array.slice(0, index + 1).join("/")}`,
    }));

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className={cn("left-rail", mobileOpen && "open")} aria-label="Primary navigation">
        <div className="left-rail-header">
          <div className="brand">
            <FlaskConical size={19} />
            <span>BranchLab</span>
          </div>
          <Button
            variant="ghost"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="mobile-only"
          >
            <X size={16} />
          </Button>
        </div>
        <nav className="nav-list" aria-label="Primary">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn("nav-item", active && "active")}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      {mobileOpen ? (
        <button className="left-rail-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      ) : null}
      <div className="main-frame">
        <header className="top-bar">
          <div className="top-bar-grid">
            <div style={{ display: "grid", gap: 6 }}>
              <p className="top-bar-meta">
                Replay: deterministic unless re-execution is explicitly enabled.
              </p>
              <div className="breadcrumbs" aria-label="Breadcrumb">
                <strong>BranchLab</strong>
                {crumbs.map((crumb) => (
                  <span key={crumb.href}>
                    / <Link href={crumb.href}>{crumb.label}</Link>
                  </span>
                ))}
              </div>
            </div>
            <div className="top-bar-actions">
              <Button
                variant="ghost"
                aria-label="Open navigation"
                onClick={() => setMobileOpen(true)}
                className="mobile-only"
              >
                <Menu size={16} />
              </Button>
              <label className="ui-button ui-inline">
                <Upload size={15} />
                Import
                <input
                  type="file"
                  accept=".jsonl,application/json"
                  hidden
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    void importTrace(file);
                  }}
                />
              </label>
              <Button variant="ghost" onClick={() => setCommandOpen(true)} aria-label="Open command palette">
                <Search size={15} /> Search <span className="kdb">Cmd+K</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => setTheme((previous) => (previous === "dark" ? "light" : "dark"))}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </Button>
              <Button variant="ghost" onClick={() => setHelpOpen(true)} aria-label="Keyboard shortcuts">
                <HelpCircle size={15} />
              </Button>
              <Link className="ui-button" href="/settings">
                Settings
              </Link>
            </div>
          </div>
          {runningJobs.length > 0 ? (
            <div className="ui-inline subtle mono" style={{ marginTop: 8 }}>
              {runningJobs.map((job) => (
                <span key={job.id}>
                  {job.type}:{job.status} ({job.progress}%)
                </span>
              ))}
            </div>
          ) : null}
        </header>
        <main id="main-content" className="main-content" role="main">
          {children}
        </main>
      </div>

      {commandOpen ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Command palette">
          <div className="ui-card dialog-panel">
            <div className="ui-stack">
              <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Command size={18} /> Command palette
              </h2>
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search runs or jump to page..."
              />
              <div className="ui-stack">
                <div className="subtle mono">Navigation</div>
                {links.map((link) => (
                  <button
                    key={link.href}
                    className="ui-button ui-button-ghost"
                    onClick={() => {
                      router.push(link.href);
                      setCommandOpen(false);
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
              <div className="ui-stack">
                <div className="subtle mono">Runs</div>
                {runMatches.length === 0 ? (
                  <div className="subtle">No matching runs.</div>
                ) : (
                  runMatches.map((run) => (
                    <button
                      key={run.id}
                      className="ui-button ui-button-ghost"
                      onClick={() => {
                        router.push(`/runs/${run.id}`);
                        setCommandOpen(false);
                      }}
                    >
                      <span className="mono">{run.id}</span> · {run.source}
                    </button>
                  ))
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setCommandOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {helpOpen ? (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
          <div className="ui-card dialog-panel">
            <div className="ui-stack">
              <h2 style={{ margin: 0 }}>Keyboard shortcuts</h2>
              <div className="ui-grid ui-grid-cols-2">
                <div className="ui-card ui-card-plain">
                  <div className="ui-inline">
                    <span className="kdb">J</span>/<span className="kdb">K</span>
                    <span className="subtle">Next/previous event</span>
                  </div>
                </div>
                <div className="ui-card ui-card-plain">
                  <div className="ui-inline">
                    <span className="kdb">Enter</span>
                    <span className="subtle">Toggle rendered/raw event tab</span>
                  </div>
                </div>
                <div className="ui-card ui-card-plain">
                  <div className="ui-inline">
                    <span className="kdb">F</span>
                    <span className="subtle">Fork from selected event</span>
                  </div>
                </div>
                <div className="ui-card ui-card-plain">
                  <div className="ui-inline">
                    <span className="kdb">Cmd/Ctrl+K</span>
                    <span className="subtle">Open command palette</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button onClick={() => setHelpOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="toast-stack" role="status" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.tone}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}
