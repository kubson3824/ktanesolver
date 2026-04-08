# Frontend Overhaul — "Defusal Manual" Design

**Goal:** Replace the current dark/glassy aesthetic with a clean, light, KTANE-manual-inspired design that is user-friendly, modern, and immediately readable. The look references the KTANE instruction booklet without being a literal copy — more "technical document" than "laser-printed manual."

**Worktree:** `.worktrees/frontend-overhaul/` (branch `feature/frontend-overhaul`)

**Tech preserved:** React 18, TypeScript 5, Vite, Zustand, React Router, Axios, STOMP/SockJS, TailwindCSS, FlyOnUI (kept and rethemed), Radix Dialog, Lucide React, CVA.

**Tech change:** FlyOnUI **stays** but its theme is completely replaced with a light palette. New fonts added: Oswald (headings) + Inter (body) via Google Fonts. Current Space Grotesk removed.

---

## Design System

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `base-100` | `#F9F6EE` | Page background (warm paper) |
| `base-200` | `#F0EBE0` | Tinted areas, table rows, panel insets |
| `base-300` | `#E2D9CA` | Subtle borders, dividers |
| `base-content` | `#1C1917` | Primary text (warm near-black ink) |
| `primary` | `#C41230` | Primary actions, key accents (KTANE red) |
| `primary-content` | `#FFFFFF` | Text on red backgrounds |
| `primary-focus` | `#9B0E26` | Hover/active red |
| `secondary` | `#374151` | Secondary UI (dark slate) |
| `secondary-content` | `#FFFFFF` | Text on secondary |
| `neutral` | `#6B7280` | Muted text, borders |
| `neutral-content` | `#FFFFFF` | — |
| `success` | `#15803D` | Solved, confirmed |
| `error` | `#C41230` | Errors (same as primary) |
| `warning` | `#B45309` | Warnings, caution |
| `info` | `#1D4ED8` | Info, links |
| White | `#FFFFFF` | Card surfaces |

Custom Tailwind additions:
```js
ink: '#1C1917'          // body text
'ink-muted': '#6B7280'  // secondary text
'ink-subtle': '#9CA3AF' // placeholders, disabled
'border-strong': '#1C1917'  // thick borders
paper: '#F9F6EE'        // page background
```

### Typography

**Google Fonts (added to `index.html`):**
```html
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

| Use | Font | Weight |
|---|---|---|
| Page titles, hero headers | Oswald 700 | Bold, condensed — industrial feel |
| Section headings | Oswald 600 | — |
| Sub-headings, card titles | Inter 600 | — |
| Body text, labels | Inter 400/500 | — |
| Serial numbers, module IDs, codes | JetBrains Mono 400 | — |

### Key Visual Patterns

**Cards:** White (`#FFFFFF`) background, `1px solid #1C1917` border, `box-shadow: 2px 2px 0 #1C1917` (slightly offset — comic/stamp feel), `border-radius: 2px`.

**Callout boxes (Alerts):** 4-pixel left border in accent color + tinted background — exactly like KTANE manual callout/danger boxes.

**Status indicators:** Color-coded left border on cards (4px). Solved = green. Active/in-progress = yellow. Error = red.

**Section headers:** Oswald font, uppercase, slightly tracked, thin bottom rule.

**Module cards:** Short, fixed-height tiles. Top-colored 4px bar (green = solved, stone = unsolved). Module name in Inter 600. ID in JetBrains Mono. Status badge.

**Buttons:**
- Primary: `bg-red text-white`, no border-radius (or 2px), lowercase Inter 600, px-4 py-2
- Secondary/outlined: white bg, dark border, dark text
- Ghost: no bg/border, ink-muted text, hover shows bg-base-200
- Sizes: xs, sm, md, lg

**Inputs:** White bg, 1px `border-neutral` border, 2px `border-primary` focus ring. Clean, no excess rounding.

**Nav:** White bg (`#FFFFFF`), `2px solid #1C1917` bottom border. Logo: "KTANE" in Oswald 700 + "SOLVER" in Oswald 400. Red indicator dot on logo. Breadcrumbs in Inter 500.

