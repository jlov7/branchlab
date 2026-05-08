# Trace Formats

BranchLab works best with a **normalized event stream**.

## 0) BranchLab Trace IR (v2)

Trace IR v2 is the canonical internal representation for frontier replay, causal debugging, evals, policy impact, and evidence packs. New ingested runs persist both the normalized v1 stream and Trace IR v2 rows with replay fingerprints.

Key fields:
- `schema`: `"branchlab.trace_ir.v2"`
- `traceId`, `runId`, `spanId`, `parentSpanId`
- `sequence`, `eventKind`
- `provider`, `model`, `toolCallId`
- `inputRef`, `outputRef`
- `hash`, `redactionState`, `causalParentIds`
- `timing`, `usage`, `policy`
- `data`

Persistence notes:
- `trace_ir_events` stores the indexed span metadata, hash, causal parents, timing, usage, policy fields, and a content-addressed metadata payload.
- `trace_fingerprints` stores deterministic replay fingerprints for fast equality checks and evidence-pack provenance.
- Semantic compare ignores branch `run_id` changes; event hashes and payload refs capture meaningful replay divergence.
- Persisted Trace IR product reads trust stored event hashes because compact database rows do not currently persist full `inputRef` and `outputRef` payload references. Raw Trace IR analysis still validates hash mismatches by default.

Initial adapters normalize:
- BranchLab v1 events
- OTel GenAI spans/events
- OpenAI Responses/Agents-style envelopes
- Anthropic message/tool envelopes
- LangSmith-style run exports
- MLflow-style trace/span exports
- malformed generic JSONL into auditable `note` events

## 1) BranchLab Normalized Trace (v1)

A JSONL file where each line is a JSON object.

Required fields:
- `schema`: `"branchlab.trace.v1"`
- `run_id`: string
- `event_id`: string (unique within run)
- `ts`: ISO-8601 UTC timestamp
- `type`: one of:
  - `run.start`, `run.end`
  - `llm.request`, `llm.response`
  - `tool.request`, `tool.response`
  - `memory.read`, `memory.write`
  - `policy.decision`
  - `error`
  - `note`
- `parent_event_id`: optional (for pairing)
- `data`: object (type-specific payload)
- `meta`: optional (cost, tokens, model, tool name, etc.)

### Tool request/response pairing
- A `tool.request` may include `call_id`.
- The matching `tool.response` must include the same `call_id`.
- During ingestion, normalize `data.call_id` into indexed storage column `events.call_id`.

### LLM request/response pairing
- A `llm.request` may include `call_id`.
- Matching `llm.response` must include the same `call_id`.

## 2) Compatibility adapters

BranchLab supports normalization adapters for common trace envelopes:

- Legacy normalized variants:
  - `runId` -> `run_id`
  - `eventId` -> `event_id`
  - `timestamp` -> `ts`
  - `event_type` -> `type`
  - `payload` -> `data`

- OpenAI envelope examples:
  - `provider: "openai", type: "response.created"` -> `llm.request`
  - `provider: "openai", type: "response.completed"` -> `llm.response`
  - `provider: "openai", type: "response.failed"` -> `error`

- Anthropic envelope examples:
  - `provider: "anthropic", type: "message_start"` -> `llm.request`
  - `provider: "anthropic", type: "message_stop"` -> `llm.response`
  - `provider: "anthropic", type: "tool_use"` -> `tool.request`
  - `provider: "anthropic", type: "tool_result"` -> `tool.response`

## 3) Generic Tool Trace (fallback)

If a user uploads a trace that cannot be mapped precisely, import it as:
- `note` events with the raw payload
- plus best-effort extraction of tool calls if detected

The UI must clearly show “partial parse”.

## 4) Included sample traces

See:
- `examples/traces/demo_run_fail.jsonl`
- `examples/traces/demo_run_success.jsonl`
- `examples/traces/golden/*.jsonl`

These traces are designed to demonstrate:
- replay
- fork by overriding a tool result
- compare view and first divergence

The `examples/traces/golden` corpus is the deterministic adapter and trace-physics fixture set. It covers BranchLab v1, Trace IR v2, OTel GenAI, OpenAI-style, Anthropic-style, LangSmith-style, MLflow-style, malformed generic JSONL, and a known parent/branch divergence pair.
