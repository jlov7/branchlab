# References / Inspiration (non-exhaustive)

This project intentionally connects several emerging threads:

- Agent Record & Replay (AgentRR): record agent traces, summarize to experiences, replay in similar tasks.
  - arXiv: https://arxiv.org/abs/2505.17716

- Counterfactual replay for failure attribution (AgenTracer): label earliest decisive error step via counterfactual substitutions.
  - arXiv: https://arxiv.org/abs/2509.03312

- Trace-aware evaluation from traces (offline reuse of traces for evaluation):
  - MLflow traces docs: https://mlflow.org/docs/latest/genai/eval-monitor/running-evaluation/traces/

- Counterfactual reasoning about alternative intents (“what if I phrased it differently?”):
  - arXiv: https://arxiv.org/html/2601.20090v2

- Policy-as-code:
  - Open Policy Agent docs: https://openpolicyagent.org/docs

Community signals:
- HN: Memory API for AI agents (rollback, replay, semantic search): https://news.ycombinator.com/item?id=47165714
- HN: AgentDbg local-first debugger for AI agents: https://news.ycombinator.com/item?id=47125760
- Reddit: Replay is not re-execution (reproducibility gap): https://www.reddit.com/r/LLMDevs/comments/1r0fzyc/replay_is_not_reexecution_the_reproducibility_gap/
