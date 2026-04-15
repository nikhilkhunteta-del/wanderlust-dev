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
  source: string;
}

interface CollageResponse {
  images: (CollageImage | null)[];
  fromCache: boolean;
  landmark?: string;
  landmarks?: string[];
}

// Use AI to identify the top 6 most iconic landmarks for a city
async function getIconicLandmarks(city: string, country: string): Promise<string[]> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    console.warn("No LOVABLE_API_KEY, falling back to generic queries");
    return [`${city} landmark`, `${city} monument`, `${city} cathedral`, `${city} museum`, `${city} palace`, `${city} park`];
  }

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
            content: "You are a travel expert. Reply with ONLY a numbered list of landmark names, one per line (e.g. '1. Eiffel Tower'). No explanations, no extra text.",
          },
          {
            role: "user",
            content: `List the top 6 most iconic, most-photographed landmarks, sights, or attractions in ${city}, ${country}. These should be specific named places a tourist would search for on Google. Return exactly 6, ranked by how iconic they are.`,
          },
        ],
      }),
    });

    if (!resp.ok) {
      console.error(`AI landmark lookup failed (${resp.status})`);
      return [`${city} landmark`];
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content?.trim();
    if (!raw) return [`${city} landmark`];

    // Parse numbered list: "1. Name" or "1) Name" or just lines
    const landmarks = raw
      .split("\n")
      .map((line: string) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((name: string) => name.length > 0 && name.length <= 80)
      .slice(0, 6);

    if (landmarks.length === 0) return [`${city} landmark`];

    console.log(`AI identified ${landmarks.length} landmarks for ${city}:`, landmarks);
    return landmarks;
  } catch (err) {
    console.error("AI landmark lookup error:", err);
    return [`${city} landmark`];
  }
}

// Build 3 search queries for the asymmetric collage
async function buildQueries(city: string, country: string, interests: string[]): Promise<{ queries: string[]; landmarks: string[] }> {
  const landmarks = await getIconicLandmarks(city, country);

  return {
    queries: [
      landmarks[0], // Hero image uses the #1 landmark
      `${city} street neighbourhood`,
      `${city} ${country} tourism`,
    ],
    landmarks,
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
    // Step 1: Text search for place photos
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

    if (!searchResp.ok) {
      console.error(`Google Places search failed (${searchResp.status}) for: ${query}`);
      return null;
    }

    const searchData = await searchResp.json();
    const photoName = searchData?.places?.[0]?.photos?.[0]?.name;
    if (!photoName) {
      console.log(`No Google Places photos for: ${query}`);
      return null;
    }

    // Step 2: Get media URI (skipHttpRedirect=true returns JSON with photoUri)
    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}&skipHttpRedirect=true`;
    const mediaResp = await fetch(mediaUrl);
    if (!mediaResp.ok) return null;

    const mediaData = await mediaResp.json();
    const photoUri = mediaData?.photoUri;
    if (!photoUri) return null;

    // Step 3: Download image bytes
    const imgResp = await fetch(photoUri);
    if (!imgResp.ok) return null;

    const contentType = imgResp.headers.get("content-type") || "image/jpeg";
    const imgBuffer = await imgResp.arrayBuffer();
    const ext = contentType.includes("png") ? "png" : "jpg";

    // Step 4: Upload to Supabase Storage for a permanent URL
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

    // Step 5: Also get a smaller version for thumbnails
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

    console.log(`Google Places image stored: ${permanentUrl}`);

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

    // Check cache first
    const cacheKey = `hero_collage:${city.toLowerCase()}:${(interests || []).sort().join("-")}`;

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
        await supabase
          .from("image_cache")
          .update({ hit_count: (cached.hit_count || 0) + 1 })
          .eq("id", cached.id);

        return new Response(
          JSON.stringify({ images: cachedImages, fromCache: true, landmark: cached.source_url || undefined } as CollageResponse),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        // Bad cache data, fetch fresh
      }
    }

    // Build queries and get landmark
    const { queries, landmark } = await buildQueries(city, country || city, interests || []);
    const images: (CollageImage | null)[] = [];

    // Fetch all 3 in parallel: Google Places primary, Unsplash fallback
    const results = await Promise.allSettled(
      queries.map(async (query): Promise<CollageImage | null> => {
        // Try Google Places first
        const gpImage = await fetchGooglePlacesImage(supabase, query);
        if (gpImage) return gpImage;

        // Fall back to Unsplash
        console.log(`Google Places failed for "${query}", falling back to Unsplash`);
        return await fetchUnsplashImage(query);
      })
    );

    for (const r of results) {
      images.push(r.status === "fulfilled" ? r.value : null);
    }

    // Fill any null slots by reusing a successfully fetched image
    const firstValid = images.find((img) => img !== null) || null;
    for (let i = 0; i < images.length; i++) {
      if (images[i] === null && firstValid) {
        images[i] = firstValid;
      }
    }

    // Determine primary source for cache metadata
    const primarySource = images[0]?.source || "google_places";

    // Cache the results (90 days)
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
        source: primarySource,
        source_url: landmark,
        photographer: images[0]?.photographer || null,
        photographer_url: images[0]?.photographerUrl || null,
        attribution_required: true,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
      },
      { onConflict: "cache_key" }
    );

    return new Response(
      JSON.stringify({ images, fromCache: false, landmark } as CollageResponse),
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
