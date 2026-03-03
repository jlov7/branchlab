import type { NormalizedEvent } from "./types";

export function determineOutcome(events: NormalizedEvent[]): "success" | "fail" | "unknown" {
  const runEnd = [...events].reverse().find((event) => event.type === "run.end");
  const fromRunEnd = runEnd?.data?.status;
  if (fromRunEnd === "success" || fromRunEnd === "fail") {
    return fromRunEnd;
  }

  const llmResponse = [...events].reverse().find((event) => event.type === "llm.response");
  const fromLlm = llmResponse?.data?.outcome;
  if (fromLlm === "success" || fromLlm === "fail") {
    return fromLlm;
  }

  return "unknown";
}
