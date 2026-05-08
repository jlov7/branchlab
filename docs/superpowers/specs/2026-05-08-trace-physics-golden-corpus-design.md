# Trace Physics + Golden Corpus Design

Date: 2026-05-08

## Feature

Add a small, deep Trace Physics kernel and a versioned golden trace corpus so BranchLab can prove its core claims through deterministic, inspectable artifacts.

## Requirements

- The kernel must accept raw trace records, normalize them to Trace IR v2, validate important invariants, build a causal graph, compute a replay fingerprint, and produce a compact evidence summary.
- Comparing two traces through the kernel must return fingerprints, first divergence, changed spans, heatmap, ranked candidates, and validation diagnostics for both sides.
- Hashes and fingerprints must stay stable when only `traceId` or `runId` changes.
- Validation must catch duplicate `spanId`, non-finite or negative `sequence`, dangling `parentSpanId`, dangling `causalParentIds`, and hash mismatches.
- The corpus must include deterministic fixtures for BranchLab v1, Trace IR v2, OTel GenAI, OpenAI-style, Anthropic-style, LangSmith-style, MLflow-style, malformed generic JSONL, and a known parent/branch pair.
- Corpus tests must load fixtures from disk and assert expected fingerprints, graph shape, diagnostics, and first divergence.

## Constraints

- Do not rewrite existing persistence or UI callers in this slice.
- Do not add new runtime dependencies.
- Keep provider-specific parsing at adapter edges; the kernel operates on raw records or Trace IR v2 events.
- Keep evidence summaries compact and serializable for later UI/export reuse.

## Acceptance Criteria

- [ ] `analyzeTracePhysics()` returns deterministic summaries for raw records and Trace IR v2 records.
- [ ] `compareTracePhysics()` returns the same first divergence for the golden parent/branch pair across repeated runs.
- [ ] Corpus fixture tests cover all supported adapter families.
- [ ] Validation diagnostics are deterministic and include stable codes.
- [ ] `pnpm --filter @branchlab/core test` passes.
- [ ] `pnpm check` passes.

## Out Of Scope

- Interactive causal graph UI.
- Saved investigation persistence.
- Provider live re-execution.
- Evidence pack format redesign.
