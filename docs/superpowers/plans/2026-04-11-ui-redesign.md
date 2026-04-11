# UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace FlyonUI with a clean shadcn/ui-style system using CSS variables, fix dark mode to use the `dark` class, and modernise the visual design to a slate/zinc tech-dashboard aesthetic.

**Architecture:** Remove FlyonUI from `tailwind.config.js` and uninstall the package. Wire in a CSS-variable–based palette (slate base, violet accent) with a `darkMode: 'class'` toggle. Existing `src/components/ui/` files are updated in-place to use the new tokens; FlyonUI component class usages in solvers are replaced file-by-file with component imports or Tailwind utility classes.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v3 (`darkMode: 'class'`), Radix UI (`@radix-ui/react-dialog` already installed), Lucide React, Zustand, Vitest + Testing Library.

---

## File Map

| File | Action |
|---|---|
| `ktanesolver-frontend/package.json` | Remove `flyonui` |
| `ktanesolver-frontend/tailwind.config.js` | Full rewrite — CSS var palette, dark mode class, color aliases |
| `ktanesolver-frontend/src/index.css` | Full rewrite — CSS vars in `:root`/`.dark`, remove hardcoded utilities, keep music/a11y |
| `ktanesolver-frontend/src/hooks/useTheme.ts` | Update to toggle `dark` class instead of `data-theme` |
| `ktanesolver-frontend/src/components/layout/Navbar.test.tsx` | Update assertions: `dark` class instead of `data-theme` |
| `ktanesolver-frontend/src/components/ui/button.tsx` | Replace FlyonUI tokens + loading spinner with Loader2 |
| `ktanesolver-frontend/src/components/ui/input.tsx` | Replace FlyonUI tokens |
| `ktanesolver-frontend/src/components/ui/badge.tsx` | Replace FlyonUI tokens |
| `ktanesolver-frontend/src/components/ui/card.tsx` | Replace FlyonUI tokens, modern border-radius |
| `ktanesolver-frontend/src/components/ui/alert.tsx` | Replace FlyonUI tokens, add warning/success/info variants |
| `ktanesolver-frontend/src/components/ui/skeleton.tsx` | Replace FlyonUI token |
| `ktanesolver-frontend/src/components/ui/dialog.tsx` | Replace FlyonUI tokens |
| `ktanesolver-frontend/src/components/layout/AppShell.tsx` | `bg-paper` → `bg-background` |
| `ktanesolver-frontend/src/components/layout/Navbar.tsx` | Replace FlyonUI classes |
| `ktanesolver-frontend/src/components/layout/PageContainer.tsx` | No change needed |
| `ktanesolver-frontend/src/components/layout/PageHeader.tsx` | Replace `.page-title` / `.section-divider` |
| `ktanesolver-frontend/src/features/setup/BombCard.tsx` | Replace `.card-manual`, `font-display`, FlyonUI tokens |
| `ktanesolver-frontend/src/features/solve/ModuleGrid.tsx` | Replace FlyonUI tokens + `loading-spinner` |
| `ktanesolver-frontend/src/features/solve/ManualPanel.tsx` | Replace `.card-manual`, FlyonUI tokens |
| `ktanesolver-frontend/src/features/rounds/RoundCard.tsx` | Replace `.card-manual`, hardcoded hex, FlyonUI tokens |
| `ktanesolver-frontend/src/components/NeedyModulesPanel.tsx` | Replace FlyonUI tokens |
| `ktanesolver-frontend/src/components/ModuleSelector.tsx` | Replace FlyonUI tokens |
| `ktanesolver-frontend/src/components/StrikeButton.tsx` | Badge `error` → `destructive`, Button `danger` → `destructive` |
| `ktanesolver-frontend/src/components/StrikeIndicator.tsx` | `text-error` → `text-destructive` |
| `ktanesolver-frontend/src/components/common/SolverControls.tsx` | Button variants: `primary`→`default`, `success`→CSS |
| `ktanesolver-frontend/src/components/common/ErrorAlert.tsx` | Alert `error` → `destructive` |
| `ktanesolver-frontend/src/pages/MainPage.tsx` | Replace `.card-manual`, FlyonUI tokens |
| `ktanesolver-frontend/src/pages/SetupPage.tsx` | Replace all FlyonUI classes |
| `ktanesolver-frontend/src/pages/SolvePage.tsx` | Replace all FlyonUI classes, add progress bar |
| `ktanesolver-frontend/src/pages/RoundsPage.tsx` | Replace `variant="primary"` → `"default"` |
| All 38 `src/components/solvers/*.tsx` | Replace `input input-bordered`, `alert alert-*`, `badge badge-*`, `loading loading-spinner` with component imports / Tailwind classes |

---

## Task 1: Foundation — package.json, tailwind.config.js, index.css

**Files:**
- Modify: `ktanesolver-frontend/package.json`
- Modify: `ktanesolver-frontend/tailwind.config.js`
- Modify: `ktanesolver-frontend/src/index.css`

- [ ] **Step 1: Remove flyonui from package.json**

In `ktanesolver-frontend/package.json`, remove this line from `"dependencies"`:
```json
"flyonui": "^2.4.1",
```

- [ ] **Step 2: Uninstall flyonui**

```bash
cd ktanesolver-frontend
npm uninstall flyonui
```

Expected: package-lock.json updates, no errors.

- [ ] **Step 3: Replace tailwind.config.js**

