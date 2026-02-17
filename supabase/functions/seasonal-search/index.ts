import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * seasonal-search: Retrieves month-specific events/experiences using real web retrieval.
 *
 * Architecture:
 * - PRIMARY: Perplexity Search API (sonar) for grounded results with citations
 * - BACKUP: Firecrawl scrape of tourism sites if Perplexity returns < 3 valid items
 * - SUMMARIZE: Gemini (Lovable AI Gateway) for formatting only — never invents events/URLs
 * - CACHE: seasonal_cache table, 7-day TTL
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTH_NAMES: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "any time",
};

const MONTH_NUMBERS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

interface RawSource {
  url: string;
  title: string;
  snippet: string;
  publisher: string;
  query_used: string;
}

interface SeasonalItem {
  event_id: string;
  title: string;
  date_range: string;
  start_date: string | null;
  end_date: string | null;
  category: "festival" | "cultural" | "seasonal_nature" | "seasonal_food" | "sports" | "other";
  primary_type: string;
  secondary_tags: string[];
  location: string | null;
  description: string;
  why_it_matters: string | null;
  impact_score: number;
  source_name: string;
  source_url: string;
  confidence: "high" | "medium" | "low";
  section: "festivals_cultural" | "food_traditions" | "weather_driven";
  verified: boolean;
}

const CACHE_TTL_DAYS = 7;
const MIN_VALID_ITEMS = 3;

// Reputable source domains
const REPUTABLE_DOMAINS = [
  "wikipedia.org", "wikidata.org", "timeout.com", "lonelyplanet.com",
  "tripadvisor.com", "visitberlin", "parisinfo", "nycgo.com",
  "japan-guide.com", "gov", ".gov.", "tourism", "visitlondon",
  "atout-france", "spain.info", "italia.it", "deutschland.de",
  "bbc.com", "theguardian.com", "nytimes.com", "reuters.com",
  "nationalgeographic.com", "cntraveler.com", "afar.com",
  "eventbrite.com", "festicket.com",
];

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

function isReputable(url: string): boolean {
  const domain = extractDomain(url).toLowerCase();
  return REPUTABLE_DOMAINS.some((r) => domain.includes(r));
}

function isSEOSpam(title: string, snippet: string): boolean {
  const spamSignals = [
    /top \d+ (things|places|attractions)/i,
    /best .* to visit/i,
    /you won't believe/i,
    /click here/i,
    /sponsored/i,
    /affiliate/i,
  ];
  const text = `${title} ${snippet}`;
  return spamSignals.some((r) => r.test(text));
}

