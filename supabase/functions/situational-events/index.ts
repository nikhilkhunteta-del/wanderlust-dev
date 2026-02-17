import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * situational-events: Clusters raw disruption sources into deduplicated events.
 * 
 * Scope: ONLY transport disruptions, safety/political events, natural hazards.
 * Produces structured events with impact_level, traveler summary, and deduplicated sources.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sources, city, country } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({
          events: [],
          overallSeverity: 0,
          statusLabel: "Normal",
          statusSummary: `No significant travel disruptions reported for ${city} in the past 7 days.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourcesText = sources
      .map((s: any, i: number) => `[${i + 1}] "${s.title}" — ${s.publisher} | ${s.snippet} | URL: ${s.url}`)
      .join("\n");

    const prompt = `You are a travel disruption analyst for ${city}, ${country}. Given recent news sources, cluster them into DISTINCT DISRUPTION EVENTS.

STRICT SCOPE — Only include:
- Transport disruptions (strikes, cancellations, closures, delays)
- Safety/political events (protests, curfews, unrest, elections affecting mobility)
- Natural/environmental hazards (floods, storms, fires, extreme pollution, outbreaks)

STRICTLY EXCLUDE — Do NOT create events for:
- General country travel advisories
- Health guidance, vaccines, disease info
- Festivals, cultural events, seasonal happenings
- Generic safety tips or tourist advice
- Historical events or resolved situations

SOURCES:
${sourcesText}

RULES:
- Group articles about the SAME real-world event into ONE event
- Each event MUST reference at least one source URL
- Maximum 6 events, prefer fewer well-sourced ones
- If NO sources describe active disruptions, return empty events array
- Use calm, practical language

Return JSON:
{
  "events": [
    {
      "id": "evt_1",
      "category": "transport" | "safety" | "protest" | "extreme_weather" | "environmental" | "other",
      "impact_level": "high" | "medium" | "low",
      "severity": 1-5,
      "confidence": 0.0-1.0,
      "title": "Clear event title",
      "summary": "2-3 sentence traveler-focused summary",
      "relevance_to_traveler": "Why this matters to a visitor",
      "start_date": "ISO date or null",
      "affected_areas": "Specific locations impacted",
      "recommended_actions": ["action 1", "action 2"],
      "sources": [{"url": "...", "title": "...", "publisher": "..."}]
    }
  ],
  "overallSeverity": 0-5,
  "statusLabel": "Normal" | "Watch" | "Disrupted",
  "statusSummary": "One calm sentence summarizing the situation for travelers"
}

impact_level mapping: high=severity 4-5, medium=severity 2-3, low=severity 1
confidence: 1 reputable source=0.6, 2+=0.8+, cross-source agreement boosts higher
Return ONLY valid JSON.`;

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let content: string | undefined;

    for (const model of models) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: "You are a travel disruption API. Return only valid JSON. Exclude advisories, health info, festivals." },
              { role: "user", content: prompt },
            ],
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const status = response.status;
          console.error(`Model ${model} error: ${status}`);
          if (status === 429 || status === 402) {
            // Rate limit or payment — try next model
            continue;
          }
          continue;
        }

        const aiData = await response.json();
        content = aiData.choices?.[0]?.message?.content;
        if (content) break;
      } catch (e) {
        console.error(`Model ${model} fetch error:`, e);
      }
    }

    if (!content) {
      return new Response(
        JSON.stringify({
          events: [],
          overallSeverity: 0,
          statusLabel: "Normal",
          statusSummary: "Unable to analyze sources at this time.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const eventsData = JSON.parse(cleaned);

    // Validate: remove events without sources, and enforce scope
    if (eventsData.events) {
      const excludedCategories = ["health", "festival", "advisory", "seasonal"];
      eventsData.events = eventsData.events.filter(
        (e: any) =>
          e.sources?.length > 0 &&
          e.sources.some((s: any) => s.url) &&
          !excludedCategories.includes(e.category)
      );

      // Ensure impact_level is set
      eventsData.events = eventsData.events.map((e: any) => ({
        ...e,
        impact_level: e.impact_level || (e.severity >= 4 ? "high" : e.severity >= 2 ? "medium" : "low"),
      }));
    }

    return new Response(JSON.stringify(eventsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in situational-events:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        events: [],
        overallSeverity: 0,
        statusLabel: "Normal",
        statusSummary: "Analysis temporarily unavailable.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
