import YAML from "yaml";
import type {
  PolicyDecisionRecord,
  PolicyEvalInput,
  YamlRule,
  YamlRulePolicy,
} from "./types";

export function parseYamlPolicy(content: string): YamlRulePolicy {
  const parsed = YAML.parse(content) as Partial<YamlRulePolicy>;
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.rules)) {
    throw new Error("Invalid YAML policy: missing rules array");
  }

  return {
    version: Number(parsed.version ?? 1),
    name: parsed.name,
    description: parsed.description,
    rules: parsed.rules as YamlRule[],
  };
}

export async function evaluateYamlPolicy(
  policy: YamlRulePolicy,
  calls: PolicyEvalInput[],
): Promise<PolicyDecisionRecord[]> {
  const records: PolicyDecisionRecord[] = [];

  for (const call of calls) {
    const matched = policy.rules.find((rule) => matchesRule(rule, call));

    if (!matched) {
      records.push({
        callId: call.callId,
        tool: call.tool,
        decision: {
          decision: "allow",
          severity: "low",
          ruleId: "default_allow",
          reason: "No matching rule",
        },
      });
      continue;
    }

    records.push({
      callId: call.callId,
      tool: call.tool,
      decision: {
        decision: matched.then.decision,
        severity: matched.then.severity,
        ruleId: matched.id,
        reason: matched.then.reason,
        remediation: matched.then.remediation,
      },
    });
  }

  return records;
}

function matchesRule(rule: YamlRule, call: PolicyEvalInput): boolean {
  const tools = rule.when.tool;
  if (Array.isArray(tools) && tools.length > 0 && !tools.includes(call.tool)) {
    return false;
  }

  const resultConditions = rule.when.result;
  if (resultConditions?.price_gt !== undefined) {
    const price = call.result?.price;
    if (typeof price !== "number" || !(price > resultConditions.price_gt)) {
      return false;
    }
  }

  return true;
}
