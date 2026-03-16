

## Problem

The full-width `.page-container` layout was applied to the city detail page and its 8 tabs, but several other pages still use hardcoded `max-w-*` constraints:

- **Results page** (`src/pages/Results.tsx`): `max-w-6xl mx-auto` on main, `max-w-2xl` on subtitle
- **Compare page** (`src/pages/Compare.tsx`): `max-w-5xl mx-auto` on main, `max-w-xl` on loading grid
- **PlanCity page** (`src/pages/PlanCity.tsx`): `max-w-2xl` on footer
- **Situational tab** (`src/components/situational/SituationalTab.tsx`): `max-w-4xl mx-auto` on container

## Plan

Replace all fixed `max-w-*` + `mx-auto` containers on these pages with the existing `.page-container` utility class, which provides full-width content with `px-4 md:px-6` padding and caps at `1200px` only on 1400px+ screens.

### Files to update

1. **`src/pages/Results.tsx`** -- Change `max-w-6xl mx-auto px-4` to `page-container` on the `<main>` element
2. **`src/pages/Compare.tsx`** -- Change `max-w-5xl mx-auto px-4` to `page-container` on the `<main>` element
3. **`src/pages/PlanCity.tsx`** -- Change `max-w-2xl mx-auto` on the footer div to `page-container`
4. **`src/components/situational/SituationalTab.tsx`** -- Change `max-w-4xl mx-auto px-4 md:px-6` to `page-container` on the root container

Inner content constraints like `max-w-md` on error messages or `max-w-lg` on centered input fields will be preserved since those are intentional content-width limits, not page-level constraints.

