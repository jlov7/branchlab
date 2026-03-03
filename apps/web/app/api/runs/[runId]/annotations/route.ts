import { badRequest, ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { getRunAnnotation, getRun, upsertRunAnnotation } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ runId: string }> },
): Promise<Response> {
  try {
    const { runId } = await context.params;
    if (!getRun(runId)) {
      return badRequest("Run not found", { runId });
    }

    return ok({
      annotation: getRunAnnotation(runId) ?? {
        runId,
        tags: [],
        note: "",
        updatedAt: new Date(0).toISOString(),
      },
    });
  } catch (error) {
    return serverError("Failed to load run annotation", error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ runId: string }> },
): Promise<Response> {
  try {
    const { runId } = await context.params;
    if (!getRun(runId)) {
      return badRequest("Run not found", { runId });
    }

    const body = (await request.json()) as { tags?: string[]; note?: string };
    const tags = Array.isArray(body.tags)
      ? body.tags.map((item) => item.trim()).filter((item) => item.length > 0)
      : [];
    const note = typeof body.note === "string" ? body.note : "";

    const annotation = await withLock(`run:annotation:${runId}`, async () =>
      upsertRunAnnotation({ runId, tags, note }),
    );
    return ok({ annotation });
  } catch (error) {
    return serverError("Failed to save run annotation", error);
  }
}
