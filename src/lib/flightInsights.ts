import { supabase } from "@/integrations/supabase/client";
import { FlightInsightsData, FlightInsightsRequest } from "@/types/flightInsights";

export async function getFlightInsights(
  request: FlightInsightsRequest
): Promise<FlightInsightsData> {
  const { data, error } = await supabase.functions.invoke<FlightInsightsData>(
    "flight-insights",
    {
      body: request,
    }
  );

  if (error) {
    console.error("Error calling flight-insights function:", error);
    throw new Error("Failed to get flight insights. Please try again.");
  }

  if (!data) {
    throw new Error("No flight insights data received");
  }

  return data;
}

interface FlightSearchParams {
  originAirport: string;
  destinationAirport: string;
  departureDate: Date;
  returnDate: Date;
  passengers: number;
  cabinClass: "economy" | "premium_economy" | "business" | "first";
}

const CABIN_CLASS_MAP: Record<string, string> = {
  economy: "e",
  premium_economy: "p",
  business: "b",
  first: "f",
};

export function buildGoogleFlightsSearchUrl({
  originAirport,
  destinationAirport,
  departureDate,
  returnDate,
  passengers,
  cabinClass,
}: FlightSearchParams): string {
  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const departDateStr = formatDate(departureDate);
  const returnDateStr = formatDate(returnDate);
  const cabinParam = CABIN_CLASS_MAP[cabinClass] || "e";

  // Build Google Flights URL
  // Format: /travel/flights/search?tfs=... with structured parameters
  // Using the simpler query-based format that Google redirects to search
  const baseUrl = "https://www.google.com/travel/flights";
  const query = `Flights from ${originAirport} to ${destinationAirport} on ${departDateStr} through ${returnDateStr}`;
  
  const params = new URLSearchParams({
    q: query,
    curr: "USD",
  });

  // Add passengers if more than 1
  if (passengers > 1) {
    params.append("px", passengers.toString());
  }

  // Add cabin class if not economy
  if (cabinClass !== "economy") {
    params.append("sc", cabinParam);
  }

  return `${baseUrl}?${params.toString()}`;
}

// Legacy function for backward compatibility (used by edge function)
export function buildGoogleFlightsUrl(
  departureCity: string,
  destinationCity: string,
  travelMonth: string
): string {
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
  };
  
  const monthNum = monthMap[travelMonth.toLowerCase()] || "01";
  const year = new Date().getFullYear();
  const targetYear = new Date().getMonth() + 1 > parseInt(monthNum) ? year + 1 : year;
  
  const departDate = `${targetYear}-${monthNum}-15`;
  const returnDateStr = `${targetYear}-${monthNum}-22`;
  
  const origin = encodeURIComponent(departureCity);
  const destination = encodeURIComponent(destinationCity);
  
  return `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departDate}%20through%20${returnDateStr}`;
}
