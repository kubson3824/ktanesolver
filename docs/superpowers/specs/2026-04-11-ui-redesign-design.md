# UI Redesign — Clean Modern Tech-Dashboard

**Date:** 2026-04-11
**Status:** Approved

## Summary

Replace the current FlyonUI-based "KTANE manual" aesthetic with a clean, modern tech-dashboard look built on shadcn/ui + Tailwind CSS. The redesign fixes dark mode (currently brittle, full of hardcoded-color overrides), establishes a proper CSS-variable token system, and produces a focused, professional UI suited to fast-paced gameplay.

---

## 1. Stack Changes

### Removed
- `flyonui` — uninstalled from `package.json` and `tailwind.config.js`
- All FlyonUI class names removed from source: `btn`, `btn-*`, `loading`, `loading-spinner`, `card`, `badge`, `callout-*`, `card-manual`, `section-divider`, `page-title`, `section-heading`, `stamp`
- Custom theme blocks (`manual`, `manual-dark`) in `tailwind.config.js`
- All `[data-theme="manual-dark"]` overrides in `index.css`

### Kept
- Tailwind CSS v3
- `@radix-ui/react-dialog` (already in use)
- `clsx`, `tailwind-merge`, `class-variance-authority` (already installed, used by shadcn/ui)
- `lucide-react` (icons)
- Inter, JetBrains Mono fonts

### Added
- shadcn/ui components as source files in `src/components/ui/`:
  - `button.tsx`, `input.tsx`, `badge.tsx`, `alert.tsx`, `dialog.tsx`, `skeleton.tsx`, `card.tsx`, `separator.tsx`
  - These already exist partially — they are replaced/updated to match shadcn/ui patterns with CSS variable theming
- `tailwind.config.js`: `darkMode: 'class'`, shadcn/ui CSS variable palette

### Font Changes
- **Remove**: Oswald (display/stencil font — no longer fits the aesthetic)
- **Keep**: Inter (body + headings), JetBrains Mono (mono)
- Update Google Fonts import in `index.css`

---

## 2. Theming System

### Mechanism
- Dark mode: `class="dark"` on `<html>` element (shadcn/ui standard)
- `useTheme` hook updated: `document.documentElement.classList.toggle('dark', isDark)` instead of `data-theme` attribute
- All color values are CSS custom properties — no hardcoded hex anywhere in component CSS

### CSS Variables (in `index.css` / `@layer base`)

```css
:root {
  --background: 248 250 252;       /* slate-50 */
  --foreground: 15 23 42;          /* slate-900 */
  --card: 255 255 255;             /* white */
  --card-foreground: 15 23 42;
  --border: 226 232 240;           /* slate-200 */
  --input: 226 232 240;
  --primary: 15 23 42;             /* slate-900 */
  --primary-foreground: 248 250 252;
  --secondary: 241 245 249;        /* slate-100 */
  --secondary-foreground: 15 23 42;
  --muted: 241 245 249;
  --muted-foreground: 100 116 139; /* slate-500 */
  --accent: 124 58 237;            /* violet-600 — used sparingly */
  --accent-foreground: 255 255 255;
  --destructive: 220 38 38;        /* red-600 */
  --destructive-foreground: 255 255 255;
  --ring: 124 58 237;              /* violet-600 focus ring */
  --radius: 0.5rem;
}

.dark {
  --background: 2 6 23;            /* slate-950 */
  --foreground: 248 250 252;       /* slate-50 */
  --card: 15 23 42;                /* slate-900 */
  --card-foreground: 248 250 252;
  --border: 30 41 59;              /* slate-800 */
  --input: 30 41 59;
  --primary: 248 250 252;          /* slate-50 */
  --primary-foreground: 15 23 42;
  --secondary: 30 41 59;           /* slate-800 */
  --secondary-foreground: 248 250 252;
  --muted: 30 41 59;
  --muted-foreground: 148 163 184; /* slate-400 */
  --accent: 139 92 246;            /* violet-500 */
  --accent-foreground: 255 255 255;
  --destructive: 239 68 68;        /* red-500 */
  --destructive-foreground: 255 255 255;
  --ring: 139 92 246;
}
```

### Semantic Color Usage
| Purpose | Token |
|---|---|
| Page background | `bg-background` |
| Card surface | `bg-card` |
| Borders | `border-border` |
| Body text | `text-foreground` |
| Secondary text | `text-muted-foreground` |
| Primary buttons | `bg-primary text-primary-foreground` |
| Focus rings | `ring-ring` |
| Active/highlight accent | `text-accent` / `ring-accent` |
| Success | `text-emerald-600 dark:text-emerald-500` |
| Warning | `text-amber-600 dark:text-amber-500` |
| Destructive | `text-destructive` |

---

## 3. Typography

- **Headings (h1–h3)**: Inter 600/700, normal casing — no `uppercase` forcing except explicit status labels/badges
- **Body**: Inter 400/500
- **Mono**: JetBrains Mono — serial numbers, module IDs, round IDs, code values
- Remove all `font-display` (Oswald) references from components and CSS
- Remove `.page-title`, `.section-heading` utility classes; replace with direct Tailwind: `text-2xl font-semibold tracking-tight` etc.

---

## 4. Component Map (FlyonUI → shadcn/ui)

