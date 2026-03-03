"use client";

import { diff } from "jsondiffpatch";
import { Badge } from "@/components/ui";

export function JsonDiffView({ before, after }: { before: unknown; after: unknown }) {
  const delta = diff(before, after);
  const summary = summarizeDelta(delta);
  const body = JSON.stringify(delta ?? { unchanged: true }, null, 2);
  const compact = body.length > 2600;

  return (
    <div className="ui-stack" style={{ gap: 8 }}>
      <div className="ui-inline">
        <Badge tone="success">added: {summary.added}</Badge>
        <Badge tone="danger">removed: {summary.removed}</Badge>
        <Badge tone="warning">changed: {summary.changed}</Badge>
      </div>
      {compact ? (
        <details>
          <summary className="mono subtle">Diff payload ({body.length} chars). Expand</summary>
          <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
            {body}
          </pre>
        </details>
      ) : (
        <pre className="mono" style={{ whiteSpace: "pre-wrap", margin: 0 }}>
          {body}
        </pre>
      )}
    </div>
  );
}

function summarizeDelta(value: unknown): { added: number; removed: number; changed: number } {
  const summary = { added: 0, removed: 0, changed: 0 };
  walk(value, summary);
  return summary;
}

function walk(value: unknown, summary: { added: number; removed: number; changed: number }): void {
  if (Array.isArray(value)) {
    if (value.length === 1) {
      summary.added += 1;
      return;
    }
    if (value.length >= 3 && value[2] === 0) {
      summary.removed += 1;
      return;
    }
    if (value.length >= 2) {
      summary.changed += 1;
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  for (const next of Object.values(value as Record<string, unknown>)) {
    walk(next, summary);
  }
}
