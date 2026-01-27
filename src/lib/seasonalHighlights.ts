import { supabase } from "@/integrations/supabase/client";
import { SeasonalHighlightsData, SeasonalHighlightsRequest } from "@/types/seasonalHighlights";

export async function getSeasonalHighlights(
  request: SeasonalHighlightsRequest
): Promise<SeasonalHighlightsData> {
  const { data, error } = await supabase.functions.invoke<SeasonalHighlightsData>(
    "seasonal-highlights",
    {
      body: request,
    }
  );

  if (error) {
    console.error("Error calling seasonal-highlights function:", error);
    throw new Error("Failed to get seasonal highlights. Please try again.");
  }

  if (!data) {
    throw new Error("No seasonal highlights data received");
  }

  return data;
}

export function getSeasonalImageUrl(imageQuery: string): string {
  const encoded = encodeURIComponent(imageQuery);
  return `https://source.unsplash.com/600x400/?${encoded}`;
}
