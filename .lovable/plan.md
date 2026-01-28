

# Plan: Integrate Real CDC Health Data via Firecrawl

## Problem

The current Health Notices tab uses AI-generated content based on the model's training data. This means it misses **real-time health alerts** from the CDC. For example, Brazil currently has:
- Level 1 Travel Health Notice
- Two active disease outbreaks (Oropouche and Dengue)

But the app shows "No major current health alerts."

## Solution Overview

Integrate **Firecrawl** (a web scraping API) to fetch real health data from the CDC Travel Health page, then have the AI synthesize the scraped content into our structured format.

```text
+------------------+     +------------------+     +------------------+
|   Frontend       | --> | health-notices   | --> |   Firecrawl      |
|   (React)        |     |   Edge Function  |     |   Scrape API     |
+------------------+     +------------------+     +------------------+
                                |                         |
                                v                         v
                         +------------------+     +------------------+
                         |   Lovable AI     | <-- |   CDC Page       |
                         |   (Synthesize)   |     |   (Markdown)     |
                         +------------------+     +------------------+
```

## Implementation Steps

### Step 1: Connect Firecrawl

Enable the Firecrawl connector to provide the `FIRECRAWL_API_KEY` as an environment variable in edge functions.

### Step 2: Create Firecrawl Scrape Function

Create a new edge function `supabase/functions/firecrawl-scrape/index.ts` to handle CDC page scraping:
- Accept a URL parameter
- Call Firecrawl API to scrape the page as markdown
- Return the cleaned content

### Step 3: Update Health Notices Edge Function

Modify `supabase/functions/health-notices/index.ts` to:

1. **Build CDC URL**: Construct the CDC travel page URL using the country name:
   - Pattern: `https://wwwnc.cdc.gov/travel/destinations/traveler/none/{country-slug}`
   - Example: `https://wwwnc.cdc.gov/travel/destinations/traveler/none/brazil`

2. **Scrape CDC Page**: Call Firecrawl to fetch the page content as markdown

3. **Feed Real Data to AI**: Include the scraped CDC content in the AI prompt so it synthesizes **actual current alerts** rather than generating from training data

4. **Graceful Fallback**: If scraping fails, fall back to AI-generated content (current behavior) with a note that data may not be current

### Step 4: Update Config

Add the new edge function to `supabase/config.toml`.

## Technical Details

### CDC URL Construction

The CDC uses lowercase, hyphenated country slugs:
```typescript
const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
const cdcUrl = `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${countrySlug}`;
```

### Enhanced AI Prompt

The AI prompt will be updated to include the real CDC data:

```typescript
const prompt = `You are a travel health analyst. Analyze this CDC travel health page for ${country}:

--- CDC DATA START ---
${cdcScrapedMarkdown}
--- CDC DATA END ---

Extract and structure the health information...`;
```

### Data to Extract from CDC

The CDC travel pages typically contain:
- **Travel Health Notices**: Warning levels (Level 1-3), outbreak names
- **Vaccines & Medicines**: Required and recommended vaccinations
- **Healthy Travel Packing List**: CDC's official recommendations
- **Travel Health Notices**: Active alerts with severity levels

### Fallback Strategy

```typescript
let cdcContent = "";
try {
  const scrapeResult = await scrapeCdc(countrySlug);
  cdcContent = scrapeResult.markdown;
} catch (error) {
  console.warn("CDC scrape failed, using AI-only mode:", error);
}

// AI prompt includes CDC content if available
const prompt = cdcContent 
  ? `Analyze this real CDC data: ${cdcContent}...`
  : `Generate health info based on your knowledge...`;
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/firecrawl-scrape/index.ts` | Create | Generic Firecrawl scrape endpoint |
| `supabase/functions/health-notices/index.ts` | Modify | Add CDC scraping before AI synthesis |
| `supabase/config.toml` | Modify | Register new edge function |

## Expected Outcome

After implementation, the Health Notices tab for Brazil will show:
- **Active health notice banner**: "Level 1 Travel Health Notice"
- **Current Notices**: Oropouche outbreak, Dengue outbreak with CDC links
- **Real vaccine recommendations** from CDC
- **Accurate severity levels** matching official sources

## Considerations

1. **Rate Limiting**: Firecrawl has usage limits; consider caching scraped results
2. **URL Patterns**: Some countries may have different CDC URL patterns; the function should handle 404s gracefully
3. **Content Changes**: CDC page structure may change; the AI handles this by interpreting markdown rather than parsing specific HTML

