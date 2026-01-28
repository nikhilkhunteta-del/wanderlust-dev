import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country } = await req.json();

    if (!city || !country) {
      throw new Error("City and country are required");
    }

    console.log(`Fetching travel advisory for ${city}, ${country}`);

    const prompt = `You are a travel safety analyst. Generate a travel advisory for ${city}, ${country} based on typical government travel advisories from UK FCDO, US State Department, and Government of Canada.

Return a JSON object with this exact structure:
{
  "level": "normal" | "increased_caution" | "reconsider_travel" | "avoid_travel",
  "levelLabel": "Human readable label for the level",
  "summary": "One sentence overall advisory summary",
  "safetyPoints": ["3-5 key safety bullet points"],
  "areasToAvoid": ["Specific areas to avoid if any, empty array if none"],
  "emergencyNumbers": {
    "police": "Emergency police number",
    "ambulance": "Emergency ambulance number", 
    "fire": "Emergency fire number",
    "tourist": "Tourist police/helpline if available, or null"
  },
  "sources": [
    {"name": "UK Foreign Office", "url": "https://www.gov.uk/foreign-travel-advice/${country.toLowerCase().replace(/ /g, '-')}"},
    {"name": "US State Department", "url": "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html"},
    {"name": "Government of Canada", "url": "https://travel.gc.ca/destinations/${country.toLowerCase().replace(/ /g, '-')}"}
  ],
  "advisoriesVary": boolean indicating if sources typically differ for this destination
}

Guidelines:
- Use accurate emergency numbers for the country
- Be factual and neutral, no alarmist language
- Safety points should cover: petty crime, scams, health, transport, natural hazards as relevant
- Only include areas to avoid if there are genuine security concerns
- For most tourist destinations, level should be "normal" or "increased_caution"
- advisoriesVary should be true if different governments typically have different assessments

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a travel safety data API. Return only valid JSON.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response
    const cleanedContent = content.replace(/```json\n?|\n?```/g, "").trim();
    const advisory = JSON.parse(cleanedContent);

    // Add last updated timestamp
    advisory.lastUpdated = new Date().toISOString().split("T")[0];

    console.log(`Generated advisory for ${city}, ${country}:`, advisory.level);

    return new Response(JSON.stringify(advisory), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in travel-advisory function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
