import { describe, expect, it } from "vitest";
import { evaluateYamlPolicy, parseYamlPolicy, summarizePolicy } from "../src";

const policyText = `
version: 1
rules:
  - id: hold_price_outlier
    when:
      tool: ["pricing.lookup"]
      result:
        price_gt: 500
    then:
      decision: hold
      severity: medium
      reason: "High price requires review"
`;

describe("yaml policy backend", () => {
  it("parses and evaluates rules", async () => {
    const policy = parseYamlPolicy(policyText);
    const records = await evaluateYamlPolicy(policy, [
      {
        callId: "c1",
        tool: "pricing.lookup",
        result: { price: 600 },
      },
      {
        callId: "c2",
        tool: "fs.read",
        result: {},
      },
    ]);

    expect(records[0]?.decision.decision).toBe("hold");
    expect(records[1]?.decision.decision).toBe("allow");

    const summary = summarizePolicy(records);
    expect(summary.violations).toBe(1);
    expect(summary.byDecision.hold).toBe(1);
  });

  it("evaluates v2 risk, PII, and secret conditions", async () => {
    const policy = parseYamlPolicy(`
version: 2
rules:
  - id: block_secret_network
    when:
      tool_risk_at_least: high
      args:
        secret: true
    then:
      decision: deny
      severity: critical
      reason: "High-risk tool contains secret material"
  - id: hold_pii_result
    when:
      result:
        pii: true
    then:
      decision: hold
      severity: high
      reason: "PII in tool output requires review"
`);

    const records = await evaluateYamlPolicy(policy, [
      {
        callId: "c1",
        tool: "http.post",
        args: { token: "sk_abcdef1234567890" },
      },
      {
        callId: "c2",
        tool: "pricing.lookup",
        result: { contact: "alice@example.com" },
      },
    ]);

    expect(records[0]?.decision.decision).toBe("deny");
    expect(records[0]?.decision.severity).toBe("critical");
    expect(records[0]?.meta?.matchedSignals).toContain("args:secret");
    expect(records[1]?.decision.decision).toBe("hold");
    expect(records[1]?.meta?.matchedSignals).toContain("result:pii");
  });
});
