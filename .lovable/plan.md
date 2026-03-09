

## Plan: Remove weather & budget questions, update novelty question, clean up edge function

### Files to edit (6 files)

**1. `src/types/questionnaire.ts`**
- Remove `weatherPreference` and `budgetLevel` from `TravelPreferences` interface
- Delete the weather question (lines 197-216) and budget question (lines 217-229) from `QUESTIONS` array
- Update novelty question (lines 230-242): new copy "Helps us choose between celebrated classics and hidden gems", new options with `description` field: classics/mix/off-beaten-path/surprise
- Reorder so novelty comes before pace (Q7 novelty, Q8 pace)

**2. `src/types/travelProfile.ts`**
- Remove `weatherPreference`, `preferredRegions`, `isFlexibleOnRegion` from `TravelProfile`
- Remove `BudgetLevel` type
- Update `NoveltyPreference`: replace `'familiar'` with `'classics'`
- Remove `budgetLevel` field

**3. `src/components/questionnaire/SingleSelectQuestion.tsx`**
- Add `description?: string` to Option interface
- Render description beneath label when present (small muted text)
- Switch layout to flex-col when description exists

**4. `src/components/questionnaire/TravelQuestionnaire.tsx`**
- Remove `weatherPreference` and `budgetLevel` from `initialPreferences`

**5. `src/pages/PlanCity.tsx`**
- Remove `weatherPreference` and `budgetLevel` from `initialPreferences`

**6. `src/lib/profileBuilder.ts`**
- Remove `weatherPreference` normalization, `budgetLevel` mapping, and related summary logic
- Remove `BUDGET_LABELS`
- Update `mapToNovelty` to use `'classics'` instead of `'familiar'`
- Remove `preferredRegions`, `isFlexibleOnRegion`, `weatherPreference`, `budgetLevel` from profile construction
- Update completeness score denominator

**7. `src/components/questionnaire/ProgressIndicator.tsx`**
- Change text to "8 quick questions · Takes about 1 minute"

**8. `supabase/functions/recommend-destinations/index.ts`**
- Remove `weatherPreference`, `preferredRegions`, `isFlexibleOnRegion`, `budgetLevel` from TravelProfile interface
- Delete `weatherDesc`, `regionConstraint`, `budgetDesc` variables
- Remove WEATHER PREFERENCE, PREFERRED REGIONS, BUDGET lines from user prompt
- Update novelty mapping: `'familiar'` → `'classics'` with new descriptions
- Replace system prompt with the provided version including TRAVEL COMPANIONS RULES and DISCOVERY STYLE RULES

