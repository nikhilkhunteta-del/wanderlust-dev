import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CollageRequest {
  city: string;
  country: string;
  interests: string[]; // e.g. ["culture-history", "food-culinary"]
}

interface CollageImage {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  query: string;
}

interface CollageResponse {
  images: (CollageImage | null)[];
  fromCache: boolean;
}

// Map interest slugs to readable search terms
function interestToSearchTerm(interest: string): string {
  const map: Record<string, string> = {
    "culture-history": "culture history landmarks",
    "nature-outdoors": "nature landscape scenery",
    "beach-coastal": "beach coast ocean",
    "food-culinary": "food cuisine restaurant",
    "arts-music-nightlife": "nightlife music arts",
    "active-sport": "sports adventure outdoor activity",
    "shopping-markets": "market bazaar shopping street",
    "wellness-slow-travel": "wellness spa relaxation",
  };
  return map[interest] || interest.replace(/-/g, " ");
}

// Build 4 search queries from city + interests
function buildQueries(city: string, interests: string[]): string[] {
  const queries: string[] = [];

  // Use up to 4 interests, pad with defaults if fewer
  const defaults = ["cityscape skyline", "street life", "architecture", "landscape"];
  const tags = interests.slice(0, 4);
  while (tags.length < 4) {
    const fallback = defaults[tags.length];
    if (fallback) tags.push(fallback);
    else break;
  }

  for (const tag of tags) {
    const term = interestToSearchTerm(tag);
    queries.push(`${city} ${term}`);
  }

  return queries.slice(0, 4);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, country, interests } = (await req.json()) as CollageRequest;

    if (!city) {
      return new Response(JSON.stringify({ error: "city is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first — look for collage-type entries for this city
    const cacheKey = `hero_collage:${city.toLowerCase()}:${(interests || []).sort().join("-")}`;

    const { data: cached } = await supabase
      .from("image_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (cached) {
      // Parse the cached collage data from entity_name (we store JSON there)
      try {
        const cachedImages = JSON.parse(cached.entity_name || "[]");
        // Increment hit count
        await supabase
          .from("image_cache")
          .update({ hit_count: (cached.hit_count || 0) + 1 })
          .eq("id", cached.id);

        return new Response(
          JSON.stringify({ images: cachedImages, fromCache: true } as CollageResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Bad cache data, continue to fetch fresh
      }
    }

    // Fetch from Unsplash
    const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!unsplashKey) {
      return new Response(JSON.stringify({ error: "UNSPLASH_ACCESS_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const queries = buildQueries(city, interests || []);
    const images: (CollageImage | null)[] = [];

    // Fetch all 4 in parallel
    const results = await Promise.allSettled(
      queries.map(async (query) => {
        const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish&client_id=${unsplashKey}`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        const photo = data.results?.[0];
        if (!photo) return null;

        return {
          url: photo.urls?.regular || photo.urls?.small,
          smallUrl: photo.urls?.small || photo.urls?.thumb,
          photographer: photo.user?.name || "Unknown",
          photographerUrl: photo.user?.links?.html || "",
          query,
        } as CollageImage;
      })
    );

    for (const r of results) {
      images.push(r.status === "fulfilled" ? r.value : null);
    }

    // Cache the results
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await supabase.from("image_cache").upsert(
      {
        cache_key: cacheKey,
        image_type: "hero_collage",
        city: city.toLowerCase(),
        country: (country || city).toLowerCase(),
        entity_name: JSON.stringify(images),
        image_url: images[0]?.url || "",
        small_url: images[0]?.smallUrl || "",
        source: "unsplash",
        photographer: images[0]?.photographer || null,
        photographer_url: images[0]?.photographerUrl || null,
        attribution_required: true,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
      },
      { onConflict: "cache_key" }
    );

    return new Response(
      JSON.stringify({ images, fromCache: false } as CollageResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("hero-collage error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
