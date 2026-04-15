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
      if (!city) return [];

      const resolvedCountry = country || city;

      const { data, error } = await supabase.functions.invoke<{ stats: CityStat[] }>(
        "get-city-stats",
        { body: { city, country: resolvedCountry, primaryInterest } }
      );

      if (error) {
        console.error("get-city-stats error:", error);
        return [];
      }

      return data?.stats ?? [];
    },
    enabled: !!city,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
