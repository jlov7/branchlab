import { ok, serverError } from "@/lib/http";
import { listJobs } from "@/lib/jobs";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    return ok({ jobs: listJobs(100) });
  } catch (error) {
    return serverError("Failed to list jobs", error);
  }
}
