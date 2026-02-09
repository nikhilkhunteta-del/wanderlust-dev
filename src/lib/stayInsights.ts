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

export interface HotelSearchParams {
  city: string;
  country: string;
  checkinDate: Date;
  checkoutDate: Date;
  adults: number;
  children: number;
  area?: string;
}

export function buildGoogleHotelsSearchUrl(params: HotelSearchParams): string {
  const { city, country, checkinDate, checkoutDate, adults, children, area } = params;
  const checkin = `${checkinDate.getFullYear()}-${String(checkinDate.getMonth() + 1).padStart(2, "0")}-${String(checkinDate.getDate()).padStart(2, "0")}`;
  const checkout = `${checkoutDate.getFullYear()}-${String(checkoutDate.getMonth() + 1).padStart(2, "0")}-${String(checkoutDate.getDate()).padStart(2, "0")}`;

  let query = `${city}, ${country}`;
  if (area) {
    const areaLabels: Record<string, string> = {
      city_center: "city centre",
      beach: "near beach",
      quiet: "quiet area",
    };
    query += ` ${areaLabels[area] || ""}`;
  }

  const destination = encodeURIComponent(query.trim());
  const guestCount = adults + children;

  return `https://www.google.com/travel/hotels?q=${destination}&dates=${checkin}to${checkout}&ap=guests${guestCount}`;
}
