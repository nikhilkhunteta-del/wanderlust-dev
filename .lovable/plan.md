

# Flight Search Controls Enhancement

## Overview
Add inline controls to the Flights tab that allow users to refine their search parameters before redirecting to Google Flights. The controls will feel like refinements rather than a booking form, maintaining the premium editorial design of the app.

## What Will Change

### New User Experience
When users view the Flights tab, they'll see a compact control panel below the route overview that lets them:
- Select departure and arrival airports from dropdowns (pre-populated from the AI-generated insights)
- Pick departure and return dates using calendar pickers (pre-filled based on travel month)
- Adjust passenger count (defaulting to 1 adult)
- Choose cabin class (defaulting to Economy)

Clicking "Search flights" validates the selections and opens Google Flights with all parameters pre-filled.

### Visual Layout
```text
+--------------------------------------------------+
|  Flight Insights Header                          |
+--------------------------------------------------+
|  [Route Overview - From/To Cities]               |
+--------------------------------------------------+
|  REFINE YOUR SEARCH                              |
|  +---------------------+  +-------------------+  |
|  | From: [JFK ▼]       |  | To: [CDG ▼]      |  |
|  +---------------------+  +-------------------+  |
|  +---------------------+  +-------------------+  |
|  | Depart: [📅 date]   |  | Return: [📅 date]|  |
|  +---------------------+  +-------------------+  |
|  +---------------------+  +-------------------+  |
|  | Passengers: [1 ▼]   |  | Class: [Econ ▼]  |  |
|  +---------------------+  +-------------------+  |
|  [🔍 Search flights →]                           |
+--------------------------------------------------+
|  [Existing price snapshot, insights, etc.]       |
+--------------------------------------------------+
```

## Technical Details

### New Component
**`FlightSearchControls.tsx`** - A new component that handles all the search refinement UI.

State management (local React state only, not persisted):
- `departureAirport`: Selected origin airport IATA code
- `arrivalAirport`: Selected destination airport IATA code  
- `departureDate`: Date object for outbound flight
- `returnDate`: Date object for return flight
- `passengers`: Number (1-9 adults)
- `cabinClass`: "economy" | "premium_economy" | "business" | "first"

### Initialization Logic
When the component mounts with flight insights data:
1. **Airports**: Auto-select the main airport (where `isMain: true`) or first airport in each list
2. **Dates**: Calculate mid-month dates based on `travelMonth`:
   - If month is in the past for current year, use next year
   - Default departure: 15th of the month
   - Default return: 22nd of the month (7-day trip)
3. **Passengers**: Default to 1
4. **Cabin Class**: Default to "economy"

### Validation Rules
Before redirecting, validate:
- Both airports selected
- Departure date selected and in the future
- Return date selected and after departure date
- At least 1 passenger

Show inline validation messages if any condition fails.

### Enhanced Google Flights URL Builder
Update the URL builder to include all parameters:

```typescript
function buildGoogleFlightsSearchUrl({
  originAirport,      // e.g., "JFK"
  destinationAirport, // e.g., "CDG" 
  departureDate,      // Date object
  returnDate,         // Date object
  passengers,         // number
  cabinClass,         // string
}): string
```

The URL format will be:
```
https://www.google.com/travel/flights?q=Flights%20from%20JFK%20to%20CDG%20on%202026-03-15%20through%202026-03-22&curr=USD&px=[passengers]&sc=[class]
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/flights/FlightSearchControls.tsx` | Create | New component with all search refinement controls |
| `src/components/flights/FlightsTab.tsx` | Modify | Import and render FlightSearchControls, pass airport data |
| `src/lib/flightInsights.ts` | Modify | Enhance `buildGoogleFlightsUrl` with full parameters |

### UI Component Usage
- **Select** (Radix): For airport, passenger count, and cabin class dropdowns
- **Calendar** (react-day-picker): For date selection in popovers
- **Popover** (Radix): To contain the calendar pickers
- **Button**: For the search action
- Uses existing Tailwind styling patterns from the app

### Styling Approach
- Compact card with subtle border, consistent with existing cards
- 2-column grid for controls on desktop, single column on mobile
- Muted labels with clear input styling
- Primary button for the search CTA
- Non-intrusive positioning between route overview and price insights

