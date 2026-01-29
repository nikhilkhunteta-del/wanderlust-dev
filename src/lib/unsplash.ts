import { supabase } from "@/integrations/supabase/client";

export interface UnsplashImage {
  id: string;
  url: string;
  smallUrl: string;
  thumbUrl: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
}

interface UnsplashResponse {
  images: UnsplashImage[];
  error?: string;
}

// In-memory cache to avoid redundant API calls
const imageCache = new Map<string, UnsplashImage[]>();

export async function getUnsplashImages(
  query: string,
  count: number = 1,
  orientation: "landscape" | "portrait" | "squarish" = "landscape"
): Promise<UnsplashImage[]> {
  const cacheKey = `${query}-${count}-${orientation}`;
  
  // Check cache first
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const { data, error } = await supabase.functions.invoke<UnsplashResponse>(
      "unsplash-images",
      {
        body: { query, count, orientation },
      }
    );

    if (error) {
      console.error("Error fetching Unsplash images:", error);
      return [];
    }

    if (data?.error) {
      console.error("Unsplash API error:", data.error);
      return [];
    }

    const images = data?.images || [];
    
    // Cache the result
    imageCache.set(cacheKey, images);
    
    return images;
  } catch (err) {
    console.error("Failed to fetch Unsplash images:", err);
    return [];
  }
}

// Helper to get a single image URL
export async function getUnsplashImageUrl(
  query: string,
  size: "url" | "smallUrl" | "thumbUrl" = "url"
): Promise<string | null> {
  const images = await getUnsplashImages(query, 1);
  return images[0]?.[size] || null;
}
