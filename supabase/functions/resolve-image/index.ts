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

// Known landmark name variations for better Wikimedia searches
const LANDMARK_SYNONYMS: Record<string, string[]> = {
  'eiffel tower': ['Tour Eiffel', 'Eiffel Tower Paris'],
  'colosseum': ['Colosseo', 'Roman Colosseum', 'Flavian Amphitheatre'],
  'taj mahal': ['Taj Mahal Agra', 'ताज महल'],
  'machu picchu': ['Machu Picchu Peru', 'Machupicchu'],
  'great wall': ['Great Wall of China', 'Chinese Wall', '万里长城'],
  'sagrada familia': ['Sagrada Família', 'Basílica de la Sagrada Família'],
  'big ben': ['Elizabeth Tower', 'Big Ben London'],
  'statue of liberty': ['Liberty Enlightening the World', 'Statue of Liberty New York'],
  'christ the redeemer': ['Cristo Redentor', 'Christ the Redeemer Rio'],
  'petra': ['Petra Jordan', 'Al-Khazneh'],
  'angkor wat': ['Angkor Wat Cambodia', 'អង្គរវត្ត'],
  'burj khalifa': ['Burj Khalifa Dubai', 'Khalifa Tower'],
  'sydney opera house': ['Sydney Opera House Australia'],
  'acropolis': ['Acropolis of Athens', 'Parthenon Athens'],
  'hagia sophia': ['Ayasofya', 'Hagia Sophia Istanbul'],
  'notre dame': ['Notre-Dame de Paris', 'Cathédrale Notre-Dame'],
};

// Festival-specific search terms for better results
const FESTIVAL_KEYWORDS: Record<string, string[]> = {
  'carnival': ['carnival parade', 'carnival celebration', 'carnival costume'],
  'diwali': ['Diwali festival', 'Diwali lights', 'Deepavali celebration'],
  'chinese new year': ['Chinese New Year celebration', 'Spring Festival China', 'Lunar New Year parade'],
  'oktoberfest': ['Oktoberfest Munich', 'Oktoberfest beer festival'],
  'holi': ['Holi festival colors', 'Holi celebration India'],
  'cherry blossom': ['Hanami', 'Sakura festival', 'Cherry blossom Japan'],
  'day of the dead': ['Día de los Muertos', 'Day of the Dead Mexico'],
  'mardi gras': ['Mardi Gras New Orleans', 'Fat Tuesday parade'],
  'la tomatina': ['La Tomatina Buñol', 'Tomato Festival Spain'],
  'lantern festival': ['Yuan Xiao', 'Lantern Festival China'],
  'songkran': ['Songkran Thailand', 'Thai New Year water festival'],
  'rio carnival': ['Carnaval do Rio', 'Rio de Janeiro Carnival samba'],
};

// Detect if entity is likely a festival
function isFestivalEntity(entityName: string): boolean {
  const festivalKeywords = ['festival', 'carnival', 'celebration', 'parade', 'feast', 'fiesta', 
    'diwali', 'holi', 'oktoberfest', 'eid', 'christmas market', 'new year', 'mardi gras'];
  const lowerName = entityName.toLowerCase();
  return festivalKeywords.some(keyword => lowerName.includes(keyword));
}

// Detect if entity is likely a landmark
function isLandmarkEntity(entityName: string): boolean {
  const landmarkKeywords = ['tower', 'temple', 'palace', 'castle', 'cathedral', 'church', 'mosque',
    'monument', 'statue', 'bridge', 'museum', 'gate', 'wall', 'ruins', 'fort', 'basilica', 'abbey'];
  const lowerName = entityName.toLowerCase();
  return landmarkKeywords.some(keyword => lowerName.includes(keyword)) ||
    Object.keys(LANDMARK_SYNONYMS).some(landmark => lowerName.includes(landmark));
}

