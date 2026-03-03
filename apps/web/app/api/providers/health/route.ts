import { ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { checkProviderHealth } from "@/lib/providerHealth";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    const health = await withLock("providers:health", async () => checkProviderHealth());
    return ok({ health });
  } catch (error) {
    return serverError("Failed to check provider health", error);
  }
}
