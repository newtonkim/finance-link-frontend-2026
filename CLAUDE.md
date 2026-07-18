# CLAUDE.md — mfuko-pro-frontend-2026

Vue 3 + Vite + Tailwind 4 SPA for Mfuko Pro (multi-tenant Sacco banking). Backend guidance lives in `../finance-link-backend-2026/CLAUDE.md`.

## Design Context

- **PRODUCT.md** (repo root): register (product), platform (web), users, positioning, brand personality, anti-references, design principles. Read before any design/UX work.
- **DESIGN.md** (repo root): visual system — Sacco Blue/Harvest Gold palette, Inter Variable type scale (h1 24/600, h2 18/600, h3 16/500, body 14), elevation, component specs, named rules.
- **docs/typography.md**: typography standard details and rationale.
- Inter Variable is the only font family; monetary columns use `tabular-nums` (the `font-mono` utility is redefined in `src/assets/main.css`).
- Design tokens live in the `@theme` block of `src/assets/main.css` (`--color-nfuko-*`, `--font-sans`).
