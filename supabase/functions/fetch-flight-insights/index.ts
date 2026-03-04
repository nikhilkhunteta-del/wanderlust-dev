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

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    GBP: '£', USD: '$', EUR: '€', AUD: 'A$',
    CAD: 'C$', JPY: '¥', CHF: 'CHF', SEK: 'kr',
    NOK: 'kr', DKK: 'kr', SGD: 'S$', HKD: 'HK$',
    NZD: 'NZ$', ZAR: 'R', INR: '₹', AED: 'AED',
    THB: '฿', MXN: '$', BRL: 'R$', KRW: '₩',
    TRY: '₺',
  };
  return symbols[currency] ?? currency;
};

// Gateway city mapping — secondary cities that connect through a major international hub
const GATEWAY_AIRPORTS: Record<string, { gateway: string; gatewayCity: string; distance: number; transferTime: number; transferMode: string; note: string }> = {
  // India
  'jaipur': { gateway: 'DEL', gatewayCity: 'Delhi', distance: 280, transferTime: 240, transferMode: 'road/rail', note: 'Most international flights connect via Delhi — direct international options are very limited' },
  'agra': { gateway: 'DEL', gatewayCity: 'Delhi', distance: 200, transferTime: 180, transferMode: 'road/rail', note: 'No international airport — Delhi is the standard entry point' },
  'udaipur': { gateway: 'DEL', gatewayCity: 'Delhi', distance: 665, transferTime: 90, transferMode: 'domestic flight', note: 'Connects via Delhi or Mumbai for most international routes' },
  'varanasi': { gateway: 'BOM', gatewayCity: 'Mumbai', distance: 0, transferTime: 90, transferMode: 'domestic flight', note: 'Limited international connections — Mumbai or Delhi typically required' },
  // Southeast Asia
  'siem reap': { gateway: 'BKK', gatewayCity: 'Bangkok', distance: 0, transferTime: 60, transferMode: 'flight', note: 'Bangkok is the primary regional hub for onward connections' },
  'luang prabang': { gateway: 'BKK', gatewayCity: 'Bangkok', distance: 0, transferTime: 90, transferMode: 'flight', note: 'Bangkok is the main gateway — direct long-haul options are limited' },
  // Eastern Europe
  'krakow': { gateway: 'WAW', gatewayCity: 'Warsaw', distance: 295, transferTime: 180, transferMode: 'road/rail', note: 'Direct international options exist but Warsaw offers more connections' },
  // Middle East / Africa
  'luxor': { gateway: 'CAI', gatewayCity: 'Cairo', distance: 0, transferTime: 60, transferMode: 'domestic flight', note: 'Cairo is the primary international gateway for Egypt' },
  'marrakech': { gateway: 'CMN', gatewayCity: 'Casablanca', distance: 240, transferTime: 150, transferMode: 'road/rail', note: 'Marrakech has growing direct connections but Casablanca offers more options' },
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

async function callSerpAPIOneWay(
  apiKey: string,
  departureId: string,
  arrivalId: string,
  outboundDate: string,
  passengers: number,
  travelClass: number,
  currency: string,
): Promise<any> {
  const params = new URLSearchParams({
    engine: "google_flights",
    type: "2",
    departure_id: departureId,
    arrival_id: arrivalId,
    outbound_date: outboundDate,
    adults: passengers.toString(),
    travel_class: travelClass.toString(),
    currency,
    api_key: apiKey,
  });
  const resp = await fetch(`https://serpapi.com/search?${params.toString()}`);
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`SerpAPI one-way ${resp.status}: ${txt}`);
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
  currency: string = "GBP",
): Promise<string> {
  try {
    const currencySymbol = getCurrencySymbol(currency);
    const query = `Provide specific factual information about flights from ${originCity} to ${destinationCity} in ${travelMonth} ${travelYear}: (1) Which airlines most commonly operate this route and what are their typical stopover hubs? (2) What is the typical total journey time including the most common connection? (3) Is ${travelMonth} considered peak, shoulder, or low season for this route and how does that affect pricing? (4) Have prices on this route trended up or down over the past 12 months and by roughly how much? (5) Are there any ${travelMonth}-specific factors that affect pricing such as Indian public holidays, local events in ${destinationCity}, or school holiday periods in ${originCity}? (6) What is the typical advance booking window for the best prices on flights from ${originCity} to ${destinationCity} in ${travelMonth}? For example, is it better to book 2 weeks, 4 weeks, 8 weeks, or further in advance? Be specific to this route and month. (7) What are the most common stopover hubs for flights from ${originCity} to ${destinationCity} and which airlines use each hub? Which hub typically offers the shortest total journey time? When mentioning any prices, use the currency symbol ${currencySymbol} not the currency code. All price figures should be per person. Return factual information only — no generic travel advice.`;

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

async function queryTicketingContext(
  perplexityKey: string,
  originCity: string,
  destinationCity: string,
  travelMonth: string,
  currencySymbol: string,
): Promise<string> {
  try {
    const query = `For flights from ${originCity} to ${destinationCity} in ${travelMonth}, is it typically cheaper to book two separate one-way tickets rather than a round trip on this route? Are there specific airline combinations that often offer better value when booked separately? Note: low-cost carriers like Ryanair and easyJet on short-haul European routes often make one-way combinations cheaper. When mentioning any prices, use the currency symbol ${currencySymbol} not the currency code. All price figures should be per person.`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide specific, factual information about flight pricing strategies. Be concise and data-driven. No markdown." },
          { role: "user", content: query },
        ],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      console.error("Perplexity ticketing context error:", resp.status);
      return "";
}

async function queryGatewayTransferInfo(
  perplexityKey: string,
  originCity: string,
  destinationCity: string,
  gatewayCity: string,
  gatewayAirport: string,
  destinationAirport: string,
): Promise<string> {
  try {
    const query = `For travel from ${originCity} to ${destinationCity}, most international travellers fly into ${gatewayCity} (${gatewayAirport}) rather than directly to ${destinationAirport}. What is the best way to travel from ${gatewayCity} to ${destinationCity}? Include: transport options, typical journey time, approximate cost, and whether advance booking is needed. Also confirm: does ${destinationAirport} have any direct international connections from ${originCity} worth considering?`;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide specific, factual travel information. Be concise and practical. No markdown." },
          { role: "user", content: query },
        ],
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      console.error("Perplexity gateway transfer info error:", resp.status);
      return "";
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Perplexity gateway transfer info failed:", err);
    return "";
  }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("Perplexity ticketing context failed:", err);
    return "";
  }
}

