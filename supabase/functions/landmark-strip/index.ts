import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StripRequest {
  city: string;
  country: string;
  places: string[];
}

interface StripImage {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  placeName: string;
  source: string;
}

// ── Google Places ──────────────────────────────────────────
async function fetchGooglePlaces(
  supabase: any,
  place: string,
  city: string
): Promise<StripImage | null> {
  const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
  if (!apiKey) return null;

  const query = `${place} ${city}`;
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

    const mediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}&skipHttpRedirect=true`;
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
    const slug = place.toLowerCase().replace(/[^a-z0-9]+/g, "-").substring(0, 60);
    const storagePath = `google-places/strip-${slug}-800.${ext}`;

    await supabase.storage
      .from("travel-images")
      .upload(storagePath, imgBuffer, { contentType, upsert: true });

    const { data: pubData } = supabase.storage
      .from("travel-images")
      .getPublicUrl(storagePath);
    const permanentUrl = pubData?.publicUrl;
    if (!permanentUrl) return null;

    let smallUrl = permanentUrl;
    try {
      const smallMediaUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=400&key=${apiKey}&skipHttpRedirect=true`;
      const smallResp = await fetch(smallMediaUrl);
      if (smallResp.ok) {
        const smallData = await smallResp.json();
        if (smallData?.photoUri) {
          const sImgResp = await fetch(smallData.photoUri);
          if (sImgResp.ok) {
            const sBuf = await sImgResp.arrayBuffer();
            const sPath = `google-places/strip-${slug}-400.${ext}`;
            await supabase.storage.from("travel-images").upload(sPath, sBuf, { contentType, upsert: true });
            const { data: sPub } = supabase.storage.from("travel-images").getPublicUrl(sPath);
            if (sPub?.publicUrl) smallUrl = sPub.publicUrl;
          }
        }
      }
    } catch { /* ignore */ }

    return { url: permanentUrl, smallUrl, photographer: "Google", photographerUrl: "", placeName: place, source: "google_places" };
  } catch (err) {
    console.error(`Google Places strip error for "${place}":`, err);
    return null;
  }
}

// ── Pexels fallback ────────────────────────────────────────
async function fetchPexels(place: string, city: string): Promise<StripImage | null> {
  const key = Deno.env.get("PEXELS_API_KEY");
  if (!key) return null;

  try {
    const query = `${place} ${city}`;
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: key } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;

    return {
      url: photo.src?.large2x || photo.src?.large || photo.src?.original,
      smallUrl: photo.src?.medium || photo.src?.small,
      photographer: photo.photographer || "Unknown",
      photographerUrl: photo.photographer_url || "",
      placeName: place,
      source: "pexels",
    };
  } catch {
    return null;
  }
}

// ── Unsplash fallback ──────────────────────────────────────
async function fetchUnsplash(place: string, city: string): Promise<StripImage | null> {
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) return null;

  try {
    const query = `${place} ${city}`;
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape&client_id=${key}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    return {
      url: photo.urls?.regular || photo.urls?.small,
      smallUrl: photo.urls?.small || photo.urls?.thumb,
      photographer: photo.user?.name || "Unknown",
      photographerUrl: photo.user?.links?.html || "",
      placeName: place,
      source: "unsplash",
    };
  } catch {
    return null;
  }
}

// ── Main handler ───────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const city = body.city as string;
    const country = body.country as string;
    // Support both new 'places' and legacy 'landmarks' field
    const places: string[] = body.places || body.landmarks || [];

    if (!city || !places.length) {
      return new Response(JSON.stringify({ error: "city and places required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache
    const cacheKey = `landmark_strip:${city.toLowerCase()}:${places.map(l => l.toLowerCase()).join("|")}`;

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
          JSON.stringify({ images: cachedImages, fromCache: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch { /* bad cache, refetch */ }
    }

    // Fetch all places in parallel
    const results = await Promise.allSettled(
      places.slice(0, 6).map(async (place): Promise<StripImage | null> => {
        const gp = await fetchGooglePlaces(supabase, place, city);
        if (gp) return gp;

        console.log(`GP failed for "${place}", trying Pexels`);
        const px = await fetchPexels(place, city);
        if (px) return px;

        console.log(`Pexels failed for "${place}", trying Unsplash`);
        return await fetchUnsplash(place, city);
      })
    );

    const images: (StripImage | null)[] = results.map(r =>
      r.status === "fulfilled" ? r.value : null
    );

    // Cache results (90 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await supabase.from("image_cache").upsert(
      {
        cache_key: cacheKey,
        image_type: "landmark_strip",
        city: city.toLowerCase(),
        country: (country || city).toLowerCase(),
        entity_name: JSON.stringify(images),
        image_url: images[0]?.url || "",
        small_url: images[0]?.smallUrl || "",
        source: images[0]?.source || "google_places",
        source_url: JSON.stringify(places),
        attribution_required: true,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
      },
      { onConflict: "cache_key" }
    );

    return new Response(
      JSON.stringify({ images, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("landmark-strip error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
