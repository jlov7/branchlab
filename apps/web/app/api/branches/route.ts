import type { BranchSpec } from "@branchlab/core";
import { createBranch } from "@/lib/branchService";
import { badRequest, ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as Partial<BranchSpec>;
    if (!body.parentRunId || !body.forkEventId || !body.intervention || !body.mode) {
      return badRequest("Missing required branch fields");
    }

    const result = await withLock("runs:branch", async () => createBranch(body as BranchSpec));
    return ok(result);
  } catch (error) {
    return serverError("Failed to create branch", error);
  }
}
