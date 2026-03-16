import { supabase } from "@/integrations/supabase/client";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation, RecommendationsResponse } from "@/types/recommendations";

export async function getDestinationRecommendations(
  profile: TravelProfile,
  excludedCities?: string[],
  previouslyRecommendedCities?: string[]
): Promise<CityRecommendation[]> {
  const { data, error } = await supabase.functions.invoke<RecommendationsResponse>(
    "recommend-destinations",
    {
      body: { profile, excludedCities, previouslyRecommendedCities },
    }
  );

  if (error) {
    console.error("Error calling recommendation function:", error);
    throw new Error("Failed to get recommendations. Please try again.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.recommendations) {
    throw new Error("No recommendations received");
  }

  return data.recommendations;
}
