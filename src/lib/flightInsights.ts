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

export function buildGoogleFlightsUrl(
  departureCity: string,
  destinationCity: string,
  travelMonth: string
): string {
  // Build a Google Flights URL with prefilled parameters
  const monthMap: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
  };
  
  const monthNum = monthMap[travelMonth.toLowerCase()] || "01";
  const year = new Date().getFullYear();
  const targetYear = new Date().getMonth() + 1 > parseInt(monthNum) ? year + 1 : year;
  
  // Format: mid-month departure, 7 days trip
  const departDate = `${targetYear}-${monthNum}-15`;
  const returnDate = `${targetYear}-${monthNum}-22`;
  
  const origin = encodeURIComponent(departureCity);
  const destination = encodeURIComponent(destinationCity);
  
  return `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${destination}%20on%20${departDate}%20through%20${returnDate}`;
}
