import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Multi-airport mapping per city
const CITY_AIRPORTS: Record<string, string[]> = {
  london: ["LHR", "LGW", "STN", "LTN", "SEN"],
  "new york": ["JFK", "EWR", "LGA"],
  paris: ["CDG", "ORY"],
  milan: ["MXP", "LIN", "BGY"],
  rome: ["FCO", "CIA"],
  tokyo: ["NRT", "HND"],
  chicago: ["ORD", "MDW"],
  "los angeles": ["LAX", "BUR", "LGB", "ONT", "SNA"],
  "san francisco": ["SFO", "OAK", "SJC"],
  bangkok: ["BKK", "DMK"],
  istanbul: ["IST", "SAW"],
  dubai: ["DXB", "DWC"],
  moscow: ["SVO", "DME", "VKO"],
  amsterdam: ["AMS"],
  madrid: ["MAD"],
  berlin: ["BER"],
  sydney: ["SYD"],
  singapore: ["SIN"],
  "hong kong": ["HKG"],
  toronto: ["YYZ"],
  frankfurt: ["FRA"],
};

const CABIN_CLASS_MAP: Record<string, number> = {
  economy: 1,
  premium_economy: 2,
  business: 3,
  first: 4,
};

const SAVING_THRESHOLDS: Record<string, number> = {
  GBP: 75, EUR: 90, USD: 100, INR: 8000, AUD: 150, CAD: 130,
  SGD: 130, HKD: 780, JPY: 15000, THB: 3500, AED: 370, TRY: 3200,
};

const LONG_HAUL_THRESHOLDS: Record<string, number> = {
  GBP: 150, EUR: 175, USD: 200, INR: 16000, AUD: 300, CAD: 260,
  SGD: 260, HKD: 1560, JPY: 30000, THB: 7000, AED: 740, TRY: 6400,
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getFirstMondayOfMonth(year: number, month: number): Date {
  const date = new Date(year, month - 1, 1);
  const day = date.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  date.setDate(date.getDate() + daysUntilMonday);
  return date;
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

function getMonthName(monthNum: number): string {
  const names = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  return names[monthNum - 1] || "January";
}

function extractBestFlight(serpData: any) {
  const bestFlights = serpData.best_flights || [];
  const bf = bestFlights[0];
  if (!bf) return null;
  const flights = bf.flights || [];
  const layovers = bf.layovers || [];
  return {
    totalDuration: bf.total_duration ?? null,
    stops: flights.length > 0 ? flights.length - 1 : 0,
    layoverAirports: layovers.map((l: any) => l.name || l.id || "Unknown"),
    airlines: flights.map((f: any) => f.airline || "Unknown"),
    carbonEmissions: bf.carbon_emissions?.this_flight ?? null,
  };
}

async function callSerpAPI(
  apiKey: string,
  departureId: string,
  arrivalId: string,
  outboundDate: string,
  returnDate: string,
  passengers: number,
  travelClass: number,
  currency: string,
): Promise<any> {
  const params = new URLSearchParams({
    engine: "google_flights",
    departure_id: departureId,
    arrival_id: arrivalId,
    outbound_date: outboundDate,
    return_date: returnDate,
    adults: passengers.toString(),
    travel_class: travelClass.toString(),
    currency,
    api_key: apiKey,
  });
  const resp = await fetch(`https://serpapi.com/search?${params.toString()}`);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`SerpAPI ${resp.status}: ${txt}`);
  }
  return resp.json();
}

interface AlternativeAirport {
  iata: string;
  city: string;
  transferTimeMinutes: number;
  transferCost: string;
  transferMode: string;
}

