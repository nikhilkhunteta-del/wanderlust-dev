import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CityHighlightsRequest {
  city: string;
  country: string;
  rationale: string;
  userInterests: string[];
  adventureTypes: string[];
  travelMonth: string;
  styleTags: string[];
}

interface SignatureExperience {
  title: string;
  description: string;
  imageQuery: string;
  bookingUrl: string | null;
}

interface CityHighlights {
  matchStatement: string;
  experiences: SignatureExperience[];
  vibeTags: string[];
  heroImageQuery: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = (await req.json()) as CityHighlightsRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating highlights for:", requestData.city, requestData.country);

    const systemPrompt = `You are a travel content curator creating personalized city highlights for travelers. 

Your task is to create emotionally resonant, curated content that helps travelers connect with a destination based on their specific interests.

RULES:
- Be specific and authentic, not generic or promotional
- Reference the user's actual interests in the match statement
- Curate experiences that genuinely align with stated preferences
- Avoid clichés and tourist trap recommendations
- Keep descriptions concise and evocative

Respond with ONLY valid JSON in this exact format:
{
  "matchStatement": "2-3 sentences explaining why this city fits the user's interests and travel timing. Reference at least two of their interests. Informative and inspiring tone.",
  "experiences": [
    {
      "title": "Experience title",
      "description": "One compelling sentence explaining why this experience is special and aligns with user interests",
      "imageQuery": "descriptive search term for a photo of this experience",
      "bookingUrl": "https://www.getyourguide.com/... or null if not applicable"
    }
  ],
  "vibeTags": ["3-5 short tags like 'walkable', 'sunset viewpoints', 'street food'"],
  "heroImageQuery": "descriptive search term for the city's most iconic scenic view"
}`;

    const userPrompt = `Create personalized highlights for a traveler visiting ${requestData.city}, ${requestData.country}.

TRAVELER PROFILE:
- Interests: ${requestData.userInterests.join(", ") || "varied interests"}
- Adventure preferences: ${requestData.adventureTypes.length > 0 ? requestData.adventureTypes.join(", ") : "relaxed activities"}
- Travel month: ${requestData.travelMonth || "flexible"}
- Travel style: ${requestData.styleTags.join(", ")}

WHY WE RECOMMENDED THIS CITY:
${requestData.rationale}

Generate:
1. A match statement (2-3 sentences) explaining why ${requestData.city} fits their interests
2. 3-5 signature experiences curated for their specific interests (not generic tourist lists)
3. 3-5 vibe tags that capture the city's character relevant to this traveler
4. A hero image search query for the city`;

    console.log("Sending prompt to AI gateway...");

    // Try with primary model, fallback to stable model if needed
    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let content: string | null = null;
    let lastError: string | null = null;

    for (const model of models) {
      console.log(`Trying model: ${model}`);
      
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

        lastError = `AI gateway returned ${response.status}`;
        continue;
      }

      const aiResponse = await response.json();
      console.log(`AI response received from ${model}`);

      content = aiResponse.choices?.[0]?.message?.content;
      if (content) {
        break;
      } else {
        console.warn(`No content from ${model}, trying next model...`);
        lastError = "No content in AI response";
      }
    }

    if (!content) {
      throw new Error(lastError || "No content in AI response after trying all models");
    }

    // Parse the JSON from the AI response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not parse JSON from AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as CityHighlights;

    console.log("Highlights parsed successfully");

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in city-highlights:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
