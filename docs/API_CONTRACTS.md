# API Contracts

Base path: `/api`

## `POST /runs/import`

- Request: `multipart/form-data` with `file` (`.jsonl`)
- Optional form field: `async=1` to queue import as background job
- Response `200`:
  - `runId: string`
  - `insertedEvents: number`
  - `partialParse: boolean`
  - `issues: Array<{ line: number; reason: string }>`
  - `validationReportId?: string`
  - `telemetry: { fileName, byteLength, parsedEvents, insertedEvents, issueCount, partialParse, durationMs }`
- Response `202` (async):
  - `jobId: string`
  - `statusUrl: string`
  - `cancelUrl: string`
  - Completed job `result.telemetry` contains the same import telemetry shape.

## `GET /runs`

- Query:
  - `status?: success|fail|unknown`
  - `mode?: replay|reexec`
  - `tool?: string`
  - `tag?: string`
  - `dateFrom?: ISO date`
  - `dateTo?: ISO date`
  - `search?: string`
  - `limit?: number`
  - `offset?: number`
- Response `200`: `{ runs: RunSummary[] }`

## `GET /runs/:runId`

- Response `200`: `{ run: RunSummary }`
- Response `400`: `{ error: "Run not found" }`

## `GET /runs/:runId/events`

- Query: `offset?: number`, `limit?: number`
- Response `200`: `{ events: NormalizedEvent[], offset: number, limit: number }`

## `GET /runs/:runId/annotations`

- Response `200`:
  - `annotation: { runId, tags: string[], note: string, updatedAt: string }`

## `PUT /runs/:runId/annotations`

- Request:
  - `tags?: string[]`
  - `note?: string`
- Response `200`: `{ annotation: RunAnnotation }`

## `GET /span-annotations`

- Query: `runId?: string`, `spanId?: string`
- Response `200`: `{ annotations: SpanAnnotation[] }`

## `POST /span-annotations`

- Request:
  - `runId: string`
  - `spanId: string`
  - `note: string`
  - `tags?: string[]`
  - `investigationId?: string`
- Response `200`: `{ annotation: SpanAnnotation }`

## `POST /branches`

- Request:
  - `parentRunId: string`
  - `forkEventId: string`
  - `mode: replay|reexec`
  - `intervention: InterventionSpec`
  - `providerId?: string`
  - `allowLiveTools?: boolean`
- Response `200`: `CreateBranchResult`

## `POST /compare`

- Request: `{ parentRunId: string, branchRunId: string }`
- Response `200`: `{ compare: CompareResult, blame: BlameCandidate[] }`

## `GET /policies`

- Response `200`: `{ policies: PolicyVersion[] }`

## `POST /policies`

- Request:
  - `name: string`
  - `description?: string`
  - `backend: yaml|rego_wasm`
  - `content: string`
  - `entrypoint?: string`
- Response `200`: `{ policy: PolicyVersion }`

## `POST /policy-evals`

- Request: `{ policyId: string, runIds: string[], async?: boolean }`
- Response `200`:
  - `evalIds: string[]`
  - `summary: { violations: number, totalCalls: number, bySeverity: Record<string, number>, byRule: Record<string, number>, byTool: Record<string, number>, blockedSuccessEstimate: number }`
  - `decisions: Array<{ runId: string, records: PolicyDecisionRecord[] }>`
- Response `202` (async): `{ jobId, statusUrl, cancelUrl }`

## `POST /export`

- Request: `{ runId: string, branchRunId?: string, redacted?: boolean, async?: boolean }`
- Response `200`: `{ bundle: ExportBundleManifest }`
- Response `202` (async): `{ jobId, statusUrl, cancelUrl }`

## `GET /settings`

- Response `200`:
  - `settings: AppSettings`
  - `providers: ProviderConfig[]`

## `PUT /settings`

- Request:
  - `settings?: Partial<AppSettings>`
  - `providers?: ProviderConfig[]`
- Response `200`:
  - `settings: AppSettings`
  - `providers: ProviderConfig[]`

## `POST /settings/delete-all`

- Response `200`: `{ deleted: true }`

## `POST /settings/open-folder`

- Response `200`: `{ opened: true }`

## `GET /providers/health`

- Response `200`:
  - `health: Array<{ providerId, enabled, hasApiKey, reachable, status: ok|warn|error, detail }>`

## `POST /diagnostics/bundle`

- Request: `{ confirmOptIn?: boolean }`
- Guardrail: requires `settings.diagnosticsOptIn === true` or `confirmOptIn === true`
- Response `200`:
  - `bundle: { id: string, folder: string, file: string, createdAt: string }`

## `GET /import-reports/:reportId`

- Response `200`:
  - `report: { id: string, runId: string, issues: Array<{line, reason}>, createdAt: string }`

## `GET /jobs`

- Response `200`:
  - `jobs: JobRecord[]`

## `GET /jobs/:jobId`

- Response `200`:
  - `job: JobRecord`

## `POST /jobs/:jobId/cancel`

- Response `200`:
  - `job: JobRecord`

## `POST /demo/seed`

- Response `200`:
  - `imported: Array<{ path: string, runId: string, insertedEvents: number }>`
