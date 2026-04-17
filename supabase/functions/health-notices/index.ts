import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callClaude, extractJson, HAIKU } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CACHE_TTL_DAYS = 7;
const FUNCTION_NAME = "health-notices";

async function scrapeCdcPage(country: string): Promise<string | null> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");

  if (!FIRECRAWL_API_KEY) {
    console.warn("FIRECRAWL_API_KEY not configured, skipping CDC scrape");
    return null;
  }

  const countrySlug = country.toLowerCase().replace(/\s+/g, "-");
  const cdcUrl = `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${countrySlug}`;

  console.log(`Scraping CDC page: ${cdcUrl}`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: cdcUrl,
        formats: ["markdown"],
        onlyMainContent: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.warn(`CDC scrape failed (${response.status}):`, errorData);
      return null;
    }

    const data = await response.json();
    const markdown = data.data?.markdown || "";

    console.log(`CDC scrape successful, content length: ${markdown.length} characters`);
    return markdown;
  } catch (error) {
    console.warn("CDC scrape error:", error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = await req.json();

    if (!city) {
      throw new Error("City is required");
    }

    const resolvedCountry = country || city;

    // Health data is not personalised — cache by city + country only
    const cacheKey = `${city.toLowerCase()}:${resolvedCountry.toLowerCase()}`;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // --- Cache check ---
    const { data: cached } = await supabase
      .from("ai_content_cache")
      .select("data_json")
      .eq("function_name", FUNCTION_NAME)
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.data_json) {
      console.log("Cache hit for health-notices:", cacheKey);
      return new Response(JSON.stringify(cached.data_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching health notices for ${city}, ${resolvedCountry} in ${travelMonth}`);

    // Step 1: Try to scrape real CDC data
    const cdcContent = await scrapeCdcPage(resolvedCountry);
    const hasCdcData = cdcContent && cdcContent.length > 100;

    // Step 2: Build prompt based on whether we have real CDC data
    let prompt: string;

    if (hasCdcData) {
      console.log("Using real CDC data for health notices");
      prompt = `You are a travel health information analyst. Analyze this REAL CDC travel health page data for ${resolvedCountry} and extract health information for travelers visiting ${city} in ${travelMonth || "any month"}.

--- CDC TRAVEL HEALTH PAGE DATA START ---
${cdcContent}
--- CDC TRAVEL HEALTH PAGE DATA END ---

IMPORTANT: Extract the ACTUAL health notices, warnings, and outbreaks mentioned in the CDC data above. Do NOT generate fictional alerts. If the CDC page mentions Level 1, 2, or 3 Travel Health Notices, include them. If it mentions specific disease outbreaks (like Oropouche, Dengue, etc.), include those as current notices.

Return a JSON object with this exact structure:
{
  "hasActiveAlerts": boolean (true if CDC data shows any Travel Health Notices or active outbreaks),
  "alertSummary": "One-line summary of the most important alert from CDC, or empty string if none",
  "currentNotices": [
    {
      "title": "Exact notice title from CDC (e.g., 'Level 1 Travel Health Notice' or outbreak name)",
      "source": "CDC",
      "summary": "Brief summary of what CDC says about this",
      "url": "https://wwwnc.cdc.gov/travel/destinations/traveler/none/${resolvedCountry.toLowerCase().replace(/\s+/g, "-")}"
    }
  ],
  "vaccines": [
    {
      "vaccine": "Vaccine name from CDC recommendations",
      "recommendation": "CDC's recommendation (Required, Recommended, Consider based on activities, etc.)"
    }
  ],
  "preventionGuidance": ["Prevention tips from CDC data"],
  "waterSafety": {
    "level": "safe" | "caution" | "not_recommended" (based on CDC guidance),
    "description": "Brief explanation based on CDC data"
  },
  "foodSafetyTips": ["Food safety tips relevant to ${resolvedCountry}"],
  "medicalFacilities": {
    "standard": "high" | "moderate" | "limited",
    "pharmacyAvailability": "Brief note on pharmacy access",
    "emergencyNumber": "Emergency number for ${resolvedCountry}"
  },
  "packingList": ["Health items from CDC packing recommendations if present, otherwise general travel health items"],
  "travelInsuranceNote": "Brief recommendation about travel medical insurance",
  "contextualInsights": [
    {
      "type": "air_quality" | "altitude" | "heat" | "mosquito" | "other",
      "title": "Insight title",
      "description": "Description based on CDC data or known conditions for ${city} in ${travelMonth}"
    }
  ]
}

Extract ALL Travel Health Notices and disease outbreaks from the CDC data. Be accurate to the source.`;
    } else {
      console.log("No CDC data available, using AI-generated content");
      prompt = `You are a travel health information analyst. Generate health travel information for ${city}, ${resolvedCountry} for travelers visiting in ${travelMonth || "any month"}.

NOTE: Real-time CDC data was not available. Use general knowledge about travel health for this destination.

Return a JSON object with this exact structure:
{
  "hasActiveAlerts": boolean,
  "alertSummary": "One-line summary if active alerts exist, otherwise empty string",
  "currentNotices": [
    {
      "title": "Notice title",
      "source": "WHO/CDC/NaTHNaC",
      "summary": "One-line summary",
      "url": "Official source URL"
    }
  ],
  "vaccines": [
    {
      "vaccine": "Vaccine name",
      "recommendation": "Brief recommendation (e.g., Recommended, Required, Consider)"
    }
  ],
  "preventionGuidance": ["General prevention tip 1", "Prevention tip 2"],
  "waterSafety": {
    "level": "safe" | "caution" | "not_recommended",
    "description": "Brief explanation"
  },
  "foodSafetyTips": ["Food safety tip 1", "Food safety tip 2", "Food safety tip 3"],
  "medicalFacilities": {
    "standard": "high" | "moderate" | "limited",
    "pharmacyAvailability": "Brief note on pharmacy access",
    "emergencyNumber": "Emergency medical number for the country"
  },
  "packingList": ["Health item 1", "Health item 2", "Health item 3", "Health item 4", "Health item 5"],
  "travelInsuranceNote": "Brief recommendation about travel medical insurance",
  "contextualInsights": [
    {
      "type": "air_quality" | "altitude" | "heat" | "mosquito" | "other",
      "title": "Insight title",
      "description": "Brief description"
    }
  ]
}

Guidelines:
- currentNotices: Include up to 3 notices. Use real official source URLs. If no current alerts, use empty array.
- vaccines: List typical vaccine recommendations for travelers to this region
- waterSafety level: "safe" for developed countries, "caution" for mixed quality, "not_recommended" where bottled water is advised
- medicalFacilities standard: "high" for developed countries, "moderate" for mixed, "limited" for remote/developing areas
- contextualInsights: Include ONLY if relevant to ${city} or ${travelMonth}

Be factual and neutral. No alarmist language. No personalized medical advice.`;
    }

    prompt += "\n\nReturn ONLY valid JSON, no markdown or explanation.";

    const text = await callClaude(
      "You are a travel health data API. Return only valid JSON. When provided with real CDC data, extract actual notices and alerts accurately.",
      prompt,
      { model: HAIKU, temperature: 0.3 },
    );
    const healthData = extractJson(text) as any;

    healthData.lastUpdated = new Date().toISOString().split("T")[0];
    healthData.dataSource = hasCdcData ? "CDC (real-time)" : "AI-generated";

    console.log(`Generated health notices for ${city}, ${resolvedCountry}:`, {
      hasActiveAlerts: healthData.hasActiveAlerts,
      noticesCount: healthData.currentNotices?.length || 0,
      dataSource: healthData.dataSource,
    });

    // --- Cache the result ---
    const expiresAt = new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { error: cacheErr } = await supabase.from("ai_content_cache").upsert(
      {
        function_name: FUNCTION_NAME,
        cache_key: cacheKey,
        data_json: healthData,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: "function_name,cache_key" }
    );
    if (cacheErr) {
      console.error("Cache write failed for health-notices:", cacheErr.message, cacheErr.code);
    } else {
      console.log("Cached health-notices:", cacheKey);
    }

    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in health-notices function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
