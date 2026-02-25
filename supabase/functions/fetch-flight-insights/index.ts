import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Step 1: City-to-primary-airport mapping
const CITY_AIRPORTS: Record<string, string> = {
  london: "LHR",
  "new york": "JFK",
  paris: "CDG",
  milan: "MXP",
  rome: "FCO",
  tokyo: "NRT",
  chicago: "ORD",
  "los angeles": "LAX",
  "san francisco": "SFO",
  bangkok: "BKK",
  istanbul: "IST",
  dubai: "DXB",
  amsterdam: "AMS",
  madrid: "MAD",
  berlin: "BER",
  sydney: "SYD",
  singapore: "SIN",
  "hong kong": "HKG",
  toronto: "YYZ",
  frankfurt: "FRA",
};

const CABIN_CLASS_MAP: Record<string, number> = {
  economy: 1,
  premium_economy: 2,
  business: 3,
  first: 4,
};

function getFirstMondayOfMonth(year: number, month: number): Date {
  // month is 1-indexed
  const date = new Date(year, month - 1, 1);
  const day = date.getDay();
  // day 0=Sun, 1=Mon...
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseMonth(monthStr: string): number {
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4,
    may: 5, june: 6, july: 7, august: 8,
    september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4,
    jun: 6, jul: 7, aug: 8,
    sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return months[monthStr.toLowerCase()] || 1;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      originCity,
      destinationCity,
      destinationAirport,
      travelMonth,
      travelYear,
      tripDuration = 7,
      passengers = 2,
      cabinClass = "economy",
      currency = "GBP",
    } = await req.json();

    if (!originCity || !destinationCity || !destinationAirport) {
      return new Response(
        JSON.stringify({ error: "originCity, destinationCity, and destinationAirport are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Resolve origin airport
    const originKey = originCity.toLowerCase().trim();
    const primaryAirportCode = CITY_AIRPORTS[originKey];

    if (!primaryAirportCode) {
      return new Response(
        JSON.stringify({ error: "Origin city airport not found", city: originCity }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate dates
    const monthNum = parseMonth(travelMonth);
    const year = parseInt(travelYear) || new Date().getFullYear();
    const outboundDate = getFirstMondayOfMonth(year, monthNum);
    const returnDate = new Date(outboundDate);
    returnDate.setDate(returnDate.getDate() + (tripDuration || 7));

    const outboundDateStr = formatDate(outboundDate);
    const returnDateStr = formatDate(returnDate);
    const travelClass = CABIN_CLASS_MAP[cabinClass] || 1;

    console.log(`Fetching flight data: ${primaryAirportCode} → ${destinationAirport}, ${outboundDateStr} to ${returnDateStr}, ${passengers} pax, class ${travelClass}`);

    // Step 2: SerpAPI call
    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) {
      throw new Error("SERPAPI_KEY is not configured");
    }

    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: primaryAirportCode,
      arrival_id: destinationAirport,
      outbound_date: outboundDateStr,
      return_date: returnDateStr,
      adults: passengers.toString(),
      travel_class: travelClass.toString(),
      currency: currency,
      api_key: SERPAPI_KEY,
    });

    const serpUrl = `https://serpapi.com/search?${params.toString()}`;
    const serpResponse = await fetch(serpUrl);

    if (!serpResponse.ok) {
      const errorText = await serpResponse.text();
      console.error("SerpAPI error:", serpResponse.status, errorText);
      throw new Error(`SerpAPI returned ${serpResponse.status}`);
    }

    const serpData = await serpResponse.json();

    // Extract structured data
    const priceInsights = serpData.price_insights || {};
    const bestFlights = serpData.best_flights || [];
    const bookingOptions = serpData.booking_options || [];

    const bestFlight = bestFlights[0] || null;
    let bestFlightData = null;

    if (bestFlight) {
      const flights = bestFlight.flights || [];
      const layovers = bestFlight.layovers || [];

      bestFlightData = {
        totalDuration: bestFlight.total_duration ?? null,
        stops: flights.length > 0 ? flights.length - 1 : 0,
        layoverAirports: layovers.map((l: any) => l.name || l.id || "Unknown"),
        airlines: flights.map((f: any) => f.airline || "Unknown"),
        carbonEmissions: bestFlight.carbon_emissions?.this_flight ?? null,
      };
    }

    const result = {
      route: {
        origin: { city: originCity, airport: primaryAirportCode },
        destination: { city: destinationCity, airport: destinationAirport },
      },
      pricing: {
        lowestPrice: priceInsights.lowest_price ?? null,
        priceLevel: priceInsights.price_level ?? null,
        typicalRange: priceInsights.typical_price_range ?? null,
        priceHistory: priceInsights.price_history ?? null,
      },
      bestFlight: bestFlightData,
      baggagePrices: bookingOptions[0]?.baggage_prices ?? null,
      currency: currency,
      searchDates: { outbound: outboundDateStr, return: returnDateStr },
      rawFlightsCount: bestFlights.length,
    };

    console.log(`Flight data fetched: ${primaryAirportCode} → ${destinationAirport}, lowest: ${result.pricing.lowestPrice}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Step 3: Error handling — always return structured object
    console.error("Error in fetch-flight-insights:", error);

    let originCity = "unknown";
    let destinationCity = "unknown";
    try {
      // Try to extract from the original request for error context
      // This is best-effort since we're in the catch block
    } catch (_) {}

    return new Response(
      JSON.stringify({
        error: "No flight data available",
        fallbackRequired: true,
        route: { origin: originCity, destination: destinationCity },
        detail: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
