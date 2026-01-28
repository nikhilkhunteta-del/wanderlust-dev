import { supabase } from "@/integrations/supabase/client";
import { HealthNoticesData } from "@/types/healthNotices";

interface GetHealthNoticesParams {
  city: string;
  country: string;
  travelMonth: string;
}

export async function getHealthNotices({
  city,
  country,
  travelMonth,
}: GetHealthNoticesParams): Promise<HealthNoticesData> {
  const { data, error } = await supabase.functions.invoke("health-notices", {
    body: { city, country, travelMonth },
  });

  if (error) {
    console.error("Health notices function error:", error);
    throw new Error(error.message || "Failed to fetch health notices");
  }

  if (!data) {
    throw new Error("No data returned from health notices function");
  }

  return data as HealthNoticesData;
}
