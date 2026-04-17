import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callClaude, SONNET } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CollageRequest {
  city: string;
  country: string;
  interests: string[];
  primaryInterest?: string;
}

interface CollageImage {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  query: string;
  source: string;
}

interface CollageResponse {
  images: (CollageImage | null)[];
  fromCache: boolean;
  landmark?: string;
  landmarks?: string[];
  places?: string[];
}

const INTEREST_PLACE_FRAMING: Record<string, string> = {
  "nature-outdoors": "viewpoints, forests, fjords, natural areas, hiking spots, and scenic trails",
  "beach-coastal": "beaches, coastal coves, harbours, seafront promenades, and waterfront areas",
  "food-culinary": "markets, harbour dining areas, food streets, and culinary districts",
  "culture-history": "historic sites, monuments, old town areas, and heritage buildings",
  "active-sport": "adventure locations, mountain access points, sports terrain, and outdoor activity centres",
  "arts-music-nightlife": "creative districts, rooftop bars, gallery neighbourhoods, and live music venues",
  "shopping-markets": "market halls, artisan districts, bazaars, and shopping streets",
  "wellness-slow-travel": "parks, lakeside areas, quiet neighbourhoods, and peaceful gardens",
};

// Use AI to identify the single most iconic landmark for a city (hero image)
async function getIconicLandmark(city: string, country: string): Promise<string> {
  try {
    const raw = await callClaude(
      "You are a travel expert. Reply with ONLY the name of the landmark, nothing else. No numbering, no explanation.",
      `What is the single most iconic, most-photographed landmark or sight in ${city}, ${country}? Name one specific place.`,
      { model: SONNET },
    );
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 80) return `${city} landmark`;
    return trimmed.replace(/^\d+[\.\)]\s*/, "").trim();
  } catch {
    return `${city} landmark`;
  }
}

// Use AI to generate 6 visually compelling places relevant to the user's primary interest
async function getInterestPlaces(city: string, country: string, primaryInterest: string): Promise<string[]> {
  const framing = INTEREST_PLACE_FRAMING[primaryInterest] || INTEREST_PLACE_FRAMING["culture-history"];
  const fallback = [`${city} ${primaryInterest}`, `${city} scenic`, `${city} view`, `${city} neighbourhood`, `${city} waterfront`, `${city} park`];

  try {
    const raw = await callClaude(
      "You are a travel expert. Reply with ONLY a numbered list of place names, one per line (e.g. '1. Kašjuni Beach'). No explanations, no extra text.",
      `List exactly 6 specific, named places in or very near ${city}, ${country} that are visually compelling and relevant for someone interested in ${framing}. These should be real, searchable place names that would return good photos on Google — not generic descriptions. Prioritise places that are photogenic and lesser-known over the most famous tourist landmarks.`,
      { model: SONNET },
    );

    const places = raw
      .trim()
      .split("\n")
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((name: string) => name.length > 0 && name.length <= 80)
      .slice(0, 6);

    if (places.length === 0) return fallback;
    console.log(`AI identified ${places.length} interest places for ${city} (${primaryInterest}):`, places);
    return places;
  } catch (err) {
    console.error("AI interest places lookup error:", err);
    return fallback;
  }
}

// Build 3 search queries for the asymmetric collage
async function buildQueries(city: string, country: string, primaryInterest: string): Promise<{ queries: string[]; landmark: string; places: string[] }> {
  const [landmark, places] = await Promise.all([
    getIconicLandmark(city, country),
    getInterestPlaces(city, country, primaryInterest),
  ]);

  return {
    queries: [
      landmark,
      `${city} street neighbourhood`,
      `${city} ${country} tourism`,
    ],
    landmark,
    places,
  };
}

