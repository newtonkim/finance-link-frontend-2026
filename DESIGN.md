---
name: Mfuko Pro
description: Multi-tenant Sacco banking platform — a trustworthy digital ledger
colors:
  sacco-blue: "#0050D8"
  action-blue: "#3288C9"
  accent-sky: "#53B3DA"
  harvest-gold: "#C9A84C"
  arctic-light: "#E8F5FF"
  surface: "#F9FAFB"
  border-gray: "#E5E7EB"
  text-muted: "#6B7280"
  success: "#10B981"
  danger: "#EF4444"
typography:
  headline:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.55
  subtitle:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.5
  body:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.35
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.sacco-blue}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.action-blue}"
  button-accent:
    backgroundColor: "{colors.harvest-gold}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  input-default:
    backgroundColor: "transparent"
    textColor: "#111827"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  card-default:
    backgroundColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "{spacing.lg}"
---

# Design System: Mfuko Pro

## 1. Overview

**Creative North Star: "The Digital Passbook"**

Mfuko Pro is the modern successor to the member's trusted passbook: every number verifiable, every entry traceable, nothing decorative standing between a teller and the transaction. The system is modern, efficient and professional — a fast contemporary SaaS feel where competence is expressed through speed and clarity, not gloss. Density is welcome (financial tables can run wide and deep) but hierarchy always makes the primary figure and the next action obvious.

The system explicitly rejects legacy banking software — cluttered gray form walls, tiny fonts, 90s core-banking density — and the generic admin template look (interchangeable Bootstrap/AdminLTE surfaces with no identity).

**Key Characteristics:**
- One typeface (Inter Variable) everywhere, tabular figures for money
- Sacco Blue carries identity and primary actions; Harvest Gold is the warm counterpoint for key CTAs
- Flat surfaces with soft lift: `shadow-sm` at rest, stronger shadows only for overlays
- Refined and restrained controls — color signals action and state, never decoration
- Dark mode is a first-class citizen (class-based, 331+ components)

## 2. Colors

A restrained financial palette: cool cooperative blues over quiet gray neutrals, with a single warm gold accent.

