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

Your task is to identify 2-4 special experiences a traveler might catch during a specific month in a city. These can include:
- Festivals and cultural celebrations
- Religious events and holidays
- Natural phenomena (cherry blossoms, northern lights, migrations, etc.)
- Seasonal food and harvest festivals
- Music festivals and cultural events
- City traditions and local celebrations

RULES:
- Be specific to the city or region, not generic
- Events must occur or peak during the specified month
- If no major seasonal events exist for that month, select distinctive year-round experiences and label them 'year-round'
- Provide accurate timing labels (e.g., 'early April', 'mid December', 'year-round')
- Include Wikipedia URLs when they exist, otherwise leave null
- Generate proper Google search URLs for each event

Respond with ONLY valid JSON in this exact format:
{
  "openingStatement": "One engaging sentence about what travelers visiting in [month] might experience",
  "highlights": [
    {
      "title": "Event or experience name",
      "timing": "Specific timing (e.g., 'late March', 'first week of July', 'year-round')",
      "category": "cultural|natural|food|religious|music|other",
      "description": "1-2 sentences explaining what this is and why it's special",
      "imageQuery": "descriptive search term for a representative photo",
      "wikipediaUrl": "https://en.wikipedia.org/wiki/... or null if no page exists",
      "officialUrl": "Official event website or null",
      "googleSearchUrl": "https://www.google.com/search?q=..."
    }
  ]
}`;

    const userPrompt = `Find 2-4 seasonal highlights for travelers visiting ${requestData.city}, ${requestData.country} during ${monthName}.

Include festivals, cultural events, natural phenomena, seasonal foods, or traditions that:
1. Are specific to ${requestData.city} or its region
2. Occur or are best experienced in ${monthName}
3. Would enhance a traveler's experience

If there are no major events in ${monthName}, include distinctive year-round experiences that are quintessential to ${requestData.city}.

For each highlight, provide accurate timing, a compelling description, and working links.`;

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
