import { badRequest, ok, serverError } from "@/lib/http";
import { requestCancel } from "@/lib/jobs";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
): Promise<Response> {
  try {
    const { jobId } = await context.params;
    const job = requestCancel(jobId);
    if (!job) {
      return badRequest("Job not found", { jobId });
    }

    return ok({ job });
  } catch (error) {
    return serverError("Failed to cancel job", error);
  }
}
