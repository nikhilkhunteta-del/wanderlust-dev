import { supabase } from "@/integrations/supabase/client";

export interface BatchCityParams {
  city: string;
  country: string;
  rationale?: string;
  userInterests?: string[];
  adventureTypes?: string[];
  travelMonth: string;
  styleTags?: string[];
  travelCompanions?: string;
  groupType?: string;
  departureCity?: string;
  tripDuration?: number;
}

export interface BatchCityResult {
  city: string;
  country: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  highlights: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  weather: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flights: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onTheGround: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  seasonal: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stays: any;
}

export interface BatchCityDataResponse {
  results: BatchCityResult[];
}

export async function getBatchCityData(cities: BatchCityParams[]): Promise<BatchCityDataResponse> {
  const { data, error } = await supabase.functions.invoke<BatchCityDataResponse>(
    "batch-city-data",
    { body: { cities } },
  );

  if (error) {
    console.error("Error calling batch-city-data:", error);
    throw new Error("Failed to load comparison data.");
  }

  if (!data) {
    throw new Error("No data returned from batch-city-data");
  }

  return data;
}
