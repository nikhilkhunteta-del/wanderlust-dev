import { supabase } from "@/integrations/supabase/client";
import { SeasonalHighlightsData, SeasonalHighlightsRequest } from "@/types/seasonalHighlights";

export async function getSeasonalHighlights(
  request: SeasonalHighlightsRequest
): Promise<SeasonalHighlightsData> {
  const { data, error } = await supabase.functions.invoke<SeasonalHighlightsData>(
    "seasonal-search",
    {
      body: {
        ...request,
        travelYear: request.travelYear || new Date().getFullYear(),
      },
    }
  );

  if (error) {
    console.error("Error calling seasonal-search function:", error);
    throw new Error("Failed to get seasonal highlights. Please try again.");
  }

  if (!data) {
    throw new Error("No seasonal highlights data received");
  }

  return data;
}
