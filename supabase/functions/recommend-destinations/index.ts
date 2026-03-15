import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TravelProfile {
  interestScores: Record<string, number>;
  primaryInterest?: string;
  adventureLevel: number;
  adventureTypes: string[];
  bucketListExperiences?: string[];
  culturalMoments?: string[];
  departureCity: string;
  travelMonth: string;
  tripDuration: number;
  travelCompanions: string;
  groupType: string;
  styleTags: string[];
  noveltyPreference?: string;
  foodDepth?: string;
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

    const noveltyMap: Record<string, string> = {
      'classics': 'wants classic, globally recognised destinations that are excellent for their interests',
      'mix': 'wants one well-known city, one moderately known, and one lesser-visited destination',
      'off-beaten-path': 'prefers lesser-known cities that reward curious travellers — avoid top 20 most visited cities globally',
      'surprise': 'open to any destination — recommend purely on interest and timing match, no constraints',
    };

    const noveltyDesc = noveltyMap[profile.noveltyPreference || ''] || 'open to any destination';

    const systemPrompt = `You are a travel recommendation expert. Recommend destination cities based on traveller preferences.

RULES:
- Recommend exactly 3 cities that best match the traveller's profile
- Each city must be from a DIFFERENT country
- DO NOT consider budget, hotel prices, or flight prices in your selection
- Match cities based on: interests, adventure preferences, travel month weather suitability, trip duration, and travel companions
- Ensure the three cities are meaningfully distinct in experience style
- For each city, provide a compelling rationale (max 40 words)
- Include 3-5 relevant interest tags per city

FLIGHT TIME FILTER (apply as a hard filter before any other signal matching):
Always consider departure city and trip duration together. Never recommend a city where the typical one-way flight time from the departure city exceeds 30% of the total trip duration. Specifically: for a weekend trip (3 days), maximum flight time is 2 hours. For a short break (5 days), maximum 4 hours. For one week, maximum 6 hours. For two weeks or longer, no flight time restriction.

BUCKET LIST EXPERIENCES:
If the user has selected specific bucket list experiences, these are trip-defining — prioritise cities where these experiences are genuinely world-class, not just available. A user selecting Northern Lights should get Iceland, Norway, or Finnish Lapland — not a city where it's theoretically possible on a good night. A user selecting Safari should get Kenya, Tanzania, or Botswana — not a zoo.

INTEREST MAPPING RULES:
- culture-history: cities with world-class museums, heritage sites, ancient ruins, and rich historical narratives
- nature-outdoors: cities with access to national parks, scenic landscapes, wildlife reserves, and outdoor activities
- beach-coastal: geography is primary — coastal cities, islands, or cities with significant beach access
- food-culinary: cities with vibrant food scenes — street food culture, fine dining, markets, cooking traditions
- arts-music-nightlife: cities with thriving arts scenes, live music venues, theatres, festivals, and nightlife districts
- active-sport: prioritise cities with renowned cycling infrastructure, hiking access, golf, skiing, or sport tourism — e.g. Copenhagen, Innsbruck, Queenstown, Porto
- shopping-markets: cities with famous markets, artisan crafts, boutique shopping districts
- wellness-slow-travel: prioritise cities with thermal bath culture, yoga retreat infrastructure, low stress navigation, and restorative quality — e.g. Budapest, Chiang Mai, Lisbon, Bath

TRAVEL COMPANIONS RULES:
- Family trips: prioritise cities with child-friendly infrastructure, manageable logistics, and safe environments
- Solo travellers: can handle complex, remote, or adventurous destinations
- Couples: weight towards cities with romantic character, walkability, and quality dining
- Groups/friends: prioritise cities with variety, nightlife options, and social experiences
- If travelCompanions is 'family' and the user has selected a cultural moment or bucket list experience that is inappropriate or impractical for children (e.g. Running of the Bulls, Burning Man, bungee jumping), include the destination but add an honest note in the rationale flagging the tension — do not silently omit the recommendation or the concern.

DISCOVERY STYLE RULES:
- classics: recommend globally recognised cities excellent for stated interests — no obscure choices
- mix: one well-known city, one moderately known, one genuinely lesser-visited
- off-beaten-path: actively avoid top 20 most visited cities globally — prioritise cities with authentic character that rewards curious travellers
- surprise: no constraints — recommend purely on best interest and timing match

CULTURAL MOMENT RULES:
If the user has selected cultural moments, treat these as the single strongest signal. Always recommend the specific city from the moment's city field, not just the country. The cultural moment city must be one of the three recommendations. The remaining two cities should match the user's broader interests independently — do not force them into the cultural moment theme. If the moment city conflicts with other interests, still recommend it but acknowledge the tension honestly in the rationale. If two cultural moments are selected in different countries, dedicate one recommendation to each, and use the third slot for interest matching. Cultural moment city always takes precedence over discovery style. If a selected cultural moment is in an obscure or off-the-beaten-path destination, recommend it regardless of the user's discovery style setting. Discovery style only applies to the slots not locked by cultural moments.

Respond with ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "city": "City Name",
      "country": "Country Name",
      "rationale": "One compelling sentence explaining why this city matches the traveller's preferences (max 40 words).",
      "tags": ["tag1", "tag2", "tag3"],
      "imageQuery": "descriptive search term for a beautiful photo of this city's most iconic view"
    }
  ]
}`;

    const primaryLine = profile.primaryInterest
      ? `\nPRIMARY INTEREST (treat this as 3x the weight of any secondary interest — if two cities are otherwise equal, this signal must break the tie): ${profile.primaryInterest}`
      : '';

    const bucketList = profile.bucketListExperiences && profile.bucketListExperiences.length > 0
      ? profile.bucketListExperiences.join(", ")
      : null;

    const culturalMomentsList = profile.culturalMoments && profile.culturalMoments.length > 0
      ? profile.culturalMoments.join(", ")
      : null;

    const userPrompt = `Find 3 destination cities for this traveller:

INTERESTS: ${topInterests.join(", ") || "varied interests"}${primaryLine}${bucketList ? `\nBUCKET LIST EXPERIENCES: ${bucketList} — these are trip-defining priorities. Select cities where these are world-class.` : ''}${culturalMomentsList ? `\nCULTURAL MOMENTS: ${culturalMomentsList} — the traveller wants to witness these specific events or festivals. Strongly prefer cities where these take place.` : ''}
FOOD PREFERENCE: ${profile.foodDepth ? profile.foodDepth.replace("-", " ") : "not specified"}
ADVENTURE TYPES: ${profile.adventureTypes.length > 0 ? profile.adventureTypes.join(", ") : "relaxed activities"}
ADVENTURE LEVEL: ${profile.adventureLevel > 0.5 ? "high" : profile.adventureLevel > 0.25 ? "moderate" : "low"}
TRAVEL MONTH: ${!profile.travelMonth || profile.travelMonth === "flexible" ? "The user is flexible on timing — prioritise destinations with year-round appeal or that are exceptional in their peak season. Include the ideal travel month in each city's rationale." : profile.travelMonth}
TRIP DURATION: ${profile.tripDuration} days
TRAVEL COMPANIONS: ${profile.travelCompanions || "solo"}
DISCOVERY STYLE: ${noveltyDesc}
STYLE TAGS: ${profile.styleTags.join(", ")}

IMPORTANT: For "off-beaten-path" or "surprise" discovery styles, prioritise cities with lower mainstream tourist footfall over world-famous hotspots.
Remember: Return exactly 3 cities from different countries, matched by interests, experience style, and discovery preference.`;

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
    console.log("AI response received:", JSON.stringify(aiResponse, null, 2));

    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content in AI response");
    }

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
