import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callClaude, HAIKU } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatsRequest {
  city: string;
  country: string;
  primaryInterest: string;
}

interface CityStat {
  stat: string;
  description: string;
}

const INTEREST_GUIDELINES: Record<string, string> = {
  "culture-history": "UNESCO sites, years of history, museums/monuments count",
  "nature-outdoors": "national parks, hiking trails km, endemic species or natural wonders",
  "beach-coastal": "km of coastline, sea temperature, number of beaches or marine reserves",
  "food-culinary": "Michelin stars, signature dishes, market or street food stalls",
  "arts-music-nightlife": "music venues, festivals per year, galleries or creative districts",
  "active-sport": "adventure activities available, world rankings, terrain statistics",
  "shopping-markets": "market age in years, artisan stalls, unique craft traditions",
  "wellness-slow-travel": "spas or hammams, walkability ranking, average pace or retreat options",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, primaryInterest } = (await req.json()) as StatsRequest;

    if (!city || !country) {
      return new Response(JSON.stringify({ error: "city and country are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const interest = primaryInterest || "culture-history";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("city_stats_cache")
      .select("stats_json")
      .eq("city", city.toLowerCase())
      .eq("country", country.toLowerCase())
      .eq("interest", interest)
      .maybeSingle();

    if (cached?.stats_json) {
      console.log(`Cache hit for ${city} / ${interest}`);
      return new Response(JSON.stringify({ stats: cached.stats_json, fromCache: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // No cache — make AI call
    const interestGuide = INTEREST_GUIDELINES[interest] || INTEREST_GUIDELINES["culture-history"];

    let stats: CityStat[] = [];
    try {
      const text = await callClaude(
        `You are a travel data specialist. Generate exactly 3 compelling, specific, accurate statistics. Focus on: ${interestGuide}. Return ONLY a valid JSON array: [{"stat": "3", "description": "UNESCO World Heritage Sites"}, ...]`,
        `City: ${city}, Country: ${country}. Primary travel interest: ${interest}. Generate 3 statistics.`,
        { model: HAIKU },
      );
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) stats = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      console.error("AI call failed:", aiErr);
      return new Response(
        JSON.stringify({ stats: [], fromCache: false, degraded: true, reason: "gateway_error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Ensure exactly 3
    stats = stats.slice(0, 3);

    // Cache the results
    if (stats.length > 0) {
      await supabase.from("city_stats_cache").upsert(
        {
          city: city.toLowerCase(),
          country: country.toLowerCase(),
          interest,
          stats_json: stats,
        },
        { onConflict: "city,country,interest" }
      );
      console.log(`Cached stats for ${city} / ${interest}`);
    }

    return new Response(JSON.stringify({ stats, fromCache: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("get-city-stats error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