**Solver Two-Column Layout:** Manual frame on left (taller, bordered); solver panel on right (white card). Module title bar uses `bg-primary text-white` with Oswald heading.

---

## File Map

**Modified:**
- `index.html` — Google Fonts link
- `ktanesolver-frontend/tailwind.config.js` — new FlyOnUI theme + custom colors/fonts
- `ktanesolver-frontend/src/index.css` — new base styles, typography, custom classes
- `ktanesolver-frontend/src/components/layout/AppShell.tsx`
- `ktanesolver-frontend/src/components/layout/Navbar.tsx`
- `ktanesolver-frontend/src/components/layout/Breadcrumb.tsx`
- `ktanesolver-frontend/src/components/layout/PageContainer.tsx`
- `ktanesolver-frontend/src/components/layout/PageHeader.tsx`
- `ktanesolver-frontend/src/components/ui/button.tsx`
- `ktanesolver-frontend/src/components/ui/card.tsx`
- `ktanesolver-frontend/src/components/ui/badge.tsx`
- `ktanesolver-frontend/src/components/ui/input.tsx`
- `ktanesolver-frontend/src/components/ui/alert.tsx`
- `ktanesolver-frontend/src/components/ui/dialog.tsx`
- `ktanesolver-frontend/src/components/ui/skeleton.tsx`
- `ktanesolver-frontend/src/pages/MainPage.tsx`
- `ktanesolver-frontend/src/pages/RoundsPage.tsx`
- `ktanesolver-frontend/src/pages/SetupPage.tsx`
- `ktanesolver-frontend/src/pages/SolvePage.tsx`
- `ktanesolver-frontend/src/features/setup/BombCard.tsx`
- `ktanesolver-frontend/src/features/rounds/RoundCard.tsx`
- `ktanesolver-frontend/src/features/solve/ModuleGrid.tsx`
- `ktanesolver-frontend/src/features/solve/ManualPanel.tsx`
- `ktanesolver-frontend/src/components/ModuleSelector.tsx`
- `ktanesolver-frontend/src/components/ModuleNumberInput.tsx`
- `ktanesolver-frontend/src/components/NeedyModulesPanel.tsx`
- `ktanesolver-frontend/src/components/StrikeButton.tsx`
- `ktanesolver-frontend/src/components/StrikeIndicator.tsx`
- `ktanesolver-frontend/src/components/ErrorBoundary.tsx`
- `ktanesolver-frontend/src/components/common/SolverLayout.tsx`
- `ktanesolver-frontend/src/components/common/SolverControls.tsx`
- `ktanesolver-frontend/src/components/common/SolverResult.tsx`
- `ktanesolver-frontend/src/components/common/TwitchCommandDisplay.tsx`
- `ktanesolver-frontend/src/components/common/ErrorAlert.tsx`

---

## Task 1: Design System Foundation

**Objective:** Replace dark/gold theme with light paper/red theme. New fonts, new CSS variables, new Tailwind config.

**Files:**
- `index.html` (frontend root — add Google Fonts link)
- `ktanesolver-frontend/tailwind.config.js` (full replacement)
- `ktanesolver-frontend/src/index.css` (full replacement)

### Step 1: `index.html` — Add Google Fonts

In the `<head>`, replace the existing font imports (if any) and add:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Step 2: `tailwind.config.js` — New Theme

