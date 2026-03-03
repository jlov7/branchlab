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
});
