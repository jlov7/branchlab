import { listEvidencePacks } from "@/lib/evidenceService";
import { ok, serverError } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    return ok({ packs: listEvidencePacks() });
  } catch (error) {
    return serverError("Failed to load evidence packs", error);
  }
}
