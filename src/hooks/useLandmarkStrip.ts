import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandmarkStripImage {
  url: string;
  smallUrl: string;
  photographer: string;
  photographerUrl: string;
  landmark: string;
  source: string;
}

interface StripResponse {
  images: (LandmarkStripImage | null)[];
  fromCache: boolean;
}

export function useLandmarkStrip(
  city: string | null,
  country: string | null,
  landmarks: string[] // expects landmarks #2-#6
) {
  return useQuery({
    queryKey: ["landmark-strip", city, landmarks.join(",")],
    queryFn: async (): Promise<(LandmarkStripImage | null)[]> => {
      if (!city || !country || landmarks.length === 0) return [];

      const { data, error } = await supabase.functions.invoke<StripResponse>(
        "landmark-strip",
        { body: { city, country, landmarks } }
      );

      if (error) {
        console.error("landmark-strip error:", error);
        return [];
      }

      return data?.images ?? [];
    },
    enabled: !!city && !!country && landmarks.length > 0,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
