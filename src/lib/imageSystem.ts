import { supabase } from "@/integrations/supabase/client";
import {
  ResolvedImage,
  ResolveImageRequest,
  ResolveImageResponse,
  PrefetchImagesRequest,
  PrefetchImagesResponse,
  ImagePack,
  ImagePackRequest,
} from "@/types/imageSystem";

// In-memory cache for immediate access
const memoryCache = new Map<string, ResolvedImage>();
const imagePackCache = new Map<string, ImagePack>();

// Generate cache key matching the edge function logic
function generateCacheKey(req: ResolveImageRequest): string {
  const parts = [req.type, req.city.toLowerCase(), req.country.toLowerCase()];
  if (req.entityName) parts.push(req.entityName.toLowerCase());
  if (req.interestTags?.length) parts.push(req.interestTags.sort().join('-'));
  if (req.month) parts.push(req.month.toLowerCase());
  return parts.join(':').replace(/\s+/g, '_');
}

/**
 * Resolve a single image from the multi-source system
 */
export async function resolveImage(request: ResolveImageRequest): Promise<ResolvedImage | null> {
  const cacheKey = generateCacheKey(request);
  
  // Check memory cache first
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!;
  }

  // Retry with exponential backoff for 503/network errors
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Stagger concurrent requests to avoid overwhelming edge runtime
      if (attempt > 0) {
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt) + Math.random() * 300));
      }

      const { data, error } = await supabase.functions.invoke<ResolveImageResponse>(
        "resolve-image",
        { body: request }
      );

      if (error) {
        // Retry on 503 / network errors
        const is503 = error.message?.includes('503') || error.message?.includes('non-2xx') || error.message?.includes('Failed to send');
        if (is503 && attempt < MAX_RETRIES - 1) {
          console.warn(`resolve-image attempt ${attempt + 1} failed (503), retrying...`);
          continue;
        }
        console.error("Error resolving image:", error);
        return null;
      }

      if (data?.image) {
        memoryCache.set(cacheKey, data.image);
        return data.image;
      }

      return null;
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) {
        console.warn(`resolve-image attempt ${attempt + 1} threw, retrying...`);
        continue;
      }
      console.error("Failed to resolve image:", err);
      return null;
    }
  }
  return null;
}

/**
 * Get a cached image immediately if available, otherwise trigger fetch
 */
export function getCachedImage(request: ResolveImageRequest): ResolvedImage | null {
  const cacheKey = generateCacheKey(request);
  return memoryCache.get(cacheKey) || null;
}

/**
 * Prefetch image packs for recommended cities
 */
export async function prefetchCityImages(
  cities: Array<{ city: string; country: string }>,
  userInterests: string[]
): Promise<PrefetchImagesResponse | null> {
  try {
    const { data, error } = await supabase.functions.invoke<PrefetchImagesResponse>(
      "prefetch-images",
      {
        body: { cities, userInterests } as PrefetchImagesRequest,
      }
    );

    if (error) {
      console.error("Error prefetching images:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("Failed to prefetch images:", err);
    return null;
  }
}

/**
 * Get the complete image pack for a city
 */
export async function getImagePack(request: ImagePackRequest): Promise<ImagePack | null> {
  const cacheKey = `${request.city.toLowerCase()}:${request.country.toLowerCase()}`;
  
  // Check memory cache
  if (imagePackCache.has(cacheKey)) {
    return imagePackCache.get(cacheKey)!;
  }

  try {
    const { data, error } = await supabase.functions.invoke<ImagePack>(
      "get-image-pack",
      { body: request }
    );

    if (error) {
      console.error("Error getting image pack:", error);
      return null;
    }

    if (data) {
      // Cache in memory
      imagePackCache.set(cacheKey, data);
      
      // Also cache individual images
      if (data.heroes) {
        data.heroes.forEach(img => {
          if (img.cacheKey) memoryCache.set(img.cacheKey, img);
        });
      }
      if (data.categories) {
        Object.values(data.categories).forEach(img => {
          if (img.cacheKey) memoryCache.set(img.cacheKey, img);
        });
      }
      
      return data;
    }

    return null;
  } catch (err) {
    console.error("Failed to get image pack:", err);
    return null;
  }
}

/**
 * Get a fallback image from the pack when specific image fails
 */
export function getFallbackFromPack(
  city: string,
  country: string,
  preferredCategory?: string
): ResolvedImage | null {
  const cacheKey = `${city.toLowerCase()}:${country.toLowerCase()}`;
  const pack = imagePackCache.get(cacheKey);
  
  if (!pack) return null;
  
  // Try preferred category first
  if (preferredCategory && pack.categories[preferredCategory]) {
    return pack.categories[preferredCategory];
  }
  
  // Fall back to first hero image
  if (pack.heroes.length > 0) {
    return pack.heroes[0];
  }
  
  // Fall back to any category image
  const categoryImages = Object.values(pack.categories);
  if (categoryImages.length > 0) {
    return categoryImages[0];
  }
  
  return null;
}

/**
 * Clear the memory cache (useful for testing or forced refresh)
 */
export function clearImageCache(): void {
  memoryCache.clear();
  imagePackCache.clear();
}

/**
 * Preload an image pack into memory cache
 */
export function preloadImagePack(pack: ImagePack, city: string, country: string): void {
  const cacheKey = `${city.toLowerCase()}:${country.toLowerCase()}`;
  imagePackCache.set(cacheKey, pack);
  
  pack.heroes?.forEach(img => {
    if (img.cacheKey) memoryCache.set(img.cacheKey, img);
  });
  
  Object.values(pack.categories || {}).forEach(img => {
    if (img.cacheKey) memoryCache.set(img.cacheKey, img);
  });
}
