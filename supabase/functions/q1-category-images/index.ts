import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORY_PROMPTS: Record<string, string> = {
  "culture-history":
    "ancient_ruins_temple_golden_hour_atmospheric_travel_photography",
  "nature-outdoors":
    "misty_rainforest_mountains_wildlife_landscape_atmospheric",
  "beach-coastal": "turquoise_ocean_beach_aerial_tropical_coastline",
  "food-culinary":
    "night_market_street_food_steam_woks_crowd_atmospheric",
  "arts-music-nightlife":
    "outdoor_concert_crowd_stage_lights_music_festival_night",
  "active-sport": "paraglider_mountain_peaks_aerial_adventure_sport",
  "shopping-markets":
    "colourful_souk_market_vibrant_atmospheric_travel",
  "wellness-slow-travel":
    "infinity_pool_mountain_view_spa_retreat_serene_morning",
};

const STORAGE_BUCKET = "travel-images";
const STORAGE_PREFIX = "q1-categories";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const pollinationsKey = Deno.env.get("POLLINATIONS_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check which images already exist in storage
    const results: Record<string, string> = {};
    const toGenerate: string[] = [];

    for (const [category] of Object.entries(CATEGORY_PROMPTS)) {
      const storagePath = `${STORAGE_PREFIX}/${category}.jpg`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;

      // Try a HEAD request to see if file exists
      const headResp = await fetch(publicUrl, { method: "HEAD" });
      if (headResp.ok) {
        results[category] = publicUrl;
        console.log(`Already exists: ${category}`);
      } else {
        toGenerate.push(category);
      }
    }

    if (toGenerate.length === 0) {
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pollinationsKey) {
      console.error("POLLINATIONS_API_KEY not set");
      return new Response(JSON.stringify(results), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate missing images in parallel
    const fetchPromises = toGenerate.map(async (category) => {
      const prompt = CATEGORY_PROMPTS[category];
      const url = `https://gen.pollinations.ai/image/${prompt}?width=600&height=400&seed=42&model=flux&key=${pollinationsKey}`;

      console.log(`Fetching ${category} from Pollinations...`);

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000);
        const resp = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);

        if (!resp.ok) {
          console.error(`Pollinations error for ${category}: ${resp.status}`);
          return;
        }

        const contentType = resp.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) {
          console.error(`Non-image response for ${category}: ${contentType}`);
          return;
        }

        const imageBytes = new Uint8Array(await resp.arrayBuffer());
        const storagePath = `${STORAGE_PREFIX}/${category}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(storagePath, imageBytes, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error(`Upload error for ${category}:`, uploadError);
          return;
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;
        results[category] = publicUrl;
        console.log(`Stored ${category}: ${publicUrl}`);
      } catch (err) {
        console.error(`Failed for ${category}:`, err);
      }
    });

    await Promise.all(fetchPromises);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
