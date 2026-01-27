import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth } = await req.json();

    console.log(`Generating weather data for ${city}, ${country} in ${travelMonth}`);

    const daysInMonth = getDaysInMonth(travelMonth);

    const prompt = `You are a climate data expert. Generate realistic weather data for ${city}, ${country} during ${travelMonth}.

Use historical climate averages and typical weather patterns for this location and time of year.

Return a JSON object with this exact structure:
{
  "verdict": "One honest sentence about whether ${travelMonth} is a good time to visit ${city}. Be informative, not promotional.",
  "stats": {
    "avgHighTemp": <number in Celsius>,
    "avgLowTemp": <number in Celsius>,
    "sunshineHours": <average daily sunshine hours>,
    "totalRainfall": <total mm for month>,
    "unit": "celsius"
  },
  "dailyData": [
    { "day": 1, "high": <temp>, "low": <temp>, "rainfall": <mm> },
    ... for all ${daysInMonth} days, with realistic day-to-day variation
  ],
  "weeklyData": [
    { "week": 1, "weekLabel": "Week 1 (1-7)", "avgHigh": <temp>, "avgLow": <temp>, "totalRainfall": <mm> },
    { "week": 2, "weekLabel": "Week 2 (8-14)", "avgHigh": <temp>, "avgLow": <temp>, "totalRainfall": <mm> },
    { "week": 3, "weekLabel": "Week 3 (15-21)", "avgHigh": <temp>, "avgLow": <temp>, "totalRainfall": <mm> },
    { "week": 4, "weekLabel": "Week 4 (22-${daysInMonth})", "avgHigh": <temp>, "avgLow": <temp>, "totalRainfall": <mm> }
  ],
  "insights": [
    { "type": "favorable|unfavorable|neutral", "text": "Short insight about a specific week" },
    ... 2-3 insights identifying best/worst weeks
  ],
  "bestTimeToVisit": "1-2 sentences about the best time within ${travelMonth} to visit",
  "packingTips": [
    { "icon": "sun|umbrella|jacket|sunglasses|layers|hat", "tip": "Concise packing suggestion" },
    ... 3 tips
  ]
}

Important:
- Use realistic climate data based on ${city}'s actual climate
- Daily temperatures should have natural variation (±2-4°C)
- Rainfall should reflect typical patterns for this region and season
- Be honest about weather conditions, don't oversell
- Weekly data should aggregate from daily data realistically`;

    const response = await fetch("https://api.ai.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a climate data expert. Return only valid JSON, no markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices[0].message.content;

    // Clean markdown formatting if present
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    console.log("Weather data generated successfully");

    const weatherData = JSON.parse(content);

    return new Response(JSON.stringify(weatherData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating weather data:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate weather data" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function getDaysInMonth(month: string): number {
  const monthDays: Record<string, number> = {
    January: 31,
    February: 28,
    March: 31,
    April: 30,
    May: 31,
    June: 30,
    July: 31,
    August: 31,
    September: 30,
    October: 31,
    November: 30,
    December: 31,
  };
  return monthDays[month] || 30;
}