interface Synthesis {
  priceVerdict: string;
  priceTrend: string | null;
  bookingTiming: string;
  bestWeekReason: string;
  insight_route: string;
  insight_flexibility: string;
  insight_timing: string;
  insight_hiddencosts: string | null;
  carbonComparison: string | null;
  originTransferNote: string | null;
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
  const currencySymbol = getCurrencySymbol(currency);
  const HARDCODED_BOOKING_FALLBACK = `For this route, booking 6–8 weeks in advance typically yields better fares than last-minute purchases — set a price alert to track changes.`;

  const fallback: Synthesis = {
    priceVerdict: `Flights from ${originCity} to ${destinationCity} in ${travelMonth} typically start around ${currencySymbol}${pricing.lowestPrice ?? "N/A"} per person.`,
    priceTrend: null,
    bookingTiming: HARDCODED_BOOKING_FALLBACK,
    bestWeekReason: `Check weekly pricing variations within ${travelMonth} for potential savings.`,
    insight_route: `${originCity} to ${destinationCity} is typically served with one-stop connections. Journey times vary by airline and routing.`,
    insight_flexibility: `Compare prices across different ${originCity} airports for potential savings.`,
    insight_timing: `Flying midweek (Tuesday–Thursday) on this route can save 10–15% compared to weekend departures.`,
    insight_hiddencosts: null,
    carbonComparison: null,
    originTransferNote: null,
  };

