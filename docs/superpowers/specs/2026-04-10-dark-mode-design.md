# Dark Mode Design

**Date:** 2026-04-10  
**Status:** Approved

## Overview

Add a persistent dark mode toggle to the KTANESolver frontend. The user can switch between light (`manual`) and dark (`manual-dark`) themes via a button on the right side of the navbar. The preference is saved to `localStorage` and restored on page load.

## Approach

Use FlyonUI's built-in multi-theme system. A second theme entry (`manual-dark`) is added to `tailwind.config.js`. A `useTheme` hook manages the active theme, persists it, and sets `data-theme` on `<html>`. No individual component files need to change — FlyonUI's CSS variable system remaps all semantic tokens automatically.

## Palette — `manual-dark`

| Token            | Value     | Note                                      |
|------------------|-----------|-------------------------------------------|
| `base-100`       | `#1C1917` | Darkest bg — mirrors light theme's ink    |
| `base-200`       | `#292524` | Card/surface bg                           |
| `base-300`       | `#3C3330` | Borders, dividers                         |
| `base-content`   | `#F5F0E8` | Body text — mirrors light theme's paper   |
| `primary`        | `#C41230` | Unchanged — red works on dark             |
| `primary-focus`  | `#9B0E26` |                                           |
| `primary-content`| `#FFFFFF` |                                           |
| `secondary`      | `#9CA3AF` | Lightened for dark bg                     |
| `secondary-focus`| `#6B7280` |                                           |
| `secondary-content`| `#FFFFFF`|                                           |
| `accent`         | `#D97706` | Slightly brighter amber                   |
| `accent-focus`   | `#B45309` |                                           |
| `accent-content` | `#FFFFFF` |                                           |
| `neutral`        | `#6B7280` |                                           |
| `neutral-focus`  | `#4B5563` |                                           |
| `neutral-content`| `#FFFFFF` |                                           |
| `base-content`   | `#F5F0E8` |                                           |
| `info`           | `#3B82F6` |                                           |
| `info-content`   | `#FFFFFF` |                                           |
| `success`        | `#16A34A` |                                           |
| `success-content`| `#FFFFFF` |                                           |
| `warning`        | `#D97706` |                                           |
| `warning-content`| `#FFFFFF` |                                           |
| `error`          | `#DC2626` | Slightly brighter than light theme        |
| `error-content`  | `#FFFFFF` |                                           |

## Components Changed

### 1. `tailwind.config.js`
- Add `manual-dark` theme object to `flyonui.themes`
- Add `darkTheme: "manual-dark"` to FlyonUI config

### 2. `src/hooks/useTheme.ts` (new file)
```ts
// Reads from localStorage key "ktane-theme"
// Falls back to "manual" (light)
// Sets document.documentElement.setAttribute("data-theme", theme) on mount and on change
// Exposes { theme, toggleTheme }
```

### 3. `src/components/layout/Navbar.tsx`
- Import and call `useTheme()`
- Add toggle button at the far right of the navbar (after strike info, before/replacing mobile toggle area)
- Sun icon when in dark mode, moon icon in light mode
- Uses existing `btn btn-ghost btn-sm btn-square` classes

### 4. `src/index.css`
- Add `[data-theme="manual-dark"]` block overriding hardcoded-color component classes:
  - `body` background
  - `.card-manual` (bg, border, shadow)
  - `.callout-error`, `.callout-warning`, `.callout-success`, `.callout-info`
  - `.section-divider` border color
  - `.page-title` and `.section-heading` color

## Files NOT changed

All solver components, pages, and UI primitives use FlyonUI semantic tokens (`bg-base-100`, `text-base-content`, `btn-primary`, etc.) which remap automatically — no changes needed there.

## Persistence

- Key: `"ktane-theme"`
- Values: `"manual"` | `"manual-dark"`
- Storage: `localStorage`
- On first visit with no stored preference: defaults to `"manual"` (light)
