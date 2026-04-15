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
  culturalMomentDetails?: { value: string; label: string; city: string; country: string }[];
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
  estimatedFlightHours: number;
  bestMonths?: string;
}

function extractRecommendations(content: string): CityRecommendation[] | null {
  let parsed: { recommendations: CityRecommendation[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    let cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const jsonStart = cleaned.indexOf("{");
    const jsonEnd = cleaned.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No JSON found in AI response");
      return null;
    }

    cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, "");

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse cleaned JSON");
      return null;
    }
  }

  if (parsed.recommendations && parsed.recommendations.length === 3) {
    return parsed.recommendations;
  }
  console.warn(`Got ${parsed.recommendations?.length ?? 0} recommendations instead of 3`);
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, excludedCities, previouslyRecommendedCities } = (await req.json()) as { profile: TravelProfile; excludedCities?: string[]; previouslyRecommendedCities?: string[] };
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
      'surprise': 'match interests with full accuracy but ignore city familiarity entirely — recommend anywhere in the world regardless of how well-known or obscure the destination is',
    };

    const noveltyDesc = noveltyMap[profile.noveltyPreference || ''] || 'open to any destination';

    const systemPrompt = `You are a travel recommendation expert. Recommend destination cities based on traveller preferences.

RULES:
- Recommend exactly 3 cities that best match the traveller's profile
- Each city must be from a DIFFERENT country
- DO NOT consider budget, hotel prices, or flight prices in your selection
- Match cities based on: interests, adventure preferences, travel month weather suitability, trip duration, and travel companions
- Ensure the three cities are meaningfully distinct in experience style
- Write each city rationale in exactly 2 sentences. Sentence 1 must explain the primary match, beginning with a direct reference to the user's stated interests or selected cultural moment. Sentence 2 must add one specific, vivid, concrete detail that makes this city feel real and unmissable. Write both sentences before outputting — do not start outputting until both sentences are complete and you have verified the total is exactly 2. If you find yourself writing a third sentence, stop, delete it, and output only the first 2.
- Include 3-5 relevant interest tags per city

FLIGHT TIME FILTER (apply as a hard filter before any other signal matching):
Always consider departure city and trip duration together. Never recommend a city where the typical one-way flight time from the departure city exceeds 30% of the total trip duration. Specifically: for a weekend trip (3 days), maximum flight time is 2 hours. For a short break (5 days), maximum 4 hours. For one week, maximum 6 hours. For two weeks or longer, no flight time restriction. If the flight time constraint eliminates all strong matches for the user's interests, recommend the closest viable city that best matches and note the constraint honestly in the rationale.

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

ADVENTURE INTENSITY RULES:
- If adventure intensity is high, prioritise cities known as adventure capitals — Queenstown, Moab, Interlaken, Medellín.
- If adventure intensity is low, prioritise cities where the experiences are available but the city itself is gentle and accessible.

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
- surprise: match interests with full accuracy but ignore city familiarity entirely — recommend anywhere in the world regardless of how well-known or obscure the destination is

CULTURAL MOMENT RULES:
If the user has selected cultural moments, treat these as the single strongest signal. Always recommend the specific city from the moment's city field, not just the country. The cultural moment city must be one of the three recommendations. The remaining two cities should match the user's broader interests independently — do not force them into the cultural moment theme. If the moment city conflicts with other interests, still recommend it but acknowledge the tension honestly in the rationale. If two cultural moments are selected in different countries, dedicate one recommendation to each, and use the third slot for interest matching. If the user has selected two cultural moments that are both in the same country, do not use two recommendation slots for that country. Instead, recommend that country once and mention both cities within that single recommendation. Use the freed slot for a second country matched to the user's broader interests. Cultural moment city always takes precedence over discovery style. If a selected cultural moment is in an obscure or off-the-beaten-path destination, recommend it regardless of the user's discovery style setting. Discovery style only applies to the slots not locked by cultural moments.

CULTURAL MOMENT COMPENSATION RULE:
When one or more slots are locked by cultural moments that conflict with the user's other interests, the remaining unlocked city slots must over-deliver on those unmet signals. For example: if the locked city is landlocked but the user wants beaches, ensure at least one of the remaining cities is a beach destination. Do not spread the compromise across all three cities — compensate fully in the free slots.

RESPONSE PROCESS:
Process your response in two internal steps: first, select the 3 cities based purely on signal matching without considering how easy they are to write about. Second, write the rationale for each. Do not let the ease of writing a compelling rationale influence which city you select.

CRITICAL: You MUST return exactly 3 recommendations in the JSON array. Not 1, not 2 — exactly 3. If you return fewer than 3, the request will fail.

Respond with ONLY valid JSON in this exact format:
{
  "recommendations": [
    {
      "city": "City Name",
      "country": "Country Name",
      "rationale": "One compelling sentence explaining why this city matches the traveller's preferences (max 40 words).",
      "tags": ["tag1", "tag2", "tag3"],
      "imageQuery": "descriptive search term for a beautiful photo of this city's most iconic view",
      "estimatedFlightHours": 3.5,
      "bestMonths": "Mar–May"
    }
  ]
}

ESTIMATED FLIGHT HOURS: For each city, estimate the typical one-way flight duration in hours (as a decimal, e.g. 3.5 for 3h 30m) from the user's departure city. Include layover time for indirect routes. Use your knowledge of typical commercial flight routes.

BEST MONTHS: If the user's travel month is "flexible", the "bestMonths" field is required for every city — return the 2 to 3 ideal months given the user's specific interests and the city's seasonal strengths (e.g. "Mar–May", "Sep–Nov", "Jun–Aug"). Use abbreviated month names with an en-dash. For non-flexible travel months, bestMonths is optional.`;

    const primaryLine = profile.primaryInterest
      ? `\nPRIMARY INTEREST (If primaryInterest is set, at least 2 of the 3 recommended cities must be standout destinations for that specific interest — not merely adequate. A city that only touches on the primary interest does not qualify.): ${profile.primaryInterest}`
      : '';

    const bucketList = profile.bucketListExperiences && profile.bucketListExperiences.length > 0
      ? profile.bucketListExperiences.join(", ")
      : null;

    const culturalMomentsList = profile.culturalMomentDetails && profile.culturalMomentDetails.length > 0
      ? profile.culturalMomentDetails
          .map(m => `${m.label} → lock city: ${m.city}, ${m.country}`)
          .join('; ')
      : profile.culturalMoments && profile.culturalMoments.length > 0
        ? profile.culturalMoments.join(", ")
        : null;

    const excludedLine = excludedCities && excludedCities.length > 0
      ? `\nEXCLUDED CITIES: ${excludedCities.map(c => `User has already visited ${c} — exclude it`).join('. ')}. Do NOT recommend any of these cities.`
      : '';

    const previousCitiesLine = previouslyRecommendedCities && previouslyRecommendedCities.length > 0
      ? `\nPREVIOUSLY RECOMMENDED: The user has previously been recommended ${previouslyRecommendedCities.join(', ')}. Prioritise recommending cities they have not seen before while still matching their interests. Only re-recommend a previously seen city if it is genuinely the best match and no comparable alternative exists.`
      : '';

    const userPrompt = `Find 3 destination cities for this traveller:

INTERESTS: ${topInterests.join(", ") || "varied interests"}${primaryLine}${bucketList ? `\nBUCKET LIST EXPERIENCES: ${bucketList} — these are trip-defining priorities. Select cities where these are world-class.` : ''}${culturalMomentsList ? `\nCULTURAL MOMENTS WITH LOCKED CITIES: ${culturalMomentsList} — the traveller wants to witness these specific events or festivals. You MUST recommend the locked city for each moment as one of the three recommendations.` : ''}
FOOD PREFERENCE: ${profile.foodDepth ? profile.foodDepth.replace("-", " ") : "not specified"}
ADVENTURE INTENSITY: ${(() => {
  const high = ['skydiving', 'bungee jumping', 'volcano trekking', 'river rafting', 'surfing', 'paragliding'];
  const low = ['scenic train', 'UNESCO sites', 'cycling tours', 'hot air balloon'];
  const types = profile.adventureTypes || [];
  const highCount = types.filter(t => high.some(h => t.toLowerCase().includes(h))).length;
  const lowCount = types.filter(t => low.some(l => t.toLowerCase().includes(l))).length;
  const intensity = highCount >= 2 ? 'high' : highCount >= 1 && highCount > lowCount ? 'medium' : 'low';
  return `${intensity} based on selected experiences: ${types.length > 0 ? types.join(', ') : 'none'}`;
})()}
TRAVEL MONTH: ${!profile.travelMonth || profile.travelMonth === "flexible" ? "The user is flexible on timing — prioritise destinations with year-round appeal or that are exceptional in their peak season. Include the ideal travel month in each city's rationale." : profile.travelMonth}
TRIP DURATION: ${profile.tripDuration} days
TRAVEL COMPANIONS: ${profile.travelCompanions || "solo"}
DISCOVERY STYLE: ${noveltyDesc}
STYLE TAGS (inferred travel personality traits e.g. "cultural-explorer", "thrill-seeker", "slow-traveller", "foodie", "beach-lover" — use to fine-tune city vibe matching): ${profile.styleTags.length > 0 ? profile.styleTags.join(", ") : "none inferred"}

IMPORTANT: For "off-beaten-path" or "surprise" discovery styles, prioritise cities with lower mainstream tourist footfall over world-famous hotspots.
Remember: Return EXACTLY 3 cities from different countries, matched by interests, experience style, and discovery preference. The response MUST contain exactly 3 objects in the recommendations array.${excludedLine}${previousCitiesLine}`;

    console.log("Sending prompt to AI gateway...");

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
    const MAX_ATTEMPTS = 3;
    let recommendations: CityRecommendation[] | null = null;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      for (const model of models) {
        console.log(`Attempt ${attempt + 1}, trying model: ${model}`);
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            response_format: { type: "json_object" },
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
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
          continue;
        }

        const aiResponse = await response.json();
        console.log("AI response received from", model);

        const content = aiResponse.choices?.[0]?.message?.content;
        if (!content) {
          console.error(`Attempt ${attempt + 1}/${model}: No content in AI response`);
          continue;
        }

        recommendations = extractRecommendations(content);
        if (recommendations) break;
      }

      if (recommendations) break;
      console.warn(`Attempt ${attempt + 1} failed to produce 3 recommendations, retrying...`);
    }

    if (!recommendations) {
      throw new Error("Failed to generate exactly 3 recommendations after multiple attempts. Please try again.");
    }

    console.log("Recommendations parsed successfully:", recommendations);

    return new Response(JSON.stringify({ recommendations }), {
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
