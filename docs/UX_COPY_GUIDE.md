# UX Copy Guide

## Voice

- Crisp, technical, and direct.
- No marketing superlatives in product UI.
- Explain system behavior and risk in one line.

## Terminology

- `Replay`: uses recorded artifacts only.
- `Re-execution`: re-runs model steps; tools remain stubbed unless allowed.
- `Branch`: child run created from a fork point.
- `Compare`: parent vs branch diff with first divergence.

## Labeling Rules

1. Always label replay/re-exec mode near outcome and metrics.
2. Danger actions must include consequence language (`Delete all data`, `Export unredacted`).
3. Async jobs should include status + percent + message.
4. Prefer sentence case for control labels.

## Microcopy Templates

- Async queued: `"{operation} queued ({jobId})"`
- Async running: `"{operation}: {status} ({progress}%) {message}"`
- Guardrail failure: `"Blocked by guardrail: {reason}"`
- Empty state: `"No {item} yet. {next_action}."`
