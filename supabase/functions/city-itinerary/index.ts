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

    console.log("Generating itinerary for:", requestData.city, "Duration:", requestData.tripDuration, "days");

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

    const systemPrompt = `You are a travel itinerary planner creating personalized day-by-day travel plans.

RULES:
- Create realistic, geographically sensible itineraries
- Group activities by neighborhood/area to minimize travel
- Include specific venue/location names when possible
- Keep activity descriptions to ONE concise line
- Include dining recommendations matching the preference
- Add practical travel tips

Respond with ONLY valid JSON in this exact format:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Short theme for the day (e.g., 'Historic Old Town')",
      "slots": [
        {
          "period": "morning",
          "activities": [
            {
              "time": "9:00 AM",
              "title": "Activity name",
              "description": "One-line description of what to do/see",
              "category": "culture|nature|food|adventure|relaxation|shopping|nightlife"
            }
          ]
        },
        {
          "period": "afternoon",
          "activities": [...]
        },
        {
          "period": "evening",
          "activities": [...]
        }
      ]
    }
  ],
  "tips": ["3-5 practical tips for this itinerary"]
}`;

    const mustDoNote = settings.mustDoExperiences.length > 0
      ? `\nMUST INCLUDE these experiences: ${settings.mustDoExperiences.join(", ")}`
      : "";

    const focusNote = settings.focusInterest
      ? `\nEMPHASIZE activities related to: ${settings.focusInterest}`
      : "";

    const freeTimeNote = settings.includeFreeTime
      ? "\nInclude some 'Free time to explore' slots for spontaneous discovery"
      : "";

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

Create a ${requestData.tripDuration}-day plan with Morning, Afternoon, and Evening sections for each day. Make it realistic and locally authentic.`;

    console.log("Sending prompt to AI gateway...");

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

      throw new Error(`AI gateway returned ${response.status}`);
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

    console.log("Itinerary parsed successfully, days:", parsed.days?.length);

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
