import { useQuery } from "@tanstack/react-query";
import { resolveImage, getCachedImage, getFallbackFromPack } from "@/lib/imageSystem";
import { ResolveImageRequest, ResolvedImage } from "@/types/imageSystem";

const STALE_TIME = 30 * 60 * 1000; // 30 minutes
const CACHE_TIME = 60 * 60 * 1000; // 1 hour

interface UseResolvedImageOptions {
  enabled?: boolean;
  fallbackCategory?: string;
}

/**
 * Hook to resolve and cache a single image
 */
export function useResolvedImage(
  request: ResolveImageRequest | null,
  options: UseResolvedImageOptions = {}
) {
  const { enabled = true, fallbackCategory } = options;

  return useQuery({
    queryKey: ["resolved-image", request?.type, request?.city, request?.country, request?.entityName, request?.interestTags?.join(','), request?.month],
    queryFn: async (): Promise<ResolvedImage | null> => {
      if (!request) return null;
      
      // Try to get from memory cache first (instant)
      const cached = getCachedImage(request);
      if (cached) return cached;
      
      // Resolve from API
      const resolved = await resolveImage(request);
      if (resolved) return resolved;
      
      // Try fallback from image pack
      if (fallbackCategory) {
        const fallback = getFallbackFromPack(request.city, request.country, fallbackCategory);
        if (fallback) return fallback;
      }
      
      return null;
    },
    enabled: enabled && !!request,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    // Return cached data immediately while refetching
    placeholderData: (previousData) => previousData,
  });
}

/**
 * Hook for city hero images with fallback
 */
export function useCityHeroImage(city: string | null, country: string | null) {
  return useResolvedImage(
    city && country ? { type: 'city_hero', city, country } : null,
    { fallbackCategory: 'cityscape' }
  );
}

/**
 * Hook for attraction images
 */
export function useAttractionImage(
  city: string | null,
  country: string | null,
  attractionName: string | null
) {
  return useResolvedImage(
    city && country && attractionName
      ? { type: 'attraction', city, country, entityName: attractionName }
      : null,
    { fallbackCategory: 'culture' }
  );
}

/**
 * Hook for seasonal/festival images
 */
export function useSeasonalImage(
  city: string | null,
  country: string | null,
  eventName: string | null,
  month?: string
) {
  return useResolvedImage(
    city && country && eventName
      ? { type: 'seasonal', city, country, entityName: eventName, month }
      : null,
    { fallbackCategory: 'cultural' }
  );
}

/**
 * Hook for category images based on interests
 */
export function useCategoryImage(
  city: string | null,
  country: string | null,
  category: string | null
) {
  return useResolvedImage(
    city && country && category
      ? { type: 'category', city, country, interestTags: [category] }
      : null
  );
}

/**
 * Hook for neighborhood images
 */
export function useNeighborhoodImage(
  city: string | null,
  country: string | null,
  neighborhoodName: string | null
) {
  return useResolvedImage(
    city && country && neighborhoodName
      ? { type: 'neighborhood', city, country, entityName: neighborhoodName }
      : null,
    { fallbackCategory: 'neighborhood' }
  );
}
