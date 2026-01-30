import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getImagePack, prefetchCityImages, preloadImagePack } from "@/lib/imageSystem";
import { ImagePack } from "@/types/imageSystem";
import { useEffect } from "react";

const STALE_TIME = 30 * 60 * 1000; // 30 minutes
const CACHE_TIME = 60 * 60 * 1000; // 1 hour

/**
 * Hook to get the complete image pack for a city
 */
export function useImagePack(city: string | null, country: string | null) {
  return useQuery({
    queryKey: ["image-pack", city, country],
    queryFn: () => getImagePack({ city: city!, country: country! }),
    enabled: !!city && !!country,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

/**
 * Hook to prefetch images for recommended cities after recommendations load
 */
export function usePrefetchCityImages(
  cities: Array<{ city: string; country: string }> | null,
  userInterests: string[]
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!cities || cities.length === 0) return;

    // Trigger prefetch in background
    const prefetch = async () => {
      console.log(`Prefetching images for ${cities.length} cities...`);
      
      try {
        const result = await prefetchCityImages(cities, userInterests);
        
        if (result) {
          console.log(`Prefetch complete: ${result.message}`);
          
          // Invalidate image pack queries to pick up newly cached images
          cities.forEach(({ city, country }) => {
            queryClient.invalidateQueries({
              queryKey: ["image-pack", city, country],
            });
          });
        }
      } catch (error) {
        console.error("Prefetch error:", error);
      }
    };

    // Small delay to not block initial render
    const timeoutId = setTimeout(prefetch, 500);
    
    return () => clearTimeout(timeoutId);
  }, [cities, userInterests, queryClient]);
}

/**
 * Hook to preload an image pack that was returned inline with other data
 */
export function usePreloadImagePack(
  pack: ImagePack | null,
  city: string | null,
  country: string | null
) {
  useEffect(() => {
    if (pack && city && country) {
      preloadImagePack(pack, city, country);
    }
  }, [pack, city, country]);
}

/**
 * Get a hero image URL from the pack, with fallback
 */
export function getHeroImageFromPack(pack: ImagePack | null, index: number = 0): string | null {
  if (!pack?.heroes || pack.heroes.length === 0) return null;
  const hero = pack.heroes[Math.min(index, pack.heroes.length - 1)];
  return hero?.url || null;
}

/**
 * Get a category image URL from the pack
 */
export function getCategoryImageFromPack(
  pack: ImagePack | null,
  category: string
): string | null {
  if (!pack?.categories) return null;
  
  // Try exact match first
  if (pack.categories[category]) {
    return pack.categories[category].url;
  }
  
  // Try case-insensitive match
  const lowerCategory = category.toLowerCase();
  const matchingKey = Object.keys(pack.categories).find(
    key => key.toLowerCase().includes(lowerCategory) || lowerCategory.includes(key.toLowerCase())
  );
  
  if (matchingKey) {
    return pack.categories[matchingKey].url;
  }
  
  return null;
}
