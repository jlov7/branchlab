# Trace Formats

BranchLab works best with a **normalized event stream**.

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

These traces are designed to demonstrate:
- replay
- fork by overriding a tool result
- compare view and first divergence
