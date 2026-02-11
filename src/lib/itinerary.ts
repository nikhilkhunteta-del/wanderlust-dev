import { supabase } from "@/integrations/supabase/client";
import { CityItinerary, ItineraryRequest } from "@/types/itinerary";

export async function getCityItinerary(
  request: ItineraryRequest
): Promise<CityItinerary> {
  const { data, error } = await supabase.functions.invoke(
    "city-itinerary",
    {
      body: request,
    }
  );

  if (error) {
    console.error("Error calling city-itinerary function:", error);
    throw new Error("Failed to generate itinerary. Please try again.");
  }

  if (!data) {
    throw new Error("No itinerary data received");
  }

  // Per-day regeneration returns { regeneratedDay: ... }
  // Full generation returns the full itinerary
  return data;
}