// Fetch a photo via Google Places API (New), store in Supabase Storage, return permanent URL
async function fetchGooglePlacesImage(
  supabase: any,
  query: string,
  maxWidthPx = 1200
): Promise<CollageImage | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) return null;

  try {
    const searchResp = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.photos",
        },
        body: JSON.stringify({ textQuery: query }),
      }
    );

    if (!searchResp.ok) return null;

    const searchData = await searchResp.json();
    const photoName = searchData?.places?.[0]?.photos?.[0]?.name;
    if (!photoName) return null;

    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}&skipHttpRedirect=true`;
    const mediaResp = await fetch(mediaUrl);
    if (!mediaResp.ok) return null;

    const mediaData = await mediaResp.json();
    const photoUri = mediaData?.photoUri;
    if (!photoUri) return null;

    const imgResp = await fetch(photoUri);
    if (!imgResp.ok) return null;

    const contentType = imgResp.headers.get("content-type") || "image/jpeg";
    const imgBuffer = await imgResp.arrayBuffer();
    const ext = contentType.includes("png") ? "png" : "jpg";

    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 80);
    const storagePath = `google-places/collage-${slug}-${maxWidthPx}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("travel-images")
      .upload(storagePath, imgBuffer, { contentType, upsert: true });

    if (uploadErr) {
      console.error("Storage upload error:", uploadErr);
      return null;
    }

    const { data: pubData } = supabase.storage.from("travel-images").getPublicUrl(storagePath);
    const permanentUrl = pubData?.publicUrl;
    if (!permanentUrl) return null;

    let smallUrl = permanentUrl;
    try {
      const smallMediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}&skipHttpRedirect=true`;
      const smallMediaResp = await fetch(smallMediaUrl);
      if (smallMediaResp.ok) {
        const smallMediaData = await smallMediaResp.json();
        if (smallMediaData?.photoUri) {
          const smallImgResp = await fetch(smallMediaData.photoUri);
          if (smallImgResp.ok) {
            const smallBuf = await smallImgResp.arrayBuffer();
            const smallPath = `google-places/collage-${slug}-400.${ext}`;
            await supabase.storage.from("travel-images").upload(smallPath, smallBuf, { contentType, upsert: true });
            const { data: smallPub } = supabase.storage.from("travel-images").getPublicUrl(smallPath);
            if (smallPub?.publicUrl) smallUrl = smallPub.publicUrl;
          }
        }
      }
    } catch {
      // Small version failed, use full size
    }

    return {
      url: permanentUrl,
      smallUrl,
      photographer: "Google",
      photographerUrl: "",
      query,
      source: "google_places",
    };
  } catch (err) {
    console.error(`Google Places error for "${query}":`, err);
    return null;
  }
}

// Unsplash fallback for a single query
async function fetchUnsplashImage(query: string): Promise<CollageImage | null> {
  const unsplashKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!unsplashKey) return null;

  try {
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
      source: "unsplash",
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, country, interests, primaryInterest } = (await req.json()) as CollageRequest;

    if (!city) {
      return new Response(JSON.stringify({ error: "city is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const effectiveInterest = primaryInterest || (interests || [])[0] || "culture-history";

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const cacheKey = `hero_collage:${city.toLowerCase()}:${effectiveInterest}`;

    const { data: cached } = await supabase
      .from("image_cache")
      .select("*")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (cached) {
      try {
        const cachedImages = JSON.parse(cached.entity_name || "[]");
        let cachedMeta: { landmarks?: string[]; places?: string[] } = {};
        try {
          cachedMeta = JSON.parse(cached.source_url || "{}");
        } catch {
          // Legacy format
          if (cached.source_url) cachedMeta = { landmarks: [cached.source_url] };
        }

        await supabase
          .from("image_cache")
          .update({ hit_count: (cached.hit_count || 0) + 1 })
          .eq("id", cached.id);

        const cachedLandmarks = cachedMeta.landmarks || [];
        const cachedPlaces = cachedMeta.places || [];

        return new Response(
          JSON.stringify({
            images: cachedImages,
            fromCache: true,
            landmark: cachedLandmarks[0] || undefined,
            landmarks: cachedLandmarks,
            places: cachedPlaces,
          } as CollageResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Bad cache data, fetch fresh
      }
    }

    // Build queries and get landmark + places
    const { queries, landmark, places } = await buildQueries(city, country || city, effectiveInterest);
    const images: (CollageImage | null)[] = [];

    // Fetch all 3 in parallel
    const results = await Promise.allSettled(
      queries.map(async (query): Promise<CollageImage | null> => {
        const gpImage = await fetchGooglePlacesImage(supabase, query);
        if (gpImage) return gpImage;
        console.log(`Google Places failed for "${query}", falling back to Unsplash`);
        return await fetchUnsplashImage(query);
      })
    );

    for (const r of results) {
      images.push(r.status === "fulfilled" ? r.value : null);
    }

    // Fill any null slots
    const firstValid = images.find((img) => img !== null) || null;
    for (let i = 0; i < images.length; i++) {
      if (images[i] === null && firstValid) {
        images[i] = firstValid;
      }
    }

    const primarySource = images[0]?.source || "google_places";

    // Cache (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    const landmarks = [landmark];

    await supabase.from("image_cache").upsert(
      {
        cache_key: cacheKey,
        image_type: "hero_collage",
        city: city.toLowerCase(),
        country: (country || city).toLowerCase(),
        entity_name: JSON.stringify(images),
        image_url: images[0]?.url || "",
        small_url: images[0]?.smallUrl || "",
        source: primarySource,
        source_url: JSON.stringify({ landmarks, places }),
        photographer: images[0]?.photographer || null,
        photographer_url: images[0]?.photographerUrl || null,
        attribution_required: true,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
      },
      { onConflict: "cache_key" }
    );

    return new Response(
      JSON.stringify({ images, fromCache: false, landmark, landmarks, places } as CollageResponse),
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
