import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * situational-events: Clusters raw sources into traveler-relevant events.
 * 
 * Takes sources from situational-search and produces structured events
 * with severity, confidence, and actionable recommendations.
 * Rule: Every event must have at least one source URL.
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
    const { sources, city, country, travelMonth } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // If no sources, return empty events with a calm status
    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({
          events: [],
          overallSeverity: 0,
          statusLabel: "Normal",
          statusSummary: `No verified disruptions found for ${city} at this time.`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sourcesText = sources
      .map((s: any, i: number) => `[${i + 1}] "${s.title}" — ${s.publisher} | ${s.snippet} | URL: ${s.url}`)
      .join("\n");

    const prompt = `You are a travel situational awareness analyst. Given the following news sources about ${city}, ${country}, cluster them into distinct EVENTS that could affect a traveler visiting in ${travelMonth || "the coming months"}.

SOURCES:
${sourcesText}

RULES:
- Group related sources into a single event (e.g., multiple articles about same strike = 1 event)
- Each event MUST reference at least one source by its URL
- Maximum 6 events, prefer fewer stronger ones
- Only include events with genuine traveler impact
- Use calm, practical language — no sensationalism

Return a JSON object:
{
  "events": [
    {
      "id": "evt_1",
      "category": "transport" | "safety" | "protest" | "extreme_weather" | "crowds_closures" | "entry_rules" | "other",
      "severity": 1-5,
      "confidence": 0.0-1.0,
      "title": "Clear event title",
      "start_time": "ISO date or null",
      "end_time": "ISO date or null",
      "affected_areas": "Description of affected areas",
      "traveler_impact_summary": "1-2 sentences on how this affects tourists",
      "recommended_actions": ["action 1", "action 2"],
      "sources": [{"url": "...", "title": "...", "publisher": "..."}]
    }
  ],
  "overallSeverity": 0-5,
  "statusLabel": "Normal" | "Watch" | "Disrupted",
  "statusSummary": "One calm sentence summarizing the situation"
}

Severity guide: 1=Minor/informational, 2=Low impact, 3=Moderate disruption, 4=Significant impact, 5=Severe/avoid
Confidence: Based on source quality and cross-source agreement. 1 reputable source=0.6, multiple=0.8+
StatusLabel: Normal(0-1), Watch(2-3), Disrupted(4-5)

Return ONLY valid JSON.`;

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let content: string | undefined;

    for (const model of models) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a travel situational awareness API. Return only valid JSON. Use calm, factual language." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        console.error(`Model ${model} error: ${response.status}`);
        continue;
      }

      const aiData = await response.json();
      content = aiData.choices?.[0]?.message?.content;
      if (content) break;
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

    // Validate: remove events without sources
    if (eventsData.events) {
      eventsData.events = eventsData.events.filter(
        (e: any) => e.sources && e.sources.length > 0 && e.sources.some((s: any) => s.url)
      );
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
