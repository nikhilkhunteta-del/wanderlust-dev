import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const interestGuide = INTEREST_GUIDELINES[interest] || INTEREST_GUIDELINES["culture-history"];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You are a travel data expert. Return ONLY a valid JSON array with exactly 3 objects. Each object has two keys: 'stat' (a short number or figure, e.g. '3', '800+', '12km') and 'description' (a concise label, max 6 words). No markdown, no explanation, no extra text.",
          },
          {
            role: "user",
            content: `Give me 3 impressive, specific, factual statistics about ${city}, ${country} that a traveler would find compelling. ${interestGuide} The stats should be real and verifiable. Return as JSON array: [{"stat":"...","description":"..."}]`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_stats",
              description: "Return exactly 3 city statistics",
              parameters: {
                type: "object",
                properties: {
                  stats: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        stat: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["stat", "description"],
                      additionalProperties: false,
                    },
                    minItems: 3,
                    maxItems: 3,
                  },
                },
                required: ["stats"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_stats" } },
      }),
    });

    if (!resp.ok) {
      const status = resp.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error(`AI gateway error: ${status}`);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();

    // Extract from tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let stats: CityStat[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        stats = parsed.stats ?? [];
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try parsing content directly
    if (stats.length === 0) {
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        try {
          stats = JSON.parse(content);
        } catch { /* ignore */ }
      }
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
