import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getIconicLandmark } from "../_shared/landmarks.ts";

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
        const landmark = await getIconicLandmark(city, country) ?? `${city} landmark`;
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