async function queryAlternativeDestinationAirports(
  perplexityKey: string,
  destinationCity: string,
  destinationCountry: string,
  destinationAirport: string,
): Promise<AlternativeAirport[]> {
  try {
    const query = `What are all commercial airports within 350km of ${destinationCity}, ${destinationCountry}? For each airport return: IATA code, city name, approximate ground transfer time to ${destinationCity} in minutes by the fastest available road or rail option, approximate transfer cost in local currency, and the primary transfer mode (taxi / train / bus). Exclude ${destinationAirport}. Return as a JSON array only with keys: iata, city, transferTimeMinutes, transferCost, transferMode. No other text.`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Return only valid JSON arrays. No markdown, no explanation." },
          { role: "user", content: query },
        ],
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      console.error("Perplexity error:", resp.status);
      return [];
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("Perplexity: no JSON array found in response");
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]) as AlternativeAirport[];

    // Filter: under 180 minutes transfer, exclude destination airport
    return parsed.filter(
      (a) =>
        a.iata &&
        a.iata !== destinationAirport &&
        typeof a.transferTimeMinutes === "number" &&
        a.transferTimeMinutes < 180
    );
  } catch (err) {
    console.error("Perplexity alternative airports failed:", err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      originCity,
      destinationCity,
      destinationCountry = "",
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

    const originKey = originCity.toLowerCase().trim();
    const originAirports = CITY_AIRPORTS[originKey];
    if (!originAirports) {
      return new Response(
        JSON.stringify({ error: "Origin city airport not found", city: originCity }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY is not configured");

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    const monthNum = parseMonth(travelMonth);
    const year = parseInt(travelYear) || new Date().getFullYear();
    const monthName = getMonthName(monthNum);
    const outboundDate = getFirstMondayOfMonth(year, monthNum);
    const returnDate = new Date(outboundDate);
    returnDate.setDate(returnDate.getDate() + tripDuration);
    const outboundDateStr = formatDate(outboundDate);
    const returnDateStr = formatDate(returnDate);
    const travelClass = CABIN_CLASS_MAP[cabinClass] || 1;

    console.log(`Multi-airport fetch: ${originAirports.join(",")} → ${destinationAirport}, ${outboundDateStr}–${returnDateStr}`);

    // === Run origin airport calls AND Perplexity alt-destination query in parallel ===
    const [originSettled, alternativeAirports] = await Promise.all([
      Promise.allSettled(
        originAirports.map((apt) =>
          callSerpAPI(SERPAPI_KEY, apt, destinationAirport, outboundDateStr, returnDateStr, passengers, travelClass, currency)
            .then((data) => ({ airport: apt, data }))
        )
      ),
      PERPLEXITY_API_KEY
        ? queryAlternativeDestinationAirports(PERPLEXITY_API_KEY, destinationCity, destinationCountry || destinationCity, destinationAirport)
        : Promise.resolve([]),
    ]);

    // Process origin results (unchanged from Prompt 2)
    const originResults: any[] = [];
    for (const result of originSettled) {
      if (result.status !== "fulfilled") continue;
      const { airport, data } = result.value;
      const pi = data.price_insights;
      if (!pi?.lowest_price) continue;
      originResults.push({
        airport,
        lowestPrice: pi.lowest_price,
        priceLevel: pi.price_level ?? null,
        typicalRange: pi.typical_price_range ?? null,
        bestFlight: extractBestFlight(data),
      });
    }

    originResults.sort((a, b) => a.lowestPrice - b.lowestPrice);

    const primaryAirport = originAirports[0];
    const primaryResult = originResults.find((r) => r.airport === primaryAirport);
    const cheapestResult = originResults[0] || null;

    const primaryOrigin = primaryResult
      ? { airport: primaryResult.airport, lowestPrice: primaryResult.lowestPrice }
      : { airport: primaryAirport, lowestPrice: null };

    const cheapestOrigin = cheapestResult
      ? { airport: cheapestResult.airport, lowestPrice: cheapestResult.lowestPrice, airlines: cheapestResult.bestFlight?.airlines ?? [] }
      : null;

    const savingThreshold = SAVING_THRESHOLDS[currency.toUpperCase()] ?? 75;
    let originSaving = 0;
    let originSavingOpportunity = false;
    if (cheapestOrigin && primaryOrigin.lowestPrice && cheapestOrigin.airport !== primaryOrigin.airport) {
      originSaving = primaryOrigin.lowestPrice - cheapestOrigin.lowestPrice;
      originSavingOpportunity = originSaving >= savingThreshold;
    }

    const mainSerpData = cheapestResult || primaryResult;
    const mainPricing = mainSerpData
      ? { lowestPrice: mainSerpData.lowestPrice, priceLevel: mainSerpData.priceLevel, typicalRange: mainSerpData.typicalRange, priceHistory: null }
      : { lowestPrice: null, priceLevel: null, typicalRange: null, priceHistory: null };
    const mainBestFlight = mainSerpData?.bestFlight ?? null;

    // === Weekly pricing (unchanged from Prompt 2) ===
    const cheapestApt = cheapestOrigin?.airport || primaryAirport;
    const weekDays = [3, 10, 17, 24];
    const weekLabels = [`Early ${monthName}`, `Mid-early ${monthName}`, `Mid-late ${monthName}`, `Late ${monthName}`];

    console.log(`Weekly pricing calls from ${cheapestApt} for weeks: ${weekDays.join(",")}`);

    const weeklySettled = await Promise.allSettled(
      weekDays.map((day) => {
        const wOutbound = new Date(year, monthNum - 1, day);
        const wReturn = new Date(wOutbound);
        wReturn.setDate(wReturn.getDate() + tripDuration);
        return callSerpAPI(SERPAPI_KEY, cheapestApt, destinationAirport, formatDate(wOutbound), formatDate(wReturn), passengers, travelClass, currency)
          .then((data) => ({ day, data }));
      })
    );

    const weeklyPricing = weekDays.map((day, i) => {
      const settled = weeklySettled[i];
      let lowestPrice: number | null = null;
      if (settled.status === "fulfilled") {
        lowestPrice = settled.value.data.price_insights?.lowest_price ?? null;
      }
      const monthShort = monthName.slice(0, 3);
      return { week: weekLabels[i], date: `${monthShort} ${day}`, lowestPrice };
    });

    const validWeeks = weeklyPricing.filter((w) => w.lowestPrice !== null);
    const bestWeek = validWeeks.length > 0
      ? validWeeks.reduce((a, b) => (a.lowestPrice! < b.lowestPrice! ? a : b))
      : null;
    const worstWeek = validWeeks.length > 0
      ? validWeeks.reduce((a, b) => (a.lowestPrice! > b.lowestPrice! ? a : b))
      : null;

    // === Addition 3: Alternative destination airport pricing ===
    console.log(`Perplexity found ${alternativeAirports.length} alternative destination airports: ${alternativeAirports.map((a) => a.iata).join(",")}`);

    let destSavingOpportunities: any[] = [];
    const alternativeAirportsChecked = alternativeAirports.length;

    if (alternativeAirports.length > 0 && mainPricing.lowestPrice) {
      const altSettled = await Promise.allSettled(
        alternativeAirports.map((alt) =>
          callSerpAPI(SERPAPI_KEY, cheapestApt, alt.iata, outboundDateStr, returnDateStr, passengers, travelClass, currency)
            .then((data) => ({ alt, data }))
        )
      );

      const isLongHaul = (mainBestFlight?.totalDuration ?? 0) > 300;
      const destThreshold = isLongHaul
        ? (LONG_HAUL_THRESHOLDS[currency.toUpperCase()] ?? 150)
        : (SAVING_THRESHOLDS[currency.toUpperCase()] ?? 75);

      const candidates: any[] = [];
      for (const settled of altSettled) {
        if (settled.status !== "fulfilled") continue;
        const { alt, data } = settled.value;
        const altPrice = data.price_insights?.lowest_price;
        if (!altPrice) continue;

        const priceSaving = mainPricing.lowestPrice! - altPrice;
        if (priceSaving < destThreshold) continue;

        const altBestFlight = extractBestFlight(data);
        candidates.push({
          airport: alt.iata,
          city: alt.city,
          priceSaving,
          lowestPrice: altPrice,
          groundTransferMinutes: alt.transferTimeMinutes,
          transferCost: alt.transferCost,
          transferMode: alt.transferMode,
          airlines: altBestFlight?.airlines ?? [],
        });
      }

      // Keep top 2 by priceSaving descending
      candidates.sort((a, b) => b.priceSaving - a.priceSaving);
      destSavingOpportunities = candidates.slice(0, 2);
    }

    const result = {
      route: {
        origin: { city: originCity, airport: cheapestApt },
        destination: { city: destinationCity, airport: destinationAirport },
      },
      pricing: mainPricing,
      bestFlight: mainBestFlight,
      baggagePrices: null,
      currency,
      searchDates: { outbound: outboundDateStr, return: returnDateStr },
      rawFlightsCount: originResults.length,
      // Prompt 2
      originResults,
      cheapestOrigin,
      primaryOrigin,
      originSavingOpportunity,
      originSaving,
      weeklyPricing,
      bestWeek,
      worstWeek,
      // Prompt 3
      destSavingOpportunities,
      alternativeAirportsChecked,
    };

    console.log(`Done: ${originResults.length} origins, ${alternativeAirportsChecked} alt destinations checked, ${destSavingOpportunities.length} dest savings found`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-flight-insights:", error);
    return new Response(
      JSON.stringify({
        error: "No flight data available",
        fallbackRequired: true,
        detail: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
