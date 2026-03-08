

# Fix: Per-person pricing and one-way vs round-trip display

## Problems identified

1. **`passengers: 2` is hardcoded** in `FlightsTab.tsx` line 171. SerpAPI returns total prices for all passengers. The UI labels everything "per person" but shows the 2-person total.

2. **The comparison logic is actually correct** — it independently fetches round-trip and two one-ways, then compares. But the raw prices displayed need to be divided by passenger count to match the "per person" labels.

## Proposed fix

### Option A (Recommended): Set `passengers: 1` in the frontend
- Change line 171 in `FlightsTab.tsx` from `passengers: 2` to `passengers: 1`
- All SerpAPI calls will then return per-person prices natively
- No division needed anywhere — all displayed prices are already per-person
- The `savingPerPerson` calculation (line 918 of edge function) would just equal `saving` since passengers=1

### Option B: Keep passengers=2 but divide all displayed prices
- Divide every price by passenger count before display
- More complex, more places to miss

### Changes for Option A

**File: `src/components/flights/FlightsTab.tsx`**
- Line 171: change `passengers: 2` to `passengers: 1`

**File: `supabase/functions/fetch-flight-insights/index.ts`**  
- Line 918: `savingPerPerson` division becomes redundant (dividing by 1), but harmless — no change needed
- Line 937: The fallback `Math.round(feasibilityPricing.lowestPrice / passengers)` is also fine with passengers=1

No other changes required. All prices from SerpAPI will be per-person, matching the UI labels.

