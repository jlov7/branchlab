import {
  applyReplayIntervention,
  determineOutcome,
  type BranchSpec,
  type NormalizedEvent,
} from "@branchlab/core";
import { createBranchRecord, getAllRunEvents, saveRun } from "./runsRepo";
import { getSettings, listProviders } from "./settings";
import { executeWithProvider } from "./providers";
import { recordRuntimeExecution } from "./runtimeService";

export interface CreateBranchResult {
  branchId: string;
  branchRunId: string;
  status: "success" | "fail" | "unknown";
  mode: "replay" | "reexec";
}

export async function createBranch(spec: BranchSpec): Promise<CreateBranchResult> {
  const parentEvents = getAllRunEvents(spec.parentRunId);
  const replay = applyReplayIntervention(parentEvents, spec.forkEventId, spec.intervention);

  const branchRunId = `${spec.parentRunId}__branch_${Date.now()}`;
  let branchEvents = replay.events.map((event) => ({
    ...event,
    run_id: branchRunId,
  }));

  if (spec.mode === "reexec") {
    branchEvents = await reexecuteEvents({
      events: branchEvents,
      forkEventId: spec.forkEventId,
      providerId: spec.providerId,
      allowLiveTools: spec.allowLiveTools ?? false,
      liveToolAllowlist: spec.liveToolAllowlist,
    });
  }

  const saved = saveRun({
    runId: branchRunId,
    source: `branch:${spec.parentRunId}`,
    mode: spec.mode,
    events: branchEvents,
    partialParse: false,
    issues: [],
  });

  const branchId = createBranchRecord({
    parentRunId: spec.parentRunId,
    forkEventId: spec.forkEventId,
    branchRunId: saved.runId,
    intervention: spec.intervention,
  });
  const settings = getSettings();
  const allowlist = spec.liveToolAllowlist?.length ? spec.liveToolAllowlist : settings.liveToolAllowlist;
  recordRuntimeExecution({
    parentRunId: spec.parentRunId,
    branchRunId: saved.runId,
    mode: spec.mode,
    providerId: spec.providerId,
    allowLiveTools: spec.allowLiveTools ?? false,
    liveToolAllowlist: allowlist,
    budget: {
      maxCalls: settings.reexecMaxCalls,
      maxTokens: settings.reexecMaxTokens,
      maxCostUsd: settings.reexecMaxCostUsd,
    },
    sideEffects: {
      liveToolsEnabled: spec.allowLiveTools ?? false,
      expectedExternalCalls: spec.mode === "reexec" ? branchEvents.filter((event) => event.type === "llm.request").length : 0,
      notes:
        spec.mode === "reexec"
          ? ["Model calls require provider configuration; tool calls are stubbed unless allowlisted."]
          : ["Replay branch uses recorded artifacts only."],
    },
    status: determineOutcome(branchEvents),
  });

  return {
    branchId,
    branchRunId: saved.runId,
    status: determineOutcome(branchEvents),
    mode: spec.mode,
  };
}

