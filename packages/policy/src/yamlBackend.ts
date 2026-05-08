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
        meta: {
          toolRisk: toolRisk(call.tool),
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
      meta: {
        toolRisk: toolRisk(call.tool),
        matchedSignals: matchedSignals(matched, call),
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

  const risk = rule.when.tool_risk_at_least;
  if (risk && riskRank(toolRisk(call.tool)) < riskRank(risk)) {
    return false;
  }

  const argConditions = rule.when.args;
  if (argConditions?.contains && !stableText(call.args).includes(argConditions.contains)) {
    return false;
  }
  if (argConditions?.pii === true && !containsPii(call.args)) {
    return false;
  }
  if (argConditions?.secret === true && !containsSecret(call.args)) {
    return false;
  }

  const resultConditions = rule.when.result;
  if (resultConditions?.price_gt !== undefined) {
    const price = call.result?.price;
    if (typeof price !== "number" || !(price > resultConditions.price_gt)) {
      return false;
    }
  }
  if (resultConditions?.contains && !stableText(call.result).includes(resultConditions.contains)) {
    return false;
  }
  if (resultConditions?.pii === true && !containsPii(call.result)) {
    return false;
  }
  if (resultConditions?.secret === true && !containsSecret(call.result)) {
    return false;
  }

  return true;
}

function matchedSignals(rule: YamlRule, call: PolicyEvalInput): string[] {
  const signals: string[] = [];
  if (rule.when.tool?.includes(call.tool)) {
    signals.push(`tool:${call.tool}`);
  }
  if (rule.when.tool_risk_at_least) {
    signals.push(`tool_risk:${toolRisk(call.tool)}`);
  }
  if (rule.when.args?.pii && containsPii(call.args)) {
    signals.push("args:pii");
  }
  if (rule.when.args?.secret && containsSecret(call.args)) {
    signals.push("args:secret");
  }
  if (rule.when.result?.pii && containsPii(call.result)) {
    signals.push("result:pii");
  }
  if (rule.when.result?.secret && containsSecret(call.result)) {
    signals.push("result:secret");
  }
  return signals;
}

function toolRisk(tool: string): "low" | "medium" | "high" | "critical" {
  if (/delete|write|exec|shell|browser|http|network|email|payment/i.test(tool)) {
    return /delete|exec|shell|payment/i.test(tool) ? "critical" : "high";
  }
  if (/read|search|lookup|retriev/i.test(tool)) {
    return "medium";
  }
  return "low";
}

function riskRank(risk: "low" | "medium" | "high" | "critical"): number {
  return { low: 1, medium: 2, high: 3, critical: 4 }[risk];
}

function containsPii(value: unknown): boolean {
  const text = stableText(value);
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) || /\b\+?\d[\d\s().-]{7,}\d\b/.test(text);
}

function containsSecret(value: unknown): boolean {
  return /\b(?:sk|rk|pk)_[A-Za-z0-9]{12,}\b|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}/.test(stableText(value));
}

function stableText(value: unknown): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
