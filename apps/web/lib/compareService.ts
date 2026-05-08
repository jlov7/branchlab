import { compareRuns, compareTracePhysics, suggestBlameCandidates } from "@branchlab/core";
import { getAllRunEvents, getRun, getRunTraceIrEvents, getTraceFingerprint } from "./runsRepo";

export function compareRunsById(parentRunId: string, branchRunId: string) {
  const parentFingerprint = getTraceFingerprint(parentRunId);
  const branchFingerprint = getTraceFingerprint(branchRunId);

  if (parentFingerprint && branchFingerprint && parentFingerprint.fingerprint === branchFingerprint.fingerprint) {
    const parentRun = getRun(parentRunId);
    const branchRun = getRun(branchRunId);
    return {
      compare: {
        divergence: {
          firstDivergenceEventId: null,
          firstDivergenceIndex: -1,
        },
        changes: [],
        stats: {
          added: 0,
          removed: 0,
          modified: 0,
        },
        deltas: {
          costUsd: 0,
          policyViolations: 0,
          outcome: {
            from: parentRun?.status ?? "unknown",
            to: branchRun?.status ?? "unknown",
          },
          toolErrorRate: 0,
        },
      },
      blame: [],
      causal: {
        parentFingerprint: parentFingerprint.fingerprint,
        branchFingerprint: branchFingerprint.fingerprint,
        firstDivergenceSpanId: null,
        firstDivergenceSequence: -1,
        changes: [],
        heatmap: {},
      },
      causalCandidates: [],
      tracePhysics: null,
      fingerprints: {
        parent: parentFingerprint,
        branch: branchFingerprint,
      },
    };
  }

  const parent = getAllRunEvents(parentRunId);
  const branch = getAllRunEvents(branchRunId);
  const parentTraceIr = getRunTraceIrEvents(parentRunId);
  const branchTraceIr = getRunTraceIrEvents(branchRunId);

  const compare = compareRuns(parent, branch);
  const blame = suggestBlameCandidates(parent, branch);
  const tracePhysics = compareTracePhysics(parentTraceIr, branchTraceIr, { trustExistingHashes: true });

  return {
    compare,
    blame,
    causal: {
      parentFingerprint: tracePhysics.parentFingerprint,
      branchFingerprint: tracePhysics.branchFingerprint,
      firstDivergenceSpanId: tracePhysics.firstDivergenceSpanId,
      firstDivergenceSequence: tracePhysics.firstDivergenceSequence,
      changes: tracePhysics.changes,
      heatmap: tracePhysics.heatmap,
    },
    causalCandidates: tracePhysics.candidates,
    tracePhysics,
    fingerprints: {
      parent: parentFingerprint,
      branch: branchFingerprint,
    },
  };
}
