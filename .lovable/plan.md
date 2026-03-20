

## Plan: Add Pollinations as Image Source in resolve-image Edge Function

### What Changes

**1. Add `POLLINATIONS_API_KEY` secret**
- Use the `add_secret` tool to request the key from the user before proceeding with code changes.

**2. Update `resolve-image/index.ts`**

- Add `'pollinations'` to the `ImageSource` type union.
- Add a `tryPollinations` function that:
  - Reads `POLLINATIONS_API_KEY` from env.
  - Derives a stable numeric seed from the entity/city name using a simple string hash (sum of char codes × prime, mod a large number).
  - Constructs URL: `https://gen.pollinations.ai/image/{encodedPrompt}?width=1200&height=800&seed={seed}&key={apiKey}` where prompt = `"{entityName} {city} atmospheric travel photography cinematic"`.
  - Fetches with a 20-second `AbortController` timeout.
  - Validates the response has `content-type` starting with `image/` and status 200.
  - Returns a `ResolvedImage` with `source: 'pollinations'`, `attributionRequired: false`, and the constructed URL.
  - Returns `null` on timeout, non-image response, or any error.

- **Change the resolution order** (lines ~1008–1042) based on type:
  - `attraction`, `city_hero`, `neighborhood`: Pollinations → Unsplash → Pexels → local storage (remove Wikimedia-first for named entities when type is one of these three).
  - `seasonal`: Wikimedia → Unsplash → Pollinations → Pexels → local storage.
  - `category` (unchanged): Wikimedia (if entityName) → Unsplash → Pexels → local storage.

- Keep the existing hero fallback (monument-focused query on Unsplash/Pexels) after the main chain for `city_hero`.

**3. Update `src/types/imageSystem.ts`**
- Add `'pollinations'` to the `ImageSource` type so the frontend type matches.

### Technical Details

**Hash function** (for deterministic seed):
```typescript
function stableHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
```

**Pollinations URL construction:**
```
const prompt = `${entityName || city} ${city} atmospheric travel photography cinematic`;
const encoded = encodeURIComponent(prompt);
const seed = stableHash((entityName || city).toLowerCase());
const url = `https://gen.pollinations.ai/image/${encoded}?width=1200&height=800&seed=${seed}&key=${apiKey}`;
```

**Timeout pattern:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 20000);
const response = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

**Resolution order by type:**

| Type | Order |
|------|-------|
| `city_hero` | Pollinations → Unsplash (chaotic reject) → Pexels → hero fallback → Storage |
| `attraction` | Pollinations → Unsplash → Pexels → Storage |
| `neighborhood` | Pollinations → Unsplash → Pexels → Storage |
| `seasonal` | Wikimedia → Unsplash → Pollinations → Pexels → Storage |
| `category` | Wikimedia (if entity) → Unsplash → Pexels → Storage (unchanged) |

### Files Modified
- `supabase/functions/resolve-image/index.ts` — add `tryPollinations`, update resolution logic
- `src/types/imageSystem.ts` — add `'pollinations'` to `ImageSource`

