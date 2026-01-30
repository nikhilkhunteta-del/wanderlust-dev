import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ImagePackRequest {
  city: string;
  country: string;
}

interface CachedImage {
  id: string;
  cache_key: string;
  image_type: string;
  city: string;
  country: string;
  entity_name: string | null;
  image_url: string;
  small_url: string | null;
  thumb_url: string | null;
  source: string;
  photographer: string | null;
  photographer_url: string | null;
  source_url: string | null;
  attribution_required: boolean;
  width: number | null;
  height: number | null;
}

interface ResolvedImage {
  id: string;
  cacheKey: string;
  imageType: string;
  city: string;
  country: string;
  entityName?: string;
  url: string;
  smallUrl?: string;
  thumbUrl?: string;
  source: string;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  attributionRequired: boolean;
  width?: number;
  height?: number;
}

function transformToResolvedImage(cached: CachedImage): ResolvedImage {
  return {
    id: cached.id,
    cacheKey: cached.cache_key,
    imageType: cached.image_type,
    city: cached.city,
    country: cached.country,
    entityName: cached.entity_name || undefined,
    url: cached.image_url,
    smallUrl: cached.small_url || undefined,
    thumbUrl: cached.thumb_url || undefined,
    source: cached.source,
    photographer: cached.photographer || undefined,
    photographerUrl: cached.photographer_url || undefined,
    sourceUrl: cached.source_url || undefined,
    attributionRequired: cached.attribution_required,
    width: cached.width || undefined,
    height: cached.height || undefined,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const request: ImagePackRequest = await req.json();
    
    if (!request.city || !request.country) {
      return new Response(
        JSON.stringify({ error: "city and country are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Getting image pack for: ${request.city}, ${request.country}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get all cached images for this city
    const { data: cachedImages, error } = await supabase
      .from('image_cache')
      .select('*')
      .eq('city', request.city)
      .eq('country', request.country)
      .gt('expires_at', new Date().toISOString())
      .order('hit_count', { ascending: false });

    if (error) {
      throw new Error(`Database query error: ${error.message}`);
    }

    const images = cachedImages || [];
    
    // Organize into pack
    const heroes: ResolvedImage[] = [];
    const categories: Record<string, ResolvedImage> = {};

    for (const cached of images) {
      const image = transformToResolvedImage(cached);
      
      if (cached.image_type === 'city_hero') {
        if (heroes.length < 3) {
          heroes.push(image);
        }
      } else if (cached.image_type === 'category') {
        // Use cache key to identify category
        const categoryMatch = cached.cache_key.match(/category:.*?:.*?:(.*)/);
        const category = categoryMatch?.[1] || cached.entity_name || 'general';
        if (!categories[category]) {
          categories[category] = image;
        }
      } else if (cached.image_type === 'attraction' || cached.image_type === 'seasonal' || cached.image_type === 'neighborhood') {
        // Add to categories by type
        const key = cached.entity_name?.toLowerCase().replace(/\s+/g, '-') || cached.image_type;
        if (!categories[key]) {
          categories[key] = image;
        }
      }
    }

    console.log(`Image pack: ${heroes.length} heroes, ${Object.keys(categories).length} categories`);

    return new Response(
      JSON.stringify({
        heroes,
        categories,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-image-pack:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to get image pack" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
