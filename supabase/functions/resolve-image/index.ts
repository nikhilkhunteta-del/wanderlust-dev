import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ImageType = 'city_hero' | 'attraction' | 'seasonal' | 'neighborhood' | 'category';
type ImageSource = 'wikimedia' | 'unsplash' | 'pexels' | 'local';

interface ResolvedImage {
  id: string;
  cacheKey: string;
  imageType: ImageType;
  city: string;
  country: string;
  entityName?: string;
  url: string;
  smallUrl?: string;
  thumbUrl?: string;
  source: ImageSource;
  photographer?: string;
  photographerUrl?: string;
  sourceUrl?: string;
  attributionRequired: boolean;
  width?: number;
  height?: number;
}

interface ResolveImageRequest {
  type: ImageType;
  city: string;
  country: string;
  entityName?: string;
  interestTags?: string[];
  month?: string;
}

// Generate a stable cache key
function generateCacheKey(req: ResolveImageRequest): string {
  const parts = [req.type, req.city.toLowerCase(), req.country.toLowerCase()];
  if (req.entityName) parts.push(req.entityName.toLowerCase());
  if (req.interestTags?.length) parts.push(req.interestTags.sort().join('-'));
  if (req.month) parts.push(req.month.toLowerCase());
  return parts.join(':').replace(/\s+/g, '_');
}

// TTL in days based on image type
function getTTLDays(type: ImageType): number {
  switch (type) {
    case 'city_hero': return 180;
    case 'attraction': return 180;
    case 'neighborhood': return 180;
    case 'seasonal': return 90;
    case 'category': return 120;
    default: return 90;
  }
}

// Build search query based on request
function buildSearchQuery(req: ResolveImageRequest): string {
  const parts: string[] = [];
  
  if (req.entityName) {
    parts.push(req.entityName);
    parts.push(req.city);
  } else if (req.type === 'city_hero') {
    parts.push(req.city);
    parts.push(req.country);
    parts.push('cityscape landmark');
  } else if (req.type === 'neighborhood') {
    parts.push(req.city);
    parts.push('neighborhood street');
  } else if (req.type === 'category' && req.interestTags?.length) {
    parts.push(req.city);
    parts.push(req.interestTags[0]);
  } else {
    parts.push(req.city);
    parts.push(req.country);
  }
  
  return parts.join(' ');
}

