import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HEALTH_CACHE_TTL_HOURS = 6;

// --- Helpers ---

function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

function toCountrySlug(country: string): string {
  return country.toLowerCase().replace(/['']/g, "").replace(/\s+/g, "-");
}

function getCurrentYear(): number {
  return new Date().getFullYear();
}

// --- 1. CDC Vaccine Data ---

async function fetchCdcVaccines(country: string): Promise<string | null> {
  const slug = toCountrySlug(country);
  const url = `https://wwwnc.cdc.gov/travel/destinations/api/${slug}`;
  console.log(`Fetching CDC vaccines: ${url}`);
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`CDC API returned ${res.status}`);
      // Fallback: try the traveler URL pattern
      const fallbackUrl = `https://wwwnc.cdc.gov/travel/destinations/traveler/none/${slug}`;
      console.log(`Trying fallback CDC URL: ${fallbackUrl}`);
      const fallbackRes = await fetchWithTimeout(fallbackUrl);
      if (!fallbackRes.ok) {
        console.warn(`CDC fallback also failed: ${fallbackRes.status}`);
        return null;
      }
      return await fallbackRes.text();
    }
    return await res.text();
  } catch (e) {
    console.warn("CDC fetch error:", e);
    return null;
  }
}

// --- 2. WHO Outbreak Notices ---

async function fetchWhoOutbreaks(country: string, _region?: string): Promise<any[]> {
  const url = "https://www.who.int/feeds/entity/csr/don/en/rss.xml";
  console.log("Fetching WHO RSS feed");
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      console.warn(`WHO RSS returned ${res.status}`);
      return [];
    }
    const xml = await res.text();

    // Simple XML parsing for RSS items
    const items: { title: string; description: string; link: string; pubDate: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
      const itemXml = match[1];
      const title = itemXml.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").trim() || "";
      const description = itemXml.match(/<description>([\s\S]*?)<\/description>/)?.[1]?.replace(/<!\[CDATA\[(.*?)\]\]>/, "$1").trim() || "";
      const link = itemXml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || "";
      const pubDate = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || "";
      items.push({ title, description, link, pubDate });
    }

    // Filter: last 180 days, mentions country
    const cutoff = Date.now() - 180 * 24 * 60 * 60 * 1000;
    const cl = country.toLowerCase();
    const filtered = items.filter((item) => {
      const date = new Date(item.pubDate).getTime();
      if (isNaN(date) || date < cutoff) return false;
      const text = `${item.title} ${item.description}`.toLowerCase();
      return text.includes(cl);
    });

    console.log(`WHO: ${items.length} total items, ${filtered.length} match "${country}" in last 180 days`);
    return filtered;
  } catch (e) {
    console.warn("WHO RSS fetch error:", e);
    return [];
  }
}

// --- 3. Perplexity Health Synthesis ---

