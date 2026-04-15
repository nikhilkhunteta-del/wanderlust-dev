

## Fix: City Stats Always Showing Culture-History Data

### Problem
`CityStatsStrip` receives `profile?.interests?.[0]` as its `primaryInterest` prop, but `TravelProfile` has no `interests` array field. This always evaluates to `undefined`, falling back to `"culture-history"` regardless of what the user selected.

### Fix
**File:** `src/components/city/HighlightsTab.tsx`, line 79

Change:
```tsx
primaryInterest={profile?.interests?.[0] || "culture-history"}
```
To:
```tsx
primaryInterest={profile?.primaryInterest || "culture-history"}
```

This single-line change ensures the correct slug (e.g. `"nature-outdoors"`) is passed to the edge function, matching the `INTEREST_GUIDELINES` keys exactly.

### Cache Cleanup
Optionally clear stale stats from `city_stats_cache` where `interest = 'culture-history'` that were generated for users who actually had a different primary interest. Since stats are cached per city+country+interest triplet, correct requests will simply generate and cache the right data on next visit — no manual cleanup strictly required.

