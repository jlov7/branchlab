import { listRuns } from "@/lib/runsRepo";
import { ok, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") ?? undefined;
    const search = url.searchParams.get("search") ?? undefined;
    const mode = url.searchParams.get("mode") ?? undefined;
    const tool = url.searchParams.get("tool") ?? undefined;
    const tag = url.searchParams.get("tag") ?? undefined;
    const dateFrom = url.searchParams.get("dateFrom") ?? undefined;
    const dateTo = url.searchParams.get("dateTo") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? 100);
    const offset = Number(url.searchParams.get("offset") ?? 0);

    const runs = listRuns({
      status,
      search,
      mode,
      tool,
      tag,
      dateFrom,
      dateTo,
      limit,
      offset,
    });
    return ok({ runs });
  } catch (error) {
    return serverError("Failed to list runs", error);
  }
}
