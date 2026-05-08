# Trace Physics + Golden Corpus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic Trace Physics kernel and a golden corpus test gate for BranchLab's core trace claims.

**Architecture:** Add `packages/core/src/tracePhysics.ts` as a deep module over existing Trace IR, causal graph, and compare utilities. Keep the existing modules intact, add corpus fixtures under `examples/traces/golden`, and verify through core tests that load fixtures from disk.

**Tech Stack:** TypeScript, Vitest, Node.js filesystem APIs, existing `@branchlab/core` modules.

---

## File Structure

- Create `packages/core/src/tracePhysics.ts`: kernel interface for normalization, validation, graph/fingerprint, evidence summary, and pairwise compare.
- Modify `packages/core/src/index.ts`: export the new kernel.
- Create `packages/core/test/tracePhysics.test.ts`: unit tests for deterministic fingerprints, validation diagnostics, and pairwise compare.
- Create `packages/core/test/goldenCorpus.test.ts`: disk-backed fixture tests for supported adapter families.
- Create `examples/traces/golden/*.jsonl`: fixture traces for adapter coverage and known compare behavior.
- Modify `.codex/PLANS.md`: track execution and verification evidence.

## Task 1: Kernel Test

**Files:**
- Create: `packages/core/test/tracePhysics.test.ts`
- Create: `packages/core/src/tracePhysics.ts`
- Modify: `packages/core/src/index.ts`

- [x] Write a failing test that imports `analyzeTracePhysics` and `compareTracePhysics`, verifies stable fingerprints across run ids, and checks validation diagnostics.
- [x] Run `pnpm --filter @branchlab/core test -- tracePhysics.test.ts` and confirm it fails because the module is missing.
- [x] Implement `TracePhysicsDiagnostic`, `TracePhysicsSummary`, `analyzeTracePhysics`, and `compareTracePhysics`.
- [x] Export the module from `packages/core/src/index.ts`.
- [x] Run `pnpm --filter @branchlab/core test -- tracePhysics.test.ts` and confirm it passes.

## Task 2: Golden Corpus

**Files:**
- Create: `examples/traces/golden/branchlab-v1-success.jsonl`
- Create: `examples/traces/golden/trace-ir-parent.jsonl`
- Create: `examples/traces/golden/trace-ir-branch.jsonl`
- Create: `examples/traces/golden/otel-genai-tool.jsonl`
- Create: `examples/traces/golden/openai-response.jsonl`
- Create: `examples/traces/golden/anthropic-tool.jsonl`
- Create: `examples/traces/golden/langsmith-run.jsonl`
- Create: `examples/traces/golden/mlflow-span.jsonl`
- Create: `examples/traces/golden/malformed-generic.jsonl`
- Create: `packages/core/test/goldenCorpus.test.ts`

- [x] Add compact JSONL fixtures, one adapter family per file.
- [x] Write a fixture loader that parses JSONL from `examples/traces/golden`.
- [x] Assert each fixture normalizes through `analyzeTracePhysics()` with expected event kinds and diagnostic counts.
- [x] Assert `trace-ir-parent` vs `trace-ir-branch` reports first divergence `tool_result` and one tool heatmap change.
- [x] Run `pnpm --filter @branchlab/core test -- goldenCorpus.test.ts` and confirm it passes.

## Task 3: Documentation And Gates

**Files:**
- Modify: `.codex/PLANS.md`

- [x] Add a Trace Physics + Golden Corpus ExecPlan section with completed tasks and verification evidence.
- [x] Run `pnpm --filter @branchlab/core test`.
- [x] Run `pnpm check`.
- [x] Record outcomes and residual gaps.

## Outcomes

- Added `analyzeTracePhysics()` and `compareTracePhysics()` as the first deep trace-physics interface over Trace IR normalization, validation, causal graph construction, fingerprints, pairwise compare, candidate ranking, and evidence summaries.
- Added a golden trace corpus under `examples/traces/golden` covering BranchLab v1, Trace IR v2, OTel GenAI, OpenAI, Anthropic, LangSmith, MLflow, malformed generic JSONL, and a known pricing parent/branch divergence.
- Tightened validation diagnostics so a structural parent that is also a causal parent produces one precise dangling-parent diagnostic.

## Verification

- `pnpm --filter @branchlab/core test -- tracePhysics.test.ts`: failed before implementation, passed after implementation.
- `pnpm --filter @branchlab/core test -- goldenCorpus.test.ts tracePhysics.test.ts`: passed.
- `pnpm --filter @branchlab/core test`: passed, 10 files and 31 tests.
- `pnpm check`: passed.

## Self-Review

- Spec coverage: the plan covers kernel analysis, pairwise compare, corpus fixtures, validation diagnostics, exports, and gates.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: all public names are defined in Task 1 and reused consistently in Task 2.
