export function ok(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, { status: 200, ...init });
}

type ErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL"
  | "VALIDATION_FAILED"
  | "GUARDRAIL_TRIGGERED";

interface ErrorPayload {
  error: string;
  code: ErrorCode;
  details?: unknown;
  hint?: string;
}

export function badRequest(message: string, details?: unknown, hint?: string): Response {
  return errorResponse(400, {
    error: message,
    code: "BAD_REQUEST",
    details,
    hint,
  });
}

export function serverError(message: string, error: unknown): Response {
  const isDev = process.env.NODE_ENV !== "production";
  const details = isDev ? (error instanceof Error ? error.message : String(error)) : undefined;
  return errorResponse(500, {
    error: message,
    code: "INTERNAL",
    details,
    hint: "Check server logs for stack trace and context.",
  });
}

function errorResponse(status: number, payload: ErrorPayload): Response {
  return Response.json(payload, { status });
}
