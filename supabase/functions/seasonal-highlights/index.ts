import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SeasonalHighlightsRequest {
  city: string;
  country: string;
  travelMonth: string;
  userInterests?: string[];
  travelCompanions?: string;
  styleTags?: string[];
}

const MONTH_NAMES: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "any time of year",
};

const MONTH_INDEX: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

const MONTH_KEYS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

function getAdjacentMonths(monthKey: string): { prev: string; next: string } {
  const idx = MONTH_KEYS.indexOf(monthKey);
  if (idx === -1) return { prev: "the previous month", next: "the following month" };
  const prevIdx = (idx - 1 + 12) % 12;
  const nextIdx = (idx + 1) % 12;
  return {
    prev: MONTH_NAMES[MONTH_KEYS[prevIdx]],
    next: MONTH_NAMES[MONTH_KEYS[nextIdx]],
  };
}

const CACHE_TTL_HOURS = 12;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = (await req.json()) as SeasonalHighlightsRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const { city, country, travelMonth, userInterests = [], travelCompanions = "", styleTags = [] } = requestData;
    const monthName = MONTH_NAMES[travelMonth] || travelMonth;
    const currentYear = new Date().getFullYear();
    const { prev: prevMonth, next: nextMonth } = getAdjacentMonths(travelMonth);

    console.log("Generating seasonal highlights for:", city, country, "in", monthName, currentYear);

    // --- Server-side cache check ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const monthNum = MONTH_INDEX[travelMonth] || 0;

    if (monthNum > 0) {
      const cutoff = new Date(Date.now() - CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();
      const { data: cached } = await supabase
        .from("seasonal_cache")
        .select("items_json")
        .eq("city", city.toLowerCase())
        .eq("country", country.toLowerCase())
        .eq("month", monthNum)
        .eq("year", currentYear)
        .gte("fetched_at", cutoff)
        .maybeSingle();

      if (cached?.items_json) {
        console.log("Cache hit for seasonal highlights");
        return new Response(JSON.stringify(cached.items_json), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ============================================================
    // LAYER 1 — Perplexity API for verified events
    // ============================================================
    console.log("Layer 1: Querying Perplexity for verified events...");

    const perplexityQuery = `What festivals, cultural celebrations, seasonal events, food markets, sporting events, and unique experiences are happening or at their peak in ${city}, ${country} in ${monthName} ${currentYear}? Include only events confirmed or reliably recurring for ${currentYear}. For each event provide: event name, typical or confirmed dates within the month, category (Cultural / Food / Nature / Music / Religious / Sport / Seasonal), a factual 2-sentence description, whether this is unique to this specific month or available year-round, the specific neighbourhood or venue or area in ${city} where it is best experienced, and a source URL where available. Return as a structured JSON array.`;

    let perplexityEvents: any[] = [];
    let perplexityCitations: string[] = [];

    try {
      const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: `You are a travel event researcher. Return ONLY valid JSON in this format:
{
  "events": [
    {
      "name": "Event name",
      "dates": "Specific dates or timing within the month",
      "category": "Cultural|Food|Nature|Music|Religious|Sport|Seasonal",
      "description": "Factual 2-sentence description",
      "isMonthSpecific": true,
      "location": "Specific neighbourhood, venue, or area in the city",
      "sourceUrl": "URL or null"
    }
  ]
}
Only include events genuinely tied to or peaking in the specified month. Filter out year-round attractions. Be specific to ${city}, not generic national events unless they are celebrated prominently in ${city}.`,
            },
            { role: "user", content: perplexityQuery },
          ],
        }),
      });

      if (perplexityResponse.ok) {
        const perplexityData = await perplexityResponse.json();
        const content = perplexityData.choices?.[0]?.message?.content || "";
        perplexityCitations = perplexityData.citations || [];

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          perplexityEvents = (parsed.events || []).filter(
            (e: any) => e.isMonthSpecific !== false
          );
          console.log(`Perplexity returned ${perplexityEvents.length} verified events`);
        }
      } else {
        console.warn("Perplexity API error:", perplexityResponse.status);
      }
    } catch (perplexityError) {
      console.warn("Perplexity fetch failed, continuing with AI-only:", perplexityError);
    }

    // ============================================================
    // LAYER 2 — AI framing and personalisation
    // ============================================================
    console.log("Layer 2: AI framing and personalisation...");

    const needsSupplement = perplexityEvents.length < 3;
    const supplementCount = needsSupplement ? Math.max(0, 5 - perplexityEvents.length) : 0;

    const companionContext = travelCompanions
      ? `The traveller is travelling as: ${travelCompanions}.${
          travelCompanions === "family" || travelCompanions === "Family with children"
            ? " Prioritise family-friendly events."
            : travelCompanions === "solo" || travelCompanions === "couple"
            ? " Prioritise immersive cultural or food experiences over large crowd events."
            : ""
        }`
      : "";

    const interestsList = userInterests.length > 0 ? userInterests.join(", ") : "varied interests";

    const aiSystemPrompt = `You are a travel content curator creating personalised seasonal content. You will receive verified events from a research layer and must frame them for a specific traveller.

RULES:
- Show ONLY experiences, events, and things happening specifically in ${monthName} in ${city} — festivals, seasonal produce, temporary exhibitions, weather-dependent experiences, or cultural moments unique to this time of year.
- Do NOT show generic year-round attractions — those are covered on the "Why This City" tab. Every card must answer: why is ${monthName} a special or particularly good time to visit ${city}?
- Do NOT invent new dated events — only frame the verified ones provided
${needsSupplement ? `- ALSO generate ${supplementCount} additional seasonal EXPERIENCES (not specific dated events) for ${city} in ${monthName}. These must be month-specific — things like seasonal produce, weather-dependent activities, or cultural moments tied to this time of year. Mark these with "isAiGenerated": true` : "- Do NOT add any events beyond what was provided"}
- Every item must have an imageQuery in format: "[event/experience name] ${city} ${country}"
- For each event, write one italic insight sentence explaining why THIS month specifically is the right time
- Be specific to ${city}, not generic

Respond with ONLY valid JSON:
{
  "openingStatement": "Single sentence (max 25 words) capturing what makes ${monthName} in ${city} feel special — focus on what's unique to now",
  "highlights": [
    {
      "title": "Event or experience name",
      "timing": "Specific timing",
      "category": "cultural|natural|food|religious|music|sport|other",
      "section": "festivals_cultural|food_traditions|weather_driven",
      "description": "1-2 factual sentences",
      "whySeasonal": "One italic-ready sentence: why THIS month makes it special",
      "urgency": "only_this_month|best_this_month|short_window|null",
      "imageQuery": "[event name] ${city} ${country}",
      "sourceUrl": "source URL from verified data or null",
      "sourceName": "publication name extracted from URL or null",
      "wikipediaUrl": "Wikipedia URL if available or null",
      "location": "Specific neighbourhood/venue/area in ${city}",
      "matchesInterests": true/false,
      "notToBeMissed": true/false,
      "isAiGenerated": false,
      "missNote": "This won't be available if you visit ${city} in ${prevMonth} or ${nextMonth}." or null
    }
  ]
}`;

    const verifiedEventsJson = JSON.stringify(perplexityEvents, null, 2);

    const aiUserPrompt = `Here are verified events for ${city}, ${country} in ${monthName} ${currentYear}:

${verifiedEventsJson}

${perplexityCitations.length > 0 ? `Source citations from research:\n${perplexityCitations.map((url, i) => `[${i + 1}] ${url}`).join("\n")}` : ""}

Traveller's stated interests: ${interestsList}
Travel style: ${styleTags.join(", ") || "balanced"}
${companionContext}

For each verified event:
1. Write one insight sentence explaining why ${monthName} specifically is the right time — what would be missed in any other month
2. Add "matchesInterests": true if it directly aligns with the traveller's stated interests
3. Add "notToBeMissed": true for unmissable events regardless of interests
4. Name the specific neighbourhood, venue, or area in ${city} where it is best experienced
5. For events tagged "only_this_month" or "short_window", add missNote: "This won't be available if you visit ${city} in ${prevMonth} or ${nextMonth}."

ORDER events: interest matches first, then unmissable, then other verified events${needsSupplement ? `, then AI-generated seasonal experiences` : ""}.

Write a single opening sentence (max 25 words) capturing what makes ${monthName} in ${city} feel special.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: aiSystemPrompt },
          { role: "user", content: aiUserPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway returned ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from AI response");

    const parsed = JSON.parse(jsonMatch[0]);

    // Ensure image queries are city-specific
    if (parsed.highlights) {
      for (const h of parsed.highlights) {
        if (h.imageQuery && !h.imageQuery.toLowerCase().includes(city.toLowerCase())) {
          h.imageQuery = `${h.title} ${city} ${country}`;
        }
      }
    }

    // Remove monthSummary (no duplicate intro)
    const result = {
      openingStatement: parsed.openingStatement || "",
      highlights: parsed.highlights || [],
    };

    console.log("Seasonal highlights ready, count:", result.highlights.length);

    // --- Cache the result ---
    if (monthNum > 0) {
      try {
        await supabase.from("seasonal_cache").delete()
          .eq("city", city.toLowerCase())
          .eq("country", country.toLowerCase())
          .eq("month", monthNum)
          .eq("year", currentYear);

        await supabase.from("seasonal_cache").insert({
          city: city.toLowerCase(),
          country: country.toLowerCase(),
          month: monthNum,
          year: currentYear,
          items_json: result,
          status: "ok",
          fetched_at: new Date().toISOString(),
        });
        console.log("Cached seasonal highlights");
      } catch (cacheErr) {
        console.warn("Failed to cache:", cacheErr);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in seasonal-highlights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
