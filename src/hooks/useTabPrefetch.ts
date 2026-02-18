import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { getCityHighlights } from "@/lib/cityHighlights";
import { getSeasonalHighlights } from "@/lib/seasonalHighlights";
import { getCityWeather } from "@/lib/weather";
import { getTravelAdvisory } from "@/lib/travelAdvisory";
import { getHealthNotices } from "@/lib/healthNotices";
import { getSituationalAwareness } from "@/lib/situationalAwareness";
import { getOnTheGround } from "@/lib/onTheGround";
import { getFlightInsights } from "@/lib/flightInsights";
import { getStayInsights } from "@/lib/stayInsights";
import { getCityItinerary } from "@/lib/itinerary";
import { CityHighlightsRequest } from "@/types/cityHighlights";
import { FlightInsightsRequest } from "@/types/flightInsights";
import { ItineraryRequest } from "@/types/itinerary";

// Tab order for adjacency calculation
const TAB_ORDER = [
  "highlights",
  "itinerary",
  "seasonal",
  "weather",
  "flights",
  "stays",
  "ground",
  "health",
] as const;

type TabName = (typeof TAB_ORDER)[number];

// Cache config
const STALE_TIME = 5 * 60 * 1000;

interface PrefetchParams {
  city: string;
  country: string;
  travelMonth: string;
  highlightsRequest: CityHighlightsRequest | null;
  flightRequest: FlightInsightsRequest | null;
  itineraryRequest: ItineraryRequest | null;
}

export function useTabPrefetch(params: PrefetchParams) {
  const queryClient = useQueryClient();
  const { city, country, travelMonth, highlightsRequest, flightRequest, itineraryRequest } = params;

  const prefetchTab = useCallback(
    async (tabName: TabName) => {
      switch (tabName) {
        case "highlights":
          if (highlightsRequest) {
            queryClient.prefetchQuery({
              queryKey: ["city-highlights", highlightsRequest.city, highlightsRequest.country],
              queryFn: () => getCityHighlights(highlightsRequest),
              staleTime: STALE_TIME,
            });
          }
          break;

        case "itinerary":
          if (itineraryRequest) {
            queryClient.prefetchQuery({
              queryKey: [
                "city-itinerary",
                itineraryRequest.city,
                itineraryRequest.country,
                itineraryRequest.tripDuration,
                itineraryRequest.travelMonth,
                itineraryRequest.settings,
              ],
              queryFn: () => getCityItinerary(itineraryRequest),
              staleTime: STALE_TIME,
            });
          }
          break;

        case "seasonal":
          queryClient.prefetchQuery({
            queryKey: ["seasonal-highlights", city, country, travelMonth],
            queryFn: () => getSeasonalHighlights({ city, country, travelMonth }),
            staleTime: STALE_TIME,
          });
          break;

        case "weather":
          queryClient.prefetchQuery({
            queryKey: ["city-weather", city, country, travelMonth],
            queryFn: () => getCityWeather({ city, country, travelMonth }),
            staleTime: STALE_TIME,
          });
          break;

        case "flights":
          if (flightRequest) {
            queryClient.prefetchQuery({
              queryKey: [
                "flight-insights",
                flightRequest.departureCity,
                flightRequest.destinationCity,
                flightRequest.travelMonth,
              ],
              queryFn: () => getFlightInsights(flightRequest),
              staleTime: STALE_TIME,
            });
          }
          break;

        case "stays":
          queryClient.prefetchQuery({
            queryKey: ["stay-insights", city, country, travelMonth],
            queryFn: () => getStayInsights({ city, country, travelMonth }),
            staleTime: STALE_TIME,
          });
          break;

        case "ground":
          queryClient.prefetchQuery({
            queryKey: ["on-the-ground", city, country, travelMonth],
            queryFn: () => getOnTheGround({ city, country, travelMonth }),
            staleTime: STALE_TIME,
          });
          break;

        case "health":
          queryClient.prefetchQuery({
            queryKey: ["health-notices", city, country, travelMonth],
            queryFn: () => getHealthNotices({ city, country, travelMonth }),
            staleTime: STALE_TIME,
          });
          break;
      }
    },
    [queryClient, city, country, travelMonth, highlightsRequest, flightRequest]
  );

  const prefetchAdjacentTabs = useCallback(
    (currentTab: string) => {
      const currentIndex = TAB_ORDER.indexOf(currentTab as TabName);
      if (currentIndex === -1) return;

      // Prefetch previous and next tabs
      const adjacentIndices = [currentIndex - 1, currentIndex + 1].filter(
        (i) => i >= 0 && i < TAB_ORDER.length
      );

      adjacentIndices.forEach((index) => {
        const tabName = TAB_ORDER[index];
        // Only prefetch if not already in cache
        prefetchTab(tabName);
      });
    },
    [prefetchTab]
  );

  return { prefetchAdjacentTabs, prefetchTab };
}
