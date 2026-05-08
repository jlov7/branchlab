# BranchLab Product Context

## Product

BranchLab is an open-source, local-first agent reliability lab. It helps engineers import traces, normalize them into BranchLab Trace IR, replay and fork runs, inspect causal divergence, run evals and policy simulations, and export evidence packs.

## Primary Users

- Frontier-lab and enterprise AI engineers debugging agent failures.
- Reliability engineers building regression gates from real traces.
- Security and policy reviewers asking what a policy would have changed.
- Local-first power users who need inspectable artifacts instead of hosted black boxes.

## Promise

No magic without a replayable artifact. Every claim should connect to a trace event, span id, hash, eval result, policy decision, runtime execution record, or evidence pack.

## Product Principles

- Evidence first: show provenance, fingerprints, hashes, and raw normalized data.
- Local first: no auth, tenancy, hosted billing, or cloud dependency in the core UX.
- Provider neutral core: OpenTelemetry, OpenAI, Anthropic, LangSmith, MLflow, and JSONL enter through adapters, then become Trace IR.
- Deterministic by default: live re-exec is explicit, budgeted, and audited.
- Dense but calm: optimize for expert debugging, scanning, comparison, and repeated workflows.

## Experience Goals

- The user can understand the state of a run in the first viewport.
- The user can move from run import to causal investigation to eval/policy evidence without losing context.
- The UI makes confidence and uncertainty visible.
- Evidence packs feel credible enough to share with engineering leadership or a review board.

## Anti-Goals

- BranchLab is not a marketing site.
- BranchLab is not a hosted SaaS admin console.
- BranchLab is not a generic observability dashboard.
- BranchLab should not imply model-judged results are human truth.
