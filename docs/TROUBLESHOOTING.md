# Troubleshooting

## Dev server won’t start
- Run `make setup` then `make dev`.
- If `pnpm` missing: `npm i -g pnpm`.
- Ensure Node >= 20.

## Upload fails for large traces
- Check browser memory.
- Ensure server implements streaming upload.
- If using Next.js route handlers, prefer streaming to disk.

## Timeline is slow
- Ensure virtualization is enabled for timeline list.
- Avoid expensive JSON diff rendering for collapsed items.

## Compare view shows “no divergence” unexpectedly
- Verify event IDs are stable and unique.
- Ensure diff algorithm matches on `(type, call_id, event_id)` appropriately.
- Check that replay-only branch actually applied overlay patches.

## Policy rules not applied
- Confirm policy is loaded (show active policy badge).
- Inspect policy evaluation logs.
- Validate rule syntax (show errors inline).

## Re-execution not working
- Ensure model endpoint configured.
- Confirm that live tool calls are disabled by default.
- For demo: use stubbed tools and a toy agent first.

## Export bundle missing assets
- Ensure export writes to a folder with:
  - `report.html`
  - `run.json`
  - `diff.json` (if branch)
  - `policy_results.json`
- Ensure report references local assets correctly.

## E2E tests flaky
- Use deterministic demo traces.
- Use stable selectors (`data-testid`).
- Avoid timing-based assertions; wait for specific UI states.
