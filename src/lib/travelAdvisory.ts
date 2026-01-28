import { supabase } from "@/integrations/supabase/client";
import { TravelAdvisory } from "@/types/travelAdvisory";

interface GetTravelAdvisoryParams {
  city: string;
  country: string;
}

export async function getTravelAdvisory({
  city,
  country,
}: GetTravelAdvisoryParams): Promise<TravelAdvisory> {
  const { data, error } = await supabase.functions.invoke("travel-advisory", {
    body: { city, country },
  });

  if (error) {
    console.error("Travel advisory function error:", error);
    throw new Error(error.message || "Failed to fetch travel advisory");
  }

  if (!data) {
    throw new Error("No data returned from travel advisory function");
  }

  return data as TravelAdvisory;
}
