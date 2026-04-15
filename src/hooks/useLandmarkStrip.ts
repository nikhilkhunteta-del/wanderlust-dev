import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandmarkStripImage {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  placeName: string;
  // Legacy compat
  landmark?: string;
  source: string;
}

interface StripResponse {
  images: (LandmarkStripImage | null)[];
  fromCache: boolean;
}

export function useLandmarkStrip(
  city: string | null,
  country: string | null,
  places: string[]
) {
  return useQuery({
    queryKey: ["landmark-strip", city, places.join(",")],
    queryFn: async (): Promise<(LandmarkStripImage | null)[]> => {
      if (!city || !country || places.length === 0) return [];

      const { data, error } = await supabase.functions.invoke<StripResponse>(
        "landmark-strip",
        { body: { city, country, places } }
      );

      if (error) {
        console.error("landmark-strip error:", error);
        return [];
      }

      // Normalize: ensure placeName is populated (handle legacy 'landmark' field)
      return (data?.images ?? []).map(img => {
        if (!img) return img;
        return {
          ...img,
          placeName: img.placeName || img.landmark || "",
        };
      });
    },
    enabled: !!city && !!country && places.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