Replace entire file:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F9F6EE',
        ink: '#1C1917',
        'ink-muted': '#6B7280',
        'ink-subtle': '#9CA3AF',
        'border-strong': '#1C1917',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'page-title': ['2rem', { lineHeight: '2.25rem', fontWeight: '700', fontFamily: 'Oswald' }],
        'section-title': ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        'card-title': ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body': ['0.9375rem', { lineHeight: '1.5rem' }],
        'caption': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      boxShadow: {
        'card': '2px 2px 0 #1C1917',
        'card-hover': '3px 3px 0 #1C1917',
        'card-sm': '1px 1px 0 #1C1917',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-out-right': {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(100%)' },
        },
        'pulse-success': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(21, 128, 61, 0.3)' },
          '50%': { boxShadow: '0 0 0 8px rgba(21, 128, 61, 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-out-right': 'slide-out-right 0.25s ease-in',
        'pulse-success': 'pulse-success 1s ease-in-out 2',
      },
    },
  },
  plugins: [require("flyonui")],
  flyonui: {
    themes: [
      {
        manual: {
          "primary": "#C41230",
          "primary-focus": "#9B0E26",
          "primary-content": "#FFFFFF",
          "secondary": "#374151",
          "secondary-focus": "#1F2937",
          "secondary-content": "#FFFFFF",
          "accent": "#B45309",
          "accent-focus": "#92400E",
          "accent-content": "#FFFFFF",
          "neutral": "#6B7280",
          "neutral-focus": "#4B5563",
          "neutral-content": "#FFFFFF",
          "base-100": "#F9F6EE",
          "base-200": "#F0EBE0",
          "base-300": "#E2D9CA",
          "base-content": "#1C1917",
          "info": "#1D4ED8",
          "info-content": "#FFFFFF",
          "success": "#15803D",
          "success-content": "#FFFFFF",
          "warning": "#B45309",
          "warning-content": "#FFFFFF",
          "error": "#C41230",
          "error-content": "#FFFFFF",
        },
      },
    ],
    defaultTheme: "manual",
    base: true,
    styled: true,
    utils: true,
    prefix: "",
    logs: false,
    themeRoot: ":root",
  },
}
```

### Step 3: `src/index.css` — New Base Styles

Replace entire file:
```css
@import url("https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Music notation fonts (for Cruel Piano Keys module) */
@font-face {
  font-family: "OpusStd";
  src: url("/font/OpusStd.otf") format("opentype");
}
@font-face {
  font-family: "OpusChordsSansStd";
  src: url("/font/OpusChordsSansStd.otf") format("opentype");
}

@layer base {
  :root {
    font-family: 'Inter', sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * {
    box-sizing: border-box;
  }

  body {
    background-color: #F9F6EE;
    color: #1C1917;
    min-height: 100vh;
    margin: 0;
  }

  #root {
    min-height: 100vh;
  }

  h1, h2 {
    font-family: 'Oswald', sans-serif;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font-family: 'Inter', sans-serif;
  }

  html {
    scroll-behavior: smooth;
  }

  :focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px #C41230;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

@layer components {
  /* ── Typography ─────────────────────────────────── */
  .font-display {
    font-family: 'Oswald', sans-serif;
  }
  .font-mono-code {
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── Manual-style section divider ───────────────── */
  .section-divider {
    @apply border-t-2 border-base-content mb-6 pt-1;
  }

  /* ── Stamp-style labels (used in setup/status) ──── */
  .stamp {
    @apply inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-widest border border-current;
  }

  /* ── Card with offset shadow ─────────────────────── */
  .card-manual {
    @apply bg-white border border-base-content rounded-sm;
    box-shadow: 2px 2px 0 theme('colors.ink');
  }

  /* ── Alert / callout box (KTANE manual style) ────── */
  .callout {
    @apply border-l-4 px-4 py-3 text-sm;
  }
  .callout-error {
    @apply callout bg-red-50 border-error text-error;
  }
  .callout-warning {
    @apply callout bg-amber-50 border-warning text-amber-800;
  }
  .callout-success {
    @apply callout bg-green-50 border-success text-green-800;
  }
  .callout-info {
    @apply callout bg-blue-50 border-info text-blue-800;
  }

  /* ── Page title (Oswald) ─────────────────────────── */
  .page-title {
    @apply font-display text-3xl font-bold uppercase tracking-tight text-base-content;
  }

  /* ── Section heading ─────────────────────────────── */
  .section-heading {
    @apply font-display text-base font-semibold uppercase tracking-widest text-base-content;
  }

  /* Music symbols */
  .music-symbol {
    font-family: 'OpusStd', sans-serif;
    font-size: 1.6em;
    position: relative;
    top: -0.2em;
  }

  .music-chord {
    font-family: 'OpusChordsSansStd', sans-serif;
    word-spacing: 0.3em;
  }

  /* ── Skip link ───────────────────────────────────── */
  .skip-link {
    @apply sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-content focus:rounded-sm focus:shadow-card;
  }
}
```

### Commit:
```bash
git add index.html ktanesolver-frontend/tailwind.config.js ktanesolver-frontend/src/index.css
git commit -m "feat: replace design system — light paper theme, Oswald+Inter fonts"
```

---

## Task 2: Layout — AppShell, Navbar, Page Structure

**Objective:** New navigation bar, layout wrapper, breadcrumbs, page containers.

**Files:**
- `ktanesolver-frontend/src/components/layout/AppShell.tsx`
- `ktanesolver-frontend/src/components/layout/Navbar.tsx`
- `ktanesolver-frontend/src/components/layout/Breadcrumb.tsx`
- `ktanesolver-frontend/src/components/layout/PageContainer.tsx`
- `ktanesolver-frontend/src/components/layout/PageHeader.tsx`

### Navbar design:
- Full-width, white (`bg-white`) background with `border-b-2 border-base-content` — thick bottom border (like manual page border)
- Height: `h-14` (56px)
- Left: Logo `<span className="font-display text-xl font-bold uppercase tracking-tight">KTANE<span className="text-primary">·</span>SOLVER</span>`
- Center (or right on mobile): Breadcrumbs
- Right: Contextual info (round status, strike count when on solve page)
- Mobile: Hamburger menu

### Breadcrumbs:
- Use `/` as separator
- Active item bold, inactive items muted + clickable
- Example: `Rounds / Setup / Modules`
- Use Inter 500, small text

### PageContainer:
```tsx
// Standard centered container
<div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">{children}</div>
```

### PageHeader:
```tsx
// Title + optional subtitle + optional actions
<div className="mb-8">
  <div className="flex items-start justify-between gap-4">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="text-ink-muted mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex gap-2 flex-shrink-0">{actions}</div>}
  </div>
  <div className="section-divider mt-4" />
</div>
```

### Commit:
```bash
git add ktanesolver-frontend/src/components/layout/
git commit -m "feat: redesign layout components — manual-style navbar, breadcrumbs"
```

---

## Task 3: UI Primitives

**Objective:** Redesign all base UI components to match new design system.

**Files:**
- `ktanesolver-frontend/src/components/ui/button.tsx`
- `ktanesolver-frontend/src/components/ui/card.tsx`
- `ktanesolver-frontend/src/components/ui/badge.tsx`
- `ktanesolver-frontend/src/components/ui/input.tsx`
- `ktanesolver-frontend/src/components/ui/alert.tsx`
- `ktanesolver-frontend/src/components/ui/dialog.tsx`
- `ktanesolver-frontend/src/components/ui/skeleton.tsx`

### Button (`button.tsx`):
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 text-sm font-semibold transition-colors cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none rounded-sm",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-content hover:bg-primary-focus border border-primary",
        secondary: "bg-white text-base-content border border-base-content hover:bg-base-200",
        ghost: "bg-transparent text-ink-muted border border-transparent hover:bg-base-200 hover:text-base-content",
        danger: "bg-error text-error-content hover:bg-primary-focus border border-error",
        success: "bg-success text-success-content hover:bg-green-700 border border-success",
        outline: "bg-transparent text-base-content border border-base-content hover:bg-base-200",
      },
      size: {
        xs: "px-2 py-1 text-xs",
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-sm",
        lg: "px-5 py-2.5 text-base",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
)
```

### Card (`card.tsx`):
Three variants:
- `default`: white bg, border-base-content, card shadow (2px 2px offset)
- `flat`: white bg, border-base-300, no shadow
- `inset`: base-200 bg, no border

Card sub-components: `<CardHeader>` (base-200 bg, border-bottom), `<CardTitle>` (Inter 600), `<CardContent>`, `<CardFooter>` (border-top, base-200 bg)

### Badge (`badge.tsx`):
```tsx
const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-sm border",
  {
    variants: {
      variant: {
        default: "bg-base-200 text-base-content border-base-300",
        primary: "bg-primary/10 text-primary border-primary/30",
        success: "bg-green-50 text-success border-success/30",
        warning: "bg-amber-50 text-warning border-warning/30",
        error: "bg-red-50 text-error border-error/30",
        info: "bg-blue-50 text-info border-info/30",
        outline: "bg-transparent border-current",
      }
    },
    defaultVariants: { variant: "default" }
  }
)
```

### Input (`input.tsx`):
```tsx
// Clean input: white bg, strong border, red focus ring, monospace font option
<input className="w-full bg-white border border-neutral/40 rounded-sm px-3 py-2 text-sm text-base-content placeholder:text-ink-subtle focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" />
```

### Alert (`alert.tsx`):
Use callout pattern (4px left border + tinted bg):
```tsx
const alertVariants = cva("callout rounded-sm", {
  variants: {
    variant: {
      default: "callout-info",
      error: "callout-error",
      warning: "callout-warning",
      success: "callout-success",
    }
  },
  defaultVariants: { variant: "default" }
})
```

### Dialog (`dialog.tsx`):
- White background modal
- Dark border / card shadow
- Header: base-200 bg with `section-heading`, bottom border
- Footer: base-200 bg, border-top, right-aligned action buttons
- Overlay: `bg-base-content/30 backdrop-blur-sm`

### Skeleton (`skeleton.tsx`):
```tsx
// Animated gray pulse on base-200 bg
<div className="animate-pulse bg-base-300 rounded-sm" />
```

### Commit:
```bash
git add ktanesolver-frontend/src/components/ui/
git commit -m "feat: redesign UI primitives — manual-style buttons, cards, badges, inputs"
```

---

## Task 4: Pages — MainPage and RoundsPage

**Objective:** Redesign the landing page and round history page with new design system.

**Files:**
- `ktanesolver-frontend/src/pages/MainPage.tsx`
- `ktanesolver-frontend/src/pages/RoundsPage.tsx`
- `ktanesolver-frontend/src/features/rounds/RoundCard.tsx`

### MainPage design:
- `PageContainer` wrapping content
- `PageHeader` with title "BOMB DEFUSAL SOLVER" and subtitle "KTaNE solver for expert teams"
- Two large action cards side by side (or stacked on mobile):
  - **New Round card:** Card with red header bar, "START NEW ROUND" button prominent
  - **Previous Rounds card:** Card with gray header bar, "VIEW HISTORY" button
- Cards use `card-manual` class with clear visual hierarchy
- Below: Quick stats if rounds exist (total rounds, best solve, etc.)

### RoundsPage design:
- `PageHeader` title "ROUND HISTORY"
- "Create New Round" button in header actions
- Round list: clean table-like layout or stack of RoundCard components
- Empty state: centered, minimal ("No rounds yet. Start your first round.")

### RoundCard design:
- Flat card variant (no heavy shadow)
- Left side: Round ID (monospace, abbreviated) + status badge
- Middle: Bomb count, module count, date
- Right side: Action buttons (View, Delete)
- Status-colored left border (4px):
  - SETUP → neutral
  - ACTIVE → warning (amber)
  - COMPLETED → success (green)
  - FAILED → error (red)

### Commit:
```bash
git add ktanesolver-frontend/src/pages/MainPage.tsx ktanesolver-frontend/src/pages/RoundsPage.tsx ktanesolver-frontend/src/features/rounds/
git commit -m "feat: redesign MainPage and RoundsPage"
```

---

## Task 5: Setup Flow — SetupPage, BombCard, ModuleSelector

**Objective:** Redesign the bomb configuration and module setup experience.

**Files:**
- `ktanesolver-frontend/src/pages/SetupPage.tsx`
- `ktanesolver-frontend/src/features/setup/BombCard.tsx`
- `ktanesolver-frontend/src/components/ModuleSelector.tsx`
- `ktanesolver-frontend/src/components/ModuleNumberInput.tsx`

### SetupPage design:
- `PageHeader` with round status stamp and "Start Round" action
- Stats row: Total Bombs, Total Modules, Checks needed — clean stat cards
- "Add Bomb" button prominent with `+` icon
- Bomb cards in a grid (2-col on desktop, 1 on mobile)
- Dialogs for adding/editing bombs: clean white modal with form sections

### BombCard design:
- `card-manual` variant
- Header: `bg-base-200` with bomb number ("BOMB 1") in Oswald 600 + edit/delete actions right-aligned
- Body: Edgework details in a clean two-column grid:
  - Serial number in `font-mono-code` large
  - Battery count with battery icon
  - Indicators as colored dots (LIT = filled, UNLIT = outline)
  - Port plates as small grouped port chips
- Footer: Module count pill + "Add Modules" button

### ModuleSelector design:
- Category tabs: VANILLA / MODDED / NEEDY — tab style navigation
- Search input at top
- Module grid: compact tiles with module name + small category badge
- Count controls: `-` / count / `+` row per selected module
- Selected modules: highlighted with primary color left border
- Checkboxes or toggle-style selection

### Commit:
```bash
git add ktanesolver-frontend/src/pages/SetupPage.tsx ktanesolver-frontend/src/features/setup/ ktanesolver-frontend/src/components/ModuleSelector.tsx ktanesolver-frontend/src/components/ModuleNumberInput.tsx
git commit -m "feat: redesign SetupPage, BombCard, ModuleSelector"
```

---

## Task 6: Solve Flow — SolvePage, ModuleGrid, ManualPanel

**Objective:** Redesign the main solve experience — the most-used view.

**Files:**
- `ktanesolver-frontend/src/pages/SolvePage.tsx`
- `ktanesolver-frontend/src/features/solve/ModuleGrid.tsx`
- `ktanesolver-frontend/src/features/solve/ManualPanel.tsx`

### SolvePage — No Module Selected (Grid view):
- Top: Bomb selector as horizontal tabs. Each tab: "BOMB 1 • SERIAL" in Oswald, strike count badge.
- "Check These First" strip: amber callout bar with module names
- Module grid: `grid-cols-3 md:grid-cols-4 lg:grid-cols-5` of compact module tiles
- Forget Me Not reminder: amber callout when applicable
- Strike counter: visible in top area

### SolvePage — Module Selected (Solver view):
Two-column layout (60/40 split on desktop, stacked on mobile):
- **Left column:** `ManualPanel` — an iframe wrapped in a bordered panel.
  - Panel header: "MANUAL" in section-heading style + module name
  - Close button top-right
- **Right column:** Solver component wrapped in a white card
  - Card header: module name in Oswald 700 + module ID in mono
  - Separator line
  - Solver content below

### ModuleGrid design:
Each module tile (compact, ~140px wide):
- White bg, border border-base-300, rounded-sm
- 4px top bar: `bg-success` if solved, `bg-base-300` if not
- Content: Module name in Inter 600, center-aligned. Below: ID in mono 11px. Status badge.
- Hover: `shadow-card-sm` + cursor-pointer
- Solved: slight green tint `bg-green-50/50`, check icon overlay

### ManualPanel design:
- Full-height iframe panel
- Top strip: Module name + "Open in new tab" link
- Loading state: skeleton/spinner centered
- Error state: callout-error

### Commit:
```bash
git add ktanesolver-frontend/src/pages/SolvePage.tsx ktanesolver-frontend/src/features/solve/
git commit -m "feat: redesign SolvePage, ModuleGrid, ManualPanel"
```

---

## Task 7: Solver Components — SolverLayout, Common, Sidebar

**Objective:** Redesign the solver wrapper, controls, results display, needy panel, and strike UI.

**Files:**
- `ktanesolver-frontend/src/components/common/SolverLayout.tsx`
- `ktanesolver-frontend/src/components/common/SolverControls.tsx`
- `ktanesolver-frontend/src/components/common/SolverResult.tsx`
- `ktanesolver-frontend/src/components/common/TwitchCommandDisplay.tsx`
- `ktanesolver-frontend/src/components/common/ErrorAlert.tsx`
- `ktanesolver-frontend/src/components/NeedyModulesPanel.tsx`
- `ktanesolver-frontend/src/components/StrikeButton.tsx`
- `ktanesolver-frontend/src/components/StrikeIndicator.tsx`
- `ktanesolver-frontend/src/components/ErrorBoundary.tsx`
- `ktanesolver-frontend/src/components/SemaphoreFlagSelector.tsx` (if visually affected)

### SolverLayout:
Clean wrapper — just a white card area. Title removed (title lives in SolvePage's module header). Content flows naturally.

### SolverControls:
- "Solve" button: primary (red), full-width or right-aligned
- "Reset" button: ghost variant, smaller
- While loading: spinner inside button, disabled state
- After solve: button turns success green, disabled

### SolverResult:
Clean results display:
- Green callout box: "SOLVED — [module name]"
- Solution content in a clean table or definition list
- `font-mono-code` for values, regular Inter for labels

### TwitchCommandDisplay:
- Small code block: `bg-base-200 border border-base-300 rounded-sm px-3 py-2 font-mono text-sm`
- Copy button with clipboard icon

### ErrorAlert (common):
Use `callout-error` pattern.

### NeedyModulesPanel:
Redesign as a right-side slide-in panel:
- Pure white bg, border-left (2px strong), shadow
- Panel header: "NEEDY MODULES" in section-heading + close button
- Each module: compact card with module name + solver inline

### StrikeButton:
- Red circular badge showing current strikes: `"STRIKES: N"`
- Add Strike button: danger variant, small

### StrikeIndicator:
- X marks or explosion icons in red for each strike
- Clean, small display

### ErrorBoundary:
- Full-page error state: centered, callout-error, "Something went wrong" message

### Commit:
```bash
git add ktanesolver-frontend/src/components/common/ ktanesolver-frontend/src/components/NeedyModulesPanel.tsx ktanesolver-frontend/src/components/StrikeButton.tsx ktanesolver-frontend/src/components/StrikeIndicator.tsx ktanesolver-frontend/src/components/ErrorBoundary.tsx
git commit -m "feat: redesign SolverLayout, controls, result display, needy panel, strike UI"
```

---

## Build Verification

After all tasks, run:
```bash
cd ktanesolver-frontend && npm run build
```

Pre-existing TypeScript errors (Simon States not wired in frontend) are acceptable. Zero new errors should be introduced by the redesign.

---

## Notes for Implementers

1. **FlyOnUI classes stay** (`btn`, `badge`, `input`, `select` etc. are still available from the library). But avoid relying on them where the custom `components/ui/` wrappers give you more control.

2. **Do not change** TypeScript types, store logic, service functions, solver algorithms, API calls, WebSocket handling, or any business logic. This is a **visual-only overhaul**.

3. **Keep all existing props/exports** on components. Only change the JSX/className content, not the component interfaces.

4. **Module solver components** (50+ files in `src/components/solvers/`) do NOT need editing — they use `SolverLayout`/`SolverControls`/`SolverResult` wrappers which will be updated in Task 7. They inherit the new design automatically.

5. **Use** `font-display` (Oswald) class for headings, `font-sans` (Inter) for body, `font-mono` (JetBrains Mono) for codes/IDs.

6. **Color shorthand:** `text-primary` = red, `bg-base-100` = paper, `bg-white` = white card, `text-base-content` = ink black, `text-ink-muted` = gray secondary text.

7. **Tailwind note:** `text-ink-muted` and `text-ink-subtle` are custom colors added in tailwind.config.js. Standard Tailwind color utilities (`text-gray-500`, etc.) also work.
