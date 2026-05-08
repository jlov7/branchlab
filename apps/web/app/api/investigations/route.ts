import { badRequest, ok, serverError } from "@/lib/http";
import { listInvestigations, saveInvestigation, updateInvestigation } from "@/lib/investigationService";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const runId = url.searchParams.get("runId") ?? undefined;
    return ok({ investigations: listInvestigations(runId) });
  } catch (error) {
    return serverError("Failed to list investigations", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      runId?: unknown;
      branchRunId?: unknown;
      title?: unknown;
      hypothesis?: unknown;
      pinnedSpanIds?: unknown;
      evidenceHash?: unknown;
    };

    if (typeof body.runId !== "string") {
      return badRequest("runId is required");
    }
    if (typeof body.title !== "string") {
      return badRequest("title is required");
    }
    if (typeof body.hypothesis !== "string") {
      return badRequest("hypothesis is required");
    }
    if (typeof body.evidenceHash !== "string") {
      return badRequest("evidenceHash is required");
    }

    const pinnedSpanIds = Array.isArray(body.pinnedSpanIds)
      ? body.pinnedSpanIds.filter((item): item is string => typeof item === "string")
      : [];

    return ok({
      investigation: saveInvestigation({
        runId: body.runId,
        branchRunId: typeof body.branchRunId === "string" ? body.branchRunId : undefined,
        title: body.title,
        hypothesis: body.hypothesis,
        pinnedSpanIds,
        evidenceHash: body.evidenceHash,
      }),
    });
  } catch (error) {
    return serverError("Failed to save investigation", error);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      id?: unknown;
      title?: unknown;
      hypothesis?: unknown;
      pinnedSpanIds?: unknown;
      status?: unknown;
    };

    if (typeof body.id !== "string") {
      return badRequest("id is required");
    }
    if (body.title !== undefined && typeof body.title !== "string") {
      return badRequest("title must be a string");
    }
    if (body.hypothesis !== undefined && typeof body.hypothesis !== "string") {
      return badRequest("hypothesis must be a string");
    }
    if (body.status !== undefined && body.status !== "open" && body.status !== "resolved" && body.status !== "rejected") {
      return badRequest("status must be open, resolved, or rejected");
    }

    const pinnedSpanIds = Array.isArray(body.pinnedSpanIds)
      ? body.pinnedSpanIds.filter((item): item is string => typeof item === "string")
      : undefined;

    return ok({
      investigation: updateInvestigation({
        id: body.id,
        title: body.title,
        hypothesis: body.hypothesis,
        pinnedSpanIds,
        status: body.status,
      }),
    });
  } catch (error) {
    return serverError("Failed to update investigation", error);
  }
}
