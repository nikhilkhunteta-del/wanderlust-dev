import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      originCity,
      originCountry,
      totalDays,
      travelMonth,
      userInterests,
      adventureTypes,
      tripStyle,
      budgetLevel,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Multi-city route: ${originCity}, ${originCountry}, ${totalDays} days`);

    const prompt = `You are a regional travel route planner. Given a primary destination city, suggest a multi-city journey that includes the original city plus 1-3 nearby cities forming a logical travel route.

PRIMARY DESTINATION: ${originCity}, ${originCountry}
TOTAL TRIP DAYS: ${totalDays}
TRAVEL MONTH: ${travelMonth}
TRAVELER INTERESTS: ${userInterests.join(", ") || "varied"}
ADVENTURE TYPES: ${adventureTypes.join(", ") || "light"}
PACE: ${tripStyle}
BUDGET: ${budgetLevel}

RULES:
- Always include ${originCity} as the first stop with the most days allocated
- Add 1-3 nearby cities reachable within ~3 hours by train, bus, flight, or ferry
- Create a geographically logical route — no backtracking
- Allocate days proportionally (primary city gets at least 40% of days)
- Each additional city needs minimum 2 days
- Include approximate GPS coordinates for each city center
- Suggest the best transport mode between cities
- Consider cultural and thematic variety between stops
- Match cities to traveler interests when possible

Respond with ONLY valid JSON:
{
  "route": {
    "stops": [
      {
        "city": "City Name",
        "country": "Country",
        "days": 4,
        "highlights": ["Top sight 1", "Top sight 2", "Top sight 3"],
        "lat": 41.39,
        "lng": 2.17
      }
    ],
    "legs": [
      {
        "from": "City A",
        "to": "City B",
        "travelTime": "2h 30min",
        "transportMode": "train",
        "distanceKm": 180
      }
    ],
    "totalDays": ${totalDays},
    "routeRationale": "One sentence explaining why this route works for this traveler"
  }
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON from AI response");

    const parsed = JSON.parse(jsonMatch[0]);
    console.log("Multi-city route generated:", parsed.route?.stops?.length, "stops");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in multi-city-route:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
