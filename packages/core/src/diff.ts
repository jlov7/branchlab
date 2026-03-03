import { determineOutcome } from "./outcome";
import { scoreRun } from "./scoring";
import type { ChangedEvent, CompareResult, NormalizedEvent } from "./types";

export function compareRuns(parentEvents: NormalizedEvent[], branchEvents: NormalizedEvent[]): CompareResult {
  const maxLen = Math.max(parentEvents.length, branchEvents.length);
  const changes: ChangedEvent[] = [];
  let firstDivergenceIndex = -1;

  for (let index = 0; index < maxLen; index += 1) {
    const before = parentEvents[index];
    const after = branchEvents[index];

    if (!before && after) {
      if (firstDivergenceIndex < 0) {
        firstDivergenceIndex = index;
      }
      changes.push({ eventId: after.event_id, kind: "added", after });
      continue;
    }

    if (before && !after) {
      if (firstDivergenceIndex < 0) {
        firstDivergenceIndex = index;
      }
      changes.push({ eventId: before.event_id, kind: "removed", before });
      continue;
    }

    if (before && after && JSON.stringify(before) !== JSON.stringify(after)) {
      if (firstDivergenceIndex < 0) {
        firstDivergenceIndex = index;
      }
      changes.push({ eventId: after.event_id, kind: "modified", before, after });
    }
  }

  const stats = {
    added: changes.filter((item) => item.kind === "added").length,
    removed: changes.filter((item) => item.kind === "removed").length,
    modified: changes.filter((item) => item.kind === "modified").length,
  };

  const parentScore = scoreRun(parentEvents);
  const branchScore = scoreRun(branchEvents);

  return {
    divergence: {
      firstDivergenceEventId:
        firstDivergenceIndex >= 0 ? (parentEvents[firstDivergenceIndex]?.event_id ?? branchEvents[firstDivergenceIndex]?.event_id ?? null) : null,
      firstDivergenceIndex,
    },
    changes,
    stats,
    deltas: {
      costUsd: round(branchScore.costUsd - parentScore.costUsd),
      policyViolations: branchScore.policyViolationCount - parentScore.policyViolationCount,
      outcome: {
        from: determineOutcome(parentEvents),
        to: determineOutcome(branchEvents),
      },
      toolErrorRate: round(branchScore.toolErrorRate - parentScore.toolErrorRate),
    },
  };
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
