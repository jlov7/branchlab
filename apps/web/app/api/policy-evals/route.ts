import { badRequest, ok, serverError } from "@/lib/http";
import { createJob, runJob } from "@/lib/jobs";
import { withLock } from "@/lib/lock";
import { evaluatePolicy } from "@/lib/policyService";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { policyId?: string; runIds?: string[]; async?: boolean };
    if (!body.policyId || !Array.isArray(body.runIds) || body.runIds.length === 0) {
      return badRequest("policyId and runIds[] are required");
    }

    if (body.async) {
      const job = createJob("policy_eval", {
        policyId: body.policyId,
        runCount: body.runIds.length,
      });

      runJob(job.id, async (ctx) => {
        ctx.setProgress(15, "Queueing policy evaluation");
        ctx.throwIfCanceled();
        const result = await withLock("policy:eval", async () => evaluatePolicy(body.policyId!, body.runIds!));
        ctx.throwIfCanceled();
        ctx.setProgress(100, "Policy evaluation complete");
        return result as Record<string, unknown>;
      });

      return Response.json(
        {
          jobId: job.id,
          statusUrl: `/api/jobs/${job.id}`,
          cancelUrl: `/api/jobs/${job.id}/cancel`,
        },
        { status: 202 },
      );
    }

    const result = await withLock("policy:eval", async () => evaluatePolicy(body.policyId!, body.runIds!));
    return ok(result);
  } catch (error) {
    return serverError("Failed to evaluate policy", error);
  }
}
