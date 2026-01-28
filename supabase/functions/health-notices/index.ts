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
    const { city, country, travelMonth } = await req.json();

    if (!city || !country) {
      throw new Error("City and country are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Fetching health notices for ${city}, ${country} in ${travelMonth}`);

    const prompt = `You are a travel health information analyst. Generate health travel information for ${city}, ${country} for travelers visiting in ${travelMonth || "any month"}.

Use information typically available from official sources like WHO, CDC, and NaTHNaC/TravelHealthPro.

Return a JSON object with this exact structure:
{
  "hasActiveAlerts": boolean,
  "alertSummary": "One-line summary if active alerts exist, otherwise empty string",
  "currentNotices": [
    {
      "title": "Notice title",
      "source": "WHO/CDC/NaTHNaC",
      "summary": "One-line summary",
      "url": "Official source URL"
    }
  ],
  "vaccines": [
    {
      "vaccine": "Vaccine name",
      "recommendation": "Brief recommendation (e.g., Recommended, Required, Consider)"
    }
  ],
  "preventionGuidance": ["General prevention tip 1", "Prevention tip 2"],
  "waterSafety": {
    "level": "safe" | "caution" | "not_recommended",
    "description": "Brief explanation"
  },
  "foodSafetyTips": ["Food safety tip 1", "Food safety tip 2", "Food safety tip 3"],
  "medicalFacilities": {
    "standard": "high" | "moderate" | "limited",
    "pharmacyAvailability": "Brief note on pharmacy access",
    "emergencyNumber": "Emergency medical number for the country"
  },
  "packingList": ["Health item 1", "Health item 2", "Health item 3", "Health item 4", "Health item 5"],
  "travelInsuranceNote": "Brief recommendation about travel medical insurance",
  "contextualInsights": [
    {
      "type": "air_quality" | "altitude" | "heat" | "mosquito" | "other",
      "title": "Insight title",
      "description": "Brief description"
    }
  ]
}

Guidelines:
- currentNotices: Include up to 3 notices. Use real official source URLs. If no current alerts, use empty array.
- vaccines: List typical vaccine recommendations for travelers to this region (e.g., Hepatitis A, Typhoid, etc.)
- preventionGuidance: 2-3 general health prevention tips
- waterSafety level: "safe" for developed countries with treated water, "caution" for mixed quality, "not_recommended" for areas where bottled water is advised
- foodSafetyTips: 2-3 concise tips
- medicalFacilities standard: "high" for developed countries, "moderate" for mixed, "limited" for remote/developing areas
- packingList: 5-7 health-related travel items
- contextualInsights: Include ONLY if relevant to ${city} or ${travelMonth}:
  - air_quality: If seasonal pollution, wildfire smoke, or dust storms are known issues
  - altitude: If city is above 2500m elevation
  - heat: If travel month has extreme heat risk
  - mosquito: If vector-borne diseases are seasonal concerns
  - Use empty array if none apply

Be factual and neutral. No alarmist language. No personalized medical advice.

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a travel health data API. Return only valid JSON.",
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
    const healthData = JSON.parse(cleanedContent);

    // Add last updated timestamp
    healthData.lastUpdated = new Date().toISOString().split("T")[0];

    console.log(`Generated health notices for ${city}, ${country}:`, healthData.hasActiveAlerts);

    return new Response(JSON.stringify(healthData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in health-notices function:", error);
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
