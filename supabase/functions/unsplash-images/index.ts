import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    html: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, count = 1, orientation = "landscape" } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
    if (!UNSPLASH_ACCESS_KEY) {
      console.error("UNSPLASH_ACCESS_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Unsplash API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching Unsplash images for: "${query}" (count: ${count})`);

    const params = new URLSearchParams({
      query,
      per_page: String(Math.min(count, 30)),
      orientation,
    });

    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Unsplash API error:", response.status, errorText);
      throw new Error(`Unsplash API returned ${response.status}`);
    }

    const data = await response.json();
    const photos: UnsplashPhoto[] = data.results || [];

    // Transform to our simplified format
    const images = photos.map((photo) => ({
      id: photo.id,
      url: photo.urls.regular,
      smallUrl: photo.urls.small,
      thumbUrl: photo.urls.thumb,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      unsplashUrl: photo.links.html,
    }));

    console.log(`Found ${images.length} images for "${query}"`);

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in unsplash-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch images" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
