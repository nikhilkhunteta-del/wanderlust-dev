import { supabase } from "@/integrations/supabase/client";
import { StayInsightsData, StayInsightsRequest } from "@/types/stayInsights";

export async function getStayInsights(
  request: StayInsightsRequest
): Promise<StayInsightsData> {
  const { data, error } = await supabase.functions.invoke<StayInsightsData>(
    "stay-insights",
    {
      body: request,
    }
  );

  if (error) {
    console.error("Error calling stay-insights function:", error);
    throw new Error("Failed to get stay insights. Please try again.");
  }

  if (!data) {
    throw new Error("No stay insights data received");
  }

  return data;
}

export function buildBookingUrl(city: string, country: string, travelMonth: string): string {
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
  };
  
  const monthNum = monthMap[travelMonth.toLowerCase()] || "01";
  const year = new Date().getFullYear();
  const targetYear = new Date().getMonth() + 1 > parseInt(monthNum) ? year + 1 : year;
  
  const checkin = `${targetYear}-${monthNum}-15`;
  const checkout = `${targetYear}-${monthNum}-17`;
  
  const destination = encodeURIComponent(`${city}, ${country}`);
  
  return `https://www.google.com/travel/hotels?q=${destination}&dates=${checkin}to${checkout}`;
}
