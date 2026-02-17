import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * situational-search: Fetches ONLY real-time travel disruption news.
 * 
 * Scope: transport disruptions, safety/political events, natural/environmental hazards.
 * Excluded: general advisories, health, festivals, generic safety tips.
 * 
 * PRIMARY: Perplexity Search API (sonar) — last 7 days
 * BACKUP: Firecrawl (Google News scraping)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SourceItem {
  url: string;
  title: string;
  publisher: string;
  published_at: string | null;
  snippet: string;
  query_used: string;
}

const MIN_SOURCES_THRESHOLD = 3;

async function searchPerplexity(query: string, apiKey: string): Promise<SourceItem[]> {
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
            content:
              "You are a travel disruption researcher. Return ONLY a JSON array of recent disruption news (last 7 days). Each item: {url, title, publisher, snippet}. Only include ACTIVE disruptions: transport strikes/cancellations/closures, protests/curfews/unrest, natural disasters/floods/fires/extreme pollution. EXCLUDE: general travel advisories, health/vaccine guidance, festivals, seasonal events, generic safety tips. No commentary.",
          },
          {
            role: "user",
            content: `Find recent disruption news (last 7 days) about: ${query}. Return as JSON array with fields: url, title, publisher, snippet. Only items with real URLs. Max 5 items. Exclude general advisories, health info, festivals.`,
          },
        ],
        temperature: 0.1,
        search_recency_filter: "week",
      }),
    });

    if (!response.ok) {
      console.error(`Perplexity error for "${query}": ${response.status}`);
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations || [];

    let items: SourceItem[] = [];
    try {
      const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const arr = Array.isArray(parsed) ? parsed : parsed.items || parsed.results || [];
      items = arr
        .filter((item: any) => item.url && item.title)
        .map((item: any) => ({
          url: item.url,
          title: item.title,
          publisher: item.publisher || extractDomain(item.url),
          published_at: item.published_at || null,
          snippet: item.snippet || "",
          query_used: query,
        }));
    } catch {
      // Fallback: use citations
      if (citations.length > 0) {
        items = citations.slice(0, 5).map((url: string, i: number) => ({
          url,
          title: `Source ${i + 1} for: ${query}`,
          publisher: extractDomain(url),
          published_at: null,
          snippet: content.substring(0, 200),
          query_used: query,
        }));
      }
    }

    return items;
  } catch (error) {
    console.error(`Perplexity search error for "${query}":`, error);
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

// Disruption-focused queries only — no advisories, health, or festivals
function buildQueries(city: string, country: string): string[] {
  return [
    `${city} transport strike cancellation closure last 7 days`,
    `${city} flight cancellations airport delays last 7 days`,
    `${city} protest demonstration curfew unrest last 7 days`,
    `${city} ${country} natural disaster flood storm fire last 7 days`,
    `${city} political unrest election disruption last 7 days`,
  ];
}

async function searchPerplexityAll(
  city: string,
  country: string,
  apiKey: string
): Promise<SourceItem[]> {
  const queries = buildQueries(city, country);
  console.log(`Running ${queries.length} disruption queries for ${city}, ${country}`);

  // Run in 2 batches to respect rate limits
  const batch1 = queries.slice(0, 3);
  const batch2 = queries.slice(3);

  const results1 = await Promise.all(batch1.map((q) => searchPerplexity(q, apiKey)));
  const results2 = await Promise.all(batch2.map((q) => searchPerplexity(q, apiKey)));
  const allSources: SourceItem[] = [...results1, ...results2].flat();

  // Deduplicate by URL
  const seen = new Set<string>();
  const deduped = allSources.filter((s) => {
    const key = s.url.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Filter out non-disruption content
  const excluded = [
    "vaccine", "vaccination", "health advisory", "festival", "carnival",
    "holiday celebration", "tourist tips", "travel insurance", "visa requirement",
  ];
  const filtered = deduped.filter((s) => {
    const text = `${s.title} ${s.snippet}`.toLowerCase();
    return !excluded.some((ex) => text.includes(ex));
  });

  // Prioritize reputable news sources
  const reputable = [
    "reuters", "bbc", "ap", "guardian", "nytimes", "aljazeera",
    "cnn", "washingtonpost", "france24",
  ];
  filtered.sort((a, b) => {
    const aScore = reputable.some((r) => a.publisher.toLowerCase().includes(r)) ? 0 : 1;
    const bScore = reputable.some((r) => b.publisher.toLowerCase().includes(r)) ? 0 : 1;
    return aScore - bScore;
  });

  return filtered.slice(0, 15);
}

async function fallbackFirecrawl(city: string, country: string): Promise<SourceItem[]> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) return [];

  const searchQuery = encodeURIComponent(`${city} ${country} travel disruption strike protest`);
  const searchUrl = `https://news.google.com/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: searchUrl, formats: ["markdown"], onlyMainContent: true }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const markdown = data.data?.markdown || "";
    if (markdown.length < 100) return [];

    return [{
      url: searchUrl,
      title: `Google News: ${city} travel disruptions`,
      publisher: "Google News (aggregated)",
      published_at: new Date().toISOString(),
      snippet: markdown.substring(0, 300),
      query_used: `${city} ${country} disruptions`,
    }];
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country } = await req.json();
    if (!city || !country) throw new Error("City and country are required");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    let sources: SourceItem[] = [];
    let status: "ok" | "degraded" | "error" = "ok";

    if (PERPLEXITY_API_KEY) {
      sources = await searchPerplexityAll(city, country, PERPLEXITY_API_KEY);
      console.log(`Perplexity returned ${sources.length} disruption sources`);
    } else {
      console.warn("PERPLEXITY_API_KEY not configured");
    }

    if (sources.length < MIN_SOURCES_THRESHOLD) {
      const fallback = await fallbackFirecrawl(city, country);
      sources = [...sources, ...fallback];
      if (fallback.length > 0) status = "degraded";
    }

    if (sources.length === 0) status = "error";

    return new Response(
      JSON.stringify({ sources, status, fetchedAt: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in situational-search:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
