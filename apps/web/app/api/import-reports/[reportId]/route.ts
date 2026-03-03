import { badRequest, ok, serverError } from "@/lib/http";
import { getImportReport } from "@/lib/importReports";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportId: string }> },
): Promise<Response> {
  try {
    const { reportId } = await context.params;
    const report = getImportReport(reportId);
    if (!report) {
      return badRequest("Import report not found", { reportId });
    }

    return ok({ report });
  } catch (error) {
    return serverError("Failed to load import report", error);
  }
}
