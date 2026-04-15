import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CollageImage {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  query: string;
}

interface CollageResponse {
  images: (CollageImage | null)[];
  fromCache: boolean;
  landmark?: string;
  landmarks?: string[];
  places?: string[];
}

export function useHeroCollage(
  city: string | null,
  country: string | null,
  interests: string[],
  primaryInterest?: string
) {
  return useQuery({
    queryKey: ["hero-collage", city, country, primaryInterest || (interests || []).sort().join(",")],
    queryFn: async (): Promise<{ images: (CollageImage | null)[]; landmarks: string[]; places: string[] }> => {
      if (!city || !country) return { images: [null, null, null], landmarks: [], places: [] };

      const { data, error } = await supabase.functions.invoke<CollageResponse>(
        "hero-collage",
        { body: { city, country, interests, primaryInterest } }
      );

      if (error) {
        console.error("hero-collage error:", error);
        return { images: [null, null, null], landmarks: [], places: [] };
      }

      return {
        images: data?.images ?? [null, null, null],
        landmarks: data?.landmarks ?? (data?.landmark ? [data.landmark] : []),
        places: data?.places ?? [],
      };
    },
    enabled: !!city && !!country,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
