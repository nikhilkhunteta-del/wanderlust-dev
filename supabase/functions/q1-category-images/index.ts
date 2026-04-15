import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATEGORIES = [
  "culture-history",
  "nature-outdoors",
  "beach-coastal",
  "food-culinary",
  "arts-music-nightlife",
  "active-sport",
  "shopping-markets",
  "wellness-slow-travel",
];

const STORAGE_BUCKET = "travel-images";
const STORAGE_PREFIX = "q1-categories";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: Record<string, string | null> = {};

    for (const category of CATEGORIES) {
      const storagePath = `${STORAGE_PREFIX}/${category}.jpg`;
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${storagePath}`;

      const headResp = await fetch(publicUrl, { method: "HEAD" });
      if (headResp.ok) {
        results[category] = publicUrl;
      } else {
        results[category] = null;
      }
    }

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
