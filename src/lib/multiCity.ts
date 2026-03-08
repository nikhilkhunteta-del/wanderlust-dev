import { supabase } from "@/integrations/supabase/client";
import {
  MultiCityRequest,
  MultiCityRoute,
  MultiCityItinerary,
  MultiCityItineraryRequest,
  NearbyCityDiscoveryResponse,
  NearbyCityOption,
} from "@/types/multiCity";

export async function discoverNearbyCities(
  request: MultiCityRequest
): Promise<NearbyCityDiscoveryResponse> {
  const { data, error } = await supabase.functions.invoke("multi-city-route", {
    body: request,
  });

  if (error) {
    console.error("Error calling multi-city-route:", error);
    throw new Error("Failed to discover nearby cities.");
  }

  return {
    suggestions: data?.suggestions || [],
    mainCityDays: data?.mainCityDays || request.totalDays,
  };
}

/** Build a MultiCityRoute from a selected nearby city suggestion */
export function buildRouteFromSuggestion(
  originCity: string,
  originCountry: string,
  totalDays: number,
  suggestion: NearbyCityOption,
  mainCityDays: number
): MultiCityRoute {
  return {
    stops: [
      {
        city: originCity,
        country: originCountry,
        days: mainCityDays,
        highlights: [],
        lat: 0,
        lng: 0,
      },
      {
        city: suggestion.city,
        country: suggestion.country,
        days: suggestion.suggestedDays || 2,
        highlights: [],
        lat: 0,
        lng: 0,
      },
    ],
    legs: [
      {
        from: originCity,
        to: suggestion.city,
        travelTime: suggestion.journeyTime,
        transportMode: suggestion.transportMode,
        distanceKm: suggestion.distanceKm,
      },
    ],
    totalDays,
    routeRationale: suggestion.whyItMatches,
  };
}

export async function getMultiCityRoute(
  request: MultiCityRequest
): Promise<{ route: MultiCityRoute }> {
  const { data, error } = await supabase.functions.invoke("multi-city-route", {
    body: request,
  });

  if (error) {
    console.error("Error calling multi-city-route:", error);
    throw new Error("Failed to generate multi-city route.");
  }

  if (!data?.route) {
    throw new Error("No route data received");
  }

  return data;
}

export async function getMultiCityItinerary(
  request: MultiCityItineraryRequest
): Promise<MultiCityItinerary> {
  const { data, error } = await supabase.functions.invoke("multi-city-itinerary", {
    body: request,
  });

  if (error) {
    console.error("Error calling multi-city-itinerary:", error);
    throw new Error("Failed to generate multi-city itinerary.");
  }

  if (!data?.days) {
    throw new Error("No itinerary data received");
  }

  return data;
}