  try {
    const weeklyStr = weeklyPricing.map((w) => `${w.week}: ${w.lowestPrice ?? "N/A"}`).join(", ");
    const savingNote = cheapestOrigin && primaryOrigin && cheapestOrigin.airport !== primaryOrigin.airport
      ? `cheapest origin airport ${cheapestOrigin.airport} saving ${currencySymbol}${primaryOrigin.lowestPrice - cheapestOrigin.lowestPrice} per person vs primary hub ${primaryOrigin.airport}`
      : "primary hub is cheapest";

    const priceHistoryNote = pricing.priceHistory
      ? `\nPrice history data: ${JSON.stringify(pricing.priceHistory)}. Based on this price history, what does the booking curve suggest about when to book for this route?`
      : "";

    const originAirportList = originCity ? (CITY_AIRPORTS[originCity.toLowerCase().trim()] || []).join(", ") : "";

    const typicalRangePP = pricing.typicalRange
      ? `${currencySymbol}${Math.round(pricing.typicalRange[0] / passengers)}–${currencySymbol}${Math.round(pricing.typicalRange[1] / passengers)}`
      : "N/A";

    const prompt = `You have the following data for flights from ${originCity} to ${destinationCity} in ${travelMonth} ${travelYear}:
Pricing data: lowest price ${currencySymbol}${pricing.lowestPrice ? Math.round(pricing.lowestPrice / passengers) : "N/A"} per person, typical range ${typicalRangePP} per person, price level ${pricing.priceLevel}, ${savingNote}.
Weekly pricing: ${weeklyStr}.
Route intelligence: ${routeIntelligence || "No additional route data available."}${priceHistoryNote}
Origin airports checked: ${originAirportList}
Cheapest origin airport: ${cheapestOrigin?.airport || "primary"}

CRITICAL RULES FOR ALL OUTPUTS:
- When referencing any price, always use the currency symbol ${currencySymbol} — never use the currency code ${currency}. Example: use '${currencySymbol}120' not '${currency} 120'.
- All prices must be per person, never total group cost.

Generate exactly these ten outputs — all must be specific to this exact route and month, never generic:
(1) priceVerdict: Write one sentence about the price for this route. Rules: always state prices per person using ${currencySymbol}, reference the typical range ${typicalRangePP} per person, and end with one sentence about the advance booking window for this route and month. Example format: 'A typical round-trip from ${originCity} to ${destinationCity} in ${travelMonth} costs around ${typicalRangePP} per person, which is [price level] for this route — booking [X] weeks ahead typically secures the best fares.'
(2) priceTrend: one sentence about whether prices on this route have risen or fallen vs last year and by roughly how much percent — based on the route intelligence data. Use ${currencySymbol} for any prices. If no trend data available, return null.
(3) bookingTiming: one sentence — how many weeks in advance should travellers book for this specific route in ${travelMonth} to get the best fares? Be specific with a number of weeks. Use the route intelligence and price history data.
(4) bestWeekReason: one sentence — name the best week to fly within ${travelMonth} and why based on the weekly pricing data? Use ${currencySymbol} for any prices.
(5) insight_route: two sentences about the typical journey — hubs, airlines, total time specific to this route?
(6) insight_flexibility: one sentence about airport or date flexibility specific to ${originCity}?
(7) insight_timing: For flights from ${originCity} to ${destinationCity} in ${travelMonth}, what is the typical price difference between flying midweek (Tuesday–Wednesday) versus weekend (Friday–Sunday)? Give an approximate figure using ${currencySymbol} if available. If no meaningful midweek/weekend difference exists for this short-haul route, instead give one specific tip about flexible date searching on this route — e.g. shifting dates by 2–3 days. Keep under 35 words, route-specific only.
(8) insight_hiddencosts: one sentence flagging any baggage or layover visa consideration specific to this route — if none, return null?
(9) carbonComparison: given the carbon emissions for this flight, write a brief relatable comparison to another commonly known route, under 10 words — if no carbon data available, return null?
(10) originTransferNote: if the cheapest origin airport (${cheapestOrigin?.airport || "primary"}) is different from the main city airport, write one brief practical sentence about how to get there from central ${originCity} — e.g. "25 minutes by Gatwick Express from London Victoria". If the cheapest airport IS the primary airport, return null.

Return as a clean JSON object with these exact ten keys. No markdown.`;

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
      priceTrend: parsed.priceTrend ?? null,
      bookingTiming,
      bestWeekReason: parsed.bestWeekReason || fallback.bestWeekReason,
      insight_route: parsed.insight_route || fallback.insight_route,
      insight_flexibility: parsed.insight_flexibility || fallback.insight_flexibility,
      insight_timing: parsed.insight_timing || fallback.insight_timing,
      insight_hiddencosts: parsed.insight_hiddencosts ?? null,
      carbonComparison: parsed.carbonComparison ?? null,
      originTransferNote: parsed.originTransferNote ?? null,
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

    // Check if destination is a gateway city
    const destKey = destinationCity.toLowerCase().trim();
    const gatewayMapping = GATEWAY_AIRPORTS[destKey] || null;
    if (gatewayMapping) {
      console.log(`Gateway city detected: ${destinationCity} → ${gatewayMapping.gatewayCity} (${gatewayMapping.gateway})`);
    }

    // === Phase 1: Origin SerpAPI + Perplexity calls + gateway SerpAPI in parallel ===
    const phase1Promises: Promise<any>[] = [
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
        ? queryRouteIntelligence(PERPLEXITY_API_KEY, originCity, destinationCity, monthName, travelYear || year.toString(), currency)
        : Promise.resolve(""),
      // Gateway SerpAPI call — always run if gateway mapping exists, no threshold applied
      gatewayMapping
        ? callSerpAPI(SERPAPI_KEY, originAirports[0], gatewayMapping.gateway, outboundDateStr, returnDateStr, passengers, travelClass, currency)
            .then((data) => ({ gateway: gatewayMapping.gateway, data }))
            .catch((e) => { console.error("Gateway SerpAPI failed:", e); return null; })
        : Promise.resolve(null),
      // Gateway transfer info from Perplexity
      gatewayMapping && PERPLEXITY_API_KEY
        ? queryGatewayTransferInfo(PERPLEXITY_API_KEY, originCity, destinationCity, gatewayMapping.gatewayCity, gatewayMapping.gateway, destinationAirport)
        : Promise.resolve(""),
    ];

    const [originSettled, alternativeAirports, routeIntelligence, gatewayRaw, gatewayTransferInfo] = await Promise.all(phase1Promises);

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

    // === Process gateway airport result ===
    let gatewayAirport: any = null;
    if (gatewayMapping && gatewayRaw) {
      const gwPrice = gatewayRaw.data?.price_insights?.lowest_price ?? null;
      if (gwPrice !== null) {
        const gatewaySaving = (mainPricing.lowestPrice ?? 0) - gwPrice;
        gatewayAirport = {
          airport: gatewayMapping.gateway,
          city: gatewayMapping.gatewayCity,
          lowestPrice: gwPrice,
          saving: gatewaySaving > 0 ? gatewaySaving : 0,
          transferTime: gatewayMapping.transferTime,
          transferMode: gatewayMapping.transferMode,
          note: gatewayMapping.note,
          isGateway: true,
        };
        console.log(`Gateway ${gatewayMapping.gateway}: price=${gwPrice}, saving=${gatewaySaving}`);
      } else {
        console.log(`Gateway ${gatewayMapping.gateway}: no pricing data returned`);
      }
    }

    // === Phase 2: Weekly pricing + alt destination pricing + one-way ticketing comparison in parallel ===
    const cheapestApt = cheapestOrigin?.airport || primaryAirport;
    const weekDays = [3, 10, 17, 24];
    const weekLabels = [`Early ${monthName}`, `Mid-early ${monthName}`, `Mid-late ${monthName}`, `Late ${monthName}`];
    const currencySymbol = getCurrencySymbol(currency);

    console.log(`Phase 2: weekly from ${cheapestApt}, ${alternativeAirports.length} alt dests, + one-way comparison`);

    // Build one-way call promises
    const onewayOutboundPromise = callSerpAPIOneWay(
      SERPAPI_KEY, cheapestApt, destinationAirport, outboundDateStr, passengers, travelClass, currency
    ).catch((e) => { console.error("One-way outbound failed:", e); return null; });

    const onewayReturnPromise = callSerpAPIOneWay(
      SERPAPI_KEY, destinationAirport, cheapestApt, returnDateStr, passengers, travelClass, currency
    ).catch((e) => { console.error("One-way return failed:", e); return null; });

    // Perplexity ticketing context query
    const ticketingContextPromise = PERPLEXITY_API_KEY
      ? queryTicketingContext(PERPLEXITY_API_KEY, originCity, destinationCity, monthName, currencySymbol)
      : Promise.resolve("");

    const [weeklySettled, onewayOutboundData, onewayReturnData, ticketingContext, ...altDestSettled] = await Promise.all([
      Promise.allSettled(
        weekDays.map((day) => {
          const wOutbound = new Date(year, monthNum - 1, day);
          const wReturn = new Date(wOutbound);
          wReturn.setDate(wReturn.getDate() + tripDuration);
          return callSerpAPI(SERPAPI_KEY, cheapestApt, destinationAirport, formatDate(wOutbound), formatDate(wReturn), passengers, travelClass, currency)
            .then((data) => ({ day, data }));
        })
      ),
      onewayOutboundPromise,
      onewayReturnPromise,
      ticketingContextPromise,
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

    // === Ticketing insight: round-trip vs two one-ways ===
    let ticketingInsight: any = null;
    const onewayOutbound = onewayOutboundData?.price_insights?.lowest_price ?? null;
    const onewayReturn = onewayReturnData?.price_insights?.lowest_price ?? null;
    const roundTrip = cheapestOrigin?.lowestPrice ?? mainPricing.lowestPrice;

    if (onewayOutbound !== null && onewayReturn !== null && roundTrip !== null) {
      const combinedOneWay = onewayOutbound + onewayReturn;
      const oneWaySaving = roundTrip - combinedOneWay;
      const roundTripSaving = combinedOneWay - roundTrip;
      // Minimum meaningful threshold — scale with currency
      const minThreshold = (SAVING_THRESHOLDS[currency.toUpperCase()] ?? 75) * (20 / 75); // ~20 GBP equivalent

      ticketingInsight = {
        roundTripPrice: roundTrip,
        combinedOneWayPrice: combinedOneWay,
        outboundPrice: onewayOutbound,
        returnPrice: onewayReturn,
        cheaperOption: oneWaySaving > 0 ? "oneWay" : "roundTrip",
        saving: Math.abs(oneWaySaving),
        savingPerPerson: Math.round(Math.abs(oneWaySaving) / passengers),
        savingPercentage: Math.round((Math.abs(oneWaySaving) / Math.max(roundTrip, combinedOneWay)) * 100),
        meaningful: Math.abs(oneWaySaving) >= minThreshold,
      };
      console.log(`Ticketing: RT=${roundTrip}, 1W=${combinedOneWay}, saving=${ticketingInsight.saving}, meaningful=${ticketingInsight.meaningful}`);
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
          priceVerdict: `Flights from ${originCity} to ${destinationCity} start around ${getCurrencySymbol(currency)}${mainPricing.lowestPrice ? Math.round(mainPricing.lowestPrice / passengers) : "N/A"} per person.`,
          priceTrend: null,
          bookingTiming: "Book 6-8 weeks ahead for best prices.",
          bestWeekReason: bestWeek ? `${bestWeek.week} offers the lowest fares.` : "Check weekly variations.",
          insight_route: `${originCity} to ${destinationCity} is typically served with connections.`,
          insight_flexibility: `Compare ${originCity} airports for savings.`,
          insight_timing: `Flying midweek on this route can often save 10-15% compared to weekend departures.`,
          insight_hiddencosts: null,
          carbonComparison: null,
          originTransferNote: null,
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
      gatewayAirport,
      gatewayTransferInfo: gatewayTransferInfo || null,
      routeIntelligence,
      synthesis,
      ticketingInsight,
      ticketingContext: ticketingContext || null,
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
