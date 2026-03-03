# One-shot prompt for Codex

Copy/paste into Codex as-is.

---

You are building **Agent Twin Lab (BranchLab)**.

Read `AGENTS.md` and everything in `/docs` first. Then implement the full product end-to-end.

Hard requirements:
- Local-first web app (Next.js) with an exceptional UX (see `/docs/UX_UI_SPEC.md`).
- Import JSONL traces and render a timeline replay UI.
- Fork (“counterfactual branch”) a run at a selected step:
  - Replay-only branch (no re-execution)
  - Re-execution branch (LLM calls can re-run; tool calls are stubbed by trace artifacts unless user opts in)
- Compare parent vs branch: diff on tool calls, memory reads/writes, policy outcomes, costs, final result.
- Policy simulation: load policies and evaluate tool calls across runs (OPA/Rego WASM + simple built-in rules).
- “Blame” suggestion: find earliest step where an alternative would likely flip outcome, using bisection over candidate interventions.
- Export shareable report bundle (HTML + JSON) for internal sharing.

Definition of done:
- `make setup && make dev` works
- `make check` passes
- `make e2e` passes
- `make demo` works and the demo script in `/docs/DEMO_SCRIPT.md` is accurate
- README is world-class and screenshots/diagrams are included

Do not stop early. Keep going until the gates pass and the product looks polished.
