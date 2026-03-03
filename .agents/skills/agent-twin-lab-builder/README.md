# agent-twin-lab-builder (Codex Skill)

Use this skill to build the entire BranchLab product from the repo specs.

Recommended invocation:

> Build Agent Twin Lab end-to-end. Read AGENTS.md and docs/*.md first. Do not stop until make dev/check/e2e/demo pass.

This skill assumes:
- Next.js + TypeScript UI
- local SQLite + blob store under `.atl/`
- streaming JSONL ingestion
- replay + fork + compare + policy lab
