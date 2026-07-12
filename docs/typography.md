# Mfuko Pro Typography Standard

Single font family across the whole system: **Inter Variable** (self-hosted via
`@fontsource-variable/inter`, loaded in `src/main.ts`). Fallback stack:
`ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.

Inter is the de-facto standard for dense financial dashboards: excellent legibility at
small sizes, full weight range from one variable file, and tabular figures for aligning
monetary amounts (`font-variant-numeric: tabular-nums`, Tailwind `tabular-nums`).

The family is registered as `--font-sans` in the Tailwind 4 `@theme` block
(`src/assets/main.css`), so every `font-sans` utility and the default sans stack resolve
to Inter. Do **not** import fonts inside components (no Google Fonts `@import`s).

## Type scale

| Level            | Element | Size          | Line height | Weight          | Tailwind classes                        |
| ---------------- | ------- | ------------- | ----------- | --------------- | --------------------------------------- |
| Page heading     | `h1`    | 24px / 1.5rem | 32px        | 600 (semibold)  | `text-2xl font-semibold tracking-tight` |
| Subheading       | `h2`    | 18px / 1.125rem | 28px      | 600 (semibold)  | `text-lg font-semibold`                 |
| Sub-subheading   | `h3`    | 16px / 1rem   | 24px        | 500 (medium)    | `text-base font-medium`                 |
| Body             | —       | 14px / 0.875rem | 21px      | 400 (normal)    | `text-sm`                               |
| Caption / label  | —       | 12px / 0.75rem | 16px       | 500 (medium)    | `text-xs font-medium`                   |

`h1`–`h3` get these styles by default from the base layer in `src/assets/main.css`;
prefer semantic heading tags. For non-heading elements that must look like a heading,
use the Tailwind classes from the table.

## Rules

1. One family everywhere: Inter Variable. No monospace, no serif, no per-component
   font imports. `--font-mono` is aliased to Inter, and the `font-mono` utility is
   redefined (in `main.css`) as Inter + `tabular-nums`, so existing `font-mono`
   usage keeps its column alignment without a second font.
2. Monetary amounts in tables/statements: add `tabular-nums`.
3. Sizes above 24px (`text-3xl`, `text-4xl`) are reserved for dashboard stat figures,
   not headings.
4. Print/PDF templates (opened in their own window, outside the app bundle) declare
   `"Inter Variable", Inter, …, sans-serif` — Inter renders when available on the
   machine, otherwise the system sans fallback is used.
