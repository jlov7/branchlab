import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { analyzeTracePhysics, compareTracePhysics } from "../src/tracePhysics";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const corpusDir = resolve(repoRoot, "examples/traces/golden");

interface FixtureExpectation {
  file: string;
  eventKinds: Record<string, number>;
  diagnostics: number;
}

const fixtures: FixtureExpectation[] = [
  { file: "branchlab-v1-success.jsonl", eventKinds: { run: 1, llm: 1 }, diagnostics: 0 },
  { file: "trace-ir-parent.jsonl", eventKinds: { run: 1, tool: 1, llm: 1 }, diagnostics: 0 },
  { file: "otel-genai-tool.jsonl", eventKinds: { tool: 1 }, diagnostics: 1 },
  { file: "openai-response.jsonl", eventKinds: { llm: 1 }, diagnostics: 0 },
  { file: "anthropic-tool.jsonl", eventKinds: { tool: 1 }, diagnostics: 0 },
  { file: "langsmith-run.jsonl", eventKinds: { tool: 1 }, diagnostics: 1 },
  { file: "mlflow-span.jsonl", eventKinds: { llm: 1 }, diagnostics: 1 },
  { file: "malformed-generic.jsonl", eventKinds: { note: 1 }, diagnostics: 0 },
];

describe("golden trace corpus", () => {
  it.each(fixtures)("normalizes $file through trace physics", ({ file, eventKinds, diagnostics }) => {
    const summary = analyzeTracePhysics(loadFixture(file));

    expect(summary.evidence.eventKinds).toEqual(eventKinds);
    expect(summary.diagnostics).toHaveLength(diagnostics);
    expect(summary.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(summary.evidence.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("locks the known first divergence for the pricing parent and branch pair", () => {
    const compare = compareTracePhysics(loadFixture("trace-ir-parent.jsonl"), loadFixture("trace-ir-branch.jsonl"));

    expect(compare.parent.fingerprint).not.toBe(compare.branch.fingerprint);
    expect(compare.firstDivergenceSpanId).toBe("tool_result");
    expect(compare.firstDivergenceSequence).toBe(1);
    expect(compare.heatmap).toEqual({ tool: 1, llm: 1 });
    expect(compare.candidates[0]?.spanId).toBe("tool_result");
    expect(compare.diagnostics).toEqual([]);
  });
});

function loadFixture(file: string): Array<Record<string, unknown>> {
  return readFileSync(resolve(corpusDir, file), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}
