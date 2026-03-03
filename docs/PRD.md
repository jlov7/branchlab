# PRD — Agent Twin Lab (BranchLab)

## 1) Summary

**Agent Twin Lab** is a local-first developer tool for **recording, replaying, and counterfactually branching** LLM agent runs. It treats a recorded run as a “digital twin”: you can **replay exactly what happened**, then **fork** at any step to answer “what if?” questions (different intent, different tool output, different policy), and **compare** outcomes with precise diffs and impact analysis.

This is positioned as a “next-gen agent reliability + governance cockpit”:
- reliability engineers use it to locate failure root causes and regressions
- platform teams use it to simulate policy changes before rollout
- product teams use it to review “why the agent did that” with evidence

## 2) Problem statement

Enterprise agents fail in ways that are hard to debug:
- stochastic LLM outputs
- non-deterministic tool outputs
- long multi-step traces
- unclear where a failure originated (tool choice, bad memory, wrong parameters, policy, or prompt)

Typical tracing tools show “what happened” but do not support **what-if** exploration in a structured way.

## 3) Target users & personas

1. **Agent Engineer**
   - needs to reproduce + debug failures
   - wants step-level diffs and quick “blame” suggestions

2. **Platform / Governance**
   - needs to test policies against real traces
   - wants “impact preview” (what would be denied/held; success vs safety tradeoff)

3. **Tech Lead / Partner**
   - wants an executive-friendly artifact: a shareable report that summarizes what happened and why

## 4) Goals

- Deterministic local replay with a high-quality timeline UI.
- Branching counterfactuals with clear semantics:
  - **Replay branch** = deterministic, no re-execution
  - **Re-execution branch** = partial re-run of LLM steps, with tool calls stubbed unless explicitly allowed
- Side-by-side comparison and “what changed” summary.
- Policy simulation and drift impact preview.
- Exportable “Run Review Pack” suitable for internal sharing.

## 5) Non-goals (MVP)

- Full production observability platform replacement.
- Running arbitrary third-party agent code without instrumentation.
- Complex environment simulation (beyond stubbing tool outputs / small deterministic sim tools).
- Enterprise auth, SSO, multi-tenancy.

## 6) Core user journeys

### Journey A: Import → Replay → Explain
1. User uploads a JSONL trace (or clicks “Try demo trace”)
2. App parses and stores run locally
3. User views run report:
   - success/failure summary
   - timeline
   - tool calls with args/results
   - memory reads/writes
   - policy decisions (if present)

### Journey B: Fork → What-if → Compare
1. User clicks “Fork from step…”
2. Chooses intervention:
   - edit the user intent (prompt)
   - override a tool result
   - block/allow a tool via policy
   - remove a retrieved memory
3. Creates branch (replay-only or re-execution)
4. Compare view shows:
   - diff timeline
   - changed tool calls
   - changed final outcome
   - cost deltas

### Journey C: Policy impact preview
1. User opens Policy Lab
2. Loads policy file(s) (Rego/WASM or YAML rules)
3. Runs policy over selected runs
4. UI shows:
   - violations by tool
   - “would-have-blocked” vs “allowed”
   - estimated success delta

### Journey D: Export report bundle
1. User clicks Export
2. Generates:
   - `report.html` (static)
   - `run.json` (normalized)
   - `diff.json` (if branch)
   - `policy_results.json`
3. Optionally redacts payloads

## 7) Functional requirements (MVP)

### Import / Normalize
- Drag/drop upload of JSONL
- Parse with streaming (do not load whole file into memory)
- Support at least:
  - BranchLab internal trace format (docs/TRACE_FORMATS.md)
  - A “Generic Tool Trace” schema
- Validation errors must be user-friendly

### Run Viewer
- Run list with filters (status, tool used, tag)
- Run report:
  - timeline
  - event inspector (raw JSON + rendered view)
  - search within run
  - cost + token breakdown

### Forking + Counterfactuals
- Fork at a selected event ID
- Interventions supported:
  - Prompt edit (counterfactual intent)
  - Tool result override
  - Memory retrieval removal
  - Policy decision override (simulate deny/hold)
- Branch types:
  - Replay branch (no re-exec)
  - Re-exec branch (replay tool outputs; re-run LLM steps; deterministic seeds when possible)

### Diff + Blame
- Side-by-side compare with:
  - “Changed events” list
  - semantic diff for JSON args/results
  - summary of outcome delta
- “Blame suggestion”:
  - heuristic bisection: try minimal intervention set to flip outcome label (success/fail)
  - show top-3 candidates with rationale

### Policy Lab
- Policy definitions versioned
- Evaluate policies over runs:
  - tool allow/deny/hold
  - argument constraints (JSON schema checks)
  - sensitive data rules (PII heuristics)
- Show impact preview

### Export
- Export selected run/branch as bundle
- Optional redaction mode

## 8) Quality requirements

- Works offline after install.
- Fast for large traces (100k+ events) via virtualization.
- Strong accessibility: keyboard navigation, aria labels, high contrast mode.
- Security: no unsafe HTML injection from trace payloads.

## 9) Success metrics

- Time-to-root-cause reduced vs manual log inspection.
- Users can create a branch + compare in < 60 seconds for demo trace.
- Demo wow moment: “we changed one tool output and the whole run outcome flips; blame identifies the earliest divergent step.”

## 10) Deliverables

- Web app + CLI wrapper (optional).
- Demo traces and a demo script.
- World-class README with screenshots and a 2-minute “showcase”.
