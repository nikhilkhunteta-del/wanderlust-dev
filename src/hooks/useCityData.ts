import { useQuery } from "@tanstack/react-query";
import { getCityHighlights } from "@/lib/cityHighlights";
import { getSeasonalHighlights } from "@/lib/seasonalHighlights";
import { getCityWeather } from "@/lib/weather";
import { getTravelAdvisory } from "@/lib/travelAdvisory";
import { getHealthNotices } from "@/lib/healthNotices";
import { fetchHealthData } from "@/lib/healthData";
import { getSituationalAwareness } from "@/lib/situationalAwareness";
import { getOnTheGround } from "@/lib/onTheGround";
import { getFlightInsights } from "@/lib/flightInsights";
import { getStayInsights } from "@/lib/stayInsights";
import { getCityItinerary } from "@/lib/itinerary";
import { getMultiCityItinerary } from "@/lib/multiCity";
import { getBatchCityData, BatchCityParams } from "@/lib/batchCityData";
import { CityHighlightsRequest } from "@/types/cityHighlights";
import { FlightInsightsRequest } from "@/types/flightInsights";
import { ItineraryRequest, CityItinerary } from "@/types/itinerary";
import { MultiCityItineraryRequest, MultiCityItinerary } from "@/types/multiCity";

// AI-generated content: never refetch automatically
const STALE_TIME = 30 * 60 * 1000;
const CACHE_TIME = 60 * 60 * 1000;

export function useCityHighlights(request: CityHighlightsRequest | null) {
  return useQuery({
    queryKey: ["city-highlights", request?.city, request?.country],
    queryFn: () => getCityHighlights(request!),
    enabled: !!request,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useSeasonalHighlights(
  city: string,
  country: string,
  travelMonth: string,
  userInterests?: string[],
  travelCompanions?: string,
  styleTags?: string[],
) {
  return useQuery({
    queryKey: ["seasonal-highlights", city, country, travelMonth, userInterests, travelCompanions],
    queryFn: () => getSeasonalHighlights({ city, country, travelMonth, userInterests, travelCompanions, styleTags }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCityWeather(city: string, country: string, travelMonth: string, primaryInterest?: string) {
  return useQuery({
    queryKey: ["city-weather", "v2-stats", city, country, travelMonth, primaryInterest],
    queryFn: () => getCityWeather({ city, country, travelMonth, primaryInterest }),
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

export function useHealthData(city: string, country: string, travelMonth: string) {
  return useQuery({
    queryKey: ["health-data", city, country, travelMonth],
    queryFn: () => fetchHealthData({ city, country, travelMonth }),
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

export function useOnTheGround(city: string, country: string, travelMonth: string) {
  return useQuery({
    queryKey: ["on-the-ground", city, country, travelMonth],
    queryFn: () => getOnTheGround({ city, country, travelMonth }),
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

export function useStayInsights(
  city: string, country: string, travelMonth: string, departureCity?: string,
  travelCompanions?: string, groupType?: string, tripDuration?: number,
  styleTags?: string[], travelPace?: number,
) {
  return useQuery({
    queryKey: ["stay-insights", city, country, travelMonth, departureCity],
    queryFn: () => getStayInsights({ city, country, travelMonth, departureCity, travelCompanions, groupType, tripDuration, styleTags, travelPace }),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useCityItinerary(request: ItineraryRequest | null) {
  return useQuery<CityItinerary>({
    queryKey: [
      "city-itinerary",
      request?.city,
      request?.country,
      request?.tripDuration,
      request?.travelMonth,
      request?.settings,
    ],
    queryFn: () => getCityItinerary(request!),
    enabled: !!request,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useMultiCityItinerary(request: MultiCityItineraryRequest | null) {
  return useQuery<MultiCityItinerary>({
    queryKey: [
      "multi-city-itinerary",
      request?.route?.totalDays,
      request?.route?.stops?.map((s) => s.city).join(","),
    ],
    queryFn: () => getMultiCityItinerary(request!),
    enabled: !!request,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}

export function useBatchCityData(cities: BatchCityParams[], enabled = true) {
  return useQuery({
    queryKey: [
      "batch-city-data",
      cities.map((c) => `${c.city}:${c.country}`).join(","),
      cities[0]?.travelMonth,
    ],
    queryFn: () => getBatchCityData(cities),
    enabled: enabled && cities.length > 0,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
  });
}
