# BranchLab Design System

## Product Atmosphere

BranchLab should feel like a local debugger for frontier agent systems: dense, quiet, technical, and evidence-led. It is not a SaaS landing page and it should never sell before it lets the user inspect. The first viewport should read as a workbench where trace mathematics, replay state, eval evidence, policy impact, and provenance are all visible.

The core visual metaphor is a forensic instrument panel: warm near-black surfaces, hairline containment, compact engineering typography, and sparse signal color. Emerald means verified signal or active replay. Amber means caution or drift. Coral means failure, policy denial, or destructive risk. Muted cyan can appear only as secondary information color.

## Palette

- Page canvas: `#050507`
- Raised canvas: `#0c0c0b`
- Panel surface: `#111110`
- Panel inset: `#171614`
- Border: `#34312d`
- Strong border: `#4a4540`
- Text: `#f1eee8`
- Muted text: `#b7b0a6`
- Subtle text: `#807a72`
- Emerald signal: `#00d992`
- Emerald dim: `#0a7f5f`
- Amber warning: `#f3b34c`
- Coral danger: `#ff5f62`
- Cyan info: `#78c7d8`

Light mode is allowed for accessibility and screenshots, but dark mode is the identity. Light mode should still use warm neutrals, thin borders, and restrained signal color.

## Typography

- UI/display: `Space Grotesk` already loaded in the app.
- Mono: `IBM Plex Mono` already loaded in the app.
- Headings are compact and technical, but not hero-scale inside workbench panels.
- Letter spacing is `0` by default. Positive spacing is allowed only for micro labels.
- Body copy should be short. Screens explain state through labels, values, and provenance, not paragraphs.
- Mono text is for run ids, span ids, hashes, tool names, budget values, policy ids, and raw evidence.

## Layout Principles

- The default screen is a debugger-grade workbench, not a stack of unrelated cards.
- Prefer three-pane layouts: left controls/context, center trace/graph/timeline, right evidence/inspector.
- Cards are only for repeated items, modals, and genuinely bounded tools. Page sections are panels or full-width workbench bands.
- Border radius stays at 8px or below for content surfaces.
- Use hairline borders, grid lines, rulers, hash rails, and timeline ticks to create depth.
- Keep primary actions close to the data they affect.
- Avoid nested cards. Use `.panel-inset`, table rows, or list rows inside panels.
- Dense is good; clutter is not. Every visible chip or number must answer a debugging question.

## Component Direction

- Navigation: compact left rail, grouped by workflow, active state as emerald left marker plus border shift.
- Top bar: command surface with replay mode, import, search, and job state. It should feel operational, not decorative.
- Panels: flat dark surface, 1px warm border, subtle header rule, 8px radius.
- Buttons: squared, compact, icon-first where possible. Primary is dark surface with emerald text/border, not a filled glowing blob.
- Inputs: dark inset fields with warm border and emerald focus.
- Badges: compact chips for status and metadata. Use fill sparingly and keep text readable.
- Graph/timeline: use CSS primitives before canvas. Ticks, lanes, and nodes should stay deterministic and accessible.
- Dialogs: border-led, compact, with the same command/workbench language as the rest of the app.

## Motion

Motion should be subtle and functional:

- Hover: border color and tiny translate only.
- Active replay/job state: restrained pulse on a small indicator.
- Timeline/graph: no decorative motion; movement must represent data or interaction.
- Respect `prefers-reduced-motion`.

## Do

- Make trace ids, hashes, fingerprints, eval status, and policy impact first-class visual objects.
- Use emerald only for verified/active/high-confidence states.
- Use amber and coral only for semantic risk.
- Make empty states look like useful local workbench states, not marketing copy.
- Favor tables, inspectors, timelines, minimaps, and compact lists over feature cards.

## Don't

- Do not use purple/blue AI gradients, glassmorphism, or decorative blobs.
- Do not create a landing page as the primary experience.
- Do not use large rounded cards or nested card stacks.
- Do not hide core debugging information behind vague summaries.
- Do not add decorative code blocks unless they are real evidence or command surfaces.
