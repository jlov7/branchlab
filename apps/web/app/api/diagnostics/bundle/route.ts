import { createDiagnosticsBundle } from "@/lib/diagnostics";
import { badRequest, ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { getSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as { confirmOptIn?: boolean };
    const settings = getSettings();
    if (!settings.diagnosticsOptIn && body.confirmOptIn !== true) {
      return badRequest("Diagnostics bundle generation requires explicit opt-in in settings or confirmOptIn=true");
    }

    const bundle = await withLock("diagnostics:bundle", async () => createDiagnosticsBundle());
    return ok({ bundle });
  } catch (error) {
    return serverError("Failed to build diagnostics bundle", error);
  }
}
