import { createDefaultEvalDataset, createEvalDataset, listEvalDatasets, listEvalRuns, runEvalDataset } from "@/lib/evalService";
import { badRequest, ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const datasetId = url.searchParams.get("datasetId") ?? undefined;
    return ok({
      datasets: listEvalDatasets(),
      evalRuns: listEvalRuns(datasetId),
    });
  } catch (error) {
    return serverError("Failed to load evals", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      action?: "create-dataset" | "create-default" | "run";
      name?: string;
      description?: string;
      runIds?: string[];
      datasetId?: string;
    };

    if (body.action === "create-default") {
      return ok({ dataset: await withLock("evals:create", async () => createDefaultEvalDataset()) });
    }

    if (body.action === "create-dataset") {
      if (!body.name || !Array.isArray(body.runIds)) {
        return badRequest("name and runIds[] are required");
      }
      return ok({
        dataset: await withLock("evals:create", async () =>
          createEvalDataset({
            name: body.name!,
            description: body.description,
            runIds: body.runIds!,
          }),
        ),
      });
    }

    if (body.action === "run") {
      if (!body.datasetId) {
        return badRequest("datasetId is required");
      }
      return ok({
        evalRun: await withLock("evals:run", async () => runEvalDataset(body.datasetId!, body.name)),
      });
    }

    return badRequest("Unsupported eval action");
  } catch (error) {
    return serverError("Failed to update evals", error);
  }
}
