import type { ProviderConfig } from "@branchlab/core";
import { getDb } from "./db";

export interface AppSettings {
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
}

const DEFAULT_SETTINGS: AppSettings = {
  redactionDefault: true,
  activeProviderId: "provider_openai",
  storagePath: ".atl",
  reexecMaxCalls: 12,
  reexecMaxTokens: 40000,
  reexecMaxCostUsd: 1,
  liveToolAllowlist: [],
  diagnosticsOptIn: false,
  savedRunViews: [],
  savedComparePresets: [],
};

const DEFAULT_PROVIDERS: ProviderConfig[] = [
  {
    id: "provider_openai",
    name: "OpenAI",
    kind: "openai",
    baseUrl: "https://api.openai.com",
    apiKeyEnv: "OPENAI_API_KEY",
    model: "gpt-5-mini",
    enabled: true,
  },
  {
    id: "provider_anthropic",
    name: "Anthropic",
    kind: "anthropic",
    baseUrl: "https://api.anthropic.com",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    model: "claude-sonnet-4-5",
    enabled: false,
  },
  {
    id: "provider_compatible",
    name: "OpenAI-Compatible",
    kind: "compatible",
    baseUrl: "http://localhost:1234/v1",
    apiKeyEnv: "OPENAI_COMPAT_KEY",
    model: "gpt-oss-120b",
    enabled: false,
  },
];

export function getSettings(): AppSettings {
  ensureDefaults();
  const db = getDb();
  const rows = db.prepare(`SELECT key, value_json FROM settings`).all() as Array<{
    key: string;
    value_json: string;
  }>;

  const loaded = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    const value = JSON.parse(row.value_json) as unknown;
    if (row.key === "redactionDefault" && typeof value === "boolean") {
      loaded.redactionDefault = value;
    }

    if (row.key === "activeProviderId" && (typeof value === "string" || value === null)) {
      loaded.activeProviderId = value;
    }

    if (row.key === "storagePath" && typeof value === "string") {
      loaded.storagePath = value;
    }

    if (row.key === "reexecMaxCalls" && typeof value === "number" && Number.isFinite(value)) {
      loaded.reexecMaxCalls = Math.max(1, Math.floor(value));
    }

    if (row.key === "reexecMaxTokens" && typeof value === "number" && Number.isFinite(value)) {
      loaded.reexecMaxTokens = Math.max(1, Math.floor(value));
    }

    if (row.key === "reexecMaxCostUsd" && typeof value === "number" && Number.isFinite(value)) {
      loaded.reexecMaxCostUsd = Math.max(0.01, value);
    }

    if (row.key === "liveToolAllowlist" && Array.isArray(value)) {
      loaded.liveToolAllowlist = value.filter((item): item is string => typeof item === "string");
    }

    if (row.key === "diagnosticsOptIn" && typeof value === "boolean") {
      loaded.diagnosticsOptIn = value;
    }

    if (row.key === "savedRunViews" && Array.isArray(value)) {
      const mapped = value.map(
        (item): AppSettings["savedRunViews"][number] | null => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const obj = item as Record<string, unknown>;
          const status = obj.status as
            | "all"
            | "success"
            | "fail"
            | "unknown"
            | undefined;
          if (
            typeof obj.id === "string" &&
            typeof obj.name === "string" &&
            typeof obj.search === "string" &&
            (status === "all" || status === "success" || status === "fail" || status === "unknown")
          ) {
            const mode = obj.mode;
            const safeMode =
              mode === "all" || mode === "replay" || mode === "reexec" ? mode : undefined;
            return {
              id: obj.id,
              name: obj.name,
              search: obj.search,
              status,
              mode: safeMode,
              tool: typeof obj.tool === "string" ? obj.tool : undefined,
              tag: typeof obj.tag === "string" ? obj.tag : undefined,
              dateFrom: typeof obj.dateFrom === "string" ? obj.dateFrom : undefined,
              dateTo: typeof obj.dateTo === "string" ? obj.dateTo : undefined,
            };
          }
          return null;
        },
      );
      loaded.savedRunViews = mapped.filter(
        (item): item is AppSettings["savedRunViews"][number] => item !== null,
      );
    }

    if (row.key === "savedComparePresets" && Array.isArray(value)) {
      loaded.savedComparePresets = value
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const obj = item as Record<string, unknown>;
          if (
            typeof obj.id === "string" &&
            typeof obj.name === "string" &&
            typeof obj.parentRunId === "string" &&
            typeof obj.branchRunId === "string"
          ) {
            return {
              id: obj.id,
              name: obj.name,
              parentRunId: obj.parentRunId,
              branchRunId: obj.branchRunId,
            };
          }
          return null;
        })
        .filter(
          (
            item,
          ): item is {
            id: string;
            name: string;
            parentRunId: string;
            branchRunId: string;
          } => item !== null,
        );
    }
  }

  return loaded;
}

export function updateSettings(next: Partial<AppSettings>): AppSettings {
  ensureDefaults();
  const db = getDb();

  for (const [key, value] of Object.entries(next)) {
    db.prepare(
      `
      INSERT INTO settings (key, value_json, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `,
    ).run(key, JSON.stringify(value), new Date().toISOString());
  }

  return getSettings();
}

export function listProviders(): ProviderConfig[] {
  ensureDefaults();
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id, name, kind, base_url, api_key_env, model, enabled
      FROM provider_configs
      ORDER BY created_at ASC
    `,
    )
    .all() as Array<{
    id: string;
    name: string;
    kind: ProviderConfig["kind"];
    base_url: string;
    api_key_env: string;
    model: string;
    enabled: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    kind: row.kind,
    baseUrl: row.base_url,
    apiKeyEnv: row.api_key_env,
    model: row.model,
    enabled: Boolean(row.enabled),
  }));
}

export function saveProviders(providers: ProviderConfig[]): ProviderConfig[] {
  ensureDefaults();
  const db = getDb();
  db.exec("BEGIN");

  try {
    for (const provider of providers) {
      db.prepare(
        `
        INSERT INTO provider_configs (id, name, kind, base_url, api_key_env, model, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          kind = excluded.kind,
          base_url = excluded.base_url,
          api_key_env = excluded.api_key_env,
          model = excluded.model,
          enabled = excluded.enabled,
          updated_at = excluded.updated_at
      `,
      ).run(
        provider.id,
        provider.name,
        provider.kind,
        provider.baseUrl,
        provider.apiKeyEnv,
        provider.model,
        provider.enabled ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  return listProviders();
}

function ensureDefaults(): void {
  const db = getDb();
  const count = db.prepare(`SELECT COUNT(*) AS count FROM settings`).get() as { count: number };
  if (count.count === 0) {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      db.prepare(`INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)`).run(
        key,
        JSON.stringify(value),
        new Date().toISOString(),
      );
    }
  }

  const providerCount = db.prepare(`SELECT COUNT(*) AS count FROM provider_configs`).get() as { count: number };
  if (providerCount.count === 0) {
    for (const provider of DEFAULT_PROVIDERS) {
      db.prepare(
        `
        INSERT INTO provider_configs (id, name, kind, base_url, api_key_env, model, enabled, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(
        provider.id,
        provider.name,
        provider.kind,
        provider.baseUrl,
        provider.apiKeyEnv,
        provider.model,
        provider.enabled ? 1 : 0,
        new Date().toISOString(),
        new Date().toISOString(),
      );
    }
  }
}
