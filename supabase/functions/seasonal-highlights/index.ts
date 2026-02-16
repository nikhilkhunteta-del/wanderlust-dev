import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SeasonalHighlightsRequest {
  city: string;
  country: string;
  travelMonth: string;
}

const MONTH_NAMES: Record<string, string> = {
  jan: "January",
  feb: "February",
  mar: "March",
  apr: "April",
  may: "May",
  jun: "June",
  jul: "July",
  aug: "August",
  sep: "September",
  oct: "October",
  nov: "November",
  dec: "December",
  flexible: "any time of year",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = (await req.json()) as SeasonalHighlightsRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const monthName = MONTH_NAMES[requestData.travelMonth] || requestData.travelMonth;
    console.log("Generating seasonal highlights for:", requestData.city, "in", monthName);

    const systemPrompt = `You are a travel content expert specializing in seasonal events, festivals, and unique experiences around the world.

Your task is to identify 4-6 special experiences a traveler might catch during a specific month in a city. These MUST be time-sensitive — things that are special BECAUSE of the month, not generic year-round attractions.

Each experience must be categorized into one of three sections:
- "festivals_cultural": Festivals, cultural celebrations, religious events, music events, local traditions
- "food_traditions": Seasonal food, harvest festivals, seasonal markets, culinary traditions
- "weather_driven": Natural phenomena, weather-dependent activities, seasonal landscapes, outdoor experiences best this month

Each experience must include an urgency level:
- "only_this_month": Happens exclusively during this month
- "best_this_month": Available other times but peaks or is best now
- "short_window": Brief seasonal window that includes this month
- null: Year-round but has seasonal character

Each experience must include a "whySeasonal" field: one sentence explaining WHY this is special during this specific month (not a generic description).

RULES:
- Be specific to the city or region, not generic
- Events must occur or peak during the specified month
- Do NOT include generic tourist attractions — only time-sensitive experiences
- Aim for at least one item per section
- Provide accurate timing labels (e.g., 'early April', 'mid December')
- Include Wikipedia URLs when they exist, otherwise leave null

Respond with ONLY valid JSON in this exact format:
{
  "openingStatement": "One engaging sentence about what travelers visiting in [month] might experience",
  "monthSummary": "A concise editorial sentence: '[Month] is one of the best times to visit [City] for [2-3 unique seasonal advantages].'",
  "highlights": [
    {
      "title": "Event or experience name",
      "timing": "Specific timing (e.g., 'Early February', 'Mid-month', 'Whole month')",
      "category": "cultural|natural|food|religious|music|other",
      "section": "festivals_cultural|food_traditions|weather_driven",
      "description": "1-2 sentences explaining what this is",
      "whySeasonal": "One sentence: why THIS month makes it special",
      "urgency": "only_this_month|best_this_month|short_window|null",
      "imageQuery": "descriptive search term for a representative photo",
      "wikipediaUrl": "https://en.wikipedia.org/wiki/... or null",
      "officialUrl": "Official event website or null",
      "googleSearchUrl": "https://www.google.com/search?q=..."
    }
  ]
}`;

    const userPrompt = `Find 4-6 seasonal highlights for travelers visiting ${requestData.city}, ${requestData.country} during ${monthName}.

Focus on time-sensitive experiences:
1. Festivals, celebrations, or cultural events happening in ${monthName}
2. Seasonal food, markets, or culinary traditions specific to ${monthName}
3. Weather-driven experiences that are best or only possible in ${monthName}

Every item must answer: "Why is this special DURING ${monthName}?"

Do NOT include generic year-round attractions. Each highlight must have clear seasonal relevance.`;

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
    console.log("Seasonal highlights parsed, count:", parsed.highlights?.length);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in seasonal-highlights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
