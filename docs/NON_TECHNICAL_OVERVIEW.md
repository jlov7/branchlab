# BranchLab Non-Technical Overview

## What BranchLab Is

BranchLab is a local-first product for understanding and improving AI agent behavior.

Think of it as a "flight recorder + simulation lab" for AI workflows:
- It records what happened.
- It lets teams test "what if we changed this one step?"
- It helps teams make policy and reliability decisions with evidence.

## Why It Matters

Teams shipping AI agents often struggle with three problems:

1. Failures are hard to explain.
2. Policy changes are risky to roll out blind.
3. Reviews become opinion-based instead of evidence-based.

BranchLab solves this by giving every run a reproducible trace, a structured branching workflow, and a side-by-side comparison view.

## Who Uses It

- Reliability and platform engineers: root-cause failures and regressions.
- Product teams: review behavior changes and customer impact.
- Governance and security teams: test policy effects before production.
- Leadership: get concise decision-ready reports with supporting evidence.

## The Core Story In 60 Seconds

1. Import a real agent trace.
2. Replay exactly what happened.
3. Fork a branch at a key step.
4. Apply one controlled intervention.
5. Compare outcomes and identify first divergence.
6. Run policy simulation and export a redacted report.

## Business Value

- Faster incident analysis and lower time-to-fix.
- Lower rollout risk for policy and prompt changes.
- Stronger cross-team alignment through shared evidence.
- Better auditability and communication quality.

## Safety And Trust Defaults

- Local-first storage by default.
- Redacted exports by default.
- Re-execution is explicit opt-in.
- Tool access in re-execution is deny-by-default unless allowlisted.

## What "Done" Looks Like

A high-quality BranchLab workflow produces:
- a clear explanation of what failed,
- one or more validated counterfactuals,
- quantified policy impact,
- and an exportable report suitable for internal review.

For an end-to-end example, use [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
