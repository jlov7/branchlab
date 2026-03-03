import { badRequest, ok, serverError } from "@/lib/http";
import { getJob } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  try {
    const { jobId } = await context.params;
    const job = getJob(jobId);
    if (!job) {
      return badRequest("Job not found", { jobId });
    }

    return ok({ job });
  } catch (error) {
    return serverError("Failed to load job", error);
  }
}
