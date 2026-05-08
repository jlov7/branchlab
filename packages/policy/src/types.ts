export type PolicyDecisionValue = "allow" | "deny" | "hold";

export interface PolicyDecision {
  decision: PolicyDecisionValue;
  severity: "low" | "medium" | "high" | "critical";
  ruleId: string;
  reason: string;
  remediation?: string;
}

export interface PolicyEvalInput {
  callId: string;
  tool: string;
  args?: Record<string, unknown>;
  result?: Record<string, unknown>;
}

export interface PolicyEvalSummary {
  totalCalls: number;
  violations: number;
  byDecision: Record<PolicyDecisionValue, number>;
  byTool: Record<string, number>;
}

export interface YamlRule {
  id: string;
  when: {
    tool?: string[];
    args?: {
      contains?: string;
      pii?: boolean;
      secret?: boolean;
    };
    result?: {
      price_gt?: number;
      contains?: string;
      pii?: boolean;
      secret?: boolean;
    };
    tool_risk_at_least?: "low" | "medium" | "high" | "critical";
  };
  then: {
    decision: PolicyDecisionValue;
    severity: "low" | "medium" | "high" | "critical";
    reason: string;
    remediation?: string;
  };
}

export interface YamlRulePolicy {
  version: number;
  name?: string;
  description?: string;
  rules: YamlRule[];
}

export interface RegoPolicyBundle {
  entrypoint: string;
  wasm: Uint8Array;
}

export interface PolicyBackend {
  id: "yaml" | "rego_wasm";
  evaluate(calls: PolicyEvalInput[]): Promise<PolicyDecisionRecord[]>;
}

export interface PolicyDecisionRecord {
  callId: string;
  tool: string;
  decision: PolicyDecision;
  meta?: Record<string, unknown>;
}
