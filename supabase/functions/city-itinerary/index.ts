import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ItinerarySettings {
  tripStyle: "relaxed" | "balanced" | "fast-paced";
  focusInterest: string;
  budgetLevel: "value" | "mid" | "premium";
  diningPreference: "local-street" | "casual" | "fine-dining" | "mixed";
  mustDoExperiences: string[];
  includeFreeTime: boolean;
}

interface ItineraryRequest {
  city: string;
  country: string;
  tripDuration: number;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  settings: ItinerarySettings;
  regenerateDay?: number;
  adjustment?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = (await req.json()) as ItineraryRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const isPerDayRegeneration = !!requestData.regenerateDay;
    console.log(
      isPerDayRegeneration
        ? `Regenerating day ${requestData.regenerateDay} with adjustment: ${requestData.adjustment}`
        : `Generating full itinerary for ${requestData.city}, ${requestData.tripDuration} days`
    );

    const { settings } = requestData;

    const paceDescription = {
      relaxed: "1-2 activities per time slot, plenty of leisure time, late starts",
      balanced: "2-3 activities per time slot, mix of activities and downtime",
      "fast-paced": "3-4 activities per time slot, early starts, maximize experiences",
    }[settings.tripStyle];

    const budgetDescription = {
      value: "budget-friendly options, street food, free attractions, public transport",
      mid: "moderate spending, mix of free and paid attractions, casual restaurants",
      premium: "high-end experiences, fine dining, private tours, luxury options",
    }[settings.budgetLevel];

    const diningDescription = {
      "local-street": "street food, local markets, hole-in-the-wall spots",
      casual: "casual restaurants, cafes, bistros",
      "fine-dining": "upscale restaurants, chef's tables, acclaimed venues",
      mixed: "variety of dining experiences from street food to nice restaurants",
    }[settings.diningPreference];

    const mustDoNote =
      settings.mustDoExperiences.length > 0
        ? `\nMUST INCLUDE these experiences: ${settings.mustDoExperiences.join(", ")}`
        : "";

    const focusNote = settings.focusInterest
      ? `\nEMPHASIZE activities related to: ${settings.focusInterest}`
      : "";

    const freeTimeNote = settings.includeFreeTime
      ? "\nInclude some 'Free time to explore' slots for spontaneous discovery"
      : "";

