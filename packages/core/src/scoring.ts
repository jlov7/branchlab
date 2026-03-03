import type { NormalizedEvent, Scorecard } from "./types";

export function scoreRun(events: NormalizedEvent[]): Scorecard {
  const toolResponses = events.filter((event) => event.type === "tool.response");
  const policyDecisions = events.filter((event) => event.type === "policy.decision");
  const toolRequests = events.filter((event) => event.type === "tool.request");
  const llmResponses = events.filter((event) => event.type === "llm.response");

  const toolErrors = toolResponses.filter((event) => Boolean(event.data.error)).length;
  const toolErrorRate = toolResponses.length > 0 ? toolErrors / toolResponses.length : 0;

  const policyViolationCount = policyDecisions.filter((event) => event.data.decision !== "allow").length;

  const repeatedTools = new Map<string, number>();
  for (const event of toolRequests) {
    const tool = event.data.tool;
    if (typeof tool === "string") {
      repeatedTools.set(tool, (repeatedTools.get(tool) ?? 0) + 1);
    }
  }
  const loopSuspected = [...repeatedTools.values()].some((count) => count >= 3);

  const callIds = new Set(
    toolRequests
      .map((event) => event.data.call_id)
      .filter((callId): callId is string => typeof callId === "string"),
  );
  const latestResponse = llmResponses.length > 0 ? llmResponses[llmResponses.length - 1] : undefined;
  const finalText = typeof latestResponse?.data.text === "string" ? latestResponse.data.text : "";
  const groundedCount = [...callIds].filter((callId) => finalText.includes(callId)).length;
  const groundednessProxy = callIds.size > 0 ? groundedCount / callIds.size : 1;

  const tokensIn = events.reduce((acc, event) => acc + numberOrZero(event.meta?.tokens_in), 0);
  const tokensOut = events.reduce((acc, event) => acc + numberOrZero(event.meta?.tokens_out), 0);
  const costUsd = events.reduce((acc, event) => acc + numberOrZero(event.meta?.cost_usd), 0);

  return {
    toolErrorRate,
    policyViolationCount,
    costUsd,
    tokensIn,
    tokensOut,
    loopSuspected,
    groundednessProxy,
  };
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0;
}
