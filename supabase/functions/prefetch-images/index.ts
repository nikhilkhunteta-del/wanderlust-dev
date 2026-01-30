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
  userInterests: string[];
}

// Category mappings for common travel interests
const INTEREST_CATEGORIES: Record<string, string[]> = {
  'food': ['local cuisine', 'restaurants', 'street food', 'food market', 'cafe'],
  'culture': ['museum', 'historic architecture', 'art gallery', 'cultural landmark', 'heritage site'],
  'nature': ['park', 'garden', 'scenic view', 'nature trail', 'waterfront'],
  'adventure': ['outdoor activity', 'hiking', 'adventure sport', 'exploration'],
  'nightlife': ['nightlife', 'bar district', 'entertainment venue'],
  'shopping': ['market', 'shopping street', 'boutique', 'local crafts'],
  'beach': ['beach', 'coastline', 'seaside', 'waterfront'],
  'history': ['historic site', 'ancient ruins', 'monument', 'old town'],
  'art': ['art gallery', 'street art', 'mural', 'art museum'],
  'architecture': ['architecture', 'building', 'skyline', 'landmark'],
  'relaxation': ['spa', 'wellness', 'peaceful garden', 'retreat'],
  'photography': ['scenic viewpoint', 'photogenic spot', 'panorama'],
};

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

    console.log(`Prefetching images for ${request.cities.length} cities`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    let cached = 0;
    let errors = 0;

    // Process each city
    for (const cityInfo of request.cities) {
      const { city, country } = cityInfo;
      
      // 1. Prefetch 3 city hero images (with variations)
      const heroQueries = [
        { type: 'city_hero' as const, city, country },
        { type: 'city_hero' as const, city, country, entityName: `${city} skyline` },
        { type: 'city_hero' as const, city, country, entityName: `${city} landmark` },
      ];

      for (const query of heroQueries) {
        try {
          const response = await supabase.functions.invoke('resolve-image', {
            body: query,
          });
          
          if (response.data?.image) {
            cached++;
          } else if (response.data?.error) {
            errors++;
          }
        } catch (e) {
          console.error(`Error prefetching hero for ${city}:`, e);
          errors++;
        }
      }

      // 2. Prefetch category images based on user interests
      const interestsToFetch = request.userInterests?.slice(0, 5) || ['culture', 'food', 'nature'];
      
      for (const interest of interestsToFetch) {
        const categoryKeywords = INTEREST_CATEGORIES[interest.toLowerCase()] || [interest];
        
        // Fetch 2 images per interest category
        for (let i = 0; i < Math.min(2, categoryKeywords.length); i++) {
          try {
            const response = await supabase.functions.invoke('resolve-image', {
              body: {
                type: 'category',
                city,
                country,
                interestTags: [categoryKeywords[i]],
              },
            });
            
            if (response.data?.image) {
              cached++;
            } else if (response.data?.error) {
              errors++;
            }
          } catch (e) {
            console.error(`Error prefetching category for ${city}/${interest}:`, e);
            errors++;
          }
        }
      }

      // Small delay between cities to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`Prefetch complete: ${cached} cached, ${errors} errors`);

    return new Response(
      JSON.stringify({
        cached,
        errors,
        message: `Prefetched images for ${request.cities.length} cities: ${cached} cached, ${errors} errors`,
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
