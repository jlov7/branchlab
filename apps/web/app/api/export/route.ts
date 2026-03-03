import { exportBundle } from "@/lib/exportService";
import { badRequest, ok, serverError } from "@/lib/http";
import { createJob, runJob } from "@/lib/jobs";
import { withLock } from "@/lib/lock";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      runId?: string;
      branchRunId?: string;
      redacted?: boolean;
      async?: boolean;
    };

    if (!body.runId) {
      return badRequest("runId is required");
    }

    if (body.async) {
      const job = createJob("export", {
        runId: body.runId,
        branchRunId: body.branchRunId,
        redacted: body.redacted ?? true,
      });

      runJob(job.id, async (ctx) => {
        ctx.setProgress(20, "Preparing export");
        ctx.throwIfCanceled();
        const bundle = await withLock("export:bundle", async () =>
          exportBundle({
            runId: body.runId!,
            branchRunId: body.branchRunId,
            redacted: body.redacted ?? true,
          }),
        );
        ctx.throwIfCanceled();
        ctx.setProgress(100, "Export complete");
        return { bundle } as Record<string, unknown>;
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

    const bundle = await withLock("export:bundle", async () =>
      exportBundle({
        runId: body.runId!,
        branchRunId: body.branchRunId,
        redacted: body.redacted ?? true,
      }),
    );

    return ok({ bundle });
  } catch (error) {
    return serverError("Failed to export bundle", error);
  }
}
