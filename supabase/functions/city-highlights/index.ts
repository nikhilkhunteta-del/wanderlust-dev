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
  category: string;
}

interface CityHighlights {
  matchStatement: string;
  experiences: SignatureExperience[];
  vibeTags: string[];
  heroImageQuery: string;
  personalMatchReasons: string[];
  perfectDayNarrative: string;
  featuredExperienceIndex: number;
  experienceThemes: { themeLabel: string; experienceIndices: number[] }[];
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
- personalMatchReasons: 3-4 concise bullet points explaining WHY this city matches THIS specific traveler. Reference their actual interests using **bold** for key phrases. Tone: confident, human, never salesy.
- perfectDayNarrative: A 3-4 sentence immersive narrative of a perfect day in this city for THIS traveler, flowing morning→afternoon→evening. Reflect their interests. No generic tourism language.
- featuredExperienceIndex: index (0-based) of the experience that best matches the user's top interests.
- experienceThemes: group the experiences by user-relevant themes with labels like "For your love of culture", "For authentic food experiences", etc.

Respond with ONLY valid JSON in this exact format:
{
  "matchStatement": "2-3 sentences explaining why this city fits the user's interests and travel timing. Reference at least two of their interests. Informative and inspiring tone.",
  "personalMatchReasons": ["You enjoy **cultural heritage** and authentic local food", "You prefer **warm, pleasant weather** during your travel month", "..."],
  "perfectDayNarrative": "Start your morning exploring... end the day...",
  "experiences": [
    {
      "title": "Experience title",
      "description": "One compelling sentence explaining why this experience is special and aligns with user interests",
      "imageQuery": "descriptive search term for a photo of this experience",
      "bookingUrl": null,
      "category": "culture|food|nature|adventure|photography|nightlife|wellness|shopping|scenic"
    }
  ],
  "featuredExperienceIndex": 0,
  "experienceThemes": [
    { "themeLabel": "For your love of culture", "experienceIndices": [0, 2] }
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
2. 3-4 personalMatchReasons as bullet points referencing their actual interests with **bold** emphasis on key phrases
3. A perfectDayNarrative (3-4 immersive sentences, morning→evening, reflecting their interests)
4. 5-7 signature experiences curated for their specific interests, each with a category tag
5. featuredExperienceIndex: the index of the single best-matching experience
6. experienceThemes: group experiences into 2-4 themes labeled for the user (e.g. "For your love of culture")
7. 3-5 vibe tags that capture the city's character relevant to this traveler
8. A hero image search query for the city`;

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
