import { getCausalDebugger } from "@/lib/causalService";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get("runId");
    const branchRunId = url.searchParams.get("branchRunId") ?? undefined;
    if (!runId) {
      return badRequest("runId is required");
    }

    return ok(getCausalDebugger(runId, branchRunId));
  } catch (error) {
    return serverError("Failed to load causal debugger", error);
  }
}
