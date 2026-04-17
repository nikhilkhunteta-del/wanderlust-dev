import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, extractJson, SONNET } from "../_shared/ai.ts";

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
    const { ranked, profile, mode } = await req.json();

    const topInterests = Object.entries(profile.interestScores || {})
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 3)
      .map(([k]: any) => k);

    const travellerContext = `Traveller context:
- Travel month: ${profile.travelMonth}
- Top 3 interests: ${topInterests.join(", ")}
- Travel party: ${profile.travelCompanions || profile.groupType || "solo"}
- Trip duration: ${profile.tripDuration} days
- Departure city: ${profile.departureCity || "not specified"}

Rankings (best to worst) with actual numeric scores:
1. ${ranked[0].city} (weighted total: ${ranked[0].score.toFixed(1)}) — personalMatch: ${ranked[0].personalMatch}, weather: ${ranked[0].weatherFit}, gettingThere: ${ranked[0].gettingThere}, safety: ${ranked[0].safety}
2. ${ranked[1].city} (weighted total: ${ranked[1].score.toFixed(1)}) — personalMatch: ${ranked[1].personalMatch}, weather: ${ranked[1].weatherFit}, gettingThere: ${ranked[1].gettingThere}, safety: ${ranked[1].safety}
3. ${ranked[2].city} (weighted total: ${ranked[2].score.toFixed(1)}) — personalMatch: ${ranked[2].personalMatch}, weather: ${ranked[2].weatherFit}, gettingThere: ${ranked[2].gettingThere}, safety: ${ranked[2].safety}`;

    let prompt: string;
    let systemMsg: string;

    if (mode === "help-decide") {
      systemMsg = "You are a decisive travel advisor. Return ONLY valid JSON. Be specific and personal.";
      prompt = `${travellerContext}

For each of the three cities, write ONE compelling sentence explaining the single strongest reason to choose that city OVER the other two for THIS specific traveller. Be concrete — reference the traveller's interests, month, or party type. Each sentence should make the reader think "that's the one."

Return ONLY valid JSON:
{
  "decisions": [
    {"city": "${ranked[0].city}", "reason": "One sentence — the single strongest reason to choose this city over the other two."},
    {"city": "${ranked[1].city}", "reason": "One sentence — the single strongest reason to choose this city over the other two."},
    {"city": "${ranked[2].city}", "reason": "One sentence — the single strongest reason to choose this city over the other two."}
  ]
}`;
    } else {
      systemMsg = "You are a travel comparison analyst. Return ONLY valid JSON. Be specific and quantified — never vague.";
      prompt = `You are a travel comparison analyst producing a verdict comparing three cities for a specific traveller.

${travellerContext}

SCORING RULES YOU MUST FOLLOW:

1. PERSONAL MATCH: Score each city's Personal Match by examining the user's top 3 interests and assessing how distinctively each city delivers on each interest. Do not average to a similar score — look for genuine differences. For example: if the user's top interest is 'street food and markets', a city renowned for its food scene should score 2-3 points higher than a city where this is average. A score difference of at least 2 points must exist between the highest and lowest Personal Match scores across the three cities.

2. TRADE-OFF ACCURACY: Write trade-off explanations using the actual scores shown above. If two cities have identical scores on a dimension (within 0.5 points), describe them as 'similar' or 'equal'. Only use comparative language ('lower', 'higher', 'significantly weaker') when the score difference is at least 1.5 points. Reference the exact scores when making comparisons.

3. TRADE-OFF SPECIFICITY: The tradeOff line MUST include a specific, concrete detail — a temperature difference, a price difference, a frequency difference — not a vague qualitative statement. Bad: 'Lisbon's weather is not quite as warm as Seville's.' Good: 'Seville averages 3-4°C warmer in April — a meaningful difference for outdoor family exploration.' Always quantify where the data supports it.

4. WHY-NOT ACCURACY: When explaining why a city didn't win, reference the actual numeric score gaps. If city A scored 8.2 on weather and city B scored 7.8, say "scored similarly on weather (8.2 vs 7.8)" — do NOT say "significantly lower". Only call a gap "significant" when it's 1.5+ points.

Return ONLY valid JSON:
{
  "verdictParagraph": "2 sentences max explaining why city #1 wins for THIS traveller. Reference the travel month, top interests, and travel party. Do NOT mention any trade-off here.",
  "tradeOff": "One specific, honest, QUANTIFIED sentence about the top city's weakest dimension compared to another city. Include a concrete number (temperature, price, count). Name both the dimension and the competing city.",
  "runnerUpReason": "One sentence why #2 is the runner-up — what specific advantage does it have over #3? Reference actual score gaps.",
  "whyNot": [
    {"city": "${ranked[1].city}", "reason": "One specific sentence explaining the dimensional gap vs the winner. Reference actual scores. Only use 'lower/weaker' for gaps >= 1.5 points."},
    {"city": "${ranked[2].city}", "reason": "One specific sentence explaining the dimensional gap vs the winner. Reference actual scores. Only use 'lower/weaker' for gaps >= 1.5 points."}
  ]
}`;
    }

    const text = await callClaude(systemMsg, prompt, { model: SONNET, temperature: 0.4 });
    const verdict = extractJson(text);

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