Replace the entire contents of `ktanesolver-frontend/tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary design tokens (CSS variable–based)
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)',
        },
        ring: 'rgb(var(--ring) / <alpha-value>)',
        // Backward-compatible aliases — solver components use these; they resolve to the
        // same CSS vars so dark mode works correctly everywhere without touching each file.
        'base-100': 'rgb(var(--background) / <alpha-value>)',
        'base-200': 'rgb(var(--muted) / <alpha-value>)',
        'base-300': 'rgb(var(--border) / <alpha-value>)',
        'base-content': 'rgb(var(--foreground) / <alpha-value>)',
        'ink-muted': 'rgb(var(--muted-foreground) / <alpha-value>)',
        'ink-subtle': 'rgb(var(--muted-foreground) / <alpha-value>)',
        'primary-content': 'rgb(var(--primary-foreground) / <alpha-value>)',
        paper: 'rgb(var(--background) / <alpha-value>)',
        ink: 'rgb(var(--foreground) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
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
        'progress': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-out-right': 'slide-out-right 0.25s ease-in',
        'progress': 'progress 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Replace index.css**

Replace the entire contents of `ktanesolver-frontend/src/index.css` with:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,500;0,600;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap");
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

/* ── CSS design tokens ───────────────────────────────────── */
:root {
  /* Slate-50 background, slate-900 text */
  --background: 248 250 252;
  --foreground: 15 23 42;
  --card: 255 255 255;
  --card-foreground: 15 23 42;
  --border: 226 232 240;
  --input: 226 232 240;
  --primary: 15 23 42;
  --primary-foreground: 248 250 252;
  --secondary: 241 245 249;
  --secondary-foreground: 15 23 42;
  --muted: 241 245 249;
  --muted-foreground: 100 116 139;
  --accent: 124 58 237;
  --accent-foreground: 255 255 255;
  --destructive: 220 38 38;
  --destructive-foreground: 255 255 255;
  --ring: 124 58 237;
  --radius: 0.5rem;
}

.dark {
  --background: 2 6 23;
  --foreground: 248 250 252;
  --card: 15 23 42;
  --card-foreground: 248 250 252;
  --border: 30 41 59;
  --input: 30 41 59;
  --primary: 248 250 252;
  --primary-foreground: 15 23 42;
  --secondary: 30 41 59;
  --secondary-foreground: 248 250 252;
  --muted: 30 41 59;
  --muted-foreground: 148 163 184;
  --accent: 139 92 246;
  --accent-foreground: 255 255 255;
  --destructive: 239 68 68;
  --destructive-foreground: 255 255 255;
  --ring: 139 92 246;
}

/* ── Base layer ──────────────────────────────────────────── */
@layer base {
  :root {
    font-family: 'Inter', sans-serif;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  * { box-sizing: border-box; }

  body {
    background-color: rgb(var(--background));
    color: rgb(var(--foreground));
    min-height: 100vh;
    margin: 0;
  }

  #root { min-height: 100vh; }

  a {
    color: inherit;
    text-decoration: none;
  }

  button { font-family: 'Inter', sans-serif; }

  html { scroll-behavior: smooth; }

  :focus-visible {
    outline: 2px solid rgb(var(--ring));
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
}

/* ── Component utilities ─────────────────────────────────── */
@layer components {
  /* Skip link for keyboard navigation */
  .skip-link {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  .skip-link:focus {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 9999;
    width: auto;
    height: auto;
    padding: 0.5rem 1rem;
    background: rgb(var(--accent));
    color: white;
    font-weight: 600;
    border-radius: var(--radius);
  }

  /* Music notation */
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

  /* Backward-compat section utilities used by a few layout components.
     These will be removed once those components are updated. */
  .font-display { font-family: 'Inter', sans-serif; font-weight: 700; }
}
```

- [ ] **Step 5: Verify the build compiles**

```bash
cd ktanesolver-frontend
npm run build
```

Expected: build succeeds (may have type errors in UI components — that's fine, we fix them next).

- [ ] **Step 6: Commit**

```bash
cd ktanesolver-frontend
git add package.json package-lock.json tailwind.config.js src/index.css
git commit -m "feat: replace flyonui with CSS-variable palette, darkMode class"
```

---

## Task 2: Theme hook — switch from data-theme to dark class

**Files:**
- Modify: `ktanesolver-frontend/src/hooks/useTheme.ts`
- Modify: `ktanesolver-frontend/src/components/layout/Navbar.test.tsx`

- [ ] **Step 1: Write failing tests first**

Replace the contents of `ktanesolver-frontend/src/components/layout/Navbar.test.tsx` with:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from './Navbar';

const mockStore = { currentBomb: null, currentModule: null, clearModule: vi.fn() };

vi.mock('../../store/useRoundStore', () => ({
  useRoundStore: (selector: (s: typeof mockStore) => unknown) => selector(mockStore),
}));

describe('Navbar theme toggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('renders a theme toggle button', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('button', { name: 'Enable dark mode' })
    ).toBeInTheDocument();
  });

  it('clicking the toggle adds dark class to <html>', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable dark mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('button label flips to "Enable light mode" after activating dark mode', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable dark mode' }));
    expect(
      screen.getByRole('button', { name: 'Enable light mode' })
    ).toBeInTheDocument();
  });

  it('shows "Enable light mode" label when dark mode is already active', () => {
    localStorage.setItem('ktane-theme', 'dark');
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(
      screen.getByRole('button', { name: 'Enable light mode' })
    ).toBeInTheDocument();
  });

  it('clicking toggle removes dark class when already in dark mode', () => {
    localStorage.setItem('ktane-theme', 'dark');
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Enable light mode' }));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — expect failures**

```bash
cd ktanesolver-frontend
npm test
```

Expected: several test failures because the hook still uses `data-theme`.

- [ ] **Step 3: Update useTheme.ts**

Replace the entire contents of `ktanesolver-frontend/src/hooks/useTheme.ts` with:

```ts
import { useEffect } from 'react';
import { create } from 'zustand';

type Theme = 'light' | 'dark';

export const STORAGE_KEY = 'ktane-theme';

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

interface ThemeStore {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const initialTheme = getInitialTheme();

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: initialTheme,
  isDark: initialTheme === 'dark',
  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore storage errors
      }
      return { theme: next, isDark: next === 'dark' };
    }),
}));

export function useTheme() {
  const theme = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  // Sync on mount: re-read localStorage in case store was initialised before this render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const localTheme: Theme = stored === 'dark' ? 'dark' : 'light';
      if (useThemeStore.getState().theme !== localTheme) {
        useThemeStore.setState({ theme: localTheme, isDark: localTheme === 'dark' });
      }
      document.documentElement.classList.toggle('dark', localTheme === 'dark');
    } catch {
      document.documentElement.classList.toggle('dark', useThemeStore.getState().isDark);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { theme, isDark, toggleTheme };
}
```

- [ ] **Step 4: Run tests — expect pass**

```bash
cd ktanesolver-frontend
npm test
```

Expected: all theme tests pass. (Other tests may still fail if they reference old FlyonUI classes — that's fine for now.)

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTheme.ts src/components/layout/Navbar.test.tsx
git commit -m "feat: theme hook uses dark class on <html> instead of data-theme"
```

---

## Task 3: UI components — button, input, badge, skeleton

**Files:**
- Modify: `ktanesolver-frontend/src/components/ui/button.tsx`
- Modify: `ktanesolver-frontend/src/components/ui/input.tsx`
- Modify: `ktanesolver-frontend/src/components/ui/badge.tsx`
- Modify: `ktanesolver-frontend/src/components/ui/skeleton.tsx`

- [ ] **Step 1: Replace button.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/button.tsx` with:

```tsx
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary:   "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline:     "border border-border bg-background text-foreground hover:bg-muted",
        ghost:       "text-foreground hover:bg-muted hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        success:     "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
        // Kept for backward compat — maps to default and destructive
        primary:     "bg-primary text-primary-foreground hover:bg-primary/90",
        danger:      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-8 rounded-md px-3 text-xs",
        md:      "h-9 px-4 py-2",
        lg:      "h-10 rounded-md px-8",
        xs:      "h-6 rounded px-2 text-xs",
        icon:    "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

- [ ] **Step 2: Replace input.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/input.tsx` with:

```tsx
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 3: Replace badge.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/badge.tsx` with:

```tsx
import { type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        outline:     "border-border text-foreground bg-transparent",
        success:     "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning:     "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        destructive: "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
        info:        "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        // Backward-compat aliases
        error:       "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
        primary:     "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
```

- [ ] **Step 4: Replace skeleton.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/skeleton.tsx` with:

```tsx
import { cn } from "../../lib/cn";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };
```

- [ ] **Step 5: Run build check**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | head -40
```

Expected: fewer or no errors than before.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/badge.tsx src/components/ui/skeleton.tsx
git commit -m "feat: update button/input/badge/skeleton to CSS variable tokens"
```

---

## Task 4: UI components — card, alert, dialog

**Files:**
- Modify: `ktanesolver-frontend/src/components/ui/card.tsx`
- Modify: `ktanesolver-frontend/src/components/ui/alert.tsx`
- Modify: `ktanesolver-frontend/src/components/ui/dialog.tsx`

- [ ] **Step 1: Replace card.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/card.tsx` with:

```tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const cardVariants = cva("rounded-xl border bg-card text-card-foreground shadow-sm", {
  variants: {
    variant: {
      default: "border-border",
      muted:   "bg-muted border-border shadow-none",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(cardVariants({ variant }), className)} {...props} />
  )
);
Card.displayName = "Card";

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-4 pb-3 border-b border-border", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("font-semibold text-base leading-tight text-foreground", className)} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 pt-3", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center justify-end gap-2 p-4 pt-3 border-t border-border", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants };
```

- [ ] **Step 2: Replace alert.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/alert.tsx` with:

```tsx
import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border-l-4 p-4 text-sm",
  {
    variants: {
      variant: {
        default:     "border-l-border bg-muted text-foreground",
        destructive: "border-l-destructive bg-destructive/5 text-destructive dark:bg-destructive/10",
        warning:     "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
        success:     "border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
        info:        "border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-400",
        // Backward-compat aliases
        error:       "border-l-destructive bg-destructive/5 text-destructive dark:bg-destructive/10",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const Alert = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn("mb-1 font-semibold leading-none", className)} {...props} />
  )
);
AlertTitle.displayName = "AlertTitle";

const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
  )
);
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
```

- [ ] **Step 3: Replace dialog.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/ui/dialog.tsx` with:

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "../../lib/cn";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] bg-card border border-border rounded-xl shadow-lg p-0 overflow-hidden data-[state=open]:animate-fade-in",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 px-5 py-4 border-b border-border", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-end gap-2 px-5 py-4 border-t border-border bg-muted/40", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-base font-semibold text-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("px-5 py-4", className)} {...props} />
);
DialogBody.displayName = "DialogBody";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
```

- [ ] **Step 4: Run build check**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/card.tsx src/components/ui/alert.tsx src/components/ui/dialog.tsx
git commit -m "feat: update card/alert/dialog to CSS variable tokens, add alert variants"
```

