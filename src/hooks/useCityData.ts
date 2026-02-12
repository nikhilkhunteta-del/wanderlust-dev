import { useQuery } from "@tanstack/react-query";
import { getCityHighlights } from "@/lib/cityHighlights";
import { getSeasonalHighlights } from "@/lib/seasonalHighlights";
import { getCityWeather } from "@/lib/weather";
import { getTravelAdvisory } from "@/lib/travelAdvisory";
import { getHealthNotices } from "@/lib/healthNotices";
import { getSituationalAwareness } from "@/lib/situationalAwareness";
import { getFlightInsights } from "@/lib/flightInsights";
import { getStayInsights } from "@/lib/stayInsights";
import { CityHighlightsRequest } from "@/types/cityHighlights";
import { FlightInsightsRequest } from "@/types/flightInsights";

// Cache for 10 minutes, consider stale after 5 minutes
const STALE_TIME = 5 * 60 * 1000;
const CACHE_TIME = 10 * 60 * 1000;

export function useCityHighlights(request: CityHighlightsRequest | null) {
  return useQuery({
    queryKey: ["city-highlights", request?.city, request?.country],
    queryFn: () => getCityHighlights(request!),
    enabled: !!request,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useSeasonalHighlights(city: string, country: string, travelMonth: string) {
  return useQuery({
    queryKey: ["seasonal-highlights", city, country, travelMonth],
    queryFn: () => getSeasonalHighlights({ city, country, travelMonth }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCityWeather(city: string, country: string, travelMonth: string) {
  return useQuery({
    queryKey: ["city-weather", city, country, travelMonth],
    queryFn: () => getCityWeather({ city, country, travelMonth }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useTravelAdvisory(city: string, country: string) {
  return useQuery({
    queryKey: ["travel-advisory", city, country],
    queryFn: () => getTravelAdvisory({ city, country }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useHealthNotices(city: string, country: string, travelMonth: string) {
  return useQuery({
    queryKey: ["health-notices", city, country, travelMonth],
    queryFn: () => getHealthNotices({ city, country, travelMonth }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useSituationalAwareness(city: string, country: string, travelMonth: string) {
  return useQuery({
    queryKey: ["situational-awareness", city, country, travelMonth],
    queryFn: () => getSituationalAwareness({ city, country, travelMonth }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useFlightInsights(request: FlightInsightsRequest | null) {
  return useQuery({
    queryKey: ["flight-insights", request?.departureCity, request?.destinationCity, request?.travelMonth],
    queryFn: () => getFlightInsights(request!),
    enabled: !!request && !!request.departureCity,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useStayInsights(city: string, country: string, travelMonth: string, departureCity?: string) {
  return useQuery({
    queryKey: ["stay-insights", city, country, travelMonth, departureCity],
    queryFn: () => getStayInsights({ city, country, travelMonth, departureCity }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}
