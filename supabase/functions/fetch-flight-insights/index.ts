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

function extractAllFlightData(serpData: any) {
  const allItineraries = [...(serpData.best_flights || []), ...(serpData.other_flights || [])];
  if (allItineraries.length === 0) return null;

  // Collect durations, hub frequencies, stops, airlines, carbon
  const durations: number[] = [];
  const hubCounts: Record<string, number> = {};
  const stopCounts: Record<number, number> = {};
  const allAirlines: string[] = [];
  let bestCarbon: number | null = null;

  for (const itin of allItineraries) {
    const dur = itin.total_duration;
    if (typeof dur === "number" && dur > 0) durations.push(dur);

    const flights = itin.flights || [];
    const stops = flights.length > 0 ? flights.length - 1 : 0;
    stopCounts[stops] = (stopCounts[stops] || 0) + 1;

    for (const f of flights) {
      if (f.airline) allAirlines.push(f.airline);
    }

    const layovers = itin.layovers || [];
    for (const l of layovers) {
      const hub = l.name || l.id;
      if (hub) hubCounts[hub] = (hubCounts[hub] || 0) + 1;
    }

    if (!bestCarbon && itin.carbon_emissions?.this_flight) {
      bestCarbon = itin.carbon_emissions.this_flight;
    }
  }

  // Filter outlier durations (> 1400 min / 23h)
  const filteredDurations = durations.filter((d) => d <= 1400);
  const sortedDurations = filteredDurations.sort((a, b) => a - b);

  let minDuration: number | null = null;
  let p75Duration: number | null = null;

  if (sortedDurations.length >= 2) {
    minDuration = sortedDurations[0];
    const p75Index = Math.floor(sortedDurations.length * 0.75);
    p75Duration = sortedDurations[Math.min(p75Index, sortedDurations.length - 1)];
  } else if (sortedDurations.length === 1) {
    minDuration = sortedDurations[0];
  }

  // Most common hub(s)
  const hubEntries = Object.entries(hubCounts).sort((a, b) => b[1] - a[1]);
  const topHubs: string[] = [];
  if (hubEntries.length > 0) {
    topHubs.push(hubEntries[0][0]);
    if (hubEntries.length > 1 && hubEntries[1][1] === hubEntries[0][1]) {
      topHubs.push(hubEntries[1][0]);
    }
  }

  // Most common stop count
  const mostCommonStops = Object.entries(stopCounts).sort((a, b) => b[1] - a[1])[0];
  const typicalStops = mostCommonStops ? parseInt(mostCommonStops[0]) : 1;

  // Best single flight for backward compat
  const bf = allItineraries[0];
  const bfFlights = bf.flights || [];
  const bfLayovers = bf.layovers || [];

  return {
    totalDuration: minDuration,
    durationRange: p75Duration && minDuration && p75Duration !== minDuration
      ? { min: minDuration, p75: p75Duration }
      : null,
    stops: typicalStops,
    mostCommonStops: typicalStops,
    layoverAirports: bfLayovers.map((l: any) => l.name || l.id || "Unknown"),
    mostCommonHubs: topHubs,
    airlines: [...new Set(allAirlines)].slice(0, 6),
    carbonEmissions: bestCarbon,
  };
}

// Legacy wrapper for compatibility
function extractBestFlight(serpData: any) {
  return extractAllFlightData(serpData);
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
      console.error("Perplexity alt-airports error:", resp.status);
      return [];
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const parsed = JSON.parse(jsonMatch[0]) as AlternativeAirport[];
    return parsed.filter(
      (a) => a.iata && a.iata !== destinationAirport && typeof a.transferTimeMinutes === "number" && a.transferTimeMinutes < 180
    );
  } catch (err) {
    console.error("Perplexity alternative airports failed:", err);
    return [];
  }
}

async function queryRouteIntelligence(
  perplexityKey: string,
  originCity: string,
  destinationCity: string,
  travelMonth: string,
  travelYear: string,
): Promise<string> {
  try {
    const query = `Provide specific factual information about flights from ${originCity} to ${destinationCity} in ${travelMonth} ${travelYear}: (1) Which airlines most commonly operate this route and what are their typical stopover hubs? (2) What is the typical total journey time including the most common connection? (3) Is ${travelMonth} considered peak, shoulder, or low season for this route and how does that affect pricing? (4) Have prices on this route trended up or down over the past 12 months and by roughly how much? (5) Are there any ${travelMonth}-specific factors that affect pricing such as Indian public holidays, local events in ${destinationCity}, or school holiday periods in ${originCity}? (6) What is the typical advance booking window for the best prices on flights from ${originCity} to ${destinationCity} in ${travelMonth}? For example, is it better to book 2 weeks, 4 weeks, 8 weeks, or further in advance? Be specific to this route and month. (7) What are the most common stopover hubs for flights from ${originCity} to ${destinationCity} and which airlines use each hub? Which hub typically offers the shortest total journey time? Return factual information only — no generic travel advice.`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide specific, factual information about flight routes. Be concise and data-driven." },
          { role: "user", content: query },
        ],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      console.error("Perplexity route intelligence error:", resp.status);
      return "";
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Perplexity route intelligence failed:", err);
    return "";
  }
}

