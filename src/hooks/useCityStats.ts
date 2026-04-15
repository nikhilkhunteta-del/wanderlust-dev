import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CityStat {
  stat: string;
  description: string;
}

export function useCityStats(city: string | null, country: string | null, primaryInterest: string) {
  return useQuery({
    queryKey: ["city-stats", city, country, primaryInterest],
    queryFn: async (): Promise<CityStat[]> => {
      if (!city || !country) return [];

      const { data, error } = await supabase.functions.invoke<{ stats: CityStat[] }>(
        "get-city-stats",
        { body: { city, country, primaryInterest } }
      );

      if (error) {
        console.error("get-city-stats error:", error);
        return [];
      }

      return data?.stats ?? [];
    },
    enabled: !!city && !!country,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
