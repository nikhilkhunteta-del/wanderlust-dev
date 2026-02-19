import { supabase } from "@/integrations/supabase/client";
import { HealthData } from "@/types/healthData";

interface FetchHealthDataParams {
  city: string;
  country: string;
  travelMonth: string;
}

export async function fetchHealthData({
  city,
  country,
  travelMonth,
}: FetchHealthDataParams): Promise<HealthData> {
  const { data, error } = await supabase.functions.invoke("fetch-health-data", {
    body: { city, country, travelMonth },
  });

  if (error) {
    console.error("Health data function error:", error);
    throw new Error(error.message || "Failed to fetch health data");
  }

  if (!data) {
    throw new Error("No data returned from health data function");
  }

  return data as HealthData;
}
