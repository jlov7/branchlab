# Counterfactuals & Forking Semantics

## 1) Definitions

- **Run**: a recorded event stream with an outcome label (success/failure/unknown).
- **Branch**: a derived run produced by applying an **intervention** at a **fork point**.
- **Fork point**: a selected `event_id` that anchors the intervention.
- **Intervention**: a structured override that changes the event stream or the re-execution behavior.

## 2) Intervention types (MVP)

### A) Prompt edit
- Patch the first `llm.request.data.messages[*]` item with `role == "user"`.
- If no `role == "user"` message exists, patch the first editable message with string `content`.
- Used for “what if the intent were phrased differently?”

### B) Tool output override
- Replace `tool.response.data.result` for a selected `call_id`
- Used for “what if the tool returned X instead of Y?”

### C) Policy override
- Simulate deny/hold for a tool call
- If deny: branch should include a `policy.decision` event and optionally an `error` event
- If hold: branch should include a `policy.decision` and a “human approved” note in demo mode

### D) Memory removal
- Remove a selected `memory.read` item from the context assembly
- Used to test if a memory is misleading/harmful

## 3) Branch types

### Replay-only branch
- No new calls.
- The branch is created by applying patch overlays to the recorded stream.
- Must be perfectly reproducible.

### Re-execution branch
- Re-run LLM steps after the fork point (requires configured model endpoint).
- Tool calls are stubbed by recorded tool outputs by default.
- Live tool calls require explicit opt-in.

## 4) Comparison semantics

Comparison output must include:
- first divergence event id
- list of added/removed/modified events
- summary metrics delta:
  - cost delta
  - policy delta
  - outcome delta

## 5) “Blame” heuristic (MVP)

Goal: find the earliest decision point where a minimal intervention flips the outcome.

Algorithm:
1. Identify candidate intervention points (tool outputs, prompt segments, memory reads)
2. Apply each intervention independently in replay-only mode if possible
3. If outcome changes, record candidate
4. If no independent flip, use bisection over ranked candidates:
   - apply top N together, then bisect to minimal subset

Output:
- top-3 candidates
- rationale string
- confidence estimate (heuristic)

## 6) Deterministic outcome resolution

Outcome resolution order for replay, branching, compare deltas, and blame evaluation:
1. `run.end.data.status` if present and valid (`success|fail`)
2. latest `llm.response.data.outcome` if present and valid (`success|fail`)
3. `unknown`

## 7) Guardrails

- Never execute code embedded in trace.
- Never auto-enable live tool calls in re-execution.
- For any intervention, preserve the original run unchanged (immutable).
