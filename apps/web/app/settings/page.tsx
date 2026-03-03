"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, Field, Input, Page, Select } from "@/components/ui";

interface Provider {
  id: string;
  name: string;
  kind: "openai" | "anthropic" | "compatible";
  baseUrl: string;
  apiKeyEnv: string;
  model: string;
  enabled: boolean;
}

interface SettingsPayload {
  settings: {
    redactionDefault: boolean;
    activeProviderId: string | null;
    storagePath: string;
    reexecMaxCalls: number;
    reexecMaxTokens: number;
    reexecMaxCostUsd: number;
    liveToolAllowlist: string[];
    diagnosticsOptIn: boolean;
    savedRunViews: Array<{
      id: string;
      name: string;
      search: string;
      status: "all" | "success" | "fail" | "unknown";
      mode?: "all" | "replay" | "reexec";
      tool?: string;
      tag?: string;
      dateFrom?: string;
      dateTo?: string;
    }>;
    savedComparePresets: Array<{
      id: string;
      name: string;
      parentRunId: string;
      branchRunId: string;
    }>;
  };
  providers: Provider[];
}

interface ProviderHealth {
  providerId: string;
  enabled: boolean;
  hasApiKey: boolean;
  reachable: boolean;
  status: "ok" | "warn" | "error";
  detail: string;
}

