import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { normalizeEvent } from "@branchlab/core";
import type { NormalizedEvent } from "@branchlab/core";

export interface IngestIssue {
  line: number;
  reason: string;
}

export interface IngestResult {
  events: NormalizedEvent[];
  issues: IngestIssue[];
  partialParse: boolean;
}

export async function parseUploadedJsonl(file: File): Promise<IngestResult> {
  const stream = Readable.fromWeb(file.stream() as any);
  const rl = createInterface({ input: stream, crlfDelay: Infinity });

  const events: NormalizedEvent[] = [];
  const issues: IngestIssue[] = [];
  let line = 0;

  for await (const rawLine of rl) {
    line += 1;
    ingestLine(rawLine, line, events, issues);
  }

  return finalizeIngest(events, issues);
}

export function parseJsonlText(text: string): IngestResult {
  const events: NormalizedEvent[] = [];
  const issues: IngestIssue[] = [];
  const lines = text.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const lineNo = index + 1;
    ingestLine(lines[index] ?? "", lineNo, events, issues);
  }

  return finalizeIngest(events, issues);
}

function ingestLine(
  rawLine: string,
  line: number,
  events: NormalizedEvent[],
  issues: IngestIssue[],
): void {
  const trimmed = rawLine.trim();
  if (!trimmed) {
    return;
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    const normalized = normalizeEvent(parsed);
    if (!normalized) {
      issues.push({ line, reason: "Missing required fields" });
      return;
    }
    events.push(normalized);
  } catch {
    issues.push({ line, reason: "Invalid JSON" });
  }
}

function finalizeIngest(events: NormalizedEvent[], issues: IngestIssue[]): IngestResult {
  const fallbackRunId = events[0]?.run_id ?? `run_partial_${Date.now()}`;
  if (events.length === 0) {
    events.push({
      schema: "branchlab.trace.v1",
      run_id: fallbackRunId,
      event_id: "note_empty",
      ts: new Date().toISOString(),
      type: "note",
      data: {
        reason: "No valid events parsed",
      },
    });
  }

  for (const event of events) {
    event.run_id = fallbackRunId;
  }

  return {
    events,
    issues,
    partialParse: issues.length > 0,
  };
}
