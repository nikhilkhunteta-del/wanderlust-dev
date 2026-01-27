import { supabase } from "@/integrations/supabase/client";
import { CityHighlights, CityHighlightsRequest } from "@/types/cityHighlights";

export async function getCityHighlights(
  request: CityHighlightsRequest
): Promise<CityHighlights> {
  const { data, error } = await supabase.functions.invoke<CityHighlights>(
    "city-highlights",
    {
      body: request,
    }
  );

  if (error) {
    console.error("Error calling city-highlights function:", error);
    throw new Error("Failed to get city highlights. Please try again.");
  }

  if (!data) {
    throw new Error("No highlights data received");
  }

  return data;
}

export function getExperienceImageUrl(imageQuery: string): string {
  const encoded = encodeURIComponent(imageQuery);
  return `https://source.unsplash.com/600x400/?${encoded}`;
}

export function getHeroImageUrl(imageQuery: string): string {
  const encoded = encodeURIComponent(imageQuery);
  return `https://source.unsplash.com/1600x900/?${encoded}`;
}