// Try Wikimedia Commons for named entities
async function tryWikimedia(query: string, entityName?: string): Promise<ResolvedImage | null> {
  try {
    // Search for images on Wikimedia Commons
    const searchQuery = entityName || query;
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=5&format=json&origin=*`;
    
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    
    const searchData = await searchResponse.json();
    const results = searchData.query?.search || [];
    
    for (const result of results) {
      const title = result.title;
      
      // Get image info
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|size|extmetadata&format=json&origin=*`;
      const infoResponse = await fetch(infoUrl);
      if (!infoResponse.ok) continue;
      
      const infoData = await infoResponse.json();
      const pages = infoData.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      const imageInfo = page?.imageinfo?.[0];
      
      if (!imageInfo) continue;
      
      // Quality filters
      const width = imageInfo.width || 0;
      const height = imageInfo.height || 0;
      
      // Skip if too small or portrait
      if (width < 1200 || width < height * 1.2) continue;
      
      // Check if it's a photo (not illustration/diagram)
      const mime = imageInfo.mime || '';
      if (!mime.includes('jpeg') && !mime.includes('jpg') && !mime.includes('png')) continue;
      
      const extmetadata = imageInfo.extmetadata || {};
      const artist = extmetadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Commons';
      const license = extmetadata.LicenseShortName?.value || '';
      
      // Prefer Creative Commons or public domain
      const isPermissive = license.includes('CC') || license.includes('Public domain') || license.includes('PD');
      if (!isPermissive) continue;
      
      return {
        id: `wm-${page.pageid}`,
        cacheKey: '',
        imageType: 'attraction',
        city: '',
        country: '',
        url: imageInfo.url,
        smallUrl: imageInfo.thumburl || imageInfo.url,
        thumbUrl: imageInfo.thumburl || imageInfo.url,
        source: 'wikimedia',
        photographer: artist.substring(0, 100),
        photographerUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
        sourceUrl: imageInfo.descriptionurl,
        attributionRequired: !license.includes('Public domain') && !license.includes('CC0'),
        width,
        height,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Wikimedia search error:', error);
    return null;
  }
}

// Try Unsplash API
async function tryUnsplash(query: string): Promise<ResolvedImage | null> {
  const UNSPLASH_ACCESS_KEY = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!UNSPLASH_ACCESS_KEY) {
    console.log("Unsplash API key not configured");
    return null;
  }
  
  try {
    const params = new URLSearchParams({
      query,
      per_page: '5',
      orientation: 'landscape',
    });
    
    const response = await fetch(
      `https://api.unsplash.com/search/photos?${params}`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const photos = data.results || [];
    
    for (const photo of photos) {
      const width = photo.width || 0;
      const height = photo.height || 0;
      
      // Quality filter: prefer landscape, decent size
      if (width < 1600 || width < height * 1.2) continue;
      
      return {
        id: `us-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.urls.regular,
        smallUrl: photo.urls.small,
        thumbUrl: photo.urls.thumb,
        source: 'unsplash',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        sourceUrl: photo.links.html,
        attributionRequired: true, // Unsplash requires attribution
        width,
        height,
      };
    }
    
    // If no landscape photos found, take the first one
    if (photos.length > 0) {
      const photo = photos[0];
      return {
        id: `us-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.urls.regular,
        smallUrl: photo.urls.small,
        thumbUrl: photo.urls.thumb,
        source: 'unsplash',
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html,
        sourceUrl: photo.links.html,
        attributionRequired: true,
        width: photo.width,
        height: photo.height,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Unsplash search error:', error);
    return null;
  }
}

// Try Pexels API
async function tryPexels(query: string): Promise<ResolvedImage | null> {
  const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
  if (!PEXELS_API_KEY) {
    console.log("Pexels API key not configured");
    return null;
  }
  
  try {
    const params = new URLSearchParams({
      query,
      per_page: '5',
      orientation: 'landscape',
    });
    
    const response = await fetch(
      `https://api.pexels.com/v1/search?${params}`,
      {
        headers: {
          Authorization: PEXELS_API_KEY,
        },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const photos = data.photos || [];
    
    for (const photo of photos) {
      const width = photo.width || 0;
      const height = photo.height || 0;
      
      // Quality filter
      if (width < 1600 || width < height * 1.2) continue;
      
      return {
        id: `px-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.src.large2x || photo.src.large,
        smallUrl: photo.src.medium,
        thumbUrl: photo.src.small,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
        attributionRequired: true, // Pexels requires attribution
        width,
        height,
      };
    }
    
    // Take first if no ideal match
    if (photos.length > 0) {
      const photo = photos[0];
      return {
        id: `px-${photo.id}`,
        cacheKey: '',
        imageType: 'city_hero',
        city: '',
        country: '',
        url: photo.src.large2x || photo.src.large,
        smallUrl: photo.src.medium,
        thumbUrl: photo.src.small,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        sourceUrl: photo.url,
        attributionRequired: true,
        width: photo.width,
        height: photo.height,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Pexels search error:', error);
    return null;
  }
}

// Try local storage fallback
async function tryLocalStorage(supabase: any, city: string, type: ImageType): Promise<ResolvedImage | null> {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    
    // Try city-specific fallback first
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const paths = [
      `fallbacks/${citySlug}-hero.jpg`,
      `fallbacks/${type}-default.jpg`,
      `fallbacks/travel-default.jpg`,
    ];
    
    for (const path of paths) {
      const { data } = await supabase.storage.from('travel-images').getPublicUrl(path);
      
      if (data?.publicUrl) {
        // Verify the file exists
        const checkResponse = await fetch(data.publicUrl, { method: 'HEAD' });
        if (checkResponse.ok) {
          return {
            id: `local-${path.replace(/[/\.]/g, '-')}`,
            cacheKey: '',
            imageType: type,
            city,
            country: '',
            url: data.publicUrl,
            smallUrl: data.publicUrl,
            thumbUrl: data.publicUrl,
            source: 'local',
            photographer: 'Stock Photo',
            attributionRequired: false,
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Local storage fallback error:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const request: ResolveImageRequest = await req.json();
    
    if (!request.type || !request.city || !request.country) {
      return new Response(
        JSON.stringify({ error: "type, city, and country are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cacheKey = generateCacheKey(request);
    console.log(`Resolving image for: ${cacheKey}`);

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check cache first
    const { data: cached, error: cacheError } = await supabase
      .from('image_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (cached && !cacheError) {
      console.log(`Cache hit for: ${cacheKey}`);
      
      // Increment hit count
      await supabase
        .from('image_cache')
        .update({ hit_count: (cached.hit_count || 0) + 1 })
        .eq('id', cached.id);
      
      const image: ResolvedImage = {
        id: cached.id,
        cacheKey: cached.cache_key,
        imageType: cached.image_type,
        city: cached.city,
        country: cached.country,
        entityName: cached.entity_name,
        url: cached.image_url,
        smallUrl: cached.small_url,
        thumbUrl: cached.thumb_url,
        source: cached.source,
        photographer: cached.photographer,
        photographerUrl: cached.photographer_url,
        sourceUrl: cached.source_url,
        attributionRequired: cached.attribution_required,
        width: cached.width,
        height: cached.height,
      };
      
      return new Response(
        JSON.stringify({ image, fromCache: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build search query
    const searchQuery = buildSearchQuery(request);
    console.log(`Searching for: ${searchQuery}`);

    let image: ResolvedImage | null = null;

    // For named entities, try Wikimedia first
    if (request.entityName) {
      console.log('Trying Wikimedia Commons...');
      image = await tryWikimedia(searchQuery, request.entityName);
    }

    // Try Unsplash
    if (!image) {
      console.log('Trying Unsplash...');
      image = await tryUnsplash(searchQuery);
    }

    // Try Pexels
    if (!image) {
      console.log('Trying Pexels...');
      image = await tryPexels(searchQuery);
    }

    // Try local storage fallback
    if (!image) {
      console.log('Trying local storage fallback...');
      image = await tryLocalStorage(supabase, request.city, request.type);
    }

    if (!image) {
      return new Response(
        JSON.stringify({ image: null, fromCache: false, error: "No image found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Complete the image data
    image.cacheKey = cacheKey;
    image.imageType = request.type;
    image.city = request.city;
    image.country = request.country;
    image.entityName = request.entityName;

    // Cache the result
    const ttlDays = getTTLDays(request.type);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    const { error: insertError } = await supabase
      .from('image_cache')
      .upsert({
        cache_key: cacheKey,
        image_type: request.type,
        city: request.city,
        country: request.country,
        entity_name: request.entityName,
        image_url: image.url,
        small_url: image.smallUrl,
        thumb_url: image.thumbUrl,
        source: image.source,
        photographer: image.photographer,
        photographer_url: image.photographerUrl,
        source_url: image.sourceUrl,
        attribution_required: image.attributionRequired,
        width: image.width,
        height: image.height,
        expires_at: expiresAt.toISOString(),
        hit_count: 1,
      }, {
        onConflict: 'cache_key',
      });

    if (insertError) {
      console.error('Cache insert error:', insertError);
    } else {
      console.log(`Cached image for ${ttlDays} days: ${cacheKey}`);
    }

    return new Response(
      JSON.stringify({ image, fromCache: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in resolve-image:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to resolve image" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
