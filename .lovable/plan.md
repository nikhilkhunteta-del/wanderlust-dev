
# Fix: City Autocomplete Click Selection

## Problem Identified

The autocomplete suggestions dropdown closes before the click event can register on the suggestion buttons. This is a classic race condition between:

1. **mousedown event** (fires first) - The click-outside handler uses `mousedown` to detect external clicks
2. **onClick event** (fires after) - The suggestion buttons listen for `onClick` which fires on mouse button release

When clicking a suggestion, the input loses focus, potentially causing state updates that interfere with the click completing.

## Solution

Change the suggestion buttons from `onClick` to `onMouseDown` and prevent the default behavior to ensure the selection happens immediately when the mouse button is pressed, before any focus changes can occur.

## Files to Modify

### `src/components/questionnaire/TextInputQuestion.tsx`

**Change 1:** Update the suggestion button handler from `onClick` to `onMouseDown`

- Replace `onClick={() => handleSelectCity(city)}` with a `onMouseDown` handler
- Add `e.preventDefault()` to prevent the input from losing focus during selection
- This ensures the city selection fires immediately on mouse press, before any blur/focus events can interfere

```tsx
// Before
<button
  onClick={() => handleSelectCity(city)}
  ...
>

// After  
<button
  onMouseDown={(e) => {
    e.preventDefault();
    handleSelectCity(city);
  }}
  ...
>
```

## Technical Details

- **onMouseDown** fires before focus changes, ensuring the handler executes while the dropdown is still visible
- **e.preventDefault()** stops the button from stealing focus from the input, keeping the user experience smooth
- The keyboard navigation (Arrow keys, Enter, Escape) will continue to work as before
- No changes needed to the click-outside detection logic - it will continue to work correctly for actual outside clicks

## Testing Checklist

1. Click on a city suggestion - should select and populate the input
2. Use keyboard arrows and Enter - should still work
3. Click outside the dropdown - should close
4. Type to filter cities - suggestions should update correctly
