import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TravelProfile {
  interestScores: Record<string, number>;
  adventureLevel: number;
  adventureTypes: string[];
  departureCity: string;
  travelMonth: string;
  preferredRegions: string[];
  isFlexibleOnRegion: boolean;
  weatherPreference: number;
  tripDuration: number;
  travelPace: number;
  travelCompanions: string;
  groupType: string;
  styleTags: string[];
}

interface CityRecommendation {
  city: string;
  country: string;
  rationale: string;
  tags: string[];
  imageQuery: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = (await req.json()) as { profile: TravelProfile };
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating recommendations for profile:", JSON.stringify(profile, null, 2));

    const topInterests = Object.entries(profile.interestScores)
      .filter(([_, score]) => score > 0)
      .map(([interest]) => interest);

    const weatherDesc =
      profile.weatherPreference >= 0.75
        ? "tropical/hot"
        : profile.weatherPreference >= 0.5
          ? "warm"
          : profile.weatherPreference >= 0.25
            ? "mild/cool"
            : "cold";

    const regionConstraint =
      profile.isFlexibleOnRegion || profile.preferredRegions.length === 0
        ? "anywhere globally"
        : profile.preferredRegions.join(", ");

    const systemPrompt = `You are a travel recommendation expert. You recommend destination cities based on traveler preferences. 

IMPORTANT RULES:
- Recommend exactly 3 cities that best match the traveler's profile
- Each city must be from a DIFFERENT country unless the user specifically constrained to one region
- DO NOT consider budget, hotel prices, or flight prices in your selection
- Match cities based on: interests, adventure preferences, travel month + weather suitability, continent preference, and trip duration
- Ensure the three cities are meaningfully distinct in experience style
- For each city, provide a compelling one-sentence rationale (max 40 words)
- Include 3-5 relevant interest tags for each city

Respond with ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "city": "City Name",
      "country": "Country Name",
      "rationale": "One compelling sentence explaining why this city matches the traveler's preferences (max 40 words).",
      "tags": ["tag1", "tag2", "tag3"],
      "imageQuery": "descriptive search term for a beautiful photo of this city's most iconic view"
    }
  ]
}`;

    const userPrompt = `Find 3 destination cities for this traveler:

INTERESTS: ${topInterests.join(", ") || "varied interests"}
ADVENTURE TYPES: ${profile.adventureTypes.length > 0 ? profile.adventureTypes.join(", ") : "relaxed activities"}
ADVENTURE LEVEL: ${profile.adventureLevel > 0.5 ? "high" : profile.adventureLevel > 0.25 ? "moderate" : "low"}
TRAVEL MONTH: ${profile.travelMonth || "flexible"}
WEATHER PREFERENCE: ${weatherDesc}
PREFERRED REGIONS: ${regionConstraint}
TRIP DURATION: ${profile.tripDuration} days
TRAVEL PACE: ${profile.travelPace > 0.6 ? "active/packed" : profile.travelPace < 0.4 ? "relaxed/slow" : "balanced"}
TRAVEL COMPANIONS: ${profile.travelCompanions || "solo"}
STYLE TAGS: ${profile.styleTags.join(", ")}

Remember: Return exactly 3 cities from different countries, matched by interests and experience style, not budget.`;

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
    console.log("AI response received:", JSON.stringify(aiResponse, null, 2));

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as { recommendations: CityRecommendation[] };

    if (!parsed.recommendations || parsed.recommendations.length !== 3) {
      throw new Error("AI did not return exactly 3 recommendations");
    }

    console.log("Recommendations parsed successfully:", parsed.recommendations);

    return new Response(JSON.stringify({ recommendations: parsed.recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in recommend-destinations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
