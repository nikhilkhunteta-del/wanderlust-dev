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
- personalMatchReasons: Write exactly 3 bullet points. Each bullet must make a completely distinct point — no two bullets may cover the same theme or repeat the same interest. Each bullet must name a specific place, experience, or characteristic of the city that connects to the user's interest — not a general statement. Bad example: "You enjoy cultural heritage / Your interest in culture aligns with the city's history" — these are the same point twice. Good example: "Your love of **historical depth** finds its match in Delhi's 7 successive cities, each layered over the last — the oldest continuously inhabited capital in the world." Format each bullet with one **bold** key phrase followed by a specific, vivid sentence. Tone: confident, human, never salesy.
- perfectDayNarrative: A 3-4 sentence immersive narrative of a perfect day in this city for THIS traveler, flowing morning→afternoon→evening. Reflect their interests. No generic tourism language.
- featuredExperienceIndex: index (0-based) of the experience that best matches the user's top interests.
- experienceThemes: group the experiences by user-relevant themes with labels like "For your love of culture", "For authentic food experiences", etc.

Respond with ONLY valid JSON in this exact format:
{
  "matchStatement": "2-3 sentences explaining why this city fits the user's interests and travel timing. Reference at least two of their interests. Informative and inspiring tone.",
  "personalMatchReasons": ["Your love of **historical depth** finds its match in Delhi's 7 successive cities, each layered over the last", "The **street food universe** of Chandni Chowk alone — paratha, jalebi, chaat — maps perfectly to your culinary curiosity", "Your preference for **warm, golden-light evenings** aligns with the sunset views from Humayun's Tomb gardens in your travel month"],
  "perfectDayNarrative": "Start your morning exploring... end the day...",
  "experiences": [
    {
      "title": "Experience title",
      "description": "Two sentences. First: explain specifically why this experience is the single best match for this traveller's stated interests — name what it delivers that aligns with their profile. Second: give one specific insider detail that makes it unmissable — best time of day, what most visitors miss, a specific viewpoint or moment. Read like advice from someone who has been there, not a guidebook.",
      "imageQuery": "descriptive search term for a photo of this experience",
      "bookingUrl": null,
      "category": "culture|food|nature|adventure|photography|nightlife|wellness|shopping|scenic"
    }
  ],
  "featuredExperienceIndex": 0,
  "experienceThemes": [
    { "themeLabel": "For your love of culture", "experienceIndices": [0, 2] }
  ],
  "vibeTags": ["3-5 short tags specific enough to only make sense for THIS city — capture contrasts and textures that someone who has visited would nod at, e.g. 'Mughal grandeur meets bazaar chaos', 'auto-rickshaw roulette', 'spice-cloud alleyways'. NEVER use generic descriptors like 'cultural immersion', 'historical depth', 'relaxed pace'."],
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
2. Exactly 3 personalMatchReasons as bullet points. Each bullet must make a completely distinct point — no two bullets may share the same theme. Each must name a specific place, experience, or local characteristic of ${requestData.city} that connects to one of the traveler's interests. Format: one **bold** key phrase followed by a specific, vivid sentence.
3. A perfectDayNarrative (3-4 immersive sentences, morning→evening, reflecting their interests)
4. 5-7 signature experiences curated for their specific interests, each with a category tag. For the featured experience (the one at featuredExperienceIndex), write a two-sentence description: first sentence explains why it's the best match for this traveller's interests; second sentence gives a specific insider detail (best time of day, what most visitors miss, a viewpoint). For other experiences, one compelling sentence is fine.
5. featuredExperienceIndex: the index of the single best-matching experience
6. experienceThemes: group experiences into 2-4 themes labeled for the user (e.g. "For your love of culture")
7. 5 vibe tags specific enough to ONLY make sense for ${requestData.city}. Capture contrast where it genuinely exists. Avoid generic descriptors like 'cultural immersion', 'historical depth', 'relaxed pace' — these apply to dozens of cities. Each chip should make someone who has visited ${requestData.city} nod in recognition.
8. A hero image search query for the city`;

    console.log("Sending prompt to AI gateway...");

    // Try with primary model, fallback to stable model if needed
    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
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

    // Robust JSON extraction and repair from LLM output
    function extractJsonFromResponse(response: string): unknown {
      let cleaned = response
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

      const jsonStart = cleaned.search(/[\{\[]/);
      if (jsonStart === -1) throw new Error("No JSON object found in response");

      const opener = cleaned[jsonStart];
      const closer = opener === '[' ? ']' : '}';
      const jsonEnd = cleaned.lastIndexOf(closer);

      if (jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error("No JSON object found in response");
      }

      cleaned = cleaned.substring(jsonStart, jsonEnd + 1);

      // Fix common LLM JSON issues before first attempt
      cleaned = cleaned
        .replace(/,\s*([}\]])/g, "$1")       // trailing commas
        .replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\t' ? c : ""); // control chars

      try {
        return JSON.parse(cleaned);
      } catch (e) {
        console.warn("First JSON parse failed, attempting repair:", (e as Error).message);

        // Try to fix unescaped quotes inside string values
        cleaned = cleaned.replace(/:\s*"((?:[^"\\]|\\.)*)"/g, (_match, inner) => {
          const fixed = inner.replace(/(?<!\\)"/g, '\\"');
          return `: "${fixed}"`;
        });

        try {
          return JSON.parse(cleaned);
        } catch (_e2) {
          // Last resort: truncate to last valid closing brace/bracket
          const lastBrace = cleaned.lastIndexOf("}");
          if (lastBrace > 0) {
            // Count open vs close braces to repair truncation
            let repaired = cleaned.substring(0, lastBrace + 1);
            repaired = repaired.replace(/,\s*$/gm, "");
            const openBraces = (repaired.match(/{/g) || []).length;
            const closeBraces = (repaired.match(/}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/]/g) || []).length;
            repaired += "]".repeat(Math.max(0, openBrackets - closeBrackets));
            repaired += "}".repeat(Math.max(0, openBraces - closeBraces));
            try {
              const result = JSON.parse(repaired);
              console.warn("Recovered JSON via truncation repair");
              return result;
            } catch (_e3) {
              // fall through
            }
          }
          throw new Error(`Cannot parse AI JSON response: ${(e as Error).message}`);
        }
      }
    }

    const parsed = extractJsonFromResponse(content) as CityHighlights;

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
