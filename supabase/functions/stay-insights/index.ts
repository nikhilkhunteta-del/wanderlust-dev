import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StayInsightsRequest {
  city: string;
  country: string;
  travelMonth: string;
}

const MONTH_NAMES: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "any month",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = (await req.json()) as StayInsightsRequest;

    if (!city || !country) {
      return new Response(
        JSON.stringify({ error: "City and country are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating stay insights for ${city}, ${country} in ${travelMonth}`);

    const monthName = MONTH_NAMES[travelMonth?.toLowerCase()] || travelMonth || "your travel dates";

    const prompt = `You are a travel accommodation expert. Generate comprehensive stay insights for ${city}, ${country} during ${monthName}.

Provide a JSON response with this exact structure:
{
  "overview": "1-2 sentence description of the accommodation landscape in ${city}",
  "priceCategories": [
    {
      "category": "budget",
      "label": "Budget",
      "starRating": "2-3★",
      "lowPrice": <number in USD>,
      "highPrice": <number in USD>,
      "currency": "USD",
      "typicalInclusions": ["wifi", "breakfast", etc - 2-3 items]
    },
    {
      "category": "midRange",
      "label": "Mid-Range",
      "starRating": "3-4★",
      "lowPrice": <number>,
      "highPrice": <number>,
      "currency": "USD",
      "typicalInclusions": [2-3 items]
    },
    {
      "category": "premium",
      "label": "Premium",
      "starRating": "4-5★",
      "lowPrice": <number>,
      "highPrice": <number>,
      "currency": "USD",
      "typicalInclusions": [2-3 items]
    },
    {
      "category": "luxury",
      "label": "Luxury",
      "starRating": "5★+",
      "lowPrice": <number>,
      "highPrice": <number>,
      "currency": "USD",
      "typicalInclusions": [2-3 items]
    }
  ],
  "neighbourhoods": [
    {
      "name": "Neighbourhood name",
      "description": "1-2 line description of vibe and suitability",
      "bestFor": ["culture", "nightlife", "families", "beach", "budget", "luxury", "shopping", "quiet"] - pick 2-3 relevant tags,
      "imageQuery": "search query for unsplash image of this neighbourhood in ${city}"
    }
  ] - provide 3-5 neighbourhoods,
  "areaGuidance": {
    "centralVsOuter": "Brief guidance on central vs outer areas trade-offs",
    "priceVsConvenience": "Brief guidance on price vs convenience trade-offs",
    "noiseVsQuiet": "Brief guidance on lively vs peaceful area options"
  },
  "practicalInsights": [
    {
      "icon": "calendar" | "coins" | "users" | "building" | "info",
      "title": "Short insight title",
      "description": "Concise practical tip"
    }
  ] - provide 3-5 insights covering seasonality, taxes, apartment vs hotel, crowd levels
}

Important guidelines:
- Prices should reflect typical rates for ${monthName} (consider seasonality)
- Use USD for all prices
- Be specific to ${city}'s actual neighbourhoods and accommodation scene
- Neighbourhoods should be real, well-known areas
- Keep descriptions concise and informative
- Use neutral, factual language - no promotional content
- Practical insights should be genuinely useful for trip planning

Return ONLY valid JSON, no markdown or explanation.`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a travel accommodation expert. Respond only with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      throw new Error("Failed to generate stay insights");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    let insights;
    try {
      const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
      insights = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse stay insights");
    }

    // Build booking URL
    const monthMap: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04",
      may: "05", jun: "06", jul: "07", aug: "08",
      sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const monthNum = monthMap[travelMonth?.toLowerCase()] || "01";
    const year = new Date().getFullYear();
    const targetYear = new Date().getMonth() + 1 > parseInt(monthNum) ? year + 1 : year;
    const checkin = `${targetYear}-${monthNum}-15`;
    const checkout = `${targetYear}-${monthNum}-17`;
    const destination = encodeURIComponent(`${city}, ${country}`);
    const bookingUrl = `https://www.google.com/travel/hotels?q=${destination}&dates=${checkin}to${checkout}`;

    const result = {
      city,
      country,
      travelMonth: monthName,
      overview: insights.overview,
      priceCategories: insights.priceCategories,
      neighbourhoods: insights.neighbourhoods,
      areaGuidance: insights.areaGuidance,
      practicalInsights: insights.practicalInsights,
      bookingUrl,
      disclaimer: "Prices shown are indicative ranges based on historical patterns and may vary. Always verify current rates when booking.",
      lastUpdated: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    console.log(`Successfully generated stay insights for ${city}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in stay-insights function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate stay insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
