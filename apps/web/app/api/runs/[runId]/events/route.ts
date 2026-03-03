import { ok, serverError } from "@/lib/http";
import { getRunEvents } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ runId: string }> },
): Promise<Response> {
  try {
    const { runId } = await context.params;
    const url = new URL(request.url);
    const offset = Number(url.searchParams.get("offset") ?? 0);
    const limit = Number(url.searchParams.get("limit") ?? 200);

    const events = getRunEvents(runId, offset, limit);
    return ok({ events, offset, limit });
  } catch (error) {
    return serverError("Failed to load run events", error);
  }
}