| Old | New |
|---|---|
| `.btn .btn-primary` | `<Button variant="default">` |
| `.btn .btn-outline` | `<Button variant="outline">` |
| `.btn .btn-ghost` | `<Button variant="ghost">` |
| `.btn .btn-destructive` | `<Button variant="destructive">` |
| `.loading .loading-spinner` | Lucide `Loader2` with `animate-spin` |
| `.card-manual` | `<Card>` (shadcn/ui, rounded-xl, border, shadow-sm) |
| `.callout .callout-error/warning/success/info` | `<Alert variant="destructive/warning/success/info">` — note: shadcn/ui Alert ships with `default` and `destructive` only; `warning`, `success`, `info` variants must be added to `alert.tsx` using CVA |
| `.badge` | `<Badge>` |
| `section-divider` | `<Separator>` |
| `.section-heading` | `text-xs font-semibold uppercase tracking-widest text-muted-foreground` |
| `[data-theme="manual-dark"]` overrides | Removed — CSS variables handle everything |

---

## 5. Page-by-Page Layout

### Navbar
- Height: `h-12`
- Surface: `bg-background border-b border-border`
- Logo: Inter 700, `text-lg`, `KTANE·SOLVER` — no Oswald, no forced uppercase
- Left: logo + inline breadcrumb (desktop), logo only (mobile)
- Right: strike indicator (solve page only) + theme toggle icon button
- Mobile: hamburger → slide-down drawer

### Main Page (`/`)
- Centered content, `max-w-lg`, `py-16` breathing room
- Heading: `text-3xl font-bold` — "Bomb Defusal Solver"
- Subheading: `text-muted-foreground`
- Two Cards side-by-side (desktop) / stacked (mobile)
- Card style: `rounded-xl border border-border shadow-sm bg-card`
- No colored card headers — title inside card body in normal weight

### Setup Page (`/round/:id/setup`)
- Three stat tiles: `Card` with large Inter-700 number, muted label below
- Bomb grid: `Card` components per bomb, action row at bottom of card
- "Add Bomb" button: `Button variant="outline"` with `+` icon
- "Start Round" CTA: `Button variant="default"` (primary, near-black/near-white)
- Dialog: clean modal, `border-b border-border` header separator, no colored backgrounds

### Solve Page — Module Grid (no module selected)
- Full-width, multi-column card grid (3–4 cols desktop, 2 mobile, 1 smallest)
- Each module: `Card` — module name, solved indicator
- **Solved modules**: `opacity-50`, checkmark icon, cursor disabled
- **Unsolved**: full contrast, hover gets subtle `bg-accent/10` ring
- **Opening/loading**: violet accent ring `ring-2 ring-accent`
- Alerts (FMN reminder, check-first) use `<Alert>` above grid

### Solve Page — Solver View (module selected)
- Grid disappears entirely, solver takes full page width
- **Desktop**: `grid grid-cols-5 gap-6`
  - Left `col-span-3`: ManualPanel (iframe/link to manual)
  - Right `col-span-2`: Solver Card — clean `Card`, module name `text-xl font-semibold`, mono ID, inputs below
- **Mobile**: ManualPanel first (collapsible), solver stacked below
- Back navigation: clear `Button variant="ghost"` with `←` in the top bar area
- No full-screen loading overlay — replaced with a `4px` top progress bar (`fixed top-0 left-0 bg-accent h-1 transition-width`)

### Rounds Page (`/rounds`)
- Table or card list of previous rounds
- Clean typography, muted secondary info (date, module count), status badge

---

## 6. Removed Custom CSS

All of the following are removed from `index.css`:

- `.card-manual`
- `.callout`, `.callout-error`, `.callout-warning`, `.callout-success`, `.callout-info`
- `.page-title`
- `.section-heading`
- `.section-divider`
- `.stamp`
- `[data-theme="manual-dark"] *` overrides
- `body { background-color: #F9F6EE }` hardcoded color
- `--shadow-ink` variable and offset shadow

Kept in `index.css`:
- Font imports (updated — remove Oswald)
- `@tailwind base/components/utilities`
- Music notation fonts (`OpusStd`, `OpusChordsSansStd`)
- `.music-symbol`, `.music-chord`
- `.skip-link` (accessibility)
- CSS variable blocks (`:root` and `.dark`)
- `:focus-visible` with `ring-ring` color
- `@media (prefers-reduced-motion)`

---

## 7. Dark Mode Correctness

The current implementation has ~15 `[data-theme="manual-dark"]` overrides because components use hardcoded hex. After this redesign:

- Every component uses `bg-background`, `text-foreground`, `border-border`, etc.
- `.dark` class on `<html>` flips all variables simultaneously
- No per-component dark overrides anywhere
- `useTheme` hook: reads from `localStorage`, applies `document.documentElement.classList`

---

## 8. Files Changed (summary)

| File | Change |
|---|---|
| `package.json` | Remove `flyonui` |
| `tailwind.config.js` | Remove FlyonUI plugin + themes, add `darkMode: 'class'`, add CSS variable color config |
| `src/index.css` | Rewrite: CSS vars, remove all hardcoded utilities, keep music/a11y |
| `src/hooks/useTheme.ts` | Update to toggle `dark` class, not `data-theme` |
| `src/components/ui/*.tsx` | Replace with shadcn/ui implementations |
| `src/components/layout/AppShell.tsx` | `bg-background` instead of `bg-paper` |
| `src/components/layout/Navbar.tsx` | New styles, remove FlyonUI classes |
| `src/pages/MainPage.tsx` | Remove `.card-manual`, use `Card` |
| `src/pages/SetupPage.tsx` | Remove FlyonUI classes throughout |
| `src/pages/SolvePage.tsx` | New focused layout, progress bar, remove FlyonUI |
| `src/pages/RoundsPage.tsx` | Clean card list |
| All solver components | Replace `.btn`, `.loading`, any FlyonUI remnants |
| `src/components/common/SolverLayout.tsx` | Minimal change — spacing only |
