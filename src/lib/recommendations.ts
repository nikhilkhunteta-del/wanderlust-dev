import { supabase } from "@/integrations/supabase/client";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation, RecommendationsResponse } from "@/types/recommendations";

export async function getDestinationRecommendations(
  profile: TravelProfile
): Promise<CityRecommendation[]> {
  const { data, error } = await supabase.functions.invoke<RecommendationsResponse>(
    "recommend-destinations",
    {
      body: { profile },
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

// City image URLs using Unsplash with specific queries
export function getCityImageUrl(imageQuery: string): string {
  const encoded = encodeURIComponent(imageQuery);
  return `https://source.unsplash.com/800x600/?${encoded}`;
}
