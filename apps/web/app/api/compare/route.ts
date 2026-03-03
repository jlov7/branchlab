import { compareRunsById } from "@/lib/compareService";
import { badRequest, ok, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { parentRunId?: string; branchRunId?: string };
    if (!body.parentRunId || !body.branchRunId) {
      return badRequest("parentRunId and branchRunId are required");
    }

    return ok(compareRunsById(body.parentRunId, body.branchRunId));
  } catch (error) {
    return serverError("Failed to compare runs", error);
  }
}