---

## Task 5: Layout components

**Files:**
- Modify: `ktanesolver-frontend/src/components/layout/AppShell.tsx`
- Modify: `ktanesolver-frontend/src/components/layout/Navbar.tsx`
- Modify: `ktanesolver-frontend/src/components/layout/PageHeader.tsx`

- [ ] **Step 1: Update AppShell.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/layout/AppShell.tsx` with:

```tsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navbar />
      <main className="flex-1" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Update Navbar.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/layout/Navbar.tsx` with:

```tsx
import { useState, useEffect } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useRoundStore } from "../../store/useRoundStore";
import { StrikeIndicator } from "../StrikeIndicator";
import { StrikeButton } from "../StrikeButton";
import Breadcrumb from "./Breadcrumb";
import { formatRoundLabel, formatModuleDisplayName } from "../../lib/utils";
import { Moon, Sun, Menu, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { cn } from "../../lib/cn";

export default function Navbar() {
  const location = useLocation();
  const { roundId } = useParams();
  const currentBomb = useRoundStore((state) => state.currentBomb);
  const currentModule = useRoundStore((state) => state.currentModule);
  const clearModule = useRoundStore((state) => state.clearModule);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const pathname = location.pathname;
  const isHome = pathname === "/";
  const isRounds = pathname === "/rounds";
  const isRoundSetup = /^\/round\/[^/]+\/setup$/.test(pathname);
  const isSolving = pathname.startsWith("/solve");

  const breadcrumbSegments = (() => {
    if (isHome) return null;
    if (isRounds) {
      return [
        { label: "Home", to: "/" },
        { label: "Previous rounds", current: true as const },
      ];
    }
    if (isRoundSetup && roundId) {
      return [
        { label: formatRoundLabel(roundId), to: `/round/${roundId}/setup` },
        { label: "Setup", current: true as const },
      ];
    }
    if (isSolving && roundId) {
      const goToModuleList = () => {
        clearModule();
        setMobileOpen(false);
      };
      const currentModuleLabel = currentModule
        ? formatModuleDisplayName(currentModule.moduleType, currentModule.id)
        : "";
      return [
        { label: formatRoundLabel(roundId), to: `/round/${roundId}/setup` },
        ...(currentModule
          ? [
              { label: "Modules", onClick: goToModuleList },
              { label: currentModuleLabel, current: true as const },
            ]
          : [{ label: "Modules", current: true as const }]),
      ];
    }
    return null;
  })();

  return (
    <nav
      className="sticky top-0 z-40 bg-background border-b border-border"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <div className="flex items-center gap-4 min-w-0">
            <Link to="/" aria-label="KTANE Solver home" className="shrink-0">
              <span className="font-bold text-lg text-foreground tracking-tight">
                KTANE<span className="text-accent">·</span>SOLVER
              </span>
            </Link>
            <div className="hidden sm:flex items-center gap-1 min-w-0">
              {breadcrumbSegments && (
                <Breadcrumb segments={breadcrumbSegments} className="truncate" />
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isSolving && currentBomb && (
              <div className="hidden sm:flex items-center gap-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton className="btn-xs" />
              </div>
            )}

            <button
              className={cn(
                "h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onClick={toggleTheme}
              aria-label={isDark ? 'Enable light mode' : 'Enable dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              className={cn(
                "sm:hidden h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground",
                "hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="sm:hidden pb-3 border-t border-border mt-0 pt-3 space-y-1">
            {breadcrumbSegments ? (
              <div className="px-2 py-1">
                <Breadcrumb segments={breadcrumbSegments} />
              </div>
            ) : !isHome ? (
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="block px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Home
              </Link>
            ) : null}
            {isSolving && currentBomb && (
              <div className="flex items-center gap-2 px-2 py-2">
                <StrikeIndicator className="text-sm" />
                <StrikeButton />
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Update PageHeader.tsx**

Replace the entire contents of `ktanesolver-frontend/src/components/layout/PageHeader.tsx` with:

```tsx
import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {eyebrow && (
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex gap-2 flex-shrink-0 items-center">{actions}</div>
        )}
      </div>
      <div className="mt-4 border-b border-border" />
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
cd ktanesolver-frontend
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppShell.tsx src/components/layout/Navbar.tsx src/components/layout/PageHeader.tsx
git commit -m "feat: update layout components to CSS variable tokens, clean Navbar"
```

---

## Task 6: Feature and shared components

**Files:**
- Modify: `ktanesolver-frontend/src/features/setup/BombCard.tsx`
- Modify: `ktanesolver-frontend/src/features/solve/ModuleGrid.tsx`
- Modify: `ktanesolver-frontend/src/features/solve/ManualPanel.tsx`
- Modify: `ktanesolver-frontend/src/features/rounds/RoundCard.tsx`
- Modify: `ktanesolver-frontend/src/components/StrikeButton.tsx`
- Modify: `ktanesolver-frontend/src/components/StrikeIndicator.tsx`
- Modify: `ktanesolver-frontend/src/components/common/SolverControls.tsx`
- Modify: `ktanesolver-frontend/src/components/common/ErrorAlert.tsx`

- [ ] **Step 1: Update BombCard.tsx**

Replace the entire contents of `ktanesolver-frontend/src/features/setup/BombCard.tsx` with:

```tsx
import { type BombEntity, BombStatus } from "../../types";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Trash2, Pencil } from "lucide-react";
import { cn } from "../../lib/cn";

interface BombCardProps {
    bomb: BombEntity;
    index: number;
    onEditEdgework: (bomb: BombEntity) => void;
    onAddModules: (bomb: BombEntity) => void;
    onDelete?: (bomb: BombEntity) => void;
    animationDelay?: number;
}

export default function BombCard({ bomb, index, onEditEdgework, onAddModules, onDelete, animationDelay = 0 }: BombCardProps) {
    const isActive = bomb.status === BombStatus.ACTIVE;
    const moduleCount = bomb.modules?.length ?? 0;
    const hasModules = moduleCount > 0;

    return (
        <div
            className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden animate-fade-in",
                isActive && "border-l-4 border-l-emerald-500"
            )}
            style={{ animationDelay: `${animationDelay}ms`, animationFillMode: "backwards" }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
                <span className="font-semibold text-sm text-foreground">
                    Bomb {index + 1}
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => onEditEdgework(bomb)}
                        aria-label="Edit edgework"
                        title="Edit edgework"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => onDelete(bomb)}
                            aria-label="Delete bomb"
                            title="Delete bomb"
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-4 py-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Serial</p>
                        <p className="font-mono text-sm font-medium text-foreground">{bomb.serialNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Batteries</p>
                        <p className="font-mono text-sm font-medium text-foreground">
                            <span title="AA batteries">{bomb.aaBatteryCount}<span className="text-xs text-muted-foreground ml-0.5">AA</span></span>
                            {" / "}
                            <span title="D batteries">{bomb.dBatteryCount}<span className="text-xs text-muted-foreground ml-0.5">D</span></span>
                        </p>
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Indicators</p>
                    <div className="flex flex-wrap gap-1.5">
                        {Object.entries(bomb.indicators ?? {}).map(([name, lit]) => (
                            <span
                                key={`${bomb.id}-${name}`}
                                className={cn(
                                    "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono font-medium rounded-full border",
                                    lit
                                        ? "bg-accent/10 text-accent border-accent/30"
                                        : "bg-muted text-muted-foreground border-border"
                                )}
                            >
                                <span
                                    className={cn("h-1.5 w-1.5 rounded-full", lit ? "bg-accent" : "bg-muted-foreground/40")}
                                    aria-hidden
                                />
                                {name}
                            </span>
                        ))}
                        {Object.keys(bomb.indicators ?? {}).length === 0 && (
                            <span className="text-xs text-muted-foreground italic">None</span>
                        )}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Port plates</p>
                    <div className="flex flex-wrap gap-1">
                        {bomb.portPlates.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                            bomb.portPlates.map((plate, plateIndex) => (
                                <Badge key={`${bomb.id}-plate-${plateIndex}`} variant="outline" className="text-xs font-mono">
                                    {plate.ports?.length ? plate.ports.join(", ") : "Empty"}
                                </Badge>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40">
                <div className="flex items-center gap-2">
                    <Badge variant={hasModules ? "info" : "secondary"} className="text-xs">
                        {moduleCount} module{moduleCount !== 1 ? "s" : ""}
                    </Badge>
                    {isActive && <Badge variant="success" className="text-xs">Active</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={() => onAddModules(bomb)}>
                    {hasModules ? "Configure Modules" : "Add Modules"}
                </Button>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Update ModuleGrid.tsx**

Replace the entire contents of `ktanesolver-frontend/src/features/solve/ModuleGrid.tsx` with:

```tsx
import { Loader2, Check } from "lucide-react";
import type { BombEntity, ModuleEntity } from "../../types";
import { formatModuleName } from "../../lib/utils";
import { cn } from "../../lib/cn";

interface ModuleGridProps {
  bombs: BombEntity[];
  currentBomb: BombEntity | null | undefined;
  regularModules: ModuleEntity[];
  onSelectBomb: (bombId: string) => void;
  onSelectModule: (module: ModuleEntity) => void;
  openingModuleId?: string | null;
}

export default function ModuleGrid({
  bombs,
  currentBomb,
  regularModules,
  onSelectBomb,
  onSelectModule,
  openingModuleId,
}: ModuleGridProps) {
  return (
    <div>
      {/* Bomb selector tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {bombs.map((bomb, index) => {
          const isActive = currentBomb?.id === bomb.id;
          const serial = bomb.serialNumber ? bomb.serialNumber.slice(0, 6) : "???";
          return (
            <button
              key={bomb.id}
              type="button"
              onClick={() => onSelectBomb(bomb.id)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium font-mono border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              )}
            >
              Bomb {index + 1}{" "}
              <span className="text-xs opacity-70">{serial}</span>
            </button>
          );
        })}
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {regularModules.length === 0 && (
          <div className="col-span-full text-center py-12 px-4">
            <p className="text-sm text-muted-foreground">No regular modules.</p>
          </div>
        )}

        {regularModules.map((module) => {
          const name = formatModuleName(module.type);
          const shortId = module.id.replace(/-/g, "").slice(-6);
          const isOpening = openingModuleId === module.id;
          const disabled = isOpening;

          return (
            <div
              key={module.id}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`${name} — ${module.solved ? "Solved" : isOpening ? "Opening" : "Awaiting"}`}
              aria-disabled={disabled}
              aria-busy={isOpening}
              className={cn(
                "rounded-lg border bg-card transition-all overflow-hidden cursor-pointer hover:shadow-md",
                module.solved && "border-emerald-200 dark:border-emerald-900 opacity-60",
                isOpening && "border-accent/50 ring-2 ring-accent/30 opacity-80",
                !isOpening && !module.solved && "border-border hover:border-accent/40"
              )}
              onClick={() => !disabled && onSelectModule(module)}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectModule(module);
                }
              }}
            >
              {/* Status top bar */}
              <div
                className={cn(
                  "h-0.5 w-full",
                  module.solved ? "bg-emerald-500" : "bg-transparent"
                )}
              />

              <div className="p-2">
                <p className="text-xs font-semibold text-foreground text-center truncate">
                  {name}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground text-center mt-0.5">
                  {shortId}
                </p>

                <div className="flex justify-center mt-1.5">
                  {module.solved ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden />
                  ) : isOpening ? (
                    <Loader2 className="w-3.5 h-3.5 text-accent animate-spin" aria-hidden />
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update ManualPanel.tsx**

Replace the entire contents of `ktanesolver-frontend/src/features/solve/ManualPanel.tsx` with:

```tsx
import { useState, useEffect } from "react";
import { Skeleton } from "../../components/ui/skeleton";
import { Alert } from "../../components/ui/alert";
import { formatModuleName } from "../../lib/utils";
import { ExternalLink } from "lucide-react";

interface ManualPanelProps {
  manualUrl: string | null | undefined;
  moduleType: string;
}

export default function ManualPanel({ manualUrl, moduleType }: ManualPanelProps) {
  const moduleName = formatModuleName(moduleType);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    setIframeError(false);
  }, [manualUrl]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm h-full min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold text-foreground truncate">{moduleName}</span>
        {manualUrl && (
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-2 shrink-0"
            aria-label={`Open ${moduleName} manual in new tab`}
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            Open in new tab
          </a>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {manualUrl ? (
          iframeError ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6">
              <Alert variant="destructive">
                Failed to load the module manual. Try opening it in a new tab.
              </Alert>
            </div>
          ) : (
            <iframe
              src={manualUrl}
              title={`${moduleType} manual`}
              className="w-full flex-1 border-0 min-h-[450px]"
              onError={() => setIframeError(true)}
            />
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 min-h-[200px]">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <p className="text-xs text-muted-foreground mt-2">Loading manual...</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update RoundCard.tsx**

Replace the entire contents of `ktanesolver-frontend/src/features/rounds/RoundCard.tsx` with:

```tsx
import { type RoundSummary, RoundStatus } from "../../types";
import { getRoundStatusLabel, getRoundStatusBadgeVariant } from "../../lib/utils";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/cn";

interface RoundCardProps {
  round: RoundSummary;
  onNavigate: (roundId: string) => void;
  onDelete: (roundId: string) => void;
  loading: boolean;
}

function getStatusAccent(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.ACTIVE:    return "border-l-amber-500";
    case RoundStatus.COMPLETED: return "border-l-emerald-500";
    case RoundStatus.FAILED:    return "border-l-destructive";
    default:                    return "border-l-border";
  }
}

export default function RoundCard({ round, onNavigate, onDelete, loading }: RoundCardProps) {
  const shortId = round.id.slice(0, 8);

  return (
    <div
      className={cn(
        "rounded-xl border-l-4 bg-card border border-border shadow-sm",
        getStatusAccent(round.status)
      )}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-mono text-xs text-muted-foreground">{shortId}</span>
          <Badge variant={getRoundStatusBadgeVariant(round.status)}>
            {getRoundStatusLabel(round.status)}
          </Badge>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground">
            {round.bombCount} {round.bombCount === 1 ? "bomb" : "bombs"} &middot;{" "}
            {round.moduleCount} {round.moduleCount === 1 ? "module" : "modules"}
          </p>
          {round.startTime && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(round.startTime).toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onNavigate(round.id)}>
            {round.status === RoundStatus.ACTIVE ? "Continue" : "View"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(round.id)}
            disabled={loading}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Update StrikeButton.tsx and StrikeIndicator.tsx**

Replace `ktanesolver-frontend/src/components/StrikeButton.tsx` with:

```tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { useRoundStore } from '../store/useRoundStore';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface StrikeButtonProps {
  bombId?: string;
  className?: string;
}

export const StrikeButton: React.FC<StrikeButtonProps> = ({ bombId, className = '' }) => {
  const { currentBomb, addStrike, loading } = useRoundStore();

  const handleStrike = async () => {
    const targetBombId = bombId || currentBomb?.id;
    if (!targetBombId) return;
    try {
      await addStrike(targetBombId);
    } catch (error) {
      console.error('Failed to add strike:', error);
    }
  };

  const isDisabled = loading || (!bombId && !currentBomb);
  const strikes = (bombId ? undefined : currentBomb?.strikes) ?? 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge variant="destructive">{strikes}</Badge>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleStrike}
        disabled={isDisabled}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Strike
      </Button>
    </div>
  );
};
```

Replace `ktanesolver-frontend/src/components/StrikeIndicator.tsx` with:

```tsx
import React from 'react';
import { useRoundStore } from '../store/useRoundStore';
import { BombStatus } from '../types';

interface StrikeIndicatorProps {
  bombId?: string;
  className?: string;
}

export const StrikeIndicator: React.FC<StrikeIndicatorProps> = ({ bombId, className = '' }) => {
  const { round, currentBomb } = useRoundStore();
  const bomb = bombId ? round?.bombs.find(b => b.id === bombId) : currentBomb;

  if (!bomb) return null;

  const isExploded = bomb.status === BombStatus.EXPLODED;
  const strikeCount = bomb.strikes;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {Array.from({ length: strikeCount }).map((_, i) => (
        <span key={i} className="font-bold text-sm text-destructive" aria-hidden>✕</span>
      ))}
      {strikeCount === 0 && !isExploded && (
        <span className="text-xs text-muted-foreground">No strikes</span>
      )}
      {isExploded && (
        <span className="text-xs font-semibold text-destructive uppercase tracking-wide ml-1">EXPLODED</span>
      )}
    </div>
  );
};
```

- [ ] **Step 6: Update SolverControls.tsx and ErrorAlert.tsx**

Replace `ktanesolver-frontend/src/components/common/SolverControls.tsx` with:

```tsx
import { Button } from "../ui/button";

interface SolverControlsProps {
  onSolve: () => void;
  onReset: () => void;
  onSolveManually?: () => void;
  isSolveDisabled?: boolean;
  canSolve?: boolean;
  isResetDisabled?: boolean;
  isManualSolveDisabled?: boolean;
  isLoading?: boolean;
  isSolved?: boolean;
  solveText?: string;
  solveButtonText?: string;
  loadingText?: string;
  showManualSolve?: boolean;
  showReset?: boolean;
  className?: string;
}

export default function SolverControls({
  onSolve,
  onReset,
  onSolveManually,
  isSolveDisabled = false,
  canSolve = true,
  isResetDisabled = false,
  isManualSolveDisabled = false,
  isLoading = false,
  isSolved = false,
  solveText = "Solve",
  solveButtonText,
  loadingText = "Solving...",
  showManualSolve = false,
  showReset = true,
  className = "",
}: SolverControlsProps) {
  const resolvedSolveText = solveButtonText ?? solveText;
  const resolvedSolveDisabled = isSolveDisabled || !canSolve;

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        variant={isSolved ? "success" : "default"}
        size="default"
        className="w-full"
        onClick={onSolve}
        disabled={resolvedSolveDisabled || isLoading || isSolved}
        loading={isLoading}
      >
        {isSolved ? "Solved ✓" : isLoading ? loadingText : resolvedSolveText}
      </Button>

      {(showManualSolve || showReset) && (
        <div className="flex items-center justify-between gap-2">
          {showManualSolve && onSolveManually && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSolveManually}
              disabled={isManualSolveDisabled || isLoading}
            >
              Mark Solved
            </Button>
          )}
          {showReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              disabled={isResetDisabled || isLoading}
              className="ml-auto"
            >
              Reset
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

Replace `ktanesolver-frontend/src/components/common/ErrorAlert.tsx` with:

```tsx
import { Alert } from "../ui/alert";

interface ErrorAlertProps {
  error?: string;
  message?: string;
  className?: string;
  onDismiss?: () => void;
}

export default function ErrorAlert({ error, message, className = "" }: ErrorAlertProps) {
  const resolvedError = error ?? message ?? "";
  if (!resolvedError) return null;

  return (
    <Alert variant="destructive" className={className}>
      {resolvedError}
    </Alert>
  );
}
```

- [ ] **Step 7: Run build check**

```bash
cd ktanesolver-frontend
npm run build 2>&1 | head -60
```

- [ ] **Step 8: Commit**

```bash
git add src/features/ src/components/StrikeButton.tsx src/components/StrikeIndicator.tsx src/components/common/SolverControls.tsx src/components/common/ErrorAlert.tsx
git commit -m "feat: update feature components and shared solver infrastructure to new tokens"
```

---

## Task 7: Pages

**Files:**
- Modify: `ktanesolver-frontend/src/pages/MainPage.tsx`
- Modify: `ktanesolver-frontend/src/pages/SetupPage.tsx`
- Modify: `ktanesolver-frontend/src/pages/SolvePage.tsx`
- Modify: `ktanesolver-frontend/src/pages/RoundsPage.tsx`

- [ ] **Step 1: Update MainPage.tsx**

Replace the entire contents of `ktanesolver-frontend/src/pages/MainPage.tsx` with:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoundStore } from "../store/useRoundStore";
import PageContainer from "../components/layout/PageContainer";
import { Button } from "../components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";

export default function MainPage() {
  const navigate = useNavigate();
  const createRound = useRoundStore((state) => state.createRound);
  const loading = useRoundStore((state) => state.loading);
  const error = useRoundStore((state) => state.error);
  const [creating, setCreating] = useState(false);

  const handleCreateNewBomb = async () => {
    setCreating(true);
    try {
      const round = await createRound();
      navigate(`/round/${round.id}/setup`);
    } catch {
      // error is in store
    } finally {
      setCreating(false);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-lg mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Bomb Defusal Solver</h1>
          <p className="text-muted-foreground mt-1">KTaNE solver for expert teams</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          {/* New Round */}
          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm flex flex-col">
            <div className="p-5 flex-1">
              <h2 className="font-semibold text-foreground">New Round</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure bombs, add modules, and start solving.
              </p>
            </div>
            <div className="px-5 pb-5">
              <Button
                variant="default"
                className="w-full"
                onClick={handleCreateNewBomb}
                disabled={loading || creating}
                loading={creating || loading}
              >
                {creating || loading ? "Creating…" : "Start New Round"}
              </Button>
            </div>
          </div>

          {/* Round History */}
          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm flex flex-col">
            <div className="p-5 flex-1">
              <h2 className="font-semibold text-foreground">Round History</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Review past rounds and solutions.
              </p>
            </div>
            <div className="px-5 pb-5">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/rounds")}
                disabled={loading}
              >
                View History
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
```

- [ ] **Step 2: Update RoundsPage.tsx**

In `ktanesolver-frontend/src/pages/RoundsPage.tsx`, make these targeted changes:
1. Change `variant="primary"` to `variant="default"` on all `<Button>` elements.
2. Change `variant="error"` to `variant="destructive"` on the `<Alert>`.
3. Change the title from `"ROUND HISTORY"` to `"Round History"` in both `PageHeader` calls.

The file structure stays the same — only these three changes.

- [ ] **Step 3: Update SetupPage.tsx**

In `ktanesolver-frontend/src/pages/SetupPage.tsx`, make the following targeted replacements:

**3a.** Change all `variant="primary"` on `<Button>` to `variant="default"`.

**3b.** In the stats row, change:
```tsx
<div className="card-manual flex-1 px-4 py-3">
```
to:
```tsx
<div className="rounded-xl border border-border bg-card shadow-sm flex-1 px-4 py-3">
```
(three times, for each stat tile)

**3c.** Change the `<p className="text-xs text-ink-muted ...">` labels in stat tiles to `text-muted-foreground`.

**3d.** In the "No bombs yet" empty state, change:
```tsx
<div className="card-manual text-center py-12 px-4">
```
to:
```tsx
<div className="rounded-xl border border-border bg-card shadow-sm text-center py-12 px-4">
```

**3e.** Change the `<p className="text-sm text-ink-muted ...">` in the empty state to `text-muted-foreground`.

**3f.** In the module drawer aside, change `bg-base-100` to `bg-background`, `border-base-300` to `border-border`, and `bg-base-200` to `bg-muted/40`.

**3g.** Change `variant="success"` on the Lit indicator button to `variant="outline"` with an added class `border-emerald-500 text-emerald-700 dark:text-emerald-400`.

**3h.** Remove the `bg-base-200/50` from the form section containers — replace with `bg-muted/30`.

**3i.** Change `Alert variant="warning"` to `variant="warning"` (already correct) and `Alert variant="error"` to `variant="destructive"`.

- [ ] **Step 4: Update SolvePage.tsx**

In `ktanesolver-frontend/src/pages/SolvePage.tsx`, make these targeted replacements:

**4a.** Replace the loading overlay (the `fixed inset-0 bg-base-300/80` div) with a slim top progress bar. Find:
```tsx
{loading && (
  <div
    className="fixed inset-0 bg-base-300/80 backdrop-blur-sm flex items-center justify-center z-50"
    aria-live="polite"
    aria-busy="true"
  >
    <div className="card-manual flex flex-col items-center gap-4 px-8 py-6">
      <span className="loading loading-spinner loading-lg text-primary" aria-hidden />
      <p className="text-sm font-medium text-base-content">Syncing round...</p>
    </div>
  </div>
)}
```
Replace with:
```tsx
{loading && (
  <div
    className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden bg-transparent"
    aria-live="polite"
    aria-busy="true"
    aria-label="Syncing round"
  >
    <div className="h-full bg-accent animate-progress" />
  </div>
)}
```

**4b.** In the loading fallback inside `SolverContent`, replace:
```tsx
<span className="loading loading-spinner loading-md text-primary"></span>
```
with:
```tsx
<Loader2 className="h-5 w-5 animate-spin text-accent" />
```
And add `import { Loader2 } from "lucide-react";` at the top of the file.

**4c.** Replace `card-manual` with `rounded-xl border border-border bg-card shadow-sm` on the solver card wrapper.

**4d.** Replace `bg-base-200 border-b border-base-300` (solver card header) with `bg-muted/40 border-b border-border`.

**4e.** Replace `text-ink-muted` with `text-muted-foreground` throughout.

**4f.** Replace `callout callout-error` with:
```tsx
<Alert variant="destructive" role="alert">{error}</Alert>
```
(add the Alert import from `../components/ui/alert`).

**4g.** Replace `callout callout-warning` on the FMN reminder with:
```tsx
<Alert variant="warning" className="flex flex-wrap items-center justify-between gap-3">
```

**4h.** Change `btn btn-outline btn-sm` raw classes to `<Button variant="outline" size="sm">` (the Back to modules button).

**4i.** Replace the "No round selected" card:
```tsx
<div className="card-manual p-6 text-center">
```
with:
```tsx
<div className="rounded-xl border border-border bg-card shadow-sm p-6 text-center">
```

**4j.** Replace `text-body text-base-content/70` with `text-sm text-muted-foreground` and `text-caption text-base-content/60` with `text-xs text-muted-foreground`.

- [ ] **Step 5: Run build — must succeed**

```bash
cd ktanesolver-frontend
npm run build
```

Expected: clean build with no TypeScript errors.

- [ ] **Step 6: Run all tests**

```bash
cd ktanesolver-frontend
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/
git commit -m "feat: update all pages to CSS variable tokens, replace loading overlay with progress bar"
```

---

## Task 8: Solver component cleanup — FlyonUI component classes

This task replaces raw FlyonUI component classes (`input input-bordered`, `alert alert-success`, `badge badge-*`, `loading loading-spinner`) in the solver files. The color tokens (`base-*`, `ink-*`) already work correctly via the tailwind.config.js aliases added in Task 1, so only the component class usages need replacement.

**Files:** All files in `ktanesolver-frontend/src/components/solvers/` that use the patterns below.

**Replacement rules:**

| Old class pattern | Replacement |
|---|---|
| `className="input input-bordered ..."` | `className={cn("flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ...", ...)}` or replace the raw `<input>` with `<Input>` component |
| `<div className="alert alert-success ...">` | `<Alert variant="success" ...>` |
| `<div className="alert alert-warning ...">` | `<Alert variant="warning" ...>` |
| `<div className="alert alert-info ...">` | `<Alert variant="info" ...>` |
| `<span className="loading loading-spinner loading-sm">` | `<Loader2 className="h-4 w-4 animate-spin text-accent" />` |
| `<span className="loading loading-spinner loading-xs">` | `<Loader2 className="h-3 w-3 animate-spin text-accent" />` |
| `<span className="badge badge-lg badge-primary">text</span>` | `<Badge variant="default" className="text-base">text</Badge>` |
| `<span className="badge badge-lg badge-success ...">` | `<Badge variant="success" className="text-base">` |

- [ ] **Step 1: Fix AnagramsSolver.tsx**

In `ktanesolver-frontend/src/components/solvers/AnagramsSolver.tsx`:

Add imports at the top:
```tsx
import { Alert } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
```

Replace the raw `<input>` at line ~196:
```tsx
// OLD:
className="input input-bordered w-full max-w-md mx-auto block text-center text-xl tracking-widest"
// NEW:
className="w-full max-w-md mx-auto block text-center text-xl tracking-widest flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
```

Replace the results alert block:
```tsx
// OLD:
<div className={`alert mb-4 ${result.possibleSolutions.length > 0 ? 'alert-success' : 'alert-info'}`}>
  <svg .../>
  <div className="w-full">
    <span className="font-bold">...</span>
    <div className="mt-2">
      {result.possibleSolutions.map((solution, index) => (
        <span key={index} className="badge badge-lg badge-primary">
          {solution}
        </span>
      ))}
    </div>
  </div>
</div>
```
with:
```tsx
<Alert variant={result.possibleSolutions.length > 0 ? "success" : "info"} className="mb-4">
  <p className="font-semibold mb-2">
    {result.possibleSolutions.length > 0 ? "Possible Solutions:" : "No Solutions"}
  </p>
  {result.possibleSolutions.length > 0 ? (
    <div className="flex flex-wrap gap-2 mt-1">
      {result.possibleSolutions.map((solution, index) => (
        <Badge key={index} variant="default">{solution}</Badge>
      ))}
    </div>
  ) : (
    <p className="text-sm">No valid anagrams found</p>
  )}
</Alert>
```

- [ ] **Step 2: Fix solvers with `loading loading-spinner` (4 files)**

**ForeignExchangeSolver.tsx** — find and replace:
```tsx
// OLD:
{isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
// NEW:
{isLoading ? <Loader2 className="h-4 w-4 animate-spin text-accent inline" /> : null}
```
Add `import { Loader2 } from "lucide-react";` at the top.

**ForgetMeNotSolver.tsx** — same pattern, same fix:
```tsx
// OLD:
{isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
// NEW:
{isLoading ? <Loader2 className="h-4 w-4 animate-spin text-accent inline" /> : null}
```
Add `import { Loader2 } from "lucide-react";` at the top.

**MorseCodeSolver.tsx** — two occurrences, same pattern. Find both:
```tsx
<span className="loading loading-spinner loading-xs"></span>
// and
{isLoading ? <span className="loading loading-spinner loading-sm"></span> : ""}
```
Replace first with `<Loader2 className="h-3 w-3 animate-spin text-accent inline" />` and second with `{isLoading ? <Loader2 className="h-4 w-4 animate-spin text-accent inline" /> : null}`. Add `import { Loader2 } from "lucide-react";`.

- [ ] **Step 3: Fix solvers with `alert alert-*` — add Alert import and replace divs**

Files to fix: `ChessSolver.tsx`, `CryptographySolver.tsx`, `EmojiMathSolver.tsx`, `AstrologySolver.tsx`, `ForgetMeNotSolver.tsx`, `KnobsSolver.tsx`, `LogicSolver.tsx`, `LetterKeysSolver.tsx`, `MathSolver.tsx`, `MorsematicsSolver.tsx`, `PlumbingSolver.tsx`, `SafetySafeSolver.tsx`, `TurnTheKeysSolver.tsx`, `TwoBitsSolver.tsx`, `TurnTheKeySolver.tsx`, `WireSolver.tsx`.

For each file, add `import { Alert } from "../ui/alert";` (if not already imported) and replace:
```tsx
<div className="alert alert-success mb-4">...</div>
```
with:
```tsx
<Alert variant="success" className="mb-4">...</Alert>
```

And:
```tsx
<div className="alert alert-warning mb-4">...</div>
```
with:
```tsx
<Alert variant="warning" className="mb-4">...</Alert>
```

And:
```tsx
<div className="alert alert-info ...">...</div>
```
with:
```tsx
<Alert variant="info" ...>...</Alert>
```

For `KnobsSolver.tsx`, find the ternary that builds the class string:
```tsx
: "alert alert-success"
```
Refactor to use a state variable or conditional render with `<Alert variant="success">`.

- [ ] **Step 4: Fix solvers with `input input-bordered`**

Files: `ChessSolver.tsx`, `EmojiMathSolver.tsx`, `MathSolver.tsx`, `MorsematicsSolver.tsx`, `MouseInTheMazeSolver.tsx`, `ThreeDMazeSolver.tsx`, `TurnTheKeysSolver.tsx`, `TurnTheKeySolver.tsx`, `TwoBitsSolver.tsx`, `WordScrambleSolver.tsx`.

For each file, either:
- Replace the raw `<input>` element's className: remove `input input-bordered` and ensure it has `border border-input bg-background rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`, OR
- Replace the `<input>` with `<Input>` component from `"../ui/input"` and pass the remaining classes as `className`.

Prefer the `<Input>` component. Example for `TurnTheKeySolver.tsx`:
```tsx
// OLD:
<input ... className="input input-bordered w-20 text-center" />
// NEW:
import { Input } from "../ui/input";
<Input ... className="w-20 text-center" />
```

- [ ] **Step 5: Fix badge usages**

**MouseInTheMazeSolver.tsx** — replace:
```tsx
<span className="badge badge-lg badge-success gap-1">...</span>
```
with:
```tsx
<Badge variant="success" className="text-base gap-1">...</Badge>
```
Add `import { Badge } from "../ui/badge";`.

**ThreeDMazeSolver.tsx** — replace:
```tsx
<span key={i} className="badge badge-lg bg-neutral-600 text-neutral-100">...</span>
```
with:
```tsx
<Badge key={i} variant="secondary" className="text-base">...</Badge>
```
Add `import { Badge } from "../ui/badge";`.

- [ ] **Step 6: Run build — must succeed**

```bash
cd ktanesolver-frontend
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 7: Run all tests**

```bash
cd ktanesolver-frontend
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/solvers/
git commit -m "feat: replace FlyonUI component classes in all solver components"
```

---

## Task 9: Final check and NeedyModulesPanel / ModuleSelector

**Files:**
- Modify: `ktanesolver-frontend/src/components/NeedyModulesPanel.tsx`
- Modify: `ktanesolver-frontend/src/components/ModuleSelector.tsx`

- [ ] **Step 1: Read both files**

Open and read `NeedyModulesPanel.tsx` and `ModuleSelector.tsx` to identify any remaining FlyonUI classes (`btn`, `card`, `base-*`, `ink-*`, `loading-spinner`, `callout`, `font-display`).

- [ ] **Step 2: Fix NeedyModulesPanel.tsx**

Replace any `card-manual` with `rounded-xl border border-border bg-card shadow-sm`. Replace any `btn btn-*` with `<Button variant="...">`. Replace `bg-base-200`, `border-base-300`, `text-ink-muted`, `text-base-content` with their CSS var equivalents (`bg-muted/40`, `border-border`, `text-muted-foreground`, `text-foreground`). Replace `loading loading-spinner` with `<Loader2 className="animate-spin" />`.

- [ ] **Step 3: Fix ModuleSelector.tsx**

Same pattern: replace FlyonUI classes with CSS var tokens. For any `<input>` or `<select>` elements using `input input-bordered`, use the `<Input>` component or the equivalent Tailwind classes.

- [ ] **Step 4: Final build**

```bash
cd ktanesolver-frontend
npm run build
```

Expected: clean build.

- [ ] **Step 5: Final test run**

```bash
cd ktanesolver-frontend
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Grep for remaining FlyonUI remnants**

```bash
cd ktanesolver-frontend
grep -r "loading loading-spinner\|btn-primary\|btn-outline\|card-manual\|callout-\|page-title\|section-heading\|font-display\|data-theme\|manual-dark\|alert-success\|badge badge-\|input input-bordered" src/ --include="*.tsx" --include="*.ts" | grep -v "\.test\." | grep -v "node_modules"
```

Expected: no output (zero matches).

- [ ] **Step 7: Commit**

```bash
git add src/components/NeedyModulesPanel.tsx src/components/ModuleSelector.tsx
git commit -m "feat: fix remaining FlyonUI references in NeedyModulesPanel and ModuleSelector"
```

- [ ] **Step 8: Final integration commit**

```bash
git log --oneline -10
```

Verify all 9 tasks' commits are present, then optionally tag:
```bash
git tag ui-redesign-complete
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Covered by task |
|---|---|
| Remove flyonui | Task 1 |
| darkMode: 'class' | Task 1 |
| CSS variable palette (:root/.dark) | Task 1 |
| Color aliases for backward compat | Task 1 |
| Oswald font removed | Task 1 (index.css) |
| Inter for headings | Task 1 |
| useTheme → dark class | Task 2 |
| Navbar.test updated | Task 2 |
| Button (Loader2 spinner, CSS vars) | Task 3 |
| Input (CSS vars) | Task 3 |
| Badge (CSS vars, dark-aware variants) | Task 3 |
| Skeleton (CSS vars) | Task 3 |
| Card (rounded-xl, CSS vars) | Task 4 |
| Alert (warning/success/info variants, CSS vars) | Task 4 |
| Dialog (CSS vars) | Task 4 |
| AppShell bg-background | Task 5 |
| Navbar clean styles, no FlyonUI | Task 5 |
| PageHeader replaces page-title/section-divider | Task 5 |
| BombCard: no card-manual, CSS vars | Task 6 |
| ModuleGrid: no FlyonUI, Loader2 | Task 6 |
| ManualPanel: no card-manual, CSS vars | Task 6 |
| RoundCard: no card-manual, no hardcoded hex | Task 6 |
| StrikeButton: destructive variant | Task 6 |
| SolverControls: correct variants | Task 6 |
| ErrorAlert: destructive variant | Task 6 |
| MainPage: card layout, CSS vars | Task 7 |
| SetupPage: all FlyonUI removed | Task 7 |
| SolvePage: progress bar, all FlyonUI removed | Task 7 |
| RoundsPage: variants fixed | Task 7 |
| Solver input/alert/badge/spinner replacements | Task 8 |
| NeedyModulesPanel, ModuleSelector cleanup | Task 9 |

**Placeholder scan:** No TBDs. All code steps include actual replacement code.

**Type consistency:** `Button` variant names are consistent across all tasks. `Alert` variants (`destructive`, `warning`, `success`, `info`, `error`) defined in Task 4 and used consistently. `Badge` variants consistent. `Loader2` import from `"lucide-react"` used in Tasks 6, 7, 8.
