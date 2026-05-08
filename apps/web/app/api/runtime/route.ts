import { ok, serverError } from "@/lib/http";
import { listRuntimeExecutions } from "@/lib/runtimeService";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    return ok({ executions: listRuntimeExecutions() });
  } catch (error) {
    return serverError("Failed to load runtime executions", error);
  }
}
