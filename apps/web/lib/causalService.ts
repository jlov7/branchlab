import { analyzeTracePhysics, compareTracePhysics } from "@branchlab/core";
import { compareRunsById } from "./compareService";
import { listInvestigations } from "./investigationService";
import { getRun, getRunTraceIrEvents, getTraceFingerprint, listBranchesForRun } from "./runsRepo";
import { listSpanAnnotations } from "./spanAnnotationService";

export function getCausalDebugger(runId: string, branchRunId?: string) {
  const run = getRun(runId);
  const traceIr = getRunTraceIrEvents(runId);
  const physics = analyzeTracePhysics(traceIr, { trustExistingHashes: true });
  const branches = listBranchesForRun(runId);
  const investigations = listInvestigations(runId, 20);
  const annotations = listSpanAnnotations({ runId, limit: 50 });
  const fingerprint = getTraceFingerprint(runId);

  if (!branchRunId) {
    return {
      run,
      fingerprint,
      graph: physics.graph,
      tracePhysics: physics,
      branches,
      investigations,
      annotations,
      compare: null,
      candidates: [],
    };
  }

  const branchTraceIr = getRunTraceIrEvents(branchRunId);
  const compare = compareTracePhysics(traceIr, branchTraceIr, { trustExistingHashes: true });
  return {
    run,
    fingerprint,
    graph: physics.graph,
    tracePhysics: physics,
    branches,
    investigations,
    annotations,
    compare,
    candidates: compare.candidates,
    fullCompare: compareRunsById(runId, branchRunId),
  };
}
