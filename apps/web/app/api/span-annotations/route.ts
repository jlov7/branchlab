import { badRequest, ok, serverError } from "@/lib/http";
import { createSpanAnnotation, listSpanAnnotations } from "@/lib/spanAnnotationService";
import { getRun } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get("runId") ?? undefined;
    const spanId = url.searchParams.get("spanId") ?? undefined;
    return ok({ annotations: listSpanAnnotations({ runId, spanId }) });
  } catch (error) {
    return serverError("Failed to list span annotations", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      runId?: unknown;
      investigationId?: unknown;
      spanId?: unknown;
      note?: unknown;
      tags?: unknown;
    };

    if (typeof body.runId !== "string") {
      return badRequest("runId is required");
    }
    if (!getRun(body.runId)) {
      return badRequest("Run not found", { runId: body.runId });
    }
    if (typeof body.spanId !== "string") {
      return badRequest("spanId is required");
    }
    if (typeof body.note !== "string") {
      return badRequest("note is required");
    }

    const tags = Array.isArray(body.tags) ? body.tags.filter((item): item is string => typeof item === "string") : [];

    return ok({
      annotation: createSpanAnnotation({
        runId: body.runId,
        investigationId: typeof body.investigationId === "string" ? body.investigationId : undefined,
        spanId: body.spanId,
        note: body.note,
        tags,
      }),
    });
  } catch (error) {
    return serverError("Failed to save span annotation", error);
  }
}
