import { getDb } from "./db";
import { newId } from "./ids";

export interface RuntimeExecutionRecord {
  id: string;
  parentRunId?: string;
  branchRunId: string;
  mode: "replay" | "reexec";
  providerId?: string;
  allowLiveTools: boolean;
  liveToolAllowlist: string[];
  budget: {
    maxCalls: number;
    maxTokens: number;
    maxCostUsd: number;
  };
  sideEffects: {
    liveToolsEnabled: boolean;
    expectedExternalCalls: number;
    notes: string[];
  };
  status: "success" | "fail" | "unknown";
  createdAt: string;
}

export function recordRuntimeExecution(input: Omit<RuntimeExecutionRecord, "id" | "createdAt">): RuntimeExecutionRecord {
  const record: RuntimeExecutionRecord = {
    ...input,
    id: newId("runtime_exec"),
    createdAt: new Date().toISOString(),
  };

  getDb()
    .prepare(
      `
      INSERT INTO runtime_executions (
        id, parent_run_id, branch_run_id, mode, provider_id, allow_live_tools,
        live_tool_allowlist_json, budget_json, side_effects_json, status, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(
      record.id,
      record.parentRunId ?? null,
      record.branchRunId,
      record.mode,
      record.providerId ?? null,
      record.allowLiveTools ? 1 : 0,
      JSON.stringify(record.liveToolAllowlist),
      JSON.stringify(record.budget),
      JSON.stringify(record.sideEffects),
      record.status,
      record.createdAt,
    );

  return record;
}

export function listRuntimeExecutions(limit = 50): RuntimeExecutionRecord[] {
  const rows = getDb()
    .prepare(
      `
      SELECT id, parent_run_id, branch_run_id, mode, provider_id, allow_live_tools,
        live_tool_allowlist_json, budget_json, side_effects_json, status, created_at
      FROM runtime_executions
      ORDER BY created_at DESC
      LIMIT ?
    `,
    )
    .all(limit) as Array<{
    id: string;
    parent_run_id: string | null;
    branch_run_id: string;
    mode: "replay" | "reexec";
    provider_id: string | null;
    allow_live_tools: number;
    live_tool_allowlist_json: string;
    budget_json: string;
    side_effects_json: string;
    status: "success" | "fail" | "unknown";
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    parentRunId: row.parent_run_id ?? undefined,
    branchRunId: row.branch_run_id,
    mode: row.mode,
    providerId: row.provider_id ?? undefined,
    allowLiveTools: Boolean(row.allow_live_tools),
    liveToolAllowlist: parseJson(row.live_tool_allowlist_json, []),
    budget: parseJson(row.budget_json, { maxCalls: 0, maxTokens: 0, maxCostUsd: 0 }),
    sideEffects: parseJson(row.side_effects_json, { liveToolsEnabled: false, expectedExternalCalls: 0, notes: [] }),
    status: row.status,
    createdAt: row.created_at,
  }));
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