### Primary
- **Sacco Blue** (#0050D8): The cooperative trust blue. Primary buttons, active navigation, links, key figures. Carries brand identity across tenant and central surfaces.
- **Action Blue** (#3288C9): Hover/secondary intensity of Sacco Blue; progress bars and medium-emphasis actions.
- **Accent Sky** (#53B3DA): Active icons, logo accents, chart secondary series. Never body text.

### Secondary
- **Harvest Gold** (#C9A84C): The warm counterpoint — reserved for high-value CTAs and highlights. Its warmth against the cool palette is what makes it read as "act here".

### Neutral
- **Surface** (#F9FAFB): Dashboard background.
- **Arctic Light** (#E8F5FF): Tinted panels and selected/highlight backgrounds.
- **Border Gray** (#E5E7EB): Input borders and dividers.
- **Text Muted** (#6B7280): Labels and secondary text — never for body copy on tinted backgrounds (AA contrast).
- **Success** (#10B981) / **Danger** (#EF4444): Positive/negative growth, credit/debit, state feedback only.

### Named Rules
**The Verifiable Figure Rule.** Money is never colored for decoration. Green means credit/positive, red means debit/negative, ink means neutral — and every colored figure must be traceable to a ledger entry.

**The Gold Budget Rule.** Harvest Gold appears on at most one primary action per screen. When everything is gold, nothing is.

## 3. Typography

**Body Font:** Inter Variable (with ui-sans-serif, system-ui fallback)
**Label/Mono Font:** none — Inter Variable with `tabular-nums` replaces monospace everywhere

**Character:** One family, many weights. Banking-grade neutrality tuned for dense data; precision in presentation signals precision in the books.

### Hierarchy
- **Headline / h1** (600, 24px, 1.33, -0.025em): Page headings.
- **Title / h2** (600, 18px, 1.55): Section headings, drawer/dialog titles.
- **Subtitle / h3** (500, 16px, 1.5): Sub-sections, card headings.
- **Body** (400, 14px, 1.5): Default text; prose capped at 65–75ch, tables may run denser.
- **Label** (500, 12px): Field labels, table headers, captions.

### Named Rules
**The One Face Rule.** Inter Variable is the only font family in the product. No monospace, no serif, no per-component font imports. Numeric columns use `tabular-nums`, not a second font.

**The Stat Ceiling Rule.** Sizes above 24px (`text-3xl`, `text-4xl`) are reserved for dashboard stat figures, never headings.

## 4. Elevation

Flat with soft lift. Surfaces are flat at rest with a hairline border and at most `shadow-sm`; depth appears as a response to hierarchy, not decoration. Overlays (drawers, dialogs, dropdowns) earn `shadow-lg`/`shadow-xl`. Dark mode conveys depth through background steps rather than shadows.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — shadow-sm): Cards, tables, panels.
- **Overlay** (`shadow-lg`/`shadow-xl`): Drawers, dialogs, dropdown menus, toasts only.

### Named Rules
**The Soft Lift Rule.** If a resting card casts a visible shadow from across the room, it's wrong. Reserve real elevation for things that float above the page.

## 5. Components

Refined and restrained: quiet controls where color marks action and state. Built on shadcn-vue/reka-ui primitives (`src/Global/ui/*`) with cva variants.

### Buttons
- **Shape:** Gently rounded (6px, `rounded-md`), 36px height (`h-9`), 14px medium text.
- **Primary:** Sacco Blue fill (#0050D8), white text; hover shifts toward Action Blue (90% opacity).
- **Accent:** Harvest Gold fill (#C9A84C) for the screen's key CTA (see The Gold Budget Rule).
- **Hover / Focus:** `focus-visible` 3px ring at 50% ring color; transitions 150–200ms.
- **Outline / Ghost / Destructive:** border + transparent bg; hover tint; red fill for destructive.

### Cards / Containers
- **Corner Style:** 12px (`rounded-xl`) dominant; 16px (`rounded-2xl`) for feature panels.
- **Background:** White on Surface (#F9FAFB); Arctic Light (#E8F5FF) for highlighted/selected panels.
- **Shadow Strategy:** shadow-sm + Border Gray hairline (see Elevation).
- **Internal Padding:** 16–24px.

### Inputs / Fields
- **Style:** Transparent bg, Border Gray (#E5E7EB) hairline, 6px radius, 36px height.
- **Focus:** ring 3px at 50% opacity + border shift; no glow.
- **Error / Disabled:** destructive ring/border via `aria-invalid`; 50% opacity + no pointer events when disabled.

### Navigation
- **Style:** Blue-tinted sidebar; active item gets `rgba(83,179,218,0.15)` background and Sacco Blue text/icon; 14px medium labels; collapses on mobile.

### Data Tables (signature)
- Dense rows, 12px medium uppercase-free column labels, right-aligned monetary columns with `tabular-nums`, running-balance columns traceable per account. Row hover tint, never zebra striping.

## 6. Do's and Don'ts

### Do:
- **Do** use Inter Variable for everything; `tabular-nums` on every monetary column.
- **Do** keep body text ≥4.5:1 contrast — bump Text Muted (#6B7280) toward ink on tinted backgrounds.
- **Do** scope color to action and state: blue = act/active, gold = key CTA, green/red = credit/debit.
- **Do** give every interactive component default, hover, focus-visible, active, disabled, loading and error states.
- **Do** use skeletons for loading and empty states that teach the interface.

### Don't:
- **Don't** recreate "legacy banking software": no cluttered gray form walls, tiny fonts, or 90s core-banking density (PRODUCT.md anti-reference).
- **Don't** drift into the "generic admin template" look — interchangeable Bootstrap/AdminLTE surfaces (PRODUCT.md anti-reference).
- **Don't** use side-stripe borders (`border-left` > 1px as accent), gradient text, or glassmorphism.
- **Don't** color money decoratively — see The Verifiable Figure Rule.
- **Don't** put more than one Harvest Gold action on a screen — see The Gold Budget Rule.
- **Don't** add decorative motion; 150–250ms state transitions only, with `prefers-reduced-motion` alternatives.