async function reexecuteEvents(args: {
  events: NormalizedEvent[];
  forkEventId: string;
  providerId?: string;
  allowLiveTools: boolean;
  liveToolAllowlist?: string[];
}): Promise<NormalizedEvent[]> {
  const settings = getSettings();
  const providers = listProviders().filter((provider) => provider.enabled);
  const provider = providers.find((item) => item.id === args.providerId) ?? providers[0];

  if (!provider) {
    return [
      ...args.events,
      {
        schema: "branchlab.trace.v1",
        run_id: args.events[0]?.run_id ?? "branch",
        event_id: `note_reexec_${Date.now()}`,
        ts: new Date().toISOString(),
        type: "note",
        data: {
          reason: "Re-execution requested but no enabled provider found",
        },
      },
    ];
  }

  if (args.allowLiveTools) {
    const allowlist = args.liveToolAllowlist?.length
      ? args.liveToolAllowlist
      : settings.liveToolAllowlist;
    if (allowlist.length === 0) {
      throw new Error(
        "Live tool execution requires an explicit allowlist in branch request or settings.liveToolAllowlist.",
      );
    }
    args.events.push({
      schema: "branchlab.trace.v1",
      run_id: args.events[0]?.run_id ?? "branch",
      event_id: `note_live_tools_${Date.now()}`,
      ts: new Date().toISOString(),
      type: "note",
      data: {
        allowlist,
        warning: "Live tool calls enabled for this branch. External side effects may occur.",
      },
    });

    const forbiddenTool = args.events
      .slice(startIndexForFork(args.events, args.forkEventId))
      .find((event) => {
        if (event.type !== "tool.request") {
          return false;
        }
        const tool = event.data.tool;
        return typeof tool === "string" && !allowlist.includes(tool);
      });
    if (forbiddenTool) {
      markRunFailed(args.events, "Live tool allowlist violation");
      args.events.push({
        schema: "branchlab.trace.v1",
        run_id: args.events[0]?.run_id ?? "branch",
        event_id: `error_reexec_live_tool_allowlist_${Date.now()}`,
        ts: new Date().toISOString(),
        type: "error",
        data: {
          message: "Tool is not in live tool allowlist",
          tool: forbiddenTool.data.tool,
          allowlist,
        },
      });
      return args.events;
    }
  } else {
    const stubbedCount = args.events
      .slice(startIndexForFork(args.events, args.forkEventId))
      .filter((event) => event.type === "tool.request").length;
    if (stubbedCount > 0) {
      args.events.push({
        schema: "branchlab.trace.v1",
        run_id: args.events[0]?.run_id ?? "branch",
        event_id: `note_reexec_stubbed_tools_${Date.now()}`,
        ts: new Date().toISOString(),
        type: "note",
        data: {
          message: "Live tool calls disabled. Recorded tool outputs are used as stubs.",
          stubbedToolCalls: stubbedCount,
        },
      });
    }
  }

  const start = startIndexForFork(args.events, args.forkEventId);
  let callCount = 0;
  let tokenCount = 0;
  let costUsd = 0;

  for (let index = start; index < args.events.length; index += 1) {
    const requestEvent = args.events[index];
    if (!requestEvent) {
      continue;
    }
    if (requestEvent.type !== "llm.request") {
      continue;
    }

    callCount += 1;
    if (callCount > settings.reexecMaxCalls) {
      markRunFailed(args.events, "Re-execution call limit exceeded");
      args.events.push({
        schema: "branchlab.trace.v1",
        run_id: args.events[0]?.run_id ?? "branch",
        event_id: `error_reexec_guardrail_calls_${Date.now()}`,
        ts: new Date().toISOString(),
        type: "error",
        data: {
          message: "Re-execution call limit exceeded",
          limit: settings.reexecMaxCalls,
        },
      });
      break;
    }

    const messagesRaw = requestEvent.data.messages;
    if (!Array.isArray(messagesRaw)) {
      continue;
    }

    try {
      const response = await executeWithProvider(provider, {
        messages: messagesRaw
          .map((item) => {
            if (!item || typeof item !== "object") {
              return null;
            }

            const role = (item as Record<string, unknown>).role;
            const content = (item as Record<string, unknown>).content;
            if (
              (role === "system" || role === "user" || role === "assistant") &&
              typeof content === "string"
            ) {
              return {
                role,
                content,
              } as const;
            }

            return null;
          })
          .filter((item): item is { role: "system" | "user" | "assistant"; content: string } => item !== null),
      });

      const callId = requestEvent.data.call_id;
      if (typeof callId !== "string") {
        continue;
      }

      const responseEvent = args.events.find(
        (event) => event.type === "llm.response" && event.data.call_id === callId,
      );

      if (responseEvent) {
        responseEvent.data = {
          ...responseEvent.data,
          text: response.outputText,
          outcome: "unknown",
        };
        responseEvent.meta = {
          ...responseEvent.meta,
          provider: provider.id,
          reexecuted: true,
          tokens_in: response.usage?.inputTokens,
          tokens_out: response.usage?.outputTokens,
        };
      }

      const callTokens = (response.usage?.inputTokens ?? 0) + (response.usage?.outputTokens ?? 0);
      tokenCount += callTokens;
      costUsd += callTokens * 0.000002;
      if (tokenCount > settings.reexecMaxTokens || costUsd > settings.reexecMaxCostUsd) {
        markRunFailed(args.events, "Re-execution budget exceeded");
        args.events.push({
          schema: "branchlab.trace.v1",
          run_id: args.events[0]?.run_id ?? "branch",
          event_id: `error_reexec_guardrail_budget_${Date.now()}`,
          ts: new Date().toISOString(),
          type: "error",
          data: {
            message: "Re-execution budget exceeded",
            tokenCount,
            tokenLimit: settings.reexecMaxTokens,
            costUsd,
            costLimitUsd: settings.reexecMaxCostUsd,
          },
        });
        break;
      }
    } catch (error) {
      markRunFailed(args.events, "Provider execution error");
      args.events.push({
        schema: "branchlab.trace.v1",
        run_id: args.events[0]?.run_id ?? "branch",
        event_id: `error_reexec_${Date.now()}`,
        ts: new Date().toISOString(),
        type: "error",
        data: {
          message: error instanceof Error ? error.message : String(error),
          provider: provider.id,
        },
      });
    }
  }

  return args.events;
}

function startIndexForFork(events: NormalizedEvent[], forkEventId: string): number {
  const forkIndex = events.findIndex((event) => event.event_id === forkEventId);
  return forkIndex >= 0 ? forkIndex : 0;
}

function markRunFailed(events: NormalizedEvent[], reason: string): void {
  const runEnd = [...events].reverse().find((event) => event.type === "run.end");
  if (runEnd) {
    runEnd.data = {
      ...runEnd.data,
      status: "fail",
      guardrail_reason: reason,
    };
  }
}
