# Policy Engine

BranchLab includes a policy layer so teams can simulate governance changes against real traces.

## 1) Policy decision model

For each `tool.request` event, compute:

- `decision`: `allow | deny | hold`
- `severity`: `low | medium | high | critical`
- `rule_id`: string
- `reason`: short explanation
- `remediation`: optional (e.g., “add allowlist”, “redact PII”)

Emit a `policy.decision` event linked by `call_id`.

## 2) Policy backends (MVP)

### A) Built-in YAML rules (default)
Simple, expressive, and easy to demo.

Example:
```yaml
version: 1
rules:
  - id: block_network_tools
    when:
      tool: ["http.get", "browser.open"]
    then:
      decision: deny
      severity: high
      reason: "Network access blocked in local replay"
  - id: allow_readonly_fs
    when:
      tool: ["fs.read"]
    then:
      decision: allow
      severity: low
```

### B) Rego/WASM backend (OPA-compatible, required in v1)
For “enterprise-grade” policy-as-code.

Approach:
1. Compile Rego policies to WASM bundle at build time.
2. Load and evaluate the WASM policy with `input` as JSON.

This keeps policy evaluation embedded and local-first.

## 3) Policy Lab UX requirements

- Policy editor with version name + description.
- Run policy over selected traces.
- Render impact analysis:
  - violation counts by tool
  - “would-have-blocked successful runs” estimate
  - top offending arguments (e.g., domains, file paths)

## 4) Policy testing

- Include unit tests for policies using the YAML backend.
- Include at least one integration test for Rego/WASM that evaluates a known policy on a known input.

## 5) Guardrails

- Policy is evaluated server-side (or in a worker) to avoid UI freezes.
- Do not allow policies to access arbitrary filesystem.
