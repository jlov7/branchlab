import { loadPolicy } from "@open-policy-agent/opa-wasm";
import type {
  PolicyDecision,
  PolicyDecisionRecord,
  PolicyEvalInput,
  RegoPolicyBundle,
} from "./types";

export async function evaluateRegoPolicy(
  bundle: RegoPolicyBundle,
  calls: PolicyEvalInput[],
): Promise<PolicyDecisionRecord[]> {
  const policy = await loadPolicy(bundle.wasm);
  const records: PolicyDecisionRecord[] = [];

  for (const call of calls) {
    const resultSet = policy.evaluate({ input: call, entrypoint: bundle.entrypoint });
    const firstResult = Array.isArray(resultSet) && resultSet.length > 0 ? resultSet[0]?.result : undefined;

    records.push({
      callId: call.callId,
      tool: call.tool,
      decision: parseDecision(firstResult),
    });
  }

  return records;
}

function parseDecision(raw: unknown): PolicyDecision {
  if (typeof raw === "boolean") {
    return {
      decision: raw ? "allow" : "deny",
      severity: raw ? "low" : "high",
      ruleId: "rego_boolean",
      reason: raw ? "Allowed by policy" : "Denied by policy",
    };
  }

  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    const decision = obj.decision;
    const severity = obj.severity;
    const reason = obj.reason;
    const ruleId = obj.rule_id;

    if (
      (decision === "allow" || decision === "deny" || decision === "hold") &&
      (severity === "low" || severity === "medium" || severity === "high" || severity === "critical") &&
      typeof reason === "string"
    ) {
      return {
        decision,
        severity,
        reason,
        ruleId: typeof ruleId === "string" ? ruleId : "rego",
      };
    }
  }

  return {
    decision: "hold",
    severity: "medium",
    ruleId: "rego_unknown",
    reason: "Policy returned unrecognized structure",
  };
}
