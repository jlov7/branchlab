# Evaluation & Scoring

BranchLab is not an eval platform, but it provides lightweight scoring to support “blame” and compare summaries.

## 1) Built-in metrics (MVP)

- `tool_error_rate`: % of tool calls returning error
- `policy_violation_count`
- `cost_usd`, `tokens_in/out` if available
- `loop_suspected`: heuristic if repeated similar tool calls
- `groundedness_proxy`: if final answer references tool outputs when tool outputs exist (simple heuristic)

## 2) Optional LLM judge (feature-flag)

For demo/advanced usage:
- evaluate final output quality against a rubric
- evaluate tool selection appropriateness

Guardrails:
- never send raw secrets; use redaction
- explicitly label judge outputs as “model-based assessment”

## 3) Trace-localized scoring

When possible, attach scores to event ranges (e.g., tool-call correctness) so the UI can highlight problematic spans.

## 4) Compare scoring

In compare view, compute deltas:
- cost delta
- violations delta
- tool error delta
- first divergence index
