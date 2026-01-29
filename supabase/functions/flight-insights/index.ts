import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildGoogleFlightsUrl(
  departureCity: string,
  destinationCity: string,
  travelMonth: string
): string {
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
    flexible: "01",
  };
  
  const monthNum = monthMap[travelMonth.toLowerCase()] || "01";
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const targetYear = currentMonth > parseInt(monthNum) ? year + 1 : year;
  
  const departDate = `${targetYear}-${monthNum}-15`;
  const returnDate = `${targetYear}-${monthNum}-22`;
  
  const origin = encodeURIComponent(departureCity);
  const destination = encodeURIComponent(destinationCity);
  
  return `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departDate}%20through%20${returnDate}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { departureCity, destinationCity, destinationCountry, travelMonth } = await req.json();

    if (!departureCity || !destinationCity || !destinationCountry) {
      throw new Error("Departure city, destination city, and country are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating flight insights: ${departureCity} → ${destinationCity}, ${destinationCountry} in ${travelMonth}`);

    const monthNames: Record<string, string> = {
      jan: "January", feb: "February", mar: "March", apr: "April",
      may: "May", jun: "June", jul: "July", aug: "August",
      sep: "September", oct: "October", nov: "November", dec: "December",
      flexible: "flexible dates",
    };
    const monthDisplay = monthNames[travelMonth?.toLowerCase()] || travelMonth || "flexible dates";

    const prompt = `You are a flight travel analyst providing indicative pricing insights for a travel planning app.

Generate flight route insights for:
- Origin: ${departureCity}
- Destination: ${destinationCity}, ${destinationCountry}
- Travel month: ${monthDisplay}

IMPORTANT GUIDELINES:
- Provide INDICATIVE pricing based on historical patterns and seasonal trends
- Use cautious language: "typically", "often", "usually", "generally"
- Never guarantee prices or claim "cheapest" fares
- Base estimates on publicly observable flight market patterns
- Consider seasonality, demand patterns, and route characteristics

Return a JSON object with this exact structure:
{
  "originCity": "${departureCity}",
  "originAirports": [
    {
      "code": "Airport IATA code",
      "name": "Full airport name",
      "isMain": true/false,
      "notes": "Brief note about this airport (optional)"
    }
  ],
  "destinationCity": "${destinationCity}",
  "destinationCountry": "${destinationCountry}",
  "destinationAirports": [
    {
      "code": "Airport IATA code",
      "name": "Full airport name",
      "isMain": true/false,
      "notes": "Brief note if relevant (optional)"
    }
  ],
  "travelMonth": "${monthDisplay}",
  "priceSnapshot": {
    "typicalPrice": number (round-trip economy in USD),
    "lowPrice": number (low end of typical range),
    "highPrice": number (high end of typical range),
    "trend": "lower" | "typical" | "higher" (compared to annual average for this route),
    "trendExplanation": "Brief explanation of why prices tend to be this way in ${monthDisplay}",
    "currency": "USD"
  },
  "timingInsight": {
    "title": "Brief timing observation title",
    "description": "1-2 sentences about price variation within the month (early vs late, holiday effects, etc.)"
  } or null if no significant variation,
  "airportComparisons": [
    {
      "airport": "Airport code",
      "priceNote": "Brief note on typical pricing",
      "convenienceNote": "Brief note on city access"
    }
  ] (only if destination has multiple relevant airports, otherwise empty array),
  "smartInsights": [
    {
      "icon": "plane" | "clock" | "calendar" | "map" | "lightbulb",
      "title": "Short insight title",
      "description": "1-2 sentence practical insight"
    }
  ] (3-4 route-specific insights about: direct vs connection flights, common layover regions, flight duration, flexibility tips),
  "disclaimer": "A brief standard disclaimer about indicative pricing",
  "lastUpdated": "Today's date in YYYY-MM-DD format"
}

Guidelines for pricing estimates:
- Short-haul (<3 hours): typically $150-600 range
- Medium-haul (3-7 hours): typically $400-1200 range  
- Long-haul (7+ hours): typically $600-2500 range
- Adjust based on route popularity, competition, and seasonality
- Peak seasons (holidays, summer for popular destinations): trend "higher"
- Shoulder seasons: trend "lower" or "typical"

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a flight pricing analyst API. Return only valid JSON. Provide realistic, indicative pricing based on market patterns. Never guarantee prices or use promotional language.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
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
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway returned ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const flightData = JSON.parse(jsonMatch[0]);
    
    // Add Google Flights URL
    flightData.googleFlightsUrl = buildGoogleFlightsUrl(departureCity, destinationCity, travelMonth);

    console.log(`Flight insights generated for ${departureCity} → ${destinationCity}`);

    return new Response(JSON.stringify(flightData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in flight-insights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
