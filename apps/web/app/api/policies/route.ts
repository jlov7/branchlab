import { badRequest, ok, serverError } from "@/lib/http";
import { withLock } from "@/lib/lock";
import { listPolicies, savePolicy } from "@/lib/policyService";

export const runtime = "nodejs";

export async function GET(): Promise<Response> {
  try {
    return ok({ policies: listPolicies() });
  } catch (error) {
    return serverError("Failed to list policies", error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as {
      name?: string;
      description?: string;
      backend?: "yaml" | "rego_wasm";
      content?: string;
      entrypoint?: string;
    };

    if (!body.name || !body.backend || !body.content) {
      return badRequest("name, backend, and content are required");
    }

    const name = body.name;
    const backend = body.backend;
    const content = body.content;

    const policy = await withLock("policy:save", async () =>
      savePolicy({
        name,
        description: body.description ?? "",
        backend,
        content,
        entrypoint: body.entrypoint,
      }),
    );

    return ok({ policy });
  } catch (error) {
    return serverError("Failed to save policy", error);
  }
}
