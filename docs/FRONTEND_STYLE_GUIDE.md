# Frontend Style Guide

## Design Tokens

Defined in `apps/web/app/globals.css`:

- Color: `--surface-*`, `--text*`, `--accent`, `--danger`, `--success`, `--warning`
- Spacing: `--space-1` to `--space-8`
- Radius: `--radius-sm` to `--radius-xl`
- Motion: `--motion-fast`, `--motion-normal`, `--motion-slow`

Theme support:

- Dark theme default (`:root`)
- Light theme override (`html[data-theme="light"]`)

## Primitive Components

Location: `apps/web/components/ui/`

- `Button` (`primary`, `default`, `danger`, `ghost`)
- `Input`, `Select`, `Textarea`
- `Card`, `Badge`
- `Tabs`, `TabButton`
- `Field`
- `Page`, `Section`, `Stack`, `Inline`, `SplitPane`
- `EmptyState`, `Skeleton`

Rule: new UI work should compose primitives first; avoid ad-hoc inline style blocks for core controls.

## Layout Rules

1. Use `Page` as top-level route container.
2. Use `Card` for bounded surfaces.
3. Use `Field` for all form controls with labels.
4. Use `Tabs` for mode switches and inspector tabs.
5. Keep action groups in `Inline` with primary action first.

## Accessibility Rules

1. Every modal has `role="dialog"`, `aria-modal="true"`, and accessible name.
2. Every select/input/textarea must have a visible or programmatic label.
3. Use `aria-live="polite"` for async status regions.
4. Maintain keyboard-first operability for all key flows.

## Motion Rules

1. Respect `prefers-reduced-motion`.
2. Use subtle transitions only for state changes (dialogs, toasts, nav states).
3. Avoid decorative motion on high-density data surfaces.
