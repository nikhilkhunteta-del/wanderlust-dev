import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { ranked, profile } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const topInterests = Object.entries(profile.interestScores || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 2)
      .map(([k]: any) => k);

    const prompt = `You are a travel comparison analyst. Generate a verdict comparing three cities for a traveller.

Traveller context:
- Travel month: ${profile.travelMonth}
- Top interests: ${topInterests.join(", ")}
- Travel party: ${profile.travelCompanions || profile.groupType || "solo"}
- Trip duration: ${profile.tripDuration} days
- Departure city: ${profile.departureCity || "not specified"}

Rankings (best to worst):
1. ${ranked[0].city} (score: ${ranked[0].score.toFixed(1)}) — match: ${ranked[0].personalMatch}, weather: ${ranked[0].weatherFit}, cost: ${ranked[0].gettingThere}, safety: ${ranked[0].safety}
2. ${ranked[1].city} (score: ${ranked[1].score.toFixed(1)}) — match: ${ranked[1].personalMatch}, weather: ${ranked[1].weatherFit}, cost: ${ranked[1].gettingThere}, safety: ${ranked[1].safety}
3. ${ranked[2].city} (score: ${ranked[2].score.toFixed(1)}) — match: ${ranked[2].personalMatch}, weather: ${ranked[2].weatherFit}, cost: ${ranked[2].gettingThere}, safety: ${ranked[2].safety}

IMPORTANT: The scores above reflect genuine differences between these cities for this specific traveller and month. Your verdict MUST clearly explain WHY the top city beats the others — reference specific dimensional advantages. Do not hedge or treat the cities as interchangeable. Be honest about real trade-offs: if the top city has a weaker dimension, name it explicitly.

Return ONLY valid JSON:
{
  "verdictParagraph": "2-3 sentences explaining why city #1 wins for THIS traveller. Reference the travel month, top 2 interests, and travel party. Must acknowledge one specific trade-off honestly — name the dimension where another city beats it.",
  "runnerUpReason": "One sentence why #2 is the runner-up — what specific advantage does it have over #3?",
  "whyNot": [
    {"city": "${ranked[1].city}", "reason": "One specific sentence explaining the dimensional gap vs the winner."},
    {"city": "${ranked[2].city}", "reason": "One specific sentence explaining the dimensional gap vs the winner."}
  ]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a travel comparison analyst. Return ONLY valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("AI error:", response.status, err);
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const verdict = JSON.parse(cleaned);

    return new Response(JSON.stringify(verdict), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in compare-cities:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