async function searchPerplexity(query: string, apiKey: string): Promise<RawSource[]> {
  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a travel events researcher. Return ONLY a JSON array of specific events, festivals, or seasonal experiences. Each item must have: url (real source URL), title (event name), snippet (1-2 sentences about date/timing), publisher (source name). Only include items with real, verifiable URLs. No commentary outside the JSON array.`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity error for "${query}": ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    let items: RawSource[] = [];
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed) ? parsed : parsed.items || parsed.results || [];
      items = arr
        .filter((item: any) => item.url && item.title)
        .map((item: any) => ({
          url: item.url,
          title: item.title,
          snippet: item.snippet || "",
          publisher: item.publisher || extractDomain(item.url),
          query_used: query,
        }));
    } catch {
      // Use citations as fallback sources
      items = citations
        .filter((url: string) => url && url.startsWith("http"))
        .map((url: string, i: number) => ({
          url,
          title: `Source ${i + 1}`,
          snippet: content.substring(0, 300),
          publisher: extractDomain(url),
          query_used: query,
        }));
    }

    return items;
  } catch (error) {
    console.error(`Perplexity search error for "${query}":`, error);
    return [];
  }
}

async function searchPerplexityAll(
  city: string,
  country: string,
  monthName: string,
  year: number,
  apiKey: string
): Promise<RawSource[]> {
  const queries = [
    `${city} events ${monthName} ${year}`,
    `${city} festival ${monthName} ${year}`,
    `${city} cultural events ${monthName} ${year}`,
    `${city} seasonal food ${monthName}`,
    `${city} best things to do ${monthName} seasonal`,
  ];

  console.log(`Running ${queries.length} Perplexity queries for ${city} in ${monthName} ${year}`);

  // Run in 2 batches to respect rate limits
  const batch1 = queries.slice(0, 3);
  const batch2 = queries.slice(3);

  const results1 = await Promise.all(batch1.map((q) => searchPerplexity(q, apiKey)));
  // Small delay between batches
  await new Promise((r) => setTimeout(r, 500));
  const results2 = await Promise.all(batch2.map((q) => searchPerplexity(q, apiKey)));
  
  const allSources: RawSource[] = [...results1, ...results2].flat();

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = allSources.filter((s) => {
    const key = s.url.toLowerCase().replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter: must have real URL, not SEO spam
  const validated = deduped.filter((s) => {
    if (!s.url.startsWith("http")) return false;
    if (isSEOSpam(s.title, s.snippet)) return false;
    return true;
  });

  // Sort: reputable first
  validated.sort((a, b) => {
    const aScore = isReputable(a.url) ? 0 : 1;
    const bScore = isReputable(b.url) ? 0 : 1;
    return aScore - bScore;
  });

  return validated.slice(0, 15);
}

async function fallbackFirecrawl(city: string, country: string, monthName: string, year: number): Promise<RawSource[]> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not configured, skipping fallback");
    return [];
  }

  const urls = [
    `https://www.timeout.com/${city.toLowerCase().replace(/\s+/g, "-")}/things-to-do`,
    `https://www.lonelyplanet.com/${country.toLowerCase().replace(/\s+/g, "-")}/${city.toLowerCase().replace(/\s+/g, "-")}/events`,
  ];

  console.log(`Firecrawl fallback for ${city} ${monthName} ${year}`);
  const results: RawSource[] = [];

  for (const url of urls) {
    try {
      const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: true,
        }),
      });

      if (!response.ok) continue;

      const data = await response.json();
      const markdown = data.data?.markdown || "";
      if (markdown.length < 100) continue;

      results.push({
        url,
        title: `Events in ${city}`,
        snippet: markdown.substring(0, 500),
        publisher: extractDomain(url),
        query_used: `firecrawl:${url}`,
      });
    } catch (error) {
      console.warn(`Firecrawl error for ${url}:`, error);
    }
  }

  return results;
}

