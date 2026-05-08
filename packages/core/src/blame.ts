import { determineOutcome } from "./outcome";
import { compareRuns } from "./diff";
import type { BlameCandidate, NormalizedEvent } from "./types";

export function suggestBlameCandidates(
  events: NormalizedEvent[],
  branchEvents?: NormalizedEvent[],
): BlameCandidate[] {
  const candidates: BlameCandidate[] = [];

  for (const event of events) {
    if (event.type === "tool.response") {
      candidates.push({
        eventId: event.event_id,
        type: event.type,
        rationale: "Tool output directly influences downstream reasoning and can flip outcome.",
        confidence: 0.9,
      });
    }

    if (event.type === "llm.request") {
      candidates.push({
        eventId: event.event_id,
        type: event.type,
        rationale: "Prompt framing affects model decisions before tool usage.",
        confidence: 0.72,
      });
    }

    if (event.type === "memory.read") {
      candidates.push({
        eventId: event.event_id,
        type: event.type,
        rationale: "Retrieved memory can bias subsequent generation.",
        confidence: 0.64,
      });
    }
  }

  if (branchEvents && determineOutcome(events) !== determineOutcome(branchEvents)) {
    const diff = compareRuns(events, branchEvents);
    const changed = diff.changes.find((change) => change.kind === "modified");
    if (changed) {
      candidates.push({
        eventId: changed.eventId,
        type: (changed.after?.type ?? changed.before?.type ?? "note") as BlameCandidate["type"],
        rationale: "Outcome flipped and this is the first modified event across compared runs.",
        confidence: 0.94,
      });
    }
  }

  if (candidates.length === 0) {
    const fallback = bisectionFallback(events);
    if (fallback) {
      candidates.push(fallback);
    }
  }

  return dedupeCandidates(candidates)
    .sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return a.eventId.localeCompare(b.eventId);
    })
    .slice(0, 3);
}

function dedupeCandidates(candidates: BlameCandidate[]): BlameCandidate[] {
  const best = new Map<string, BlameCandidate>();
  for (const candidate of candidates) {
    const current = best.get(candidate.eventId);
    if (!current || candidate.confidence > current.confidence) {
      best.set(candidate.eventId, candidate);
    }
  }
  return [...best.values()];
}

function bisectionFallback(events: NormalizedEvent[]): BlameCandidate | null {
  if (events.length === 0) {
    return null;
  }
  const midpoint = events[Math.floor(events.length / 2)];
  if (!midpoint) {
    return null;
  }
  return {
    eventId: midpoint.event_id,
    type: midpoint.type,
    rationale: "No direct flip candidate found; selected midpoint via bisection fallback for further narrowing.",
    confidence: 0.45,
  };
}