async function fetchPerplexityHealth(
  apiKey: string,
  city: string,
  country: string,
  travelMonth: string
): Promise<any> {
  const year = getCurrentYear();
  const query = `What are the current health risks, water safety, food safety, and medical facility quality for tourists visiting ${city}, ${country} in ${travelMonth} ${year}? Use CDC, WHO, and NaTHNaC as primary sources. Be specific to the city, not just the country. Return: tap_water_safety (Safe / Caution / Unsafe + one-sentence reason specific to this city), food_safety_notes (2-3 sentences specific to this city and month), medical_facility_quality (Excellent / Good / Basic + one sentence), pharmacy_availability (one sentence), seasonal_health_considerations (relevant to this specific month only).`;

  try {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
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
            content: `You are a travel health analyst. Return ONLY valid JSON with this structure:
{
  "tap_water": {"status":"Safe"|"Caution"|"Unsafe","reason":"one sentence specific to ${city}"},
  "food_safety": "2-3 sentences specific to ${city} in ${travelMonth}",
  "medical_quality": {"level":"Excellent"|"Good"|"Basic","detail":"one sentence"},
  "pharmacy": "one sentence about pharmacy availability in ${city}",
  "seasonal_considerations": ["array of considerations specific to ${travelMonth}, empty if none"],
  "packing_suggestions": ["Generate a single consolidated packing list for ${city} in ${travelMonth} combining: (1) weather-appropriate clothing and comfort items based on the climate that month (e.g. light layers, rain jacket, sun hat), (2) health and safety items specific to this destination. Organise into a flat array with each item prefixed by its category in square brackets: [Clothing & comfort], [Health & pharmacy], [Documents & money], or [City-specific essentials]. INSECT REPELLENT RULE: Only include insect repellent if the destination has documented mosquito-borne disease risk (dengue, malaria, Zika) or the travel month falls in peak mosquito season for that region. For major European cities in spring/autumn, do NOT include insect repellent unless there is a specific reason. Every item must have a clear destination-and-month-specific reason."]
}
Return ONLY valid JSON.`,
          },
          { role: "user", content: query },
        ],
        temperature: 0.1,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      console.warn(`Perplexity health error ${res.status}:`, txt);
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("Perplexity health fetch error:", e);
    return null;
  }
}

// --- Emergency number fallback (shared with on-the-ground) ---

function getEmergencyNumber(country: string): string {
  const c = country.toLowerCase();
  const euCountries = [
    "spain", "france", "germany", "italy", "portugal", "greece", "netherlands",
    "belgium", "austria", "croatia", "czech republic", "denmark", "finland",
    "sweden", "ireland", "poland", "romania", "hungary", "slovakia", "slovenia",
    "estonia", "latvia", "lithuania", "luxembourg", "malta", "cyprus", "bulgaria",
  ];
  if (euCountries.includes(c)) return "112";
  if (["united kingdom", "uk"].includes(c)) return "999 / 112";
  if (["united states", "usa", "us", "canada"].includes(c)) return "911";
  if (c === "australia") return "000";
  if (c === "new zealand") return "111";
  if (c === "japan") return "119 (ambulance) / 110 (police)";
  if (c === "south korea") return "119";
  if (c === "china") return "120 (ambulance) / 110 (police)";
  if (c === "thailand") return "1669 (ambulance) / 191 (police)";
  if (c === "india") return "112";
  if (c === "brazil") return "192 (ambulance) / 190 (police)";
  if (c === "mexico") return "911";
  if (c === "south africa") return "10177 (ambulance) / 10111 (police)";
  if (["morocco", "tunisia", "egypt"].includes(c)) return "150 (ambulance) / 19 (police)";
  if (c === "turkey" || c === "türkiye") return "112";
  return "Check local emergency numbers";
}

// --- AI calls with model fallback ---

async function callAI(
  lovableKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
  let response: Response | null = null;

  for (const model of models) {
    console.log("AI trying model:", model);
    response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(model.startsWith("google/") ? { temperature: 0.3 } : {}),
      }),
    });
    if (response.ok) break;
    const errText = await response.text();
    console.error(`AI error with ${model}:`, response.status, errText);
    if (response.status === 429) throw new Error("Rate limits exceeded");
    if (response.status === 402) throw new Error("Payment required");
  }
  if (!response || !response.ok) throw new Error("AI gateway error: all models failed");

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("No content in AI response");
  return content.replace(/```json\n?|\n?```/g, "").trim();
}

