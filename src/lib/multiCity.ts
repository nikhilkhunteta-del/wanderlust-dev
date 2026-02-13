import { supabase } from "@/integrations/supabase/client";
import { MultiCityRequest, MultiCityRoute } from "@/types/multiCity";

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
