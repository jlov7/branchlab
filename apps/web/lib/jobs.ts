import { getDb } from "./db";
import { newId } from "./ids";

export type JobType = "import" | "policy_eval" | "export";
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

export interface JobRecord {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  message: string;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: { message: string } | null;
  cancelRequested: boolean;
  createdAt: string;
  updatedAt: string;
}

const runningJobs = new Set<string>();

export function createJob(type: JobType, payload: Record<string, unknown> = {}): JobRecord {
  const id = newId("job");
  const now = new Date().toISOString();
  const db = getDb();
  db.prepare(
    `
      INSERT INTO jobs (id, type, status, progress, message, payload_json, result_json, error_json, cancel_requested, created_at, updated_at)
      VALUES (?, ?, 'queued', 0, 'Queued', ?, NULL, NULL, 0, ?, ?)
    `,
  ).run(id, type, JSON.stringify(payload), now, now);

  return getJobOrThrow(id);
}

export function getJob(id: string): JobRecord | null {
  const db = getDb();
  const row = db
    .prepare(
      `
      SELECT id, type, status, progress, message, payload_json, result_json, error_json, cancel_requested, created_at, updated_at
      FROM jobs
      WHERE id = ?
    `,
    )
    .get(id) as
    | {
        id: string;
        type: JobType;
        status: JobStatus;
        progress: number;
        message: string;
        payload_json: string | null;
        result_json: string | null;
        error_json: string | null;
        cancel_requested: number;
        created_at: string;
        updated_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    progress: row.progress,
    message: row.message,
    payload: row.payload_json ? (JSON.parse(row.payload_json) as Record<string, unknown>) : null,
    result: row.result_json ? (JSON.parse(row.result_json) as Record<string, unknown>) : null,
    error: row.error_json ? (JSON.parse(row.error_json) as { message: string }) : null,
    cancelRequested: Boolean(row.cancel_requested),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listJobs(limit = 50): JobRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `
      SELECT id
      FROM jobs
      ORDER BY created_at DESC
      LIMIT ?
    `,
    )
    .all(limit) as Array<{ id: string }>;

  return rows
    .map((row) => getJob(row.id))
    .filter((job): job is JobRecord => job !== null);
}

export function requestCancel(jobId: string): JobRecord | null {
  const db = getDb();
  db.prepare(`UPDATE jobs SET cancel_requested = 1, updated_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    jobId,
  );

  return getJob(jobId);
}

export interface JobContext {
  setProgress(progress: number, message: string): void;
  throwIfCanceled(): void;
}

export function runJob(
  jobId: string,
  worker: (ctx: JobContext) => Promise<Record<string, unknown>>,
): void {
  if (runningJobs.has(jobId)) {
    return;
  }

  runningJobs.add(jobId);
  void runJobInternal(jobId, worker).finally(() => {
    runningJobs.delete(jobId);
  });
}

async function runJobInternal(
  jobId: string,
  worker: (ctx: JobContext) => Promise<Record<string, unknown>>,
): Promise<void> {
  const db = getDb();
  updateJob(jobId, {
    status: "running",
    progress: 1,
    message: "Running",
  });

  const ctx: JobContext = {
    setProgress(progress, message) {
      updateJob(jobId, {
        status: "running",
        progress,
        message,
      });
    },
    throwIfCanceled() {
      const job = getJobOrThrow(jobId);
      if (job.cancelRequested) {
        throw new JobCanceledError();
      }
    },
  };

  try {
    const result = await worker(ctx);
    updateJob(jobId, {
      status: "succeeded",
      progress: 100,
      message: "Completed",
      result: result,
      error: null,
    });
  } catch (error) {
    if (error instanceof JobCanceledError) {
      updateJob(jobId, {
        status: "canceled",
        progress: 100,
        message: "Canceled",
        error: null,
      });
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    updateJob(jobId, {
      status: "failed",
      progress: 100,
      message: "Failed",
      error: { message },
    });
  }

  db.exec("PRAGMA optimize;");
}

function updateJob(
  jobId: string,
  patch: {
    status?: JobStatus;
    progress?: number;
    message?: string;
    result?: Record<string, unknown> | null;
    error?: { message: string } | null;
  },
): void {
  const current = getJobOrThrow(jobId);
  const now = new Date().toISOString();
  const next = {
    status: patch.status ?? current.status,
    progress: patch.progress ?? current.progress,
    message: patch.message ?? current.message,
    result: patch.result === undefined ? current.result : patch.result,
    error: patch.error === undefined ? current.error : patch.error,
  };

  const db = getDb();
  db.prepare(
    `
      UPDATE jobs
      SET status = ?, progress = ?, message = ?, result_json = ?, error_json = ?, updated_at = ?
      WHERE id = ?
    `,
  ).run(
    next.status,
    Math.max(0, Math.min(100, Math.floor(next.progress))),
    next.message,
    next.result ? JSON.stringify(next.result) : null,
    next.error ? JSON.stringify(next.error) : null,
    now,
    jobId,
  );
}

function getJobOrThrow(id: string): JobRecord {
  const job = getJob(id);
  if (!job) {
    throw new Error(`Job not found: ${id}`);
  }
  return job;
}

class JobCanceledError extends Error {
  constructor() {
    super("Job canceled");
  }
}
