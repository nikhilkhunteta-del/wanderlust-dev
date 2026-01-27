
# Travel Preference Profile System

## Overview

Build a preference processing layer that transforms raw questionnaire responses into a structured, normalized profile for destination matching. This system will:
1. Convert responses to weighted interest scores (0-1)
2. Infer travel style tags from answer patterns
3. Validate completeness and generate follow-up questions if needed
4. Generate personalized summary text after completion

---

## Architecture

```text
+---------------------+     +------------------------+     +-------------------+
| TravelPreferences   | --> | buildTravelProfile()   | --> | TravelProfile     |
| (raw questionnaire) |     | (processing utility)   |     | (normalized JSON) |
+---------------------+     +------------------------+     +-------------------+
                                      |
                                      v
                            +-------------------+
                            | Travel Style Tags |
                            | + Summary Text    |
                            +-------------------+
```

---

## New Types

### `TravelProfile` Interface

```typescript
interface TravelProfile {
  // Normalized interest scores (0-1)
  interestScores: {
    culture: number;
    nature: number;
    beach: number;
    food: number;
    nightlife: number;
    shopping: number;
    photography: number;
    wellness: number;
  };

  // Adventure intensity (0-1)
  adventureLevel: number;
  adventureTypes: string[];

  // Travel constraints
  departureCity: string;
  travelMonth: string;
  preferredRegions: string[];
  isFlexibleOnRegion: boolean;

  // Normalized preferences (0-1)
  weatherPreference: number;      // 0=cold, 1=tropical
  tripDuration: number;           // actual days
  travelPace: number;             // 0=relaxed, 1=packed

  // Companion context
  travelCompanions: string;
  groupType: 'solo' | 'couple' | 'family' | 'friends' | 'group';

  // Inferred tags
  styleTags: TravelStyleTag[];

  // Personalization summary
  summary: string;

  // Completeness
  completenessScore: number;
  followUpQuestion: string | null;
}

type TravelStyleTag =
  | 'culture-focused'
  | 'nature-lover'
  | 'beach-seeker'
  | 'foodie'
  | 'adventure-seeker'
  | 'adventure-light'
  | 'relaxation-focused'
  | 'family-friendly'
  | 'nightlife-seeker'
  | 'photography-enthusiast'
  | 'wellness-oriented'
  | 'active-explorer'
  | 'slow-traveler';
```

---

## Processing Logic

### 1. Interest Score Normalization

Multi-select answers are converted to weighted scores:

| Selection State | Score |
|----------------|-------|
| Selected as primary (1st-2nd pick) | 1.0 |
| Selected (3rd+ pick) | 0.7 |
| Not selected | 0.0 |

**Note:** Since multi-select doesn't capture order, all selected items receive equal weight of 1.0, unselected receive 0.0.

### 2. Travel Style Tag Inference Rules

| Condition | Tag Assigned |
|-----------|--------------|
| interests includes 'culture' | `culture-focused` |
| interests includes 'nature' | `nature-lover` |
| interests includes 'beach' | `beach-seeker` |
| interests includes 'food' | `foodie` |
| interests includes 'nightlife' | `nightlife-seeker` |
| interests includes 'wellness' | `wellness-oriented` |
| interests includes 'photography' | `photography-enthusiast` |
| adventureExperiences has 3+ items (excluding 'none') | `adventure-seeker` |
| adventureExperiences has 1-2 items (excluding 'none') | `adventure-light` |
| adventureExperiences includes 'none' only | `relaxation-focused` |
| travelCompanions === 'family' | `family-friendly` |
| travelPace >= 75 | `active-explorer` |
| travelPace <= 25 | `slow-traveler` |

### 3. Completeness Validation

Check critical fields that significantly impact recommendation quality:

| Field | Impact Level | Follow-up Question |
|-------|-------------|-------------------|
| interests (empty) | Critical | "What type of experiences interest you most on a trip?" |
| departureCity (empty) | High | "Where will you be departing from?" |
| travelMonth (empty) | Medium | "When are you planning to travel?" |
| continentPreference (empty) | Low | (acceptable - use 'anywhere') |

Logic: Return first missing critical/high-impact field as follow-up, or `'complete'`.

### 4. Summary Generation

Template-based generation combining key preferences:

```
"We'll find destinations perfect for a {companions} trip focused on 
{top2Interests}. Looking for {weatherDescription} weather in {month}, 
with a {paceDescription} {duration}-day itinerary{regionNote}."
```

Example output:
> "We'll find destinations perfect for a couple's trip focused on culture and food. Looking for warm weather in September, with a balanced 10-day itinerary exploring Asia."

---

## Files to Create/Modify

### 1. Create `src/types/travelProfile.ts`
- Define `TravelProfile` interface
- Define `TravelStyleTag` type
- Define `InterestScores` interface

### 2. Create `src/lib/profileBuilder.ts`
- `buildTravelProfile(preferences: TravelPreferences): TravelProfile`
- `normalizeInterestScores(interests: string[]): InterestScores`
- `inferStyleTags(preferences: TravelPreferences): TravelStyleTag[]`
- `calculateAdventureLevel(experiences: string[]): number`
- `checkCompleteness(preferences: TravelPreferences): { score: number; followUp: string | null }`
- `generateSummary(profile: Partial<TravelProfile>): string`

### 3. Update `src/components/questionnaire/TravelQuestionnaire.tsx`
- Import `buildTravelProfile` utility
- Call profile builder on questionnaire completion
- Display personalized summary in completion screen
- Handle optional follow-up question flow

---

## Integration Flow

1. User completes questionnaire
2. On final submit, call `buildTravelProfile(preferences)`
3. If `followUpQuestion` is not null, show follow-up question UI
4. Display `summary` in completion screen
5. Pass `TravelProfile` to recommendation engine (future)

---

## Example Output JSON

```json
{
  "interestScores": {
    "culture": 1.0,
    "nature": 0.0,
    "beach": 1.0,
    "food": 1.0,
    "nightlife": 0.0,
    "shopping": 0.0,
    "photography": 0.0,
    "wellness": 0.0
  },
  "adventureLevel": 0.25,
  "adventureTypes": ["diving"],
  "departureCity": "London",
  "travelMonth": "sep",
  "preferredRegions": ["asia", "europe"],
  "isFlexibleOnRegion": false,
  "weatherPreference": 0.75,
  "tripDuration": 14,
  "travelPace": 0.5,
  "travelCompanions": "couple",
  "groupType": "couple",
  "styleTags": [
    "culture-focused",
    "beach-seeker",
    "foodie",
    "adventure-light"
  ],
  "summary": "We'll find destinations perfect for a romantic getaway focused on culture and beach relaxation. Looking for warm weather in September, with a balanced 14-day itinerary exploring Asia and Europe.",
  "completenessScore": 1.0,
  "followUpQuestion": null
}
```
