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
}

export function useHeroCollage(
  city: string | null,
  country: string | null,
  interests: string[]
) {
  return useQuery({
    queryKey: ["hero-collage", city, country, interests.sort().join(",")],
    queryFn: async (): Promise<(CollageImage | null)[]> => {
      if (!city || !country) return [null, null, null, null];

      const { data, error } = await supabase.functions.invoke<CollageResponse>(
        "hero-collage",
        { body: { city, country, interests } }
      );

      if (error) {
        console.error("hero-collage error:", error);
        return [null, null, null, null];
      }

      return data?.images ?? [null, null, null, null];
    },
    enabled: !!city && !!country,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
