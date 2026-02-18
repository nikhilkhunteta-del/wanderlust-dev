import { supabase } from "@/integrations/supabase/client";
import { OnTheGroundData } from "@/types/onTheGround";

interface GetOnTheGroundParams {
  city: string;
  country: string;
  travelMonth: string;
}

export async function getOnTheGround({
  city,
  country,
  travelMonth,
}: GetOnTheGroundParams): Promise<OnTheGroundData> {
  const { data, error } = await supabase.functions.invoke("on-the-ground", {
    body: { city, country, travelMonth },
  });

  if (error) {
    console.error("On the ground function error:", error);
    throw new Error(error.message || "Failed to fetch on-the-ground data");
  }

  if (!data) {
    throw new Error("No data returned from on-the-ground function");
  }

  return data as OnTheGroundData;
}
