import { supabase } from "@/integrations/supabase/client";
import { SituationalAwarenessData } from "@/types/situationalAwareness";

interface GetSituationalAwarenessParams {
  city: string;
  country: string;
  travelMonth: string;
}

export async function getSituationalAwareness({
  city,
  country,
  travelMonth,
}: GetSituationalAwarenessParams): Promise<SituationalAwarenessData> {
  const { data, error } = await supabase.functions.invoke("situational-awareness", {
    body: { city, country, travelMonth },
  });

  if (error) {
    console.error("Situational awareness function error:", error);
    throw new Error(error.message || "Failed to fetch situational awareness");
  }

  if (!data) {
    throw new Error("No data returned from situational awareness function");
  }

  return data as SituationalAwarenessData;
}
