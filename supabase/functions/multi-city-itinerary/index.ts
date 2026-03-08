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
      route,
      travelMonth,
      userInterests,
      adventureTypes,
      tripStyle,
      budgetLevel,
      diningPreference,
      includeFreeTime,
    } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Multi-city itinerary: ${route.stops.length} cities, ${route.totalDays} days`);

    const paceDescription: Record<string, string> = {
      relaxed: "1-2 activities per slot, late starts, plenty of downtime",
      balanced: "2-3 activities per slot, mix of activity and rest",
      "fast-paced": "3-4 activities per slot, early starts, maximize experiences",
    };

    const budgetDescription: Record<string, string> = {
      value: "budget-friendly, street food, free attractions, public transport",
      mid: "moderate spending, mix of free and paid, casual restaurants",
      premium: "high-end, fine dining, private tours, luxury options",
    };

    const diningDescription: Record<string, string> = {
      "local-street": "street food, local markets",
      casual: "casual restaurants, cafes",
      "fine-dining": "upscale restaurants, acclaimed venues",
      mixed: "variety from street food to nice restaurants",
    };

    // Build the city breakdown for the prompt
    const cityBreakdown = route.stops
      .map((stop: any, i: number) => {
        const leg = route.legs[i - 1];
        const travelNote = leg
          ? `\n  ARRIVING FROM: ${leg.from} by ${leg.transportMode} (~${leg.travelTime})`
          : "";
        return `CITY ${i + 1}: ${stop.city}, ${stop.country} — ${stop.days} days${travelNote}
  HIGHLIGHTS TO WEAVE IN: ${(stop.highlights || []).join(", ") || "local highlights"}`;
      })
      .join("\n\n");

    const systemPrompt = `You are an expert multi-city travel itinerary planner. You create seamless day-by-day plans that span multiple cities, including realistic travel days between them.

RULES:
- Create a continuous day-by-day itinerary numbered from Day 1 to Day ${route.totalDays}
- Each day MUST include a "cityName" field indicating which city the traveler is in
- Travel days between cities should have activities in BOTH the departure and arrival city
- On travel days, mark "isTravelDay": true and include the transit as a morning/afternoon activity
- Group activities by neighbourhood within each city
- Include specific venue names and approximate GPS coordinates
- Keep activity descriptions to ONE concise line
- Include dining recommendations matching preferences
- Weave in seasonal experiences for ${travelMonth}
- Estimate walking distance and transit time per day
- For each day, include an estimatedDailyBudget field — approximate spend per person covering entrance fees, meals at the specified dining preference, and local transport. Return as a number. Also include budgetCurrency (e.g. "₹", "£", "€") and budgetBreakdown with entranceFees, food, and transport as numbers. Clearly an estimate.
- For each activity, include a transitTo field: transport method and time to the next activity (e.g. "10 min walk", "20 min metro"). Return null for the last activity of each day or time period.
- For each activity, include a personalNote field — one sentence connecting this activity to the user's stated interests. Mandatory for every activity.
- For each activity, include a practicalNote field — closure day, booking tip, or best visit time for ${travelMonth}. Return null if not relevant.

Respond with ONLY valid JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "cityName": "City Name",
      "isTravelDay": false,
      "theme": "Short theme",
      "neighbourhood": "Primary area",
      "neighbourhoodVibe": "One-line area description",
      "estimatedWalkingKm": 5.5,
      "estimatedTransitMinutes": 20,
      "paceLabel": "leisurely|moderate|active",
      "estimatedDailyBudget": 45,
      "budgetCurrency": "₹",
      "budgetBreakdown": { "entranceFees": 15, "food": 20, "transport": 10 },
      "slots": [
        {
          "period": "morning",
          "activities": [
            {
              "time": "9:00 AM",
              "title": "Activity name",
              "description": "One-line description",
              "category": "culture|nature|food|adventure|relaxation|shopping|nightlife|transit",
              "location": "Specific venue or street",
              "lat": 41.3851,
              "lng": 2.1734,
              "seasonalNote": "Optional seasonal note or null",
              "personalNote": "One sentence connecting this activity to the user's interests",
              "practicalNote": "Closure day, booking tip, or best visit time — or null",
              "transitTo": "10 min walk or null"
            }
          ]
        },
        { "period": "afternoon", "activities": [...] },
        { "period": "evening", "activities": [...] }
      ]
    }
  ],
  "tips": ["3-5 practical tips covering multi-city logistics"],
  "cityTransitions": [
    {
      "fromCity": "City A",
      "toCity": "City B",
      "dayNumber": 4,
      "transportMode": "train",
      "travelTime": "2h 30min",
      "tip": "Practical tip about this journey segment"
    }
  ]
}`;

    const userPrompt = `Create a ${route.totalDays}-day multi-city itinerary for this route:

${cityBreakdown}

ROUTE LOGIC: ${route.routeRationale}

TRAVELER PREFERENCES:
- Interests: ${userInterests?.join(", ") || "varied"}
- Adventure activities: ${adventureTypes?.length > 0 ? adventureTypes.join(", ") : "light activities"}
- Travel month: ${travelMonth || "flexible"}
- Pace: ${tripStyle} (${paceDescription[tripStyle] || paceDescription.balanced})
- Budget: ${budgetLevel} (${budgetDescription[budgetLevel] || budgetDescription.mid})
- Dining: ${diningPreference} (${diningDescription[diningPreference] || diningDescription.mixed})
${includeFreeTime ? "- Include free time slots for spontaneous discovery" : ""}

Create a seamless ${route.totalDays}-day journey. Travel days should feel productive — include activities in both the departure and arrival city. Make each city segment feel like a distinct chapter of the trip with locally authentic experiences.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
    console.log("Multi-city itinerary generated:", parsed.days?.length, "days");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in multi-city-itinerary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