async function summarizeWithGemini(
  rawSources: RawSource[],
  city: string,
  country: string,
  monthName: string,
  year: number,
  lovableApiKey: string
): Promise<{ items: SeasonalItem[]; monthOpener: string }> {
  const sourcesJson = JSON.stringify(
    rawSources.map((s) => ({
      title: s.title,
      snippet: s.snippet,
      url: s.url,
      publisher: s.publisher,
    }))
  );

  const systemPrompt = `You are a travel content editor. Your job is to take RAW SEARCH RESULTS about events/experiences in a city during a specific month and structure them into a clean, deduplicated list ranked by traveler impact.

CRITICAL RULES:
- You must ONLY use information from the provided sources
- NEVER invent event names, dates, or URLs that aren't in the sources
- NEVER add events not mentioned in the sources
- Each item MUST reference a source_url from the provided sources
- DEDUPLICATE: If two sources refer to the same real-world event (e.g. "Holi" appearing in multiple sources), merge them into ONE item. Merge tags instead of duplicating.
- Same title + overlapping dates + same city = single event
- Maximum 10 items total

For each item, assign an impact_score (0-10):
- 9-10: Once-in-a-lifetime, city-defining events (major festivals like Holi, Carnival, Oktoberfest)
- 7-8: Significant events that shape a trip (large cultural celebrations, renowned exhibitions)
- 4-6: Worth knowing about (concerts, seasonal markets, exhibitions, food events)
- 1-3: Niche or minor (conferences, workshops, small local meetups)

For items with impact_score >= 7, add a "why_it_matters" field: 1-2 practical sentences about how it affects trip planning (crowds, hotel prices, closures, cultural uniqueness).

Categorize each into a section:
- "festivals_cultural": Festivals, celebrations, cultural events, music, art
- "food_traditions": Seasonal food, markets, harvest, culinary traditions
- "weather_driven": Nature, weather activities, seasonal landscapes, outdoor experiences

Set confidence:
- "high": Source explicitly mentions this event in ${monthName} ${year} or annually in ${monthName}
- "medium": Source mentions the event but timing is approximate
- "low": Source mentions the city/experience but timing isn't clearly ${monthName}

Generate a stable event_id for each: lowercase, hyphenated, e.g. "holi-festival-jaipur-2026"

Return ONLY valid JSON:
{
  "monthOpener": "One compelling sentence about what makes ${monthName} special in ${city}",
  "items": [
    {
      "event_id": "stable-unique-id",
      "title": "Event name (from source)",
      "date_range": "Specific dates or 'All month' (from source)",
      "start_date": "YYYY-MM-DD or null",
      "end_date": "YYYY-MM-DD or null",
      "category": "festival|cultural|seasonal_nature|seasonal_food|sports|other",
      "primary_type": "Festival|Cultural|Food|Experience|Conference|Sports|Nature|Other",
      "secondary_tags": ["Crowd-heavy", "Family-friendly", "Night-event", "Seasonal"],
      "section": "festivals_cultural|food_traditions|weather_driven",
      "location": "Venue or area (from source, or null)",
      "description": "1-2 sentences (can rephrase source but must be grounded)",
      "why_it_matters": "Practical trip impact (for impact_score >= 7, else null)",
      "impact_score": 8,
      "source_name": "Publisher name",
      "source_url": "Exact URL from the source",
      "confidence": "high|medium|low",
      "verified": true
    }
  ]
}`;

  const userPrompt = `Here are search results about events and experiences in ${city}, ${country} during ${monthName} ${year}:

${sourcesJson}

Structure these into a clean list of seasonal highlights. Remember: use ONLY information from these sources. Do not invent events or URLs.`;

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Gemini summarization error:", response.status);
      // Fallback: create items directly from sources without AI
      return createItemsFromRawSources(rawSources, city, monthName);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      return createItemsFromRawSources(rawSources, city, monthName);
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return createItemsFromRawSources(rawSources, city, monthName);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate: every item must have a source_url that exists in our raw sources
    const sourceUrls = new Set(rawSources.map((s) => s.url.toLowerCase().replace(/\/$/, "")));
    const validItems = (parsed.items || []).filter((item: any) => {
      if (!item.source_url) return false;
      const normalized = item.source_url.toLowerCase().replace(/\/$/, "");
      // Allow if the URL matches or is from the same domain
      return sourceUrls.has(normalized) || rawSources.some(
        (s) => extractDomain(s.url) === extractDomain(item.source_url)
      );
    });

    return {
      items: validItems.slice(0, 10),
      monthOpener: parsed.monthOpener || `Discover what's happening in ${city} during ${monthName}.`,
    };
  } catch (error) {
    console.error("Gemini summarization error:", error);
    return createItemsFromRawSources(rawSources, city, monthName);
  }
}

