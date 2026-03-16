

# Cache the Itinerary Tab with React Query

## Problem
The Itinerary tab stores its data in local component state (`useState` + `useEffect`). When you navigate to another tab and back, React unmounts and remounts the component, losing all state and triggering a fresh API call. Every other tab already uses React Query, which keeps data in a shared cache that survives tab switches.

## Solution
Migrate the Itinerary tab's data fetching to React Query, matching the pattern used by all other tabs.

## Changes

### 1. Add `useCityItinerary` hook to `src/hooks/useCityData.ts`
- Create a new hook wrapping `getCityItinerary` with React Query
- Use a query key like `["city-itinerary", city, country, tripDuration, travelMonth, settings]`
- Apply the same 5-minute stale time / 10-minute cache time as other tabs

### 2. Refactor `src/components/itinerary/ItineraryTab.tsx`
- Replace the local `useState` for itinerary/isLoading/error with the new `useCityItinerary` hook
- Keep the local state for UI-only concerns (showMap, selectedMapDay, settings, multi-city toggle)
- For day refinement (`handleRefineDay`), use React Query's `queryClient.setQueryData` to patch the cached itinerary in-place after a successful per-day regeneration, so the update is also cached
- For full re-generation (when the user clicks "Update" in the refinement panel), call `refetch()` from the query result
- Remove the `useEffect(() => fetchItinerary(), [])` call entirely

### 3. Add itinerary prefetching to `src/hooks/useTabPrefetch.ts`
- In the `"itinerary"` case, prefetch the itinerary query so data is warm when the user navigates to it from an adjacent tab

## What stays the same
- All UI components (DayCard, RefinementPanel, etc.) remain unchanged
- Day refinement and multi-city features work identically
- Settings state stays local since it drives the query parameters

