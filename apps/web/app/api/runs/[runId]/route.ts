import { badRequest, ok, serverError } from "@/lib/http";
import { getRun } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
): Promise<Response> {
  try {
    const { runId } = await context.params;
    const run = getRun(runId);
    if (!run) {
      return badRequest("Run not found");
    }

    return ok({ run });
  } catch (error) {
    return serverError("Failed to load run", error);
  }
}
