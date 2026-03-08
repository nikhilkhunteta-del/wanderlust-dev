import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReplaceRequest {
  city: string;
  country: string;
  travelMonth: string;
  userInterests: string[];
  currentActivity: {
    title: string;
    description: string;
    category: string;
    time: string;
    location?: string;
  };
  replacementMode: "similar" | "less-walking" | "family-friendly" | "custom";
  customPrompt?: string;
  dayTheme: string;
  period: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request = (await req.json()) as ReplaceRequest;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const modeInstructions = {
      similar: `Find an alternative with a similar vibe and category (${request.currentActivity.category}) but a completely different venue/place.`,
      "less-walking": "Find a nearby alternative that requires less physical effort — ideally indoors, seated, or very close to the same area.",
      "family-friendly": "Find a more family-friendly alternative suitable for children — interactive, safe, engaging for young ones.",
      custom: request.customPrompt || "Find a different alternative.",
    }[request.replacementMode];

    const prompt = `You are a travel activity planner for ${request.city}, ${request.country} in ${request.travelMonth}.

CURRENT ACTIVITY TO REPLACE:
- Title: ${request.currentActivity.title}
- Description: ${request.currentActivity.description}
- Time slot: ${request.currentActivity.time} (${request.period})
- Day theme: ${request.dayTheme}

REPLACEMENT INSTRUCTION: ${modeInstructions}

TRAVELER INTERESTS: ${request.userInterests.join(", ") || "varied"}

Return ONLY valid JSON for a single replacement activity:
{
  "time": "${request.currentActivity.time}",
  "title": "New activity name",
  "description": "One-line description",
  "category": "culture|nature|food|adventure|relaxation|shopping|nightlife",
  "location": "Specific venue or street name",
  "lat": 28.6,
  "lng": 77.2,
  "personalNote": "One sentence connecting this to the traveler's interests — like a friend explaining why they will love it",
  "practicalNote": "Closing day, booking tip, or best visit time — or null if not applicable"
}`;

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];
    let response: Response | null = null;

    for (const model of models) {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (response.ok) break;
      const errorText = await response.text();
      console.error(`AI error with ${model}:`, response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!response || !response.ok) throw new Error("AI gateway failed");

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("replace-activity error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
