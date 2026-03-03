# UX & UI Spec — Agent Twin Lab (BranchLab)

This spec is intentionally strict. The UX must feel like premium developer tooling, not a generic CRUD dashboard.

## 1) Design principles

1. **Verification-first**
   - Always show what is *deterministic replay* vs *re-execution*.
   - Every view has “source of truth” affordances: show raw event JSON, event hashes, and trace origin.

2. **Dense, readable, calm**
   - The UI is information-dense but never cluttered.
   - Use typographic hierarchy, spacing, and progressive disclosure.

3. **Time is the primary axis**
   - Traces are temporal; the UI should reflect that.
   - The timeline is a core product surface, not a side panel.

4. **Branching should feel like Git**
   - Forks are branches; comparisons are diffs.
   - Language and iconography should echo that mental model without copying Git UIs.

5. **Local-first, trust by design**
   - “No account, no cloud” is a UX feature.
   - Explain storage location and how to delete everything.

## 2) Visual design requirements (non-boring)

### Theme
- Default: dark-first with high contrast.
- Provide light mode toggle.
- Use a restrained palette with **one signature accent** (e.g., electric violet / cyan).
- Background: subtle gradient + noise texture (very low opacity).
- Elevated surfaces: soft borders + blurred backdrop (tasteful “glass” for modals/tooltips).

### Typography
- Use a modern sans for UI + mono for trace/code.
- Clear scale:
  - H1: 28–32px, tight line-height
  - H2: 20–24px
  - Body: 14–16px
  - Mono: 12–13px
- Never use default browser fonts.

### Layout
- 12-column responsive grid.
- “Studio” layout:
  - left: navigation + run list filters
  - center: primary content (timeline, report)
  - right: inspector drawer (event details)
- Support wide screens well (avoid huge empty whitespace).

### Motion
- Micro-interactions only:
  - timeline scrub highlight
  - drawer open/close
  - branch creation success animation (subtle)
- Use reduced-motion respect.

### Icons & data viz
- Use consistent icon set (Lucide).
- Charts: minimal, crisp (sparklines, bar charts).
- Timeline virtualization for performance.

## 3) Information architecture

### Primary nav (left rail)
- Runs
- Compare
- Policy Lab
- Library (Tools, Memories, Entities) [optional MVP]
- Settings

### Secondary actions (top bar)
- Import
- Export
- Theme toggle
- Help (demo script, keyboard shortcuts)

## 4) Core screens & required interactions

## Screen A — Landing / Onboarding
**Goal:** instant comprehension + one-click demo.

Required components:
- Hero title: “Replay and fork agent runs”
- Two CTAs:
  - “Try demo trace (30 sec)”
  - “Import JSONL”
- Three feature cards:
  - Replay
  - Fork
  - Compare
- Small footer:
  - “Local-first. Stored under .atl/”
  - “Delete all data” button (opens confirm modal)

Empty-state behavior:
- If no runs exist, show landing as the default.

## Screen B — Runs list
Required:
- Table with columns: time, status, scenario, duration, cost, tools, tags
- Filters: status, tool, date range, text search
- Fast: virtualization for >500 runs

Selecting a run opens Screen C.

## Screen C — Run report (the centerpiece)
Layout:
- Top summary strip:
  - status badge
  - “Replay / Re-exec” badge
  - duration, cost, token usage
  - policy summary (violations)
- Main timeline:
  - vertical timeline with grouped steps
  - grouping levels:
    - phases (Plan, Act, Observe, Summarize) if present
    - otherwise tool/llm/memory events
  - hover highlights related events (e.g., tool request + tool response)

Right inspector drawer:
- Tabs:
  - Rendered view
  - Raw JSON
  - Diff (if in compare mode)
- Must include “Copy JSON” and “Copy as cURL” for tool calls.

Search:
- Global search within run: matches tool names, args, text spans.

Keyboard shortcuts:
- J/K: next/prev event
- Enter: expand/collapse event
- F: fork at selected

## Screen D — Fork modal
Must feel like a serious control surface.

Modal sections:
1. Fork point
   - event id, timestamp, summary
2. Intervention type
   - Prompt edit
   - Tool output override
   - Block tool (policy)
   - Remove memory
3. Branch type
   - Replay-only
   - Re-execution
4. Safety
   - default: tools are stubbed by recorded artifacts
   - explicit checkbox to “Allow live tool calls” (danger styling)

UX requirement:
- Show a preview of the intervention in a diff-like UI.
- On submit, show progress with an activity timeline (not a spinner).

## Screen E — Compare view
A true diff experience.

Required:
- “Branch graph” header: parent → branch nodes
- Split view:
  - left = original
  - right = branch
- Above fold:
  - outcome delta (success/failure)
  - cost delta
  - policy delta
- “Divergence map”:
  - small minimap of timeline with first divergence marked
- “Changed events” list:
  - added/removed/modified counts
  - click jumps timeline to exact point

Diff rules:
- JSON diffs displayed as semantic diff (not raw text).
- Large payloads collapsed with “expand”.

## Screen F — Policy Lab
Goal: simulate governance.

Required:
- Policy editor (Monaco) with:
  - syntax highlight for Rego or YAML rules
  - version name + description
  - “Run on selected traces”
- Results panel:
  - violations table
  - charts by tool/severity
  - “would have blocked X% of successful runs” summary
- Policy testing:
  - include a few example policies in `/examples/policies/`

## Screen G — Settings
- Storage location + “Open folder”
- Redaction defaults
- Model endpoints for re-execution (optional)
- Danger zone: delete all runs

## 5) Copywriting & tone

- Use crisp, technical language.
- Avoid marketing fluff.
- Always label determinism vs re-execution.
- Provide one-line explanations in tooltips for advanced concepts:
  - “Replay”: “Uses recorded artifacts only.”
  - “Re-execution”: “Re-runs model steps; tool calls are stubbed unless enabled.”

## 6) Accessibility requirements

- Keyboard navigable.
- ARIA labels for timeline items.
- Color contrast AA minimum.
- Support reduced motion.

## 7) UI acceptance checklist (must pass)

- Landing page is custom and branded (not default Next template).
- Timeline scroll is smooth for large traces.
- Compare view is intuitive and readable.
- Empty states are designed, not blank.
- No “unstyled” pages anywhere.
- App feels like a cohesive product: consistent spacing, borders, hover states, focus rings.
