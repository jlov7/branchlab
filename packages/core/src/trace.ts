import type { EventType, NormalizedEvent } from "./types";

const EVENT_TYPES = new Set<EventType>([
  "run.start",
  "run.end",
  "llm.request",
  "llm.response",
  "tool.request",
  "tool.response",
  "memory.read",
  "memory.write",
  "policy.decision",
  "error",
  "note",
]);

export interface ParseIssue {
  line: number;
  reason: string;
}

export interface ParseTraceResult {
  events: NormalizedEvent[];
  issues: ParseIssue[];
  partialParse: boolean;
}

export function parseTraceLines(lines: Iterable<string>): ParseTraceResult {
  const events: NormalizedEvent[] = [];
  const issues: ParseIssue[] = [];
  let lineNo = 0;

  for (const line of lines) {
    lineNo += 1;
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      const normalized = normalizeEvent(parsed);
      if (!normalized) {
        issues.push({ line: lineNo, reason: "Missing required fields or invalid type" });
        continue;
      }
      events.push(normalized);
    } catch {
      issues.push({ line: lineNo, reason: "Invalid JSON" });
      events.push({
        schema: "branchlab.trace.v1",
        run_id: "partial_parse",
        event_id: `note_${lineNo}`,
        ts: new Date().toISOString(),
        type: "note",
        data: { raw_line: trimmed, reason: "invalid_json" },
      });
    }
  }

  const runId = events.find((event) => event.run_id)?.run_id;
  if (runId) {
    for (const event of events) {
      event.run_id = runId;
    }
  }

  return {
    events,
    issues,
    partialParse: issues.length > 0,
  };
}

export function normalizeEvent(raw: Record<string, unknown>): NormalizedEvent | null {
  const external = normalizeExternalProviderEvent(raw);
  if (external) {
    return external;
  }

  const schema = typeof raw.schema === "string" ? raw.schema : "branchlab.trace.v1";
  const runId = raw.run_id ?? raw.runId;
  const eventId = raw.event_id ?? raw.eventId ?? raw.id;
  const ts = raw.ts ?? raw.timestamp;
  const type = raw.type ?? raw.event_type;
  const data = raw.data ?? raw.payload;

  if (
    (schema !== "branchlab.trace.v1" && schema !== "branchlab.trace.v0" && schema !== "agent.trace.v1") ||
    typeof runId !== "string" ||
    typeof eventId !== "string" ||
    typeof ts !== "string" ||
    typeof type !== "string" ||
    !EVENT_TYPES.has(type as EventType) ||
    typeof data !== "object" ||
    data === null
  ) {
    return null;
  }

  const event: NormalizedEvent = {
    schema: "branchlab.trace.v1",
    run_id: runId,
    event_id: eventId,
    ts,
    type: type as EventType,
    data: data as Record<string, unknown>,
  };

  if (typeof raw.parent_event_id === "string") {
    event.parent_event_id = raw.parent_event_id;
  }

  if (raw.meta && typeof raw.meta === "object") {
    event.meta = raw.meta as Record<string, unknown>;
  }

  return event;
}

function normalizeExternalProviderEvent(raw: Record<string, unknown>): NormalizedEvent | null {
  const provider = raw.provider;
  const type = raw.type;
  if (provider !== "openai" && provider !== "anthropic") {
    return null;
  }
  if (typeof type !== "string") {
    return null;
  }

  const runId = typeof raw.run_id === "string" ? raw.run_id : `run_${provider}`;
  const ts = typeof raw.ts === "string" ? raw.ts : new Date().toISOString();
  const fallbackId = `${provider}_${type}_${Date.now()}`;

  if (provider === "openai") {
    const response = raw.response && typeof raw.response === "object" ? (raw.response as Record<string, unknown>) : {};
    const callId = typeof response.id === "string" ? response.id : raw.call_id;
    if (type === "response.created" && typeof callId === "string") {
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "llm.request",
        data: {
          call_id: callId,
          messages: [],
        },
      };
    }

    if (type === "response.completed" && typeof callId === "string") {
      const outputText = typeof response.output_text === "string" ? response.output_text : raw.output_text;
      const status = response.status;
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "llm.response",
        data: {
          call_id: callId,
          text: typeof outputText === "string" ? outputText : "",
          outcome: status === "completed" ? "success" : "unknown",
        },
      };
    }

    if (type === "response.failed" && typeof callId === "string") {
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "error",
        data: {
          call_id: callId,
          message: typeof raw.error === "string" ? raw.error : "OpenAI response failed",
        },
      };
    }
  }

  if (provider === "anthropic") {
    const message = raw.message && typeof raw.message === "object" ? (raw.message as Record<string, unknown>) : {};
    const callId = typeof message.id === "string" ? message.id : raw.call_id;

    if (type === "message_start" && typeof callId === "string") {
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "llm.request",
        data: {
          call_id: callId,
          messages: [],
        },
      };
    }

    if (type === "message_stop" && typeof callId === "string") {
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "llm.response",
        data: {
          call_id: callId,
          text: typeof raw.output_text === "string" ? raw.output_text : "",
          outcome: "success",
        },
      };
    }

    if (type === "tool_use") {
      const name = raw.name;
      const call = raw.call_id;
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "tool.request",
        data: {
          call_id: typeof call === "string" ? call : fallbackId,
          tool: typeof name === "string" ? name : "tool.unknown",
          args: raw.args && typeof raw.args === "object" ? raw.args : {},
        },
      };
    }

    if (type === "tool_result") {
      return {
        schema: "branchlab.trace.v1",
        run_id: runId,
        event_id: typeof raw.event_id === "string" ? raw.event_id : fallbackId,
        ts,
        type: "tool.response",
        data: {
          call_id: typeof raw.call_id === "string" ? raw.call_id : fallbackId,
          tool: typeof raw.name === "string" ? raw.name : "tool.unknown",
          result: raw.result && typeof raw.result === "object" ? raw.result : {},
        },
      };
    }
  }

  return null;
}
