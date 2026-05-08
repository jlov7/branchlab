import { parseJsonlText, parseUploadedJsonl } from "@/lib/ingest";
import { badRequest, ok, serverError } from "@/lib/http";
import { createImportReport } from "@/lib/importReports";
import { createJob, runJob } from "@/lib/jobs";
import { withLock } from "@/lib/lock";
import { saveRun } from "@/lib/runsRepo";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return badRequest("Expected multipart form with a 'file' field");
    }

    const asyncFlag = form.get("async");
    const isAsync = asyncFlag === "1" || asyncFlag === "true";

    if (isAsync) {
      const text = await file.text();
      const startedAt = Date.now();
      const job = createJob("import", {
        fileName: file.name,
        byteLength: text.length,
      });

      runJob(job.id, async (ctx) => {
        ctx.setProgress(10, "Parsing JSONL");
        const parsed = parseJsonlText(text);
        ctx.throwIfCanceled();
        ctx.setProgress(45, `Parsed ${parsed.events.length} events`);

        ctx.setProgress(70, "Persisting run");
        const saved = await withLock("runs:import", async () =>
          saveRun({
            source: file.name,
            mode: "replay",
            events: parsed.events,
            partialParse: parsed.partialParse,
            issues: parsed.issues,
          }),
        );
        ctx.throwIfCanceled();

        let validationReportId: string | undefined;
        if (parsed.issues.length > 0) {
          validationReportId = createImportReport(saved.runId, parsed.issues).id;
        }

        ctx.setProgress(100, "Import complete");
        const durationMs = Math.max(0, Date.now() - startedAt);
        return {
          runId: saved.runId,
          insertedEvents: saved.insertedEvents,
          partialParse: parsed.partialParse,
          issues: parsed.issues,
          validationReportId,
          telemetry: {
            fileName: file.name,
            byteLength: text.length,
            parsedEvents: parsed.events.length,
            insertedEvents: saved.insertedEvents,
            issueCount: parsed.issues.length,
            partialParse: parsed.partialParse,
            durationMs,
          },
        };
      });

      return Response.json(
        {
          jobId: job.id,
          statusUrl: `/api/jobs/${job.id}`,
          cancelUrl: `/api/jobs/${job.id}/cancel`,
        },
        { status: 202 },
      );
    }

    const startedAt = Date.now();
    const parsed = await parseUploadedJsonl(file);
    const saved = await withLock("runs:import", async () =>
      saveRun({
        source: file.name,
        mode: "replay",
        events: parsed.events,
        partialParse: parsed.partialParse,
        issues: parsed.issues,
      }),
    );

    let validationReportId: string | undefined;
    if (parsed.issues.length > 0) {
      validationReportId = createImportReport(saved.runId, parsed.issues).id;
    }

    return ok({
      runId: saved.runId,
      insertedEvents: saved.insertedEvents,
      partialParse: parsed.partialParse,
      issues: parsed.issues,
      validationReportId,
      telemetry: {
        fileName: file.name,
        byteLength: file.size,
        parsedEvents: parsed.events.length,
        insertedEvents: saved.insertedEvents,
        issueCount: parsed.issues.length,
        partialParse: parsed.partialParse,
        durationMs: Math.max(0, Date.now() - startedAt),
      },
    });
  } catch (error) {
    return serverError("Failed to import trace", error);
  }
}
