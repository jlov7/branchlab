import type {
  PolicyDecisionRecord,
  PolicyDecisionValue,
  PolicyEvalSummary,
} from "./types";

export function summarizePolicy(records: PolicyDecisionRecord[]): PolicyEvalSummary {
  const byDecision: Record<PolicyDecisionValue, number> = {
    allow: 0,
    deny: 0,
    hold: 0,
  };

  const byTool: Record<string, number> = {};
  for (const record of records) {
    byDecision[record.decision.decision] += 1;
    byTool[record.tool] = (byTool[record.tool] ?? 0) + 1;
  }

  return {
    totalCalls: records.length,
    violations: byDecision.deny + byDecision.hold,
    byDecision,
    byTool,
  };
}
