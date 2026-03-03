import {
  compileRegoToWasm,
  evaluateRegoPolicy,
  evaluateYamlPolicy,
  parseYamlPolicy,
  summarizePolicy,
  type PolicyDecisionRecord,
} from "@branchlab/policy";
import type { NormalizedEvent } from "@branchlab/core";
import { readBlobJson, writeBlobJson } from "./blobStore";
import { getDb } from "./db";
import { newId } from "./ids";
import { getAllRunEvents } from "./runsRepo";

export interface PolicyVersion {
  id: string;
  name: string;
  description: string;
  backend: "yaml" | "rego_wasm";
  createdAt: string;
}

export interface SavePolicyInput {
  name: string;
  description: string;
  backend: "yaml" | "rego_wasm";
  content: string;
  entrypoint?: string;
}

export function savePolicy(input: SavePolicyInput): PolicyVersion {
  const db = getDb();
  const id = newId("policy");
  const createdAt = new Date().toISOString();

  let policyBlobSha: string;

  if (input.backend === "yaml") {
    parseYamlPolicy(input.content);
    policyBlobSha = writeBlobJson({ content: input.content });
  } else {
    const entrypoint = input.entrypoint ?? "branchlab/allow";
    const wasm = compileRegoToWasm(input.content, { entrypoint });
    policyBlobSha = writeBlobJson({ entrypoint, wasm: Buffer.from(wasm).toString("base64") });

    db.prepare(
      `INSERT INTO artifacts (id, owner_type, owner_id, kind, blob_sha, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(newId("artifact"), "policy", id, "policy_source", writeBlobJson({ rego: input.content }), createdAt);
  }

  db.prepare(
    `
    INSERT INTO policies (id, name, description, backend, policy_blob_sha, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
  ).run(id, input.name, input.description, input.backend, policyBlobSha, createdAt);

  db.prepare(`INSERT INTO artifacts (id, owner_type, owner_id, kind, blob_sha, created_at) VALUES (?, ?, ?, ?, ?, ?)`).run(
    newId("artifact"),
    "policy",
    id,
    input.backend === "yaml" ? "json" : "policy_wasm",
    policyBlobSha,
    createdAt,
  );

  return {
    id,
    name: input.name,
    description: input.description,
    backend: input.backend,
    createdAt,
  };
}

export function listPolicies(): PolicyVersion[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, name, description, backend, created_at FROM policies ORDER BY created_at DESC`)
    .all() as Array<{
    id: string;
    name: string;
    description: string;
    backend: "yaml" | "rego_wasm";
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    backend: row.backend,
    createdAt: row.created_at,
  }));
}

export async function evaluatePolicy(policyId: string, runIds: string[]): Promise<{
  evalIds: string[];
  summary: {
    violations: number;
    totalCalls: number;
    bySeverity: Record<string, number>;
    byRule: Record<string, number>;
    byTool: Record<string, number>;
    blockedSuccessEstimate: number;
  };
  decisions: Array<{ runId: string; records: PolicyDecisionRecord[] }>;
}> {
  const db = getDb();
  const policyRow = db
    .prepare(`SELECT id, backend, policy_blob_sha FROM policies WHERE id = ?`)
    .get(policyId) as { id: string; backend: "yaml" | "rego_wasm"; policy_blob_sha: string } | undefined;

  if (!policyRow) {
    throw new Error("Policy not found");
  }

  const blob = readBlobJson<{ content?: string; entrypoint?: string; wasm?: string }>(policyRow.policy_blob_sha);

  const evalIds: string[] = [];
  const allRunDecisions: Array<{ runId: string; records: PolicyDecisionRecord[] }> = [];
  let totalCalls = 0;
  let violations = 0;
  const bySeverity: Record<string, number> = {};
  const byRule: Record<string, number> = {};
  const byTool: Record<string, number> = {};

  for (const runId of runIds) {
    const calls = extractPolicyInputs(getAllRunEvents(runId));
    let records: PolicyDecisionRecord[] = [];

    if (policyRow.backend === "yaml") {
      const parsed = parseYamlPolicy(blob.content ?? "version: 1\nrules: []");
      records = await evaluateYamlPolicy(parsed, calls);
    } else {
      const wasmBase64 = blob.wasm;
      const entrypoint = blob.entrypoint ?? "branchlab/allow";
      if (!wasmBase64) {
        throw new Error("Missing WASM payload");
      }

      records = await evaluateRegoPolicy(
        {
          entrypoint,
          wasm: Uint8Array.from(Buffer.from(wasmBase64, "base64")),
        },
        calls,
      );
    }

    const summary = summarizePolicy(records);
    totalCalls += summary.totalCalls;
    violations += summary.violations;
    Object.entries(summary.byTool).forEach(([tool, count]) => {
      byTool[tool] = (byTool[tool] ?? 0) + count;
    });

    const evalId = newId("policy_eval");
    evalIds.push(evalId);
    allRunDecisions.push({ runId, records });

    for (const record of records) {
      const severity = record.decision.severity;
      bySeverity[severity] = (bySeverity[severity] ?? 0) + 1;
      const ruleId = record.decision.ruleId;
      byRule[ruleId] = (byRule[ruleId] ?? 0) + 1;
    }

    db.exec("BEGIN");
    try {
      db.prepare(
        `
        INSERT INTO policy_evals (id, policy_id, run_id, created_at, summary_json)
        VALUES (?, ?, ?, ?, ?)
      `,
      ).run(evalId, policyId, runId, new Date().toISOString(), JSON.stringify(summary));

      const insertDecision = db.prepare(
        `
        INSERT INTO policy_decisions (policy_eval_id, run_id, call_id, decision, severity, rule_id, reason, meta_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      );

      for (const record of records) {
        insertDecision.run(
          evalId,
          runId,
          record.callId,
          record.decision.decision,
          record.decision.severity,
          record.decision.ruleId,
          record.decision.reason,
          JSON.stringify({ tool: record.tool }),
        );
      }

      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  return {
    evalIds,
    summary: {
      violations,
      totalCalls,
      bySeverity,
      byRule,
      byTool,
      blockedSuccessEstimate:
        totalCalls === 0 ? 0 : Number(Math.min(1, violations / Math.max(totalCalls, 1)).toFixed(3)),
    },
    decisions: allRunDecisions,
  };
}

function extractPolicyInputs(events: NormalizedEvent[]): Array<{
  callId: string;
  tool: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}> {
  const byCallId = new Map<string, { tool: string; args?: Record<string, unknown>; result?: Record<string, unknown> }>();

  for (const event of events) {
    if (event.type === "tool.request") {
      const callId = event.data.call_id;
      const tool = event.data.tool;
      if (typeof callId === "string" && typeof tool === "string") {
        byCallId.set(callId, {
          tool,
          args: typeof event.data.args === "object" && event.data.args ? (event.data.args as Record<string, unknown>) : undefined,
        });
      }
    }

    if (event.type === "tool.response") {
      const callId = event.data.call_id;
      if (typeof callId === "string") {
        const existing = byCallId.get(callId);
        if (existing) {
          existing.result =
            typeof event.data.result === "object" && event.data.result ? (event.data.result as Record<string, unknown>) : undefined;
        }
      }
    }
  }

  return [...byCallId.entries()].map(([callId, value]) => ({
    callId,
    tool: value.tool,
    args: value.args,
    result: value.result,
  }));
}
