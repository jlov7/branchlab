import { compareRuns, determineOutcome, scoreRun } from "@branchlab/core";
import { getDb } from "./db";
import { newId } from "./ids";
import { getAllRunEvents, getRun, listRuns } from "./runsRepo";

export interface EvalDataset {
  id: string;
  name: string;
  description: string;
  runIds: string[];
  createdAt: string;
}

export interface EvalCaseResult {
  runId: string;
  status: "pass" | "fail" | "warn";
  outcome: "success" | "fail" | "unknown";
  checks: Array<{ id: string; status: "pass" | "fail" | "warn"; message: string }>;
  metrics: {
    toolErrorRate: number;
    policyViolationCount: number;
    costUsd: number;
    loopSuspected: boolean;
    groundednessProxy: number;
  };
}

export interface EvalRunRecord {
  id: string;
  datasetId: string;
  name: string;
  status: "pass" | "fail" | "warn";
  summary: {
    total: number;
    pass: number;
    fail: number;
    warn: number;
    successRate: number;
    regressionCount: number;
  };
  results: EvalCaseResult[];
  createdAt: string;
}

export function createEvalDataset(input: {
  name: string;
  description?: string;
  runIds: string[];
}): EvalDataset {
  const db = getDb();
  const id = newId("eval_dataset");
  const createdAt = new Date().toISOString();
  const runIds = [...new Set(input.runIds)].filter((runId) => getRun(runId));

  db.prepare(
    `
    INSERT INTO eval_datasets (id, name, description, run_ids_json, created_at)
    VALUES (?, ?, ?, ?, ?)
  `,
  ).run(id, input.name, input.description ?? "", JSON.stringify(runIds), createdAt);

  return {
    id,
    name: input.name,
    description: input.description ?? "",
    runIds,
    createdAt,
  };
}

export function listEvalDatasets(): EvalDataset[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT id, name, description, run_ids_json, created_at FROM eval_datasets ORDER BY created_at DESC`)
    .all() as Array<{
    id: string;
    name: string;
    description: string;
    run_ids_json: string;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    runIds: parseStringArray(row.run_ids_json),
    createdAt: row.created_at,
  }));
}

export function runEvalDataset(datasetId: string, name = "frontier-regression-gate"): EvalRunRecord {
  const dataset = listEvalDatasets().find((item) => item.id === datasetId);
  if (!dataset) {
    throw new Error("Eval dataset not found");
  }

  const results = dataset.runIds.map((runId) => evaluateRun(runId));
  const pass = results.filter((result) => result.status === "pass").length;
  const fail = results.filter((result) => result.status === "fail").length;
  const warn = results.filter((result) => result.status === "warn").length;
  const regressionCount = countRegressions(dataset.runIds);
  const summary = {
    total: results.length,
    pass,
    fail,
    warn,
    successRate: results.length === 0 ? 0 : Number((pass / results.length).toFixed(3)),
    regressionCount,
  };
  const status = fail > 0 || regressionCount > 0 ? "fail" : warn > 0 ? "warn" : "pass";
  const id = newId("eval_run");
  const createdAt = new Date().toISOString();

  getDb()
    .prepare(
      `
      INSERT INTO eval_runs (id, dataset_id, name, status, summary_json, results_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .run(id, datasetId, name, status, JSON.stringify(summary), JSON.stringify(results), createdAt);

  return {
    id,
    datasetId,
    name,
    status,
    summary,
    results,
    createdAt,
  };
}

export function listEvalRuns(datasetId?: string): EvalRunRecord[] {
  const db = getDb();
  const rows = datasetId
    ? db
        .prepare(
          `SELECT id, dataset_id, name, status, summary_json, results_json, created_at FROM eval_runs WHERE dataset_id = ? ORDER BY created_at DESC`,
        )
        .all(datasetId)
    : db
        .prepare(
          `SELECT id, dataset_id, name, status, summary_json, results_json, created_at FROM eval_runs ORDER BY created_at DESC LIMIT 50`,
        )
        .all();

  return (rows as Array<{
    id: string;
    dataset_id: string;
    name: string;
    status: "pass" | "fail" | "warn";
    summary_json: string;
    results_json: string;
    created_at: string;
  }>).map((row) => ({
    id: row.id,
    datasetId: row.dataset_id,
    name: row.name,
    status: row.status,
    summary: JSON.parse(row.summary_json) as EvalRunRecord["summary"],
    results: JSON.parse(row.results_json) as EvalCaseResult[],
    createdAt: row.created_at,
  }));
}

export function createDefaultEvalDataset(): EvalDataset {
  const runs = listRuns({ limit: 200 }).map((run) => run.id);
  return createEvalDataset({
    name: `frontier-dataset-${new Date().toISOString().slice(0, 10)}`,
    description: "Auto-generated local regression dataset from current runs.",
    runIds: runs,
  });
}

function evaluateRun(runId: string): EvalCaseResult {
  const events = getAllRunEvents(runId);
  const score = scoreRun(events);
  const outcome = determineOutcome(events);
  const checks: EvalCaseResult["checks"] = [];

  checks.push({
    id: "outcome-known",
    status: outcome === "unknown" ? "warn" : "pass",
    message: outcome === "unknown" ? "Outcome is unknown" : `Outcome is ${outcome}`,
  });
  checks.push({
    id: "tool-error-rate",
    status: score.toolErrorRate > 0 ? "fail" : "pass",
    message: `Tool error rate ${score.toolErrorRate}`,
  });
  checks.push({
    id: "policy-violations",
    status: score.policyViolationCount > 0 ? "warn" : "pass",
    message: `${score.policyViolationCount} policy violations`,
  });
  checks.push({
    id: "loop-detection",
    status: score.loopSuspected ? "warn" : "pass",
    message: score.loopSuspected ? "Repeated tool loop suspected" : "No repeated tool loop detected",
  });

  const status = checks.some((check) => check.status === "fail")
    ? "fail"
    : checks.some((check) => check.status === "warn")
      ? "warn"
      : "pass";

  return {
    runId,
    status,
    outcome,
    checks,
    metrics: {
      toolErrorRate: score.toolErrorRate,
      policyViolationCount: score.policyViolationCount,
      costUsd: score.costUsd,
      loopSuspected: score.loopSuspected,
      groundednessProxy: score.groundednessProxy,
    },
  };
}

function countRegressions(runIds: string[]): number {
  let regressions = 0;
  for (let index = 0; index < runIds.length - 1; index += 1) {
    const left = getAllRunEvents(runIds[index] ?? "");
    const right = getAllRunEvents(runIds[index + 1] ?? "");
    if (left.length === 0 || right.length === 0) {
      continue;
    }
    const diff = compareRuns(left, right);
    if (diff.deltas.outcome.from === "success" && diff.deltas.outcome.to === "fail") {
      regressions += 1;
    }
  }
  return regressions;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