export default function SettingsPage() {
  const [payload, setPayload] = useState<SettingsPayload | null>(null);
  const [message, setMessage] = useState<string>("");
  const [health, setHealth] = useState<ProviderHealth[]>([]);

  async function load(): Promise<void> {
    const response = await fetch("/api/settings");
    const data = (await response.json()) as SettingsPayload;
    setPayload(data);
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(): Promise<void> {
    if (!payload) {
      return;
    }

    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setMessage("Failed to save settings");
      return;
    }

    setMessage("Settings saved");
  }

  async function openFolder(): Promise<void> {
    const response = await fetch("/api/settings/open-folder", { method: "POST" });
    const data = (await response.json()) as { error?: string; path?: string };
    setMessage(data.error ? data.error : `Opened ${data.path}`);
  }

  async function deleteAll(): Promise<void> {
    if (!window.confirm("Delete all local data under .atl/? This cannot be undone.")) {
      return;
    }

    await fetch("/api/settings/delete-all", { method: "POST" });
    setMessage("Deleted all local data.");
  }

  async function checkHealth(): Promise<void> {
    const response = await fetch("/api/providers/health");
    const data = (await response.json()) as { health?: ProviderHealth[]; error?: string };
    if (!response.ok || !data.health) {
      setMessage(data.error ?? "Failed to check provider health");
      return;
    }
    setHealth(data.health);
    setMessage("Provider health refreshed");
  }

  async function buildDiagnosticsBundle(): Promise<void> {
    const response = await fetch("/api/diagnostics/bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmOptIn: payload?.settings.diagnosticsOptIn ?? false }),
    });
    const data = (await response.json()) as { bundle?: { id: string; file: string }; error?: string };
    if (!response.ok || !data.bundle) {
      setMessage(data.error ?? "Failed to generate diagnostics bundle");
      return;
    }
    setMessage(`Diagnostics bundle: ${data.bundle.id} (${data.bundle.file})`);
  }

  function updateProvider(index: number, patch: Partial<Provider>): void {
    setPayload((previous) => {
      if (!previous) {
        return previous;
      }
      const providers = [...previous.providers];
      const current = providers[index];
      if (!current) {
        return previous;
      }
      providers[index] = { ...current, ...patch };
      return { ...previous, providers };
    });
  }

  if (!payload) {
    return (
      <Page>
        <Card>Loading settings…</Card>
      </Page>
    );
  }

  return (
    <Page aria-label="Settings">
      <Card className="page-header">
        <h1 style={{ marginTop: 0 }}>Settings</h1>
        <p className="subtle">
          Control storage, redaction defaults, provider endpoints, and re-execution guardrails.
        </p>
        <div className="ui-inline">
          <Badge tone="success">Storage path visible</Badge>
          <Badge tone="warning">Danger actions confirmed</Badge>
          <Badge>No cloud account required</Badge>
        </div>
      </Card>

      <Card className="ui-stack">
        <h2 style={{ marginTop: 0 }}>Trust and safety defaults</h2>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={payload.settings.redactionDefault}
            onChange={(event) =>
              setPayload((previous) =>
                previous
                  ? {
                      ...previous,
                      settings: {
                        ...previous.settings,
                        redactionDefault: event.target.checked,
                      },
                    }
                  : previous,
              )
            }
          />
          Redaction enabled by default for exports
        </label>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={payload.settings.diagnosticsOptIn}
            onChange={(event) =>
              setPayload((previous) =>
                previous
                  ? {
                      ...previous,
                      settings: {
                        ...previous.settings,
                        diagnosticsOptIn: event.target.checked,
                      },
                    }
                  : previous,
              )
            }
          />
          Allow diagnostics bundle generation (explicit opt-in)
        </label>

        <p className="subtle" style={{ margin: 0 }}>
          Redaction protects sensitive payload values in exports by default. Diagnostics bundles include run metadata
          and should only be generated when you explicitly consent.
        </p>
      </Card>

      <Card className="ui-stack">
        <h2 style={{ marginTop: 0 }}>Storage and profile</h2>

        <Field label="Active provider">
          <Select
            value={payload.settings.activeProviderId ?? ""}
            onChange={(event) =>
              setPayload((previous) =>
                previous
                  ? {
                      ...previous,
                      settings: {
                        ...previous.settings,
                        activeProviderId: event.target.value || null,
                      },
                    }
                  : previous,
              )
            }
          >
            <option value="">None</option>
            {payload.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name}
              </option>
            ))}
          </Select>
        </Field>

        <Card className="ui-card-plain" style={{ margin: 0 }}>
          <div className="mono">Storage location: {payload.settings.storagePath}</div>
          <div className="subtle mono">
            Saved run views: {payload.settings.savedRunViews.length} · Compare presets:{" "}
            {payload.settings.savedComparePresets.length}
          </div>
        </Card>

        <div className="ui-grid ui-grid-cols-3">
          <Field label="Re-exec max calls">
            <Input
              type="number"
              min={1}
              value={payload.settings.reexecMaxCalls}
              onChange={(event) =>
                setPayload((previous) =>
                  previous
                    ? {
                        ...previous,
                        settings: { ...previous.settings, reexecMaxCalls: Number(event.target.value) || 1 },
                      }
                    : previous,
                )
              }
            />
          </Field>

          <Field label="Re-exec max tokens">
            <Input
              type="number"
              min={1}
              value={payload.settings.reexecMaxTokens}
              onChange={(event) =>
                setPayload((previous) =>
                  previous
                    ? {
                        ...previous,
                        settings: { ...previous.settings, reexecMaxTokens: Number(event.target.value) || 1 },
                      }
                    : previous,
                )
              }
            />
          </Field>

          <Field label="Re-exec max cost (USD)">
            <Input
              type="number"
              min={0.01}
              step={0.01}
              value={payload.settings.reexecMaxCostUsd}
              onChange={(event) =>
                setPayload((previous) =>
                  previous
                    ? {
                        ...previous,
                        settings: {
                          ...previous.settings,
                          reexecMaxCostUsd: Number(event.target.value) || 0.01,
                        },
                      }
                    : previous,
                )
              }
            />
          </Field>
        </div>

        <Field label="Live tool allowlist (comma-separated tool names)">
          <Input
            value={payload.settings.liveToolAllowlist.join(", ")}
            onChange={(event) =>
              setPayload((previous) =>
                previous
                  ? {
                      ...previous,
                      settings: {
                        ...previous.settings,
                        liveToolAllowlist: event.target.value
                          .split(",")
                          .map((entry) => entry.trim())
                          .filter((entry) => entry.length > 0),
                      },
                    }
                  : previous,
              )
            }
          />
        </Field>

        <div className="ui-inline">
          <Button onClick={() => void openFolder()}>Open folder</Button>
          <Button variant="danger" onClick={() => void deleteAll()}>
            Delete all data
          </Button>
          <Button onClick={() => void checkHealth()}>Check provider health</Button>
          <Button onClick={() => void buildDiagnosticsBundle()}>Build diagnostics bundle</Button>
          <Button variant="primary" onClick={() => void save()}>
            Save settings
          </Button>
        </div>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0 }}>Model providers</h2>
        <div className="ui-grid" style={{ gap: 12 }}>
          {payload.providers.map((provider, index) => (
            <Card key={provider.id} className="ui-card-plain" style={{ margin: 0 }}>
              <div className="ui-grid">
                <Field label="Name">
                  <Input
                    value={provider.name}
                    onChange={(event) => updateProvider(index, { name: event.target.value })}
                  />
                </Field>

                <div className="ui-grid ui-grid-cols-2">
                  <Field label="Base URL">
                    <Input
                      value={provider.baseUrl}
                      onChange={(event) => updateProvider(index, { baseUrl: event.target.value })}
                    />
                  </Field>
                  <Field label="Model">
                    <Input
                      value={provider.model}
                      onChange={(event) => updateProvider(index, { model: event.target.value })}
                    />
                  </Field>
                </div>

                <Field label="API key env var">
                  <Input
                    value={provider.apiKeyEnv}
                    onChange={(event) => updateProvider(index, { apiKeyEnv: event.target.value })}
                  />
                </Field>

                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={provider.enabled}
                    onChange={(event) => updateProvider(index, { enabled: event.target.checked })}
                  />
                  Enabled
                </label>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card>
        <h2 style={{ marginTop: 0 }}>Provider diagnostics</h2>
        {health.length === 0 ? (
          <p className="subtle">Run &quot;Check provider health&quot; to populate diagnostics.</p>
        ) : (
          <div className="ui-grid" style={{ gap: 8 }}>
            {health.map((item) => (
              <Card key={item.providerId} className="ui-card-plain" style={{ margin: 0 }}>
                <div className="mono">
                  {item.providerId} · {item.status.toUpperCase()}
                </div>
                <div className="subtle">
                  enabled={String(item.enabled)} reachable={String(item.reachable)} hasApiKey=
                  {String(item.hasApiKey)}
                </div>
                <div>{item.detail}</div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {message ? <Card className="mono">{message}</Card> : null}
    </Page>
  );
}