interface Synthesis {
  priceVerdict: string;
  bookingTiming: string;
  bestWeekReason: string;
  insight_route: string;
  insight_flexibility: string;
  insight_timing: string;
  insight_hiddencosts: string | null;
  carbonComparison: string | null;
}

async function generateSynthesis(
  lovableKey: string,
  originCity: string,
  destinationCity: string,
  travelMonth: string,
  travelYear: string,
  pricing: any,
  cheapestOrigin: any,
  primaryOrigin: any,
  weeklyPricing: any[],
  routeIntelligence: string,
  currency: string,
  perplexityKey: string | null,
): Promise<Synthesis> {
  const HARDCODED_BOOKING_FALLBACK = `For this route, booking 6–8 weeks in advance typically yields better fares than last-minute purchases — set a price alert to track changes.`;

  const fallback: Synthesis = {
    priceVerdict: `Flights from ${originCity} to ${destinationCity} in ${travelMonth} typically start around ${currency} ${pricing.lowestPrice ?? "N/A"}.`,
    bookingTiming: HARDCODED_BOOKING_FALLBACK,
    bestWeekReason: `Check weekly pricing variations within ${travelMonth} for potential savings.`,
    insight_route: `${originCity} to ${destinationCity} is typically served with one-stop connections. Journey times vary by airline and routing.`,
    insight_flexibility: `Compare prices across different ${originCity} airports for potential savings.`,
    insight_timing: `Flying midweek (Tuesday–Thursday) on this route can save 10–15% compared to weekend departures.`,
    insight_hiddencosts: null,
    carbonComparison: null,
  };

  try {
    const weeklyStr = weeklyPricing.map((w) => `${w.week}: ${w.lowestPrice ?? "N/A"}`).join(", ");
    const savingNote = cheapestOrigin && primaryOrigin && cheapestOrigin.airport !== primaryOrigin.airport
      ? `cheapest origin airport ${cheapestOrigin.airport} saving ${currency} ${primaryOrigin.lowestPrice - cheapestOrigin.lowestPrice} vs primary hub ${primaryOrigin.airport}`
      : "primary hub is cheapest";

    const priceHistoryNote = pricing.priceHistory
      ? `\nPrice history data: ${JSON.stringify(pricing.priceHistory)}. Based on this price history, what does the booking curve suggest about when to book for this route?`
      : "";

    const prompt = `You have the following data for flights from ${originCity} to ${destinationCity} in ${travelMonth} ${travelYear}:
Pricing data: lowest price ${currency} ${pricing.lowestPrice}, typical range ${pricing.typicalRange?.[0]}–${pricing.typicalRange?.[1]}, price level ${pricing.priceLevel}, ${savingNote}.
Weekly pricing: ${weeklyStr}.
Route intelligence: ${routeIntelligence || "No additional route data available."}${priceHistoryNote}

Generate exactly these eight outputs — all must be specific to this exact route and month, never generic:
(1) priceVerdict: one sentence — is this good value or expensive for this route, and what should a traveller budget including the range?
(2) bookingTiming: one sentence — how many weeks in advance should travellers book for this specific route in ${travelMonth} to get the best fares? Be specific with a number of weeks. Use the route intelligence and price history data.
(3) bestWeekReason: one sentence — name the best week to fly within ${travelMonth} and why based on the weekly pricing data?
(4) insight_route: two sentences about the typical journey — hubs, airlines, total time specific to this route?
(5) insight_flexibility: one sentence about airport or date flexibility specific to ${originCity}?
(6) insight_timing: For flights from ${originCity} to ${destinationCity} in ${travelMonth}, is there a meaningful price difference between flying midweek (Tuesday–Thursday) versus weekend (Friday–Sunday)? If yes, quantify it approximately. If midweek vs weekend is not significant for this route, instead describe the trade-off between the most common stopover hubs — e.g. what is the practical difference for a traveller choosing between connection cities? Keep it under 40 words and specific to this route.
(7) insight_hiddencosts: one sentence flagging any baggage or layover visa consideration specific to this route — if none, return null?
(8) carbonComparison: given the carbon emissions for this flight, write a brief relatable comparison to another commonly known route, under 10 words — if no carbon data available, return null?

Return as a clean JSON object with these exact eight keys. No markdown.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a flight analyst API. Return only valid JSON with exactly the eight requested keys. Be specific to the route — never generic." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      console.error("Lovable AI synthesis error:", resp.status);
      return fallback;
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;

    const parsed = JSON.parse(jsonMatch[0]);
    let bookingTiming = parsed.bookingTiming || "";

    // Check if bookingTiming is broken / no-data
    const brokenPhrases = ["no data", "not available", "cannot determine", "insufficient", "n/a", "no information"];
    const isBroken = !bookingTiming || brokenPhrases.some((p) => bookingTiming.toLowerCase().includes(p));

    if (isBroken && perplexityKey) {
      console.log("bookingTiming broken, running Perplexity fallback");
      try {
        const fallbackResp = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${perplexityKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              { role: "system", content: "Provide a single concise sentence answer. No markdown." },
              { role: "user", content: `When is the best time to book flights from ${originCity} to ${destinationCity} in ${travelMonth} ${travelYear} to get the lowest fares? Provide a specific number of weeks in advance.` },
            ],
            temperature: 0.2,
          }),
        });
        if (fallbackResp.ok) {
          const fbData = await fallbackResp.json();
          const fbContent = fbData.choices?.[0]?.message?.content || "";
          if (fbContent && !brokenPhrases.some((p) => fbContent.toLowerCase().includes(p))) {
            bookingTiming = fbContent.split("\n")[0].trim();
          }
        }
      } catch (e) {
        console.error("Perplexity booking fallback failed:", e);
      }
    }

    // Final hardcoded fallback
    if (!bookingTiming || brokenPhrases.some((p) => bookingTiming.toLowerCase().includes(p))) {
      bookingTiming = HARDCODED_BOOKING_FALLBACK;
    }

    return {
      priceVerdict: parsed.priceVerdict || fallback.priceVerdict,
      bookingTiming,
      bestWeekReason: parsed.bestWeekReason || fallback.bestWeekReason,
      insight_route: parsed.insight_route || fallback.insight_route,
      insight_flexibility: parsed.insight_flexibility || fallback.insight_flexibility,
      insight_timing: parsed.insight_timing || fallback.insight_timing,
      insight_hiddencosts: parsed.insight_hiddencosts ?? null,
      carbonComparison: parsed.carbonComparison ?? null,
    };
  } catch (err) {
    console.error("AI synthesis failed:", err);
    return fallback;
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const monthNum = parseMonth(travelMonth);
    const year = parseInt(travelYear) || new Date().getFullYear();
    const monthName = getMonthName(monthNum);
    const outboundDate = getFirstMondayOfMonth(year, monthNum);
    const returnDate = new Date(outboundDate);
    returnDate.setDate(returnDate.getDate() + tripDuration);
    const outboundDateStr = formatDate(outboundDate);
    const returnDateStr = formatDate(returnDate);
    const travelClass = CABIN_CLASS_MAP[cabinClass] || 1;

    console.log(`Fetch: ${originAirports.join(",")} → ${destinationAirport}, ${outboundDateStr}–${returnDateStr}`);

    // === Phase 1: Origin SerpAPI + both Perplexity calls in parallel ===
    const [originSettled, alternativeAirports, routeIntelligence] = await Promise.all([
      Promise.allSettled(
        originAirports.map((apt) =>
          callSerpAPI(SERPAPI_KEY, apt, destinationAirport, outboundDateStr, returnDateStr, passengers, travelClass, currency)
            .then((data) => ({ airport: apt, data }))
        )
      ),
      PERPLEXITY_API_KEY
        ? queryAlternativeDestinationAirports(PERPLEXITY_API_KEY, destinationCity, destinationCountry || destinationCity, destinationAirport)
        : Promise.resolve([]),
      PERPLEXITY_API_KEY
        ? queryRouteIntelligence(PERPLEXITY_API_KEY, originCity, destinationCity, monthName, travelYear || year.toString())
        : Promise.resolve(""),
    ]);

    // Process origin results
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
        priceHistory: pi.price_history ?? null,
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
      ? { lowestPrice: mainSerpData.lowestPrice, priceLevel: mainSerpData.priceLevel, typicalRange: mainSerpData.typicalRange, priceHistory: mainSerpData.priceHistory ?? null }
      : { lowestPrice: null, priceLevel: null, typicalRange: null, priceHistory: null };
    const mainBestFlight = mainSerpData?.bestFlight ?? null;

    // === Phase 2: Weekly pricing + alt destination pricing in parallel ===
    const cheapestApt = cheapestOrigin?.airport || primaryAirport;
    const weekDays = [3, 10, 17, 24];
    const weekLabels = [`Early ${monthName}`, `Mid-early ${monthName}`, `Mid-late ${monthName}`, `Late ${monthName}`];

    console.log(`Phase 2: weekly from ${cheapestApt}, ${alternativeAirports.length} alt dests`);

    const [weeklySettled, ...altDestSettled] = await Promise.all([
      Promise.allSettled(
        weekDays.map((day) => {
          const wOutbound = new Date(year, monthNum - 1, day);
          const wReturn = new Date(wOutbound);
          wReturn.setDate(wReturn.getDate() + tripDuration);
          return callSerpAPI(SERPAPI_KEY, cheapestApt, destinationAirport, formatDate(wOutbound), formatDate(wReturn), passengers, travelClass, currency)
            .then((data) => ({ day, data }));
        })
      ),
      ...(alternativeAirports.length > 0 && mainPricing.lowestPrice
        ? alternativeAirports.map((alt) =>
            callSerpAPI(SERPAPI_KEY, cheapestApt, alt.iata, outboundDateStr, returnDateStr, passengers, travelClass, currency)
              .then((data) => ({ alt, data }))
              .catch(() => null)
          )
        : []),
    ]);

    // Process weekly pricing
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
    const bestWeek = validWeeks.length > 0 ? validWeeks.reduce((a, b) => (a.lowestPrice! < b.lowestPrice! ? a : b)) : null;
    const worstWeek = validWeeks.length > 0 ? validWeeks.reduce((a, b) => (a.lowestPrice! > b.lowestPrice! ? a : b)) : null;

    // Process alt destination results
    let destSavingOpportunities: any[] = [];
    const alternativeAirportsChecked = alternativeAirports.length;

    if (altDestSettled.length > 0 && mainPricing.lowestPrice) {
      const isLongHaul = (mainBestFlight?.totalDuration ?? 0) > 300;
      const destThreshold = isLongHaul
        ? (LONG_HAUL_THRESHOLDS[currency.toUpperCase()] ?? 150)
        : (SAVING_THRESHOLDS[currency.toUpperCase()] ?? 75);

      const candidates: any[] = [];
      for (let i = 0; i < altDestSettled.length; i++) {
        const res = altDestSettled[i];
        if (!res || typeof res !== "object" || !("alt" in (res as any))) continue;
        const { alt, data } = res as any;
        const altPrice = data?.price_insights?.lowest_price;
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
      candidates.sort((a, b) => b.priceSaving - a.priceSaving);
      destSavingOpportunities = candidates.slice(0, 2);
    }

    // === Phase 3: AI synthesis (needs all data collected above) ===
    console.log("Phase 3: AI synthesis");

    const synthesis = LOVABLE_API_KEY
      ? await generateSynthesis(
          LOVABLE_API_KEY, originCity, destinationCity, monthName, travelYear || year.toString(),
          mainPricing, cheapestOrigin, primaryOrigin, weeklyPricing, routeIntelligence, currency,
          PERPLEXITY_API_KEY || null,
        )
      : {
          priceVerdict: `Flights from ${originCity} to ${destinationCity} start around ${currency} ${mainPricing.lowestPrice ?? "N/A"}.`,
          bookingTiming: "Book 6-8 weeks ahead for best prices.",
          bestWeekReason: bestWeek ? `${bestWeek.week} offers the lowest fares.` : "Check weekly variations.",
          insight_route: `${originCity} to ${destinationCity} is typically served with connections.`,
          insight_flexibility: `Compare ${originCity} airports for savings.`,
          insight_timing: `Flying midweek on this route can often save 10-15% compared to weekend departures.`,
          insight_hiddencosts: null,
          carbonComparison: null,
        };

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
      originResults,
      cheapestOrigin,
      primaryOrigin,
      originSavingOpportunity,
      originSaving,
      weeklyPricing,
      bestWeek,
      worstWeek,
      destSavingOpportunities,
      alternativeAirportsChecked,
      routeIntelligence,
      synthesis,
    };

    console.log(`Done: ${originResults.length} origins, ${alternativeAirportsChecked} alt dests, synthesis complete`);

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
