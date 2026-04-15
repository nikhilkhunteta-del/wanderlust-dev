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
}

export function useHeroCollage(
  city: string | null,
  country: string | null,
  interests: string[]
) {
  return useQuery({
    queryKey: ["hero-collage", city, country, interests.sort().join(",")],
    queryFn: async (): Promise<{ images: (CollageImage | null)[]; landmarks: string[] }> => {
      if (!city || !country) return { images: [null, null, null], landmarks: [] };

      const { data, error } = await supabase.functions.invoke<CollageResponse>(
        "hero-collage",
        { body: { city, country, interests } }
      );

      if (error) {
        console.error("hero-collage error:", error);
        return { images: [null, null, null], landmarks: [] };
      }

      return {
        images: data?.images ?? [null, null, null],
        landmarks: data?.landmarks ?? (data?.landmark ? [data.landmark] : []),
      };
    },
    enabled: !!city && !!country,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