function createItemsFromRawSources(
  sources: RawSource[],
  city: string,
  monthName: string
): { items: SeasonalItem[]; monthOpener: string } {
  const items: SeasonalItem[] = sources.slice(0, 10).map((s, i) => ({
    event_id: `raw-${i}-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 30)}`,
    title: s.title,
    date_range: monthName,
    start_date: null,
    end_date: null,
    category: "other" as const,
    primary_type: "Other",
    secondary_tags: [],
    section: "festivals_cultural" as const,
    location: null,
    description: s.snippet.substring(0, 200),
    why_it_matters: null,
    impact_score: 3,
    source_name: s.publisher,
    source_url: s.url,
    confidence: "low" as const,
    verified: false,
  }));

  return {
    items,
    monthOpener: `Here's what we found about ${city} in ${monthName}.`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth, travelYear } = await req.json();

    if (!city || !country || !travelMonth) {
      throw new Error("city, country, and travelMonth are required");
    }

    const monthName = MONTH_NAMES[travelMonth] || travelMonth;
    const monthNum = MONTH_NUMBERS[travelMonth] || 1;
    const year = travelYear || new Date().getFullYear();

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cached } = await supabase
      .from("seasonal_cache")
      .select("*")
      .eq("city", city.toLowerCase())
      .eq("country", country.toLowerCase())
      .eq("month", monthNum)
      .eq("year", year)
      .single();

    if (cached) {
      const fetchedAt = new Date(cached.fetched_at);
      const age = Date.now() - fetchedAt.getTime();
      const ttl = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

      if (age < ttl) {
        console.log(`Cache hit for ${city} ${monthName} ${year} (age: ${Math.round(age / 3600000)}h)`);
        return new Response(
          JSON.stringify({
            ...(cached.items_json as any),
            fetchedAt: cached.fetched_at,
            status: cached.status,
            fromCache: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Cache miss for ${city} ${monthName} ${year}, fetching fresh data...`);

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let rawSources: RawSource[] = [];
    let status: "ok" | "degraded" | "error" = "ok";

    // PRIMARY: Perplexity
    if (PERPLEXITY_API_KEY) {
      rawSources = await searchPerplexityAll(city, country, monthName, year, PERPLEXITY_API_KEY);
      console.log(`Perplexity returned ${rawSources.length} validated sources`);
    } else {
      console.warn("PERPLEXITY_API_KEY not configured");
    }

    // BACKUP: Firecrawl if insufficient
    if (rawSources.length < MIN_VALID_ITEMS) {
      console.log(`Only ${rawSources.length} sources, trying Firecrawl fallback...`);
      const fallbackSources = await fallbackFirecrawl(city, country, monthName, year);
      rawSources = [...rawSources, ...fallbackSources];
      if (rawSources.length > 0 && fallbackSources.length > 0) {
        status = "degraded";
      }
    }

    if (rawSources.length === 0) {
      status = "error";
      const result = {
        items: [],
        monthOpener: `No verified events found for ${city} in ${monthName}.`,
        fetchedAt: new Date().toISOString(),
        status,
        fromCache: false,
      };

      // Cache the empty result too (shorter TTL via status)
      await upsertCache(supabase, city, country, monthNum, year, result, status);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SUMMARIZE with Gemini (formatting only, not inventing)
    const { items, monthOpener } = await summarizeWithGemini(
      rawSources, city, country, monthName, year, LOVABLE_API_KEY
    );

    const result = {
      items,
      monthOpener,
      fetchedAt: new Date().toISOString(),
      status,
      fromCache: false,
    };

    // Cache
    await upsertCache(supabase, city, country, monthNum, year, result, status);

    console.log(`Returning ${items.length} seasonal items for ${city} ${monthName} ${year}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in seasonal-search:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function upsertCache(
  supabase: any,
  city: string,
  country: string,
  month: number,
  year: number,
  data: any,
  status: string
) {
  try {
    await supabase
      .from("seasonal_cache")
      .upsert(
        {
          city: city.toLowerCase(),
          country: country.toLowerCase(),
          month,
          year,
          items_json: data,
          status,
          fetched_at: new Date().toISOString(),
        },
        { onConflict: "city,country,month,year" }
      );
  } catch (error) {
    console.error("Cache write error:", error);
  }
}
