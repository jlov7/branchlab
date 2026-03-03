# Security & Privacy

## Threat model (MVP)
- Trace files may contain secrets, PII, or malicious payloads.
- UI rendering must not execute scripts or HTML embedded in trace content.
- “Re-execution” mode may exfiltrate data if tools are allowed.

## Required controls
- Strict output encoding (no dangerouslySetInnerHTML).
- Content Security Policy (CSP) headers.
- Redaction mode:
  - default on for exports
  - simple detectors: email, phone, access keys patterns
- Tool allowlist for re-execution:
  - default deny for network tools
  - explicit per-tool enablement

## Data residency
- All data stored locally:
  - `.atl/` folder in repo root by default
- Provide “Open folder” and “Delete all” controls.

## Export safety
- Exports must be redacted by default unless user opts out.
- Mark exports with a warning banner if unredacted.

## Auditability
- Store original trace unchanged.
- Store derived branches with explicit intervention specs.
