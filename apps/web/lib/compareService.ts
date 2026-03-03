import { compareRuns, suggestBlameCandidates } from "@branchlab/core";
import { getAllRunEvents } from "./runsRepo";

export function compareRunsById(parentRunId: string, branchRunId: string) {
  const parent = getAllRunEvents(parentRunId);
  const branch = getAllRunEvents(branchRunId);

  const compare = compareRuns(parent, branch);
  const blame = suggestBlameCandidates(parent, branch);

  return {
    compare,
    blame,
  };
}