    // Per-day regeneration mode
    if (isPerDayRegeneration) {
      const singleDayPrompt = `You are a travel itinerary planner. Regenerate ONLY Day ${requestData.regenerateDay} of a ${requestData.tripDuration}-day trip in ${requestData.city}, ${requestData.country}.

ADJUSTMENT REQUESTED: ${requestData.adjustment || "Refresh the day with new activities"}

TRAVELER PREFERENCES:
- Interests: ${requestData.userInterests.join(", ") || "varied"}
- Travel month: ${requestData.travelMonth || "flexible"}
- Pace: ${settings.tripStyle} (${paceDescription})
- Budget: ${settings.budgetLevel} (${budgetDescription})
- Dining: ${settings.diningPreference} (${diningDescription})
${mustDoNote}${focusNote}${freeTimeNote}

MEAL RULES:
- Always include at least one lunch and one dinner as explicit time-slotted activities with category "food".
- Name a specific restaurant or food experience — never just "lunch" or "dinner".
- Meals should be in the same neighbourhood as surrounding activities to avoid unnecessary travel.
- Reflect the dining preference: ${diningDescription}.
${requestData.userInterests.includes("family") || requestData.adventureTypes.includes("family") ? "- Note if a restaurant is child-friendly." : ""}

TRANSITION RULES:
- For each activity, include a "transitTo" field: a short string describing travel to the NEXT activity. Format: "N min walk" or "N min by metro/auto-rickshaw/taxi". If this is the last activity of the day, set transitTo to null.
- If a transition exceeds 30 minutes, append " · consider [faster option] to save time".

BUDGET ESTIMATION:
- Estimate estimatedDailyBudget (single number), budgetBreakdown ({entranceFees, food, transport}), and budgetCurrency (symbol like £, $, ₹, €) for this day.

PRACTICAL NOTES:
- For each activity, include a "practicalNote" field if relevant: closing day, advance booking requirement, best time to visit, or access tip. Set to null if not applicable.

DAY TRIP STRUCTURE:
- If this is a day trip, structure the day around transport anchors: departure time and method, arrival, realistic on-site schedule, return departure, return arrival. Flag early departures in the first activity's practicalNote.

Respond with ONLY valid JSON for a single day:
{
  "dayNumber": ${requestData.regenerateDay},
  "theme": "Short theme",
  "neighbourhood": "Primary area/district name",
  "neighbourhoodVibe": "One-line character description of the area",
  "estimatedWalkingKm": 5.5,
  "estimatedTransitMinutes": 25,
  "paceLabel": "leisurely|moderate|active",
  "moodLine": "Three evocative words separated by ·",
  "estimatedDailyBudget": 45,
  "budgetBreakdown": {"entranceFees": 12, "food": 25, "transport": 8},
  "budgetCurrency": "£",
  "weatherRationale": null,
  "slots": [
    {
      "period": "morning",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "One-line description",
          "category": "culture|nature|food|adventure|relaxation|shopping|nightlife",
          "location": "Specific venue or street name",
          "lat": 41.3851,
          "lng": 2.1734,
          "personalNote": "One sentence connecting this activity to the traveler's interests",
          "practicalNote": "Closed Mondays" or null,
          "transitTo": "5 min walk"
        }
      ]
    },
    { "period": "afternoon", "activities": [...] },
    { "period": "evening", "activities": [...] }
  ]
}`;

      const singleDayModels = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
      let response: Response | null = null;
      for (const model of singleDayModels) {
        console.log("Trying model:", model);
        response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: singleDayPrompt }],
          }),
        });
        if (response.ok) break;
        const errorText = await response.text();
        console.error(`AI gateway error with ${model}:`, response.status, errorText);
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      if (!response || !response.ok) {
        throw new Error("AI gateway returned 500");
      }

      const aiResponse = await response.json();
      const content = aiResponse.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content in AI response");

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse JSON from AI response");

      const parsed = JSON.parse(jsonMatch[0]);
      console.log("Single day regenerated:", parsed.dayNumber);

      return new Response(JSON.stringify({ regeneratedDay: parsed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Full itinerary generation
    const currencySymbol = requestData.userInterests.includes("currency") ? "₹" : "£"; // Default; AI should infer from destination

    const systemPrompt = `You are a travel itinerary planner creating personalized day-by-day travel plans with spatial intelligence.

RULES:
- Create realistic, geographically sensible itineraries
- Group activities by neighborhood/area to minimize travel
- Include specific venue/location names and approximate GPS coordinates (lat, lng)
- Keep activity descriptions to ONE concise line
- Add practical travel tips
- If traveling in ${requestData.travelMonth}, weave in seasonal or time-specific experiences (festivals, seasonal foods, weather-dependent activities) and mark them with a seasonalNote
- Estimate walking distance and transit time per day realistically
- Suggest 3-5 day trips within ~2 hours of the city
- Suggest 2-3 activities for "if you had one more day"

DAY TRIP STRUCTURE:
- For any day designated as a day trip away from ${requestData.city}, always structure the day around fixed transport anchors:
  (1) Departure time and transport method from ${requestData.city} (e.g. "06:15 AM — Gatimaan Express from Hazrat Nizamuddin")
  (2) Approximate arrival time at the day trip destination
  (3) A realistic activity schedule that fits within the available on-site hours — never schedule more activities than the time allows
  (4) Latest feasible departure time for return journey
  (5) Approximate return arrival time back in ${requestData.city}
- If the day trip requires very early departure, flag it in the first activity's practicalNote: e.g. "Note: Gatimaan Express departs 08:10 from Hazrat Nizamuddin — plan to leave your hotel by 07:15."

PRACTICAL NOTES:
- For each activity, include a "practicalNote" field if relevant: closing day of the week, advance booking requirement, best time of day to visit given the travel month, or a specific access tip.
- If no practical note applies, set to null — do NOT generate a generic note.
- Examples: "Closed Mondays", "Book tickets online — queues are long in peak season", "Visit before 9am in May to avoid peak heat", "Last entry 30 mins before closing."

BUDGET ESTIMATION RULES:
- For each day, estimate the total daily spend per person: entrance fees at standard rates, one lunch and one dinner at the dining style specified (${diningDescription}), and local transport between activities.
- Return estimatedDailyBudget as a single number and budgetBreakdown as {entranceFees, food, transport} — all numbers.
- Use the local currency symbol appropriate for the destination (e.g. £ for UK, $ for USA, ₹ for India, € for Europe). Return this as budgetCurrency.
- Label clearly as an estimate. Do not include accommodation. If an activity is free, its entrance fee contribution is 0.

WEATHER-AWARE DAY ORDERING:
- If the travel month has significant intra-month weather variation for ${requestData.city} — e.g. early monsoon weeks are lighter than peak monsoon, or early summer is cooler than late summer — schedule outdoor-heavy days earlier in the trip and indoor/museum-heavy days later.
- For hot-weather destinations in summer months, schedule the most physically demanding days (most walking, most outdoor time) in the first half of the trip when the traveller is fresher.
- Add a weatherRationale field to each day: one sentence explaining why this day is positioned where it is in the trip sequence if weather influenced it. Set to null if weather was not a factor.

MEAL RULES:
- For every day, include at minimum one lunch and one dinner as explicit time-slotted activities with category "food".
- Breakfast is optional unless the day starts very early.
- Each meal must name a specific restaurant or food experience — never just "lunch" or "dinner".
- Meals should be in the same neighbourhood as surrounding activities.
- Reflect the dining preference: ${diningDescription}.
${requestData.userInterests.includes("family") || requestData.adventureTypes.includes("family") ? "- Note if a restaurant is child-friendly in the description." : ""}

TRANSITION RULES:
- For each activity, include a "transitTo" field describing approximate travel to the NEXT activity. Format: "N min walk" or "N min by metro/auto-rickshaw/taxi/bus". Set to null for the last activity of each period/day.
- If a transition exceeds 30 minutes, append " · consider [faster option] to save time".

Respond with ONLY valid JSON in this exact format:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Short theme for the day",
      "neighbourhood": "Primary neighbourhood or district",
      "neighbourhoodVibe": "One-line description of the area's character",
      "estimatedWalkingKm": 5.5,
      "estimatedTransitMinutes": 20,
      "paceLabel": "leisurely|moderate|active",
      "moodLine": "Three evocative words separated by · describing the day's feel",
      "estimatedDailyBudget": 45,
      "budgetBreakdown": {"entranceFees": 12, "food": 25, "transport": 8},
      "budgetCurrency": "£",
      "weatherRationale": "Outdoor walking day placed early when June heat is still manageable" or null,
      "slots": [
        {
          "period": "morning",
          "activities": [
            {
              "time": "9:00 AM",
              "title": "Activity name",
              "description": "One-line description",
              "category": "culture|nature|food|adventure|relaxation|shopping|nightlife",
              "location": "Specific venue or street name",
              "lat": 41.3851,
              "lng": 2.1734,
              "seasonalNote": "Only include if relevant to the travel month or null",
              "personalNote": "One sentence connecting this activity to the traveler's interests — do not repeat the description.",
              "practicalNote": "Closed Mondays" or null,
              "transitTo": "5 min walk"
            }
          ]
        },
        { "period": "afternoon", "activities": [...] },
        { "period": "evening", "activities": [...] }
      ]
    }
  ],
  "tips": ["3-5 practical tips"],
  "dayTrips": [
    {
      "destination": "Nearby destination name",
      "travelTime": "45 min by train",
      "description": "One-line reason to visit",
      "matchedInterests": ["culture", "nature"],
      "suggestedDayToReplace": 3
    }
  ],
  "extensionSuggestions": [
    {
      "title": "Theme for the extra day",
      "description": "What you'd do and why it's worth staying",
      "highlights": ["Specific place 1", "Specific place 2", "Specific place 3"]
    }
  ]
}`;

    const userPrompt = `Create a ${requestData.tripDuration}-day itinerary for ${requestData.city}, ${requestData.country}.

TRAVELER PREFERENCES:
- Interests: ${requestData.userInterests.join(", ") || "varied"}
- Adventure activities: ${requestData.adventureTypes.length > 0 ? requestData.adventureTypes.join(", ") : "light activities"}
- Travel month: ${requestData.travelMonth || "flexible"}

ITINERARY SETTINGS:
- Pace: ${settings.tripStyle} (${paceDescription})
- Budget: ${settings.budgetLevel} (${budgetDescription})
- Dining: ${settings.diningPreference} (${diningDescription})
${mustDoNote}${focusNote}${freeTimeNote}

Create a ${requestData.tripDuration}-day plan with Morning, Afternoon, and Evening for each day. Include specific meal recommendations as activities, transition times between activities, neighbourhood context, realistic pacing estimates, seasonal highlights for ${requestData.travelMonth}, day trip suggestions, and extension ideas. Make it locally authentic with real coordinates.`;

    console.log("Sending prompt to AI gateway...");

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
    let response: Response | null = null;
    for (const model of models) {
      console.log("Trying model:", model);
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      });
      if (response.ok) break;
      const errorText = await response.text();
      console.error(`AI gateway error with ${model}:`, response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    if (!response || !response.ok) {
      throw new Error("AI gateway returned 500");
    }

    const aiResponse = await response.json();
    console.log("AI response received");

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    console.log("Itinerary parsed successfully, days:", parsed.days?.length, "dayTrips:", parsed.dayTrips?.length);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in city-itinerary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