// --- Main Handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = await req.json();
    if (!city) throw new Error("City is required");

    const resolvedCountry = country || city;

    // --- Cache check ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const cutoff = new Date(Date.now() - HEALTH_CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from("health_cache")
      .select("data_json, fetched_at")
      .eq("city", city.toLowerCase())
      .eq("country", resolvedCountry.toLowerCase())
      .eq("travel_month", (travelMonth || "").toLowerCase())
      .gte("fetched_at", cutoff)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached?.data_json) {
      console.log(`Health cache HIT for ${city}, ${resolvedCountry}, ${travelMonth}`);
      return new Response(JSON.stringify(cached.data_json), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`Health cache MISS for ${city}, ${resolvedCountry}, ${travelMonth}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    console.log(`Fetching health data for ${city}, ${resolvedCountry} in ${travelMonth}`);

    // Run all data sources in parallel
    const [cdcRaw, whoItems, perplexityHealth] = await Promise.allSettled([
      fetchCdcVaccines(resolvedCountry),
      fetchWhoOutbreaks(resolvedCountry),
      fetchPerplexityHealth(PERPLEXITY_API_KEY, city, resolvedCountry, travelMonth || ""),
    ]);

    const cdcData = cdcRaw.status === "fulfilled" ? cdcRaw.value : null;
    const whoData = whoItems.status === "fulfilled" ? whoItems.value : [];
    const pxHealth = perplexityHealth.status === "fulfilled" ? perplexityHealth.value : null;

    // --- Step A: Filter CDC vaccines through AI ---
    let vaccines: any[] = [];
    if (cdcData && cdcData.length > 50) {
      try {
        const vaccineJson = await callAI(
          LOVABLE_API_KEY,
          "You are a travel health data filter. Return ONLY valid JSON.",
          `Filter this CDC vaccine data for a tourist visiting ${city}, ${resolvedCountry} in ${travelMonth}. Remove vaccines only relevant to: rural or remote travel, long-stay travellers (6+ months), healthcare workers, or areas far from ${city}. Return only vaccines genuinely recommended or required for this specific city and tourist travel context.

HEPATITIS A RULE: If Hepatitis A is listed solely due to generic international travel guidance and the destination country has low documented incidence (e.g. Western Europe, North America, Australia, Japan, South Korea), do NOT show it as a standalone "Recommended" entry. Instead include it as "Routine" with reason: "Hepatitis A — consider if eating street food or travelling outside major restaurants."

CDC DATA:
${cdcData.substring(0, 4000)}

Return a JSON array: [{"name":"vaccine name","recommendation_level":"Routine"|"Recommended"|"Required","reason":"one sentence plain-language reason relevant to ${city}"}]
If only routine vaccines apply, still list them but mark as "Routine".
Return ONLY valid JSON array.`
        );
        vaccines = JSON.parse(vaccineJson);
        if (!Array.isArray(vaccines)) vaccines = [];
      } catch (e) {
        console.warn("Vaccine filtering failed:", e);
      }
    }

    // If no CDC data, ask AI for general vaccine info
    if (vaccines.length === 0) {
      try {
        const vaccineJson = await callAI(
          LOVABLE_API_KEY,
          "You are a travel health data API. Return ONLY valid JSON.",
          `What vaccines are recommended for a tourist visiting ${city}, ${resolvedCountry} in ${travelMonth}? Only include vaccines genuinely relevant for a short-stay tourist visiting the city. Do NOT include Yellow Fever unless required/recommended for this destination. Do NOT include Rabies unless there is documented high risk. Do NOT include Tick-borne encephalitis for major urban destinations.

HEPATITIS A RULE: If Hepatitis A is listed solely due to generic international travel guidance and the destination country has low documented incidence (e.g. Western Europe, North America, Australia, Japan, South Korea), do NOT show it as a standalone "Recommended" entry. Instead include it as "Routine" with reason: "Hepatitis A — consider if eating street food or travelling outside major restaurants."

Return a JSON array: [{"name":"vaccine name","recommendation_level":"Routine"|"Recommended"|"Required","reason":"one sentence reason specific to ${city}"}]
Return ONLY valid JSON array.`
        );
        vaccines = JSON.parse(vaccineJson);
        if (!Array.isArray(vaccines)) vaccines = [];
      } catch (e) {
        console.warn("AI vaccine generation failed:", e);
      }
    }

    // --- Step B: Filter WHO notices through AI ---
    let activeNotices: any[] = [];
    if (whoData.length > 0) {
      for (const item of whoData.slice(0, 5)) {
        try {
          const result = await callAI(
            LOVABLE_API_KEY,
            "You are a travel health relevance filter. Return ONLY valid JSON.",
            `Does this WHO outbreak notice genuinely affect tourists visiting ${city} in ${travelMonth}?

Title: ${item.title}
Description: ${item.description?.substring(0, 500)}
Published: ${item.pubDate}

If YES, return: {"relevant": true, "summary": "one sentence plain-language summary of what it means for a tourist"}
If NO, return: {"relevant": false}
Return ONLY valid JSON.`
          );
          const parsed = JSON.parse(result);
          if (parsed.relevant && parsed.summary) {
            activeNotices.push({
              source: "WHO",
              title: item.title,
              summary: parsed.summary,
              url: item.link,
              date: new Date(item.pubDate).toISOString().split("T")[0],
            });
          }
        } catch (e) {
          console.warn("WHO notice filtering failed for item:", e);
        }
      }
    }

    // --- Step C: Build water/food safety from Perplexity ---
    const waterStatusMap: Record<string, string> = { Safe: "safe", Caution: "caution", Unsafe: "unsafe" };
    const waterSafety = pxHealth?.tap_water
      ? {
          status: waterStatusMap[pxHealth.tap_water.status] || "caution",
          reason: pxHealth.tap_water.reason || "",
        }
      : { status: "caution", reason: "Verify local water safety on arrival." };

    const foodSafety = pxHealth?.food_safety || "";

    const medicalQuality = pxHealth?.medical_quality
      ? { level: pxHealth.medical_quality.level || "Good", detail: pxHealth.medical_quality.detail || "" }
      : { level: "Good", detail: "Check local medical facilities on arrival." };

    const pharmacy = pxHealth?.pharmacy || "Pharmacies generally available in the city centre.";

    const seasonalConsiderations: string[] = pxHealth?.seasonal_considerations || [];
    const packingSuggestions: string[] = pxHealth?.packing_suggestions || [];

    // --- Step D: AI Health Summary (fold minor seasonal into summary) ---
    let healthSummary = "";
    let hasActiveAlerts = activeNotices.length > 0;
    let displaySeasonalConsiderations = seasonalConsiderations;

    // If only one minor seasonal consideration, fold it into summary
    const foldSeasonal = seasonalConsiderations.length === 1;

    try {
      const summaryInput = {
        city,
        country: resolvedCountry,
        month: travelMonth,
        activeNotices: activeNotices.length,
        noticeDetails: activeNotices.map((n) => n.summary).join("; "),
        waterStatus: waterSafety.status,
        medicalLevel: medicalQuality.level,
        vaccineCount: vaccines.filter((v) => v.recommendation_level !== "Routine").length,
        seasonalNote: foldSeasonal ? seasonalConsiderations[0] : null,
      };

      healthSummary = await callAI(
        LOVABLE_API_KEY,
        "You are a calm, specific travel health writer. Return ONLY plain text (no JSON, no markdown).",
        `Write a 2-3 sentence health summary for a tourist visiting ${city} in ${travelMonth}. 

Context: ${JSON.stringify(summaryInput)}

Lead with the overall risk level for a typical tourist. Mention active notices ONLY if genuinely relevant (${activeNotices.length} active). ${foldSeasonal ? `Incorporate this seasonal note naturally as part of the summary: "${seasonalConsiderations[0]}".` : ""} End with the single most important health action for this trip. Be calm, specific to ${city}, and avoid generic advice that applies to every destination. Return ONLY the 2-3 sentences, nothing else.`
      );

      if (foldSeasonal) {
        displaySeasonalConsiderations = [];
      }
    } catch (e) {
      console.warn("Health summary generation failed:", e);
      healthSummary = `${city} is generally a safe destination for tourists. Ensure routine vaccinations are current and consider travel insurance.`;
    }

    // --- Step E: Reassurance line ---
    let reassuranceLine: string | null = null;
    const qualityLevel = medicalQuality.level;
    if (qualityLevel === "Excellent" || qualityLevel === "Good") {
      try {
        reassuranceLine = await callAI(
          LOVABLE_API_KEY,
          "You are a calm travel writer. Return ONLY plain text, one sentence, under 20 words.",
          `Write one sentence that reassures a tourist about the healthcare infrastructure in ${city} specifically — mention something concrete like English-speaking staff, proximity to major hospitals, or pharmacy availability. Keep it under 20 words.`
        );
        // Clean any quotes
        reassuranceLine = reassuranceLine.replace(/^["']|["']$/g, "").trim();
      } catch (e) {
        console.warn("Reassurance line generation failed:", e);
      }
    }

    // Emergency number with descriptor
    const emergencyNumber = getEmergencyNumber(resolvedCountry);
    const hasMultipleNumbers = emergencyNumber.includes("/") || emergencyNumber.includes("(");
    const emergencyDescriptor = hasMultipleNumbers
      ? emergencyNumber
      : `All emergency services — police, ambulance, fire`;

    // --- Step F: Determine health risk level ---
    let healthRiskLevel: "low" | "moderate" | "high" = "moderate"; // default
    {
      const hasRequiredVaccines = vaccines.some((v: any) => v.recommendation_level === "Required");
      const hasRecommendedVaccines = vaccines.some((v: any) => v.recommendation_level === "Recommended");
      const waterIsSafe = waterSafety.status === "safe";
      const goodMedical = ["Excellent", "Good"].includes(medicalQuality.level);
      const hasAlerts = hasActiveAlerts;

      if (hasRequiredVaccines || hasAlerts || medicalQuality.level === "Basic") {
        healthRiskLevel = "high";
      } else if (hasRecommendedVaccines || !waterIsSafe || seasonalConsiderations.length > 0) {
        healthRiskLevel = "moderate";
      } else if (waterIsSafe && goodMedical && !hasAlerts && !hasRecommendedVaccines) {
        healthRiskLevel = "low";
      }
    }

    console.log(`Health risk level for ${city}: ${healthRiskLevel}`);

    // Build response
    const result = {
      healthRiskLevel,
      healthSummary,
      hasActiveAlerts,
      activeNotices,
      vaccines,
      waterSafety,
      foodSafety,
      medicalFacilities: {
        quality: medicalQuality.level,
        qualityDetail: medicalQuality.detail,
        pharmacy,
        emergencyNumber,
        emergencyDescriptor,
      },
      seasonalConsiderations: displaySeasonalConsiderations,
      packingSuggestions,
      reassuranceLine,
      lastUpdated: new Date().toISOString().split("T")[0],
      dataSources: [
        cdcData ? "CDC (live)" : null,
        whoData.length > 0 ? "WHO (live)" : null,
        pxHealth ? "Perplexity (live)" : null,
      ].filter(Boolean),
    };

    console.log(`Health data complete for ${city}:`, {
      notices: activeNotices.length,
      vaccines: vaccines.length,
      water: waterSafety.status,
      sources: result.dataSources,
    });

    // --- Store in cache (delete old + insert new) ---
    try {
      const cityL = city.toLowerCase();
      const countryL = resolvedCountry.toLowerCase();
      const monthL = (travelMonth || "").toLowerCase();
      await supabase.from("health_cache")
        .delete()
        .eq("city", cityL)
        .eq("country", countryL)
        .eq("travel_month", monthL);
      await supabase.from("health_cache").insert({
        city: cityL,
        country: countryL,
        travel_month: monthL,
        data_json: result,
        fetched_at: new Date().toISOString(),
      });
      console.log(`Health cache stored for ${city}`);
    } catch (cacheErr) {
      console.warn("Failed to store health cache:", cacheErr);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-health-data:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";
    const status = msg.includes("Rate limits") ? 429 : msg.includes("Payment required") ? 402 : 500;
    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
