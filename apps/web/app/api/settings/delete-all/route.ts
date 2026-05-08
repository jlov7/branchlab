import { ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { resetAllData } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function POST(): Promise<Response> {
  try {
    await withLock("settings:delete-all", async () => resetAllData({ allowDefaultRoot: true }));
    return ok({ deleted: true });
  } catch (error) {
    return serverError("Failed to delete all data", error);
  }
}
