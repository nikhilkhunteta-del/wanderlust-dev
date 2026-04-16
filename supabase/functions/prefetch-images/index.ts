import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PrefetchRequest {
  cities: Array<{
    city: string;
    country: string;
  }>;
  userInterests?: string[];
}

// Ask the AI to identify the single most iconic landmark for a city.
// Mirrors the approach used by the hero-collage edge function so prefetch
// queries hit Google Places with a real, searchable place name.
async function getIconicLandmark(city: string, country: string): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return `${city} landmark`;

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content:
              "You are a travel expert. Reply with ONLY the name of the landmark, nothing else. No numbering, no explanation.",
          },
          {
            role: "user",
            content: `What is the single most iconic, most-photographed landmark or sight in ${city}, ${country}? Name one specific place.`,
          },
        ],
      }),
    });

    if (!resp.ok) return `${city} landmark`;
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw || raw.length > 80) return `${city} landmark`;
    return raw.replace(/^\d+[\.\)]\s*/, "").trim();
  } catch {
    return `${city} landmark`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const request: PrefetchRequest = await req.json();

    if (!request.cities?.length) {
      return new Response(
        JSON.stringify({ error: "cities array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Prefetching 1 city_hero for ${request.cities.length} cities`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let cached = 0;
    let errors = 0;

    for (const cityInfo of request.cities) {
      const { city, country } = cityInfo;

      try {
        const landmark = await getIconicLandmark(city, country);
        console.log(`[${city}] iconic landmark: "${landmark}"`);

        const response = await supabase.functions.invoke("resolve-image", {
          body: {
            type: "city_hero",
            city,
            country,
            entityName: landmark,
          },
        });

        if (response.data?.image) {
          cached++;
        } else {
          errors++;
          if (response.data?.error) {
            console.error(`[${city}] resolve-image error:`, response.data.error);
          }
        }
      } catch (e) {
        console.error(`[${city}] prefetch error:`, e);
        errors++;
      }

      // Small delay between cities to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(`Prefetch complete: ${cached} cached, ${errors} errors`);

    return new Response(
      JSON.stringify({
        cached,
        errors,
        message: `Prefetched ${cached}/${request.cities.length} city heroes (${errors} errors)`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in prefetch-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to prefetch images" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
