import { supabase } from "@/integrations/supabase/client";
import { MultiCityRequest, MultiCityRoute, MultiCityItinerary, MultiCityItineraryRequest } from "@/types/multiCity";

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