// Generate enhanced search queries for Wikimedia
function generateWikimediaSearchQueries(entityName: string, city: string): string[] {
  const queries: string[] = [];
  const lowerName = entityName.toLowerCase();
  
  // Check for known landmark synonyms
  for (const [landmark, synonyms] of Object.entries(LANDMARK_SYNONYMS)) {
    if (lowerName.includes(landmark)) {
      queries.push(...synonyms);
    }
  }
  
  // Check for festival-specific terms
  for (const [festival, terms] of Object.entries(FESTIVAL_KEYWORDS)) {
    if (lowerName.includes(festival)) {
      queries.push(...terms);
    }
  }
  
  // Add the exact entity name
  queries.push(entityName);
  
  // Add entity + city combination
  queries.push(`${entityName} ${city}`);
  
  // For landmarks, add "exterior" or "view" suffixes
  if (isLandmarkEntity(entityName)) {
    queries.push(`${entityName} exterior`);
    queries.push(`${entityName} panorama`);
  }
  
  // For festivals, add "celebration" suffix
  if (isFestivalEntity(entityName)) {
    queries.push(`${entityName} celebration`);
    queries.push(`${entityName} crowd`);
  }
  
  // Deduplicate
  return [...new Set(queries)];
}

// Try to get image from Wikipedia article's main image
async function tryWikipediaImage(entityName: string, city: string): Promise<ResolvedImage | null> {
  try {
    // Search Wikipedia for the article
    const searchTerms = [`${entityName}`, `${entityName} ${city}`];
    
    for (const searchTerm of searchTerms) {
      const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srlimit=3&format=json&origin=*`;
      const searchResponse = await fetch(wikiSearchUrl);
      if (!searchResponse.ok) continue;
      
      const searchData = await searchResponse.json();
      const results = searchData.query?.search || [];
      
      for (const result of results) {
        const title = result.title;
        
        // Get the page's main image
        const pageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original&format=json&origin=*`;
        const pageResponse = await fetch(pageUrl);
        if (!pageResponse.ok) continue;
        
        const pageData = await pageResponse.json();
        const pages = pageData.query?.pages || {};
        const page = Object.values(pages)[0] as any;
        
        if (!page?.original?.source) continue;
        
        const imageUrl = page.original.source;
        const width = page.original.width || 0;
        const height = page.original.height || 0;
        
        // Quality filters - prefer landscape, decent size
        if (width < 1200 || width < height * 1.1) continue;
        
        // Get image info from Commons for attribution
        const filename = imageUrl.split('/').pop();
        const commonsInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`;
        
        let photographer = 'Wikipedia';
        let attributionRequired = true;
        
        try {
          const commonsResponse = await fetch(commonsInfoUrl);
          if (commonsResponse.ok) {
            const commonsData = await commonsResponse.json();
            const commonsPages = commonsData.query?.pages || {};
            const commonsPage = Object.values(commonsPages)[0] as any;
            const extmetadata = commonsPage?.imageinfo?.[0]?.extmetadata || {};
            
            photographer = extmetadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikipedia';
            const license = extmetadata.LicenseShortName?.value || '';
            attributionRequired = !license.includes('Public domain') && !license.includes('CC0');
          }
        } catch {
          // Use defaults
        }
        
        console.log(`Found Wikipedia image for "${entityName}": ${width}x${height}`);
        
        return {
          id: `wp-${page.pageid}`,
          cacheKey: '',
          imageType: 'attraction',
          city: '',
          country: '',
          url: imageUrl,
          smallUrl: imageUrl.replace(/\/\d+px-/, '/800px-'),
          thumbUrl: imageUrl.replace(/\/\d+px-/, '/300px-'),
          source: 'wikimedia',
          photographer: photographer.substring(0, 100),
          photographerUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
          attributionRequired,
          width,
          height,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Wikipedia image search error:', error);
    return null;
  }
}

// Score a Wikimedia image based on quality indicators
function scoreWikimediaImage(result: any, imageInfo: any, entityName: string): number {
  let score = 0;
  const title = result.title.toLowerCase();
  const lowerEntity = entityName.toLowerCase();
  
  // Size scoring
  const width = imageInfo.width || 0;
  if (width >= 2000) score += 30;
  else if (width >= 1600) score += 20;
  else if (width >= 1200) score += 10;
  
  // Aspect ratio - prefer landscape
  const aspectRatio = width / (imageInfo.height || 1);
  if (aspectRatio >= 1.5 && aspectRatio <= 2.0) score += 20; // Ideal landscape
  else if (aspectRatio >= 1.2 && aspectRatio < 1.5) score += 10;
  
  // Title relevance
  if (title.includes(lowerEntity.split(' ')[0])) score += 15;
  
  // Prefer "panorama", "view", "exterior" in title
  if (title.includes('panorama') || title.includes('view') || title.includes('exterior')) score += 10;
  
  // Penalize "interior", "detail", "map", "diagram", "plan"
  if (title.includes('interior') || title.includes('detail')) score -= 10;
  if (title.includes('map') || title.includes('diagram') || title.includes('plan')) score -= 30;
  if (title.includes('logo') || title.includes('icon') || title.includes('flag')) score -= 30;
  
  // Penalize night shots slightly (often harder to see)
  if (title.includes('night')) score -= 5;
  
  // Prefer Featured or Quality images (indicated by categories sometimes in title)
  if (title.includes('featured') || title.includes('quality')) score += 15;
  
  return score;
}

// Try Wikimedia Commons for named entities with enhanced search
async function tryWikimedia(query: string, entityName?: string, city?: string): Promise<ResolvedImage | null> {
  if (!entityName) return null;
  
  try {
    // First, try Wikipedia's main image for famous landmarks/festivals
    if (isLandmarkEntity(entityName) || isFestivalEntity(entityName)) {
      console.log(`Trying Wikipedia main image for: ${entityName}`);
      const wikiImage = await tryWikipediaImage(entityName, city || '');
      if (wikiImage) return wikiImage;
    }
    
    // Generate multiple search queries
    const searchQueries = generateWikimediaSearchQueries(entityName, city || '');
    console.log(`Wikimedia search queries: ${searchQueries.slice(0, 3).join(', ')}...`);
    
    interface ScoredImage {
      result: any;
      imageInfo: any;
      score: number;
    }
    
    const candidates: ScoredImage[] = [];
    
    // Try multiple queries
    for (const searchQuery of searchQueries.slice(0, 5)) {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&srlimit=8&format=json&origin=*`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) continue;
      
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
        
        // Basic quality filters
        const width = imageInfo.width || 0;
        const height = imageInfo.height || 0;
        
        // Skip if too small
        if (width < 1000) continue;
        
        // Check if it's a photo (not illustration/diagram)
        const mime = imageInfo.mime || '';
        if (!mime.includes('jpeg') && !mime.includes('jpg') && !mime.includes('png')) continue;
        
        const extmetadata = imageInfo.extmetadata || {};
        const license = extmetadata.LicenseShortName?.value || '';
        
        // Prefer Creative Commons or public domain
        const isPermissive = license.includes('CC') || license.includes('Public domain') || license.includes('PD');
        if (!isPermissive) continue;
        
        // Score this image
        const score = scoreWikimediaImage(result, imageInfo, entityName);
        candidates.push({ result, imageInfo, score });
      }
    }
    
    // Sort by score and return best
    candidates.sort((a, b) => b.score - a.score);
    
    if (candidates.length === 0) return null;
    
    const best = candidates[0];
    const imageInfo = best.imageInfo;
    const title = best.result.title;
    
    const extmetadata = imageInfo.extmetadata || {};
    const artist = extmetadata.Artist?.value?.replace(/<[^>]*>/g, '') || 'Wikimedia Commons';
    const license = extmetadata.LicenseShortName?.value || '';
    
    console.log(`Best Wikimedia image: "${title}" (score: ${best.score}, size: ${imageInfo.width}x${imageInfo.height})`);
    
    // Generate thumbnail URLs
    const filename = title.replace('File:', '');
    const thumbBase = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(filename)}`;
    
    return {
      id: `wm-${Object.keys(best.result)[0] || Date.now()}`,
      cacheKey: '',
      imageType: 'attraction',
      city: '',
      country: '',
      url: imageInfo.url,
      smallUrl: `${thumbBase}?width=800`,
      thumbUrl: `${thumbBase}?width=300`,
      source: 'wikimedia',
      photographer: artist.substring(0, 100),
      photographerUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
      sourceUrl: imageInfo.descriptionurl,
      attributionRequired: !license.includes('Public domain') && !license.includes('CC0'),
      width: imageInfo.width,
      height: imageInfo.height,
    };
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
      image = await tryWikimedia(searchQuery, request.entityName, request.city);
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
