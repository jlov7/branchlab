export type EventType =
  | "run.start"
  | "run.end"
  | "llm.request"
  | "llm.response"
  | "tool.request"
  | "tool.response"
  | "memory.read"
  | "memory.write"
  | "policy.decision"
  | "error"
  | "note";

export interface NormalizedEvent {
  schema: "branchlab.trace.v1";
  run_id: string;
  event_id: string;
  ts: string;
  type: EventType;
  parent_event_id?: string;
  data: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface NormalizedRun {
  id: string;
  createdAt: string;
  source: string;
  mode: BranchExecutionMode;
  status: "success" | "fail" | "unknown";
  durationMs: number;
  costUsd: number;
  meta: Record<string, unknown>;
}

export type BranchExecutionMode = "replay" | "reexec";

export type InterventionSpec =
  | {
      kind: "prompt_edit";
      eventId?: string;
      newPrompt: string;
    }
  | {
      kind: "tool_output_override";
      callId: string;
      result: Record<string, unknown>;
    }
  | {
      kind: "policy_override";
      callId: string;
      decision: "allow" | "deny" | "hold";
      reason?: string;
    }
  | {
      kind: "memory_removal";
      memoryId: string;
    };

export interface BranchSpec {
  parentRunId: string;
  forkEventId: string;
  mode: BranchExecutionMode;
  intervention: InterventionSpec;
  allowLiveTools?: boolean;
  liveToolAllowlist?: string[];
  providerId?: string;
}

export interface ChangedEvent {
  eventId: string;
  kind: "added" | "removed" | "modified";
  before?: NormalizedEvent;
  after?: NormalizedEvent;
}

export interface DvergenceEventStats {
  added: number;
  removed: number;
  modified: number;
}

export interface DivergencePoint {
  firstDivergenceEventId: string | null;
  firstDivergenceIndex: number;
}

export interface CompareResult {
  divergence: DivergencePoint;
  changes: ChangedEvent[];
  stats: DvergenceEventStats;
  deltas: {
    costUsd: number;
    policyViolations: number;
    outcome: {
      from: "success" | "fail" | "unknown";
      to: "success" | "fail" | "unknown";
    };
    toolErrorRate: number;
  };
}

export interface BlameCandidate {
  eventId: string;
  type: EventType;
  rationale: string;
  confidence: number;
}

export interface Scorecard {
  toolErrorRate: number;
  policyViolationCount: number;
  costUsd: number;
  tokensIn: number;
  tokensOut: number;
  loopSuspected: boolean;
  groundednessProxy: number;
}

export interface ExportBundleManifest {
  id: string;
  runId: string;
  branchRunId?: string;
  redacted: boolean;
  createdAt: string;
  files: string[];
}

export interface ProviderCapabilities {
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
}

export interface ProviderConfig {
  id: string;
  name: string;
  kind: "openai" | "anthropic" | "compatible";
  baseUrl: string;
  apiKeyEnv: string;
  model: string;
  enabled: boolean;
}

export interface ReexecRequest {
  systemPrompt?: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
}

export interface ReexecResult {
  outputText: string;
  finishReason: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

export interface ModelProviderAdapter {
  id: string;
  capabilities: ProviderCapabilities;
  execute(request: ReexecRequest, config: ProviderConfig): Promise<ReexecResult>;
}
