import { determineOutcome } from "./outcome";
import type { InterventionSpec, NormalizedEvent } from "./types";

interface BranchResult {
  events: NormalizedEvent[];
  status: "success" | "fail" | "unknown";
}

export function applyReplayIntervention(
  events: NormalizedEvent[],
  forkEventId: string,
  intervention: InterventionSpec,
): BranchResult {
  const clone = structuredClone(events);
  const forkIndex = clone.findIndex((event) => event.event_id === forkEventId);
  const startIndex = forkIndex >= 0 ? forkIndex : 0;

  if (intervention.kind === "prompt_edit") {
    const edited = clone.slice(startIndex).find((event) => {
      if (event.type !== "llm.request") {
        return false;
      }
      return Array.isArray(event.data.messages);
    });

    if (edited && Array.isArray(edited.data.messages)) {
      const messages = edited.data.messages as Array<Record<string, unknown>>;
      const userIndex = messages.findIndex((message) => message.role === "user" && typeof message.content === "string");
      const targetIndex = userIndex >= 0 ? userIndex : messages.findIndex((message) => typeof message.content === "string");
      if (targetIndex >= 0) {
        messages[targetIndex] = {
          ...messages[targetIndex],
          content: intervention.newPrompt,
        };
      }
    }
  }

  if (intervention.kind === "tool_output_override") {
    const target = clone
      .slice(startIndex)
      .find(
        (event) =>
          event.type === "tool.response" &&
          typeof event.data.call_id === "string" &&
          event.data.call_id === intervention.callId,
      );
    if (target) {
      target.data = {
        ...target.data,
        result: intervention.result,
      };
    }
  }

  if (intervention.kind === "memory_removal") {
    const target = clone.slice(startIndex).find((event) => event.type === "memory.read" && Array.isArray(event.data.items));
    if (target && Array.isArray(target.data.items)) {
      target.data.items = (target.data.items as Array<Record<string, unknown>>).filter(
        (item) => item.id !== intervention.memoryId,
      );
    }
  }

  if (intervention.kind === "policy_override") {
    const requestIndex = clone.findIndex(
      (event) => event.type === "tool.request" && event.data.call_id === intervention.callId,
    );
    if (requestIndex >= 0) {
      const request = clone[requestIndex];
      if (!request) {
        return { events: clone, status: determineOutcome(clone) };
      }
      const policyEvent: NormalizedEvent = {
        schema: "branchlab.trace.v1",
        run_id: request.run_id,
        event_id: `policy_${intervention.callId}_${request.event_id}`,
        ts: request.ts,
        type: "policy.decision",
        parent_event_id: request.event_id,
        data: {
          call_id: intervention.callId,
          decision: intervention.decision,
          rule_id: "manual_override",
          severity: intervention.decision === "allow" ? "low" : "high",
          reason: intervention.reason ?? "Manual policy override",
        },
      };
      clone.splice(requestIndex + 1, 0, policyEvent);
    }
  }

  const status = determineOutcome(clone);
  return { events: clone, status };
}
