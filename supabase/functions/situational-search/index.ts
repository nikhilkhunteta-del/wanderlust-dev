import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * situational-search: Primary data sourcing for situational awareness.
 * 
 * Architecture:
 * - PRIMARY: Perplexity Search API (sonar model) for grounded, cited results
 * - BACKUP: Firecrawl (Google News scraping) — only when Perplexity fails or returns < 6 sources
 * - Caching: 6-hour TTL in situational_cache Supabase table
 * - Rule: No claim without a source URL
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

const MIN_SOURCES_THRESHOLD = 6;

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
              "You are a travel safety researcher. Return ONLY a JSON array of relevant news items. Each item must have: url, title, publisher, snippet (1 sentence). Focus on recent events (last 14 days preferred). No commentary.",
          },
          {
            role: "user",
            content: `Find recent news and reports about: ${query}. Return as JSON array with fields: url, title, publisher, snippet. Only include items with real URLs. Max 5 items.`,
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

    // Try to parse structured response
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
      // If JSON parsing fails, use citations as sources
      items = citations.map((url: string, i: number) => ({
        url,
        title: `Source ${i + 1} for: ${query}`,
        publisher: extractDomain(url),
        published_at: null,
        snippet: content.substring(0, 200),
        query_used: query,
      }));
    }

    return items;
  } catch (error) {
    console.error(`Perplexity search error for "${query}":`, error);
    return [];
  }
}

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return "Unknown";
  }
}

async function searchPerplexityAll(
  city: string,
  country: string,
  travelMonth: string,
  travelYear: number,
  apiKey: string
): Promise<SourceItem[]> {
  const queries = [
    `${city} travel disruption`,
    `${city} transport strike OR metro closure OR airport delays`,
    `${city} protest demonstration traffic`,
    `${country} travel advisory ${city}`,
    `${city} safety incident tourists`,
    `${city} festival crowd disruption ${travelMonth} ${travelYear}`,
  ];

  console.log(`Running ${queries.length} Perplexity queries for ${city}, ${country}`);

  // Run queries in parallel for speed (2 batches of 3 to stay within rate limits)
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

  // Prioritize reputable publishers
  const reputable = [
    "reuters", "bbc", "ap", "guardian", "nytimes", "aljazeera",
    "gov", "state.gov", "who.int", "cdc.gov",
  ];
  deduped.sort((a, b) => {
    const aScore = reputable.some((r) => a.publisher.toLowerCase().includes(r)) ? 0 : 1;
    const bScore = reputable.some((r) => b.publisher.toLowerCase().includes(r)) ? 0 : 1;
    return aScore - bScore;
  });

  return deduped.slice(0, 15);
}

async function fallbackFirecrawl(city: string, country: string): Promise<SourceItem[]> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not configured, skipping fallback");
    return [];
  }

  const searchQuery = encodeURIComponent(`${city} ${country} travel news safety 2025`);
  const searchUrl = `https://news.google.com/search?q=${searchQuery}&hl=en-US&gl=US&ceid=US:en`;

  console.log(`Firecrawl fallback for: ${city}, ${country}`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: searchUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const markdown = data.data?.markdown || "";
    if (markdown.length < 100) return [];

    // Extract what we can from the scraped content
    return [
      {
        url: searchUrl,
        title: `Google News results for ${city} travel safety`,
        publisher: "Google News (aggregated)",
        published_at: new Date().toISOString(),
        snippet: markdown.substring(0, 300),
        query_used: `${city} ${country} travel news`,
      },
    ];
  } catch (error) {
    console.warn("Firecrawl fallback error:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth, travelYear } = await req.json();

    if (!city || !country) {
      throw new Error("City and country are required");
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    const currentYear = travelYear || new Date().getFullYear();

    let sources: SourceItem[] = [];
    let status: "ok" | "degraded" | "error" = "ok";

    // PRIMARY: Perplexity
    if (PERPLEXITY_API_KEY) {
      sources = await searchPerplexityAll(city, country, travelMonth || "", currentYear, PERPLEXITY_API_KEY);
      console.log(`Perplexity returned ${sources.length} sources`);
    } else {
      console.warn("PERPLEXITY_API_KEY not configured");
    }

    // BACKUP: Firecrawl if Perplexity insufficient
    if (sources.length < MIN_SOURCES_THRESHOLD) {
      console.log(`Sources below threshold (${sources.length} < ${MIN_SOURCES_THRESHOLD}), trying Firecrawl fallback`);
      const fallbackSources = await fallbackFirecrawl(city, country);
      sources = [...sources, ...fallbackSources];
      if (fallbackSources.length > 0) {
        status = "degraded";
      }
    }

    if (sources.length === 0) {
      status = "error";
    }

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
