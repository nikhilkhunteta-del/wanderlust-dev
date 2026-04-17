import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callClaude, extractJson, HAIKU } from "../_shared/ai.ts";

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

    if (!city) {
      throw new Error("City is required");
    }

    const resolvedCountry = country || city;

    console.log(`Fetching travel advisory for ${city}, ${resolvedCountry}`);

    const prompt = `You are a travel safety analyst. Generate a travel advisory for ${city}, ${resolvedCountry} based on typical government travel advisories from UK FCDO, US State Department, and Government of Canada.

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
    {"name": "UK Foreign Office", "url": "https://www.gov.uk/foreign-travel-advice/${resolvedCountry.toLowerCase().replace(/ /g, '-')}"},
    {"name": "US State Department", "url": "https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html"},
    {"name": "Government of Canada", "url": "https://travel.gc.ca/destinations/${resolvedCountry.toLowerCase().replace(/ /g, '-')}"}
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

    const text = await callClaude("You are a travel safety data API. Return only valid JSON.", prompt, {
      model: HAIKU,
      temperature: 0.3,
    });
    const advisory = extractJson(text) as any;

    // Add last updated timestamp
    advisory.lastUpdated = new Date().toISOString().split("T")[0];

    console.log(`Generated advisory for ${city}, ${resolvedCountry}:`, advisory.level);

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
