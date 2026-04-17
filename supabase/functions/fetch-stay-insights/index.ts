import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { callClaude, SONNET } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTH_NAMES: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function parsePrice(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") return raw;
  const cleaned = raw.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function extractProperties(properties: any[], limit = 3) {
  if (!properties?.length) return [];
  return properties.slice(0, limit).map((p: any) => ({
    name: p.name || "Unknown",
    rating: p.overall_rating ?? null,
    reviewCount: p.reviews ?? null,
    pricePerNight: parsePrice(p.rate_per_night?.lowest) ?? parsePrice(p.rate_per_night?.before_taxes_fees),
    totalPrice: parsePrice(p.total_rate?.lowest) ?? parsePrice(p.total_rate?.before_taxes_fees),
    amenities: (p.amenities || []).slice(0, 5),
    type: p.type || "hotel",
    neighbourhood: p.neighborhood || p.location || null,
    link: p.link || null,
    thumbnail: p.images?.[0]?.thumbnail || p.thumbnail || null,
  }));
}

function extractTierData(result: any) {
  const properties = result?.properties || [];
  const prices = properties
    .map((p: any) => parsePrice(p.rate_per_night?.lowest) ?? parsePrice(p.rate_per_night?.before_taxes_fees))
    .filter((n: number | null): n is number => n !== null && n > 0);

  return {
    resultCount: properties.length,
    lowestPrice: prices.length ? Math.min(...prices) : null,
    highestPrice: prices.length ? Math.max(...prices) : null,
    medianPrice: prices.length ? median(prices) : null,
    topProperties: extractProperties(properties, 3),
    priceInsights: result?.price_insights || null,
  };
}

// ── Step 1: Get tier thresholds via Perplexity ──────────────────────────────

async function fetchTierThresholds(
  city: string, country: string, monthName: string, currency: string,
  perplexityKey: string,
): Promise<{ budgetCeiling: number; midCeiling: number; premiumCeiling: number }> {
  const prompt = `What are the typical nightly hotel price ranges in ${city}, ${country} in ${monthName} in ${currency}? Give me four tiers: budget, mid-range, premium, and luxury — with approximate price breakpoints between them. Return ONLY valid JSON with no markdown: {"budgetCeiling": X, "midCeiling": Y, "premiumCeiling": Z} where X is the max budget price, Y is the max mid-range price, Z is the max premium price. All values must be integers.`;

  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Return only valid JSON. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    if (!resp.ok) {
      console.error("Perplexity tier threshold error:", resp.status, await resp.text());
      throw new Error("Perplexity failed");
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error("No JSON in Perplexity response");

    const parsed = JSON.parse(jsonMatch[0]);
    const budgetCeiling = Math.round(Number(parsed.budgetCeiling));
    const midCeiling = Math.round(Number(parsed.midCeiling));
    const premiumCeiling = Math.round(Number(parsed.premiumCeiling));

    if (!budgetCeiling || !midCeiling || !premiumCeiling) throw new Error("Invalid thresholds");
    if (budgetCeiling >= midCeiling || midCeiling >= premiumCeiling) throw new Error("Non-monotonic thresholds");

    console.log(`Tier thresholds for ${city} (${currency}): budget<${budgetCeiling}, mid<${midCeiling}, premium<${premiumCeiling}`);
    return { budgetCeiling, midCeiling, premiumCeiling };
  } catch (e) {
    console.error("Tier threshold fallback:", e);
    // Sensible USD fallbacks, scaled roughly
    const fallbacks: Record<string, { budgetCeiling: number; midCeiling: number; premiumCeiling: number }> = {
      USD: { budgetCeiling: 80, midCeiling: 180, premiumCeiling: 350 },
      EUR: { budgetCeiling: 75, midCeiling: 170, premiumCeiling: 330 },
      GBP: { budgetCeiling: 65, midCeiling: 150, premiumCeiling: 300 },
      INR: { budgetCeiling: 3000, midCeiling: 8000, premiumCeiling: 20000 },
      JPY: { budgetCeiling: 10000, midCeiling: 25000, premiumCeiling: 50000 },
      THB: { budgetCeiling: 1500, midCeiling: 4000, premiumCeiling: 10000 },
      AUD: { budgetCeiling: 120, midCeiling: 250, premiumCeiling: 500 },
      CAD: { budgetCeiling: 100, midCeiling: 220, premiumCeiling: 450 },
      SGD: { budgetCeiling: 120, midCeiling: 280, premiumCeiling: 550 },
      AED: { budgetCeiling: 300, midCeiling: 700, premiumCeiling: 1500 },
      MXN: { budgetCeiling: 1200, midCeiling: 3000, premiumCeiling: 7000 },
      BRL: { budgetCeiling: 300, midCeiling: 700, premiumCeiling: 1500 },
      ZAR: { budgetCeiling: 1200, midCeiling: 3000, premiumCeiling: 6000 },
    };
    return fallbacks[currency] || fallbacks.USD;
  }
}

// ── Step 2: SerpAPI hotel search ────────────────────────────────────────────

async function searchHotels(
  params: Record<string, string>,
  serpApiKey: string,
): Promise<any> {
  const url = `https://serpapi.com/search?${new URLSearchParams({ ...params, api_key: serpApiKey })}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`SerpAPI error ${resp.status}:`, errText);
    throw new Error(`SerpAPI ${resp.status}`);
  }
  return resp.json();
}

// ── Step 4: Perplexity neighbourhood & contextual intelligence ──────────────

async function fetchNeighbourhoodInsights(
  city: string, country: string, monthName: string, stayDuration: number,
  perplexityKey: string, currency: string,
): Promise<{
  neighbourhoods: any[];
  bookingAdvice: any;
  vacationRentalContext: string;
  practicalInsights: any[];
  personalRecommendation: string | null;
}> {
  const prompt = `For tourists staying in ${city}, ${country} in ${monthName} for approximately ${stayDuration} nights:
(1) What are the 3-4 best neighbourhoods to stay in? For each, give: name, 2-3 sentence description of vibe, and 2-3 "bestFor" tags from [culture, nightlife, families, beach, budget, luxury, shopping, quiet, food].
(2) How far in advance should you book for each price tier in ${monthName} — is it peak, shoulder, or off season? Give specific weeks for budget, mid-range, premium, and luxury.
(3) Are vacation rentals/Airbnb widely available and practical in ${city}? Compare: who benefits from apartments vs hotels, typical price difference, any practical considerations.
(4) Any important practical considerations — taxes, resort fees, deposit requirements, or local booking customs specific to ${city}?

IMPORTANT CURRENCY RULES:
- The traveller's currency is ${currency}.
- When mentioning any prices or monetary amounts in descriptions, tips, or insights, always use the traveller's currency symbol converted at the approximate exchange rate. Show the local currency in brackets after for context.
- Example: "£18–45/night (approx. ₹2,000–5,000)". Never show only local currency figures when the traveller's currency is known.
- Use currency symbols (£, $, €, ₹) not ISO codes (GBP, USD).

Return ONLY valid JSON:
{
  "neighbourhoods": [{"name":"...","description":"...","bestFor":["..."],"imageQuery":"[name] ${city} residential street buildings"}],
  "bookingAdvice": {"budget":"Book X weeks ahead","midRange":"...","premium":"...","luxury":"...","seasonType":"peak|shoulder|off"},
  "vacationRentalContext": {"bestForApartments":"...","priceComparison":"...","whatToKnow":"..."},
  "practicalInsights": [{"icon":"calendar|coins|users|building|info","title":"...","description":"..."}],
  "personalRecommendation": null
}`;

  try {
    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "You are a travel accommodation expert. Return only valid JSON, no markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      console.error("Perplexity neighbourhood error:", resp.status);
      throw new Error("Perplexity failed");
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    // Repair common LLM JSON errors
    let cleaned = jsonMatch[0]
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\x00-\x1F\x7F]/g, (c: string) => c === "\n" || c === "\t" ? c : "");

    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Neighbourhood insights fallback:", e);
    return {
      neighbourhoods: [],
      bookingAdvice: { budget: "Book 2-3 weeks ahead", midRange: "Book 3-4 weeks ahead", premium: "Book 4-6 weeks ahead", luxury: "Book 6-8 weeks ahead", seasonType: "unknown" },
      vacationRentalContext: "",
      practicalInsights: [],
      personalRecommendation: null,
    };
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      city, country, checkIn, checkOut, adults = 2, children = 0,
      currency = "USD", departureCity, travelMonth,
      travelCompanions, groupType, tripDuration, styleTags, travelPace,
    } = body;

    if (!city) {
      return new Response(JSON.stringify({ error: "City is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    if (!SERPAPI_KEY) throw new Error("SERPAPI_KEY is not configured");
    if (!PERPLEXITY_API_KEY) throw new Error("PERPLEXITY_API_KEY is not configured");

    const resolvedCountry = country || city;
    const monthKey = travelMonth?.toLowerCase()?.slice(0, 3);
    const monthName = MONTH_NAMES[monthKey] || travelMonth || "your travel dates";
    const stayDuration = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : (tripDuration || 3);

    console.log(`fetch-stay-insights: ${city}, ${resolvedCountry}, ${monthName}, ${currency}, dates=${checkIn}→${checkOut}`);

    // ── Cache check (6-hour TTL) ──
    const CACHE_TTL_HOURS = 6;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const normCity = city.toLowerCase().trim();
    const normCountry = resolvedCountry.toLowerCase().trim();

    if (checkIn && checkOut) {
      const { data: cached } = await supabase
        .from("stay_insights_cache")
        .select("data_json, fetched_at")
        .eq("city", normCity)
        .eq("country", normCountry)
        .eq("check_in", checkIn)
        .eq("check_out", checkOut)
        .eq("currency", currency)
        .eq("adults", adults)
        .eq("children", children)
        .maybeSingle();

      if (cached) {
        const cacheAge = (Date.now() - new Date(cached.fetched_at).getTime()) / 3600000;
        if (cacheAge < CACHE_TTL_HOURS) {
          console.log(`Cache hit for ${city} (${cacheAge.toFixed(1)}h old)`);
          return new Response(JSON.stringify(cached.data_json), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        console.log(`Cache stale for ${city} (${cacheAge.toFixed(1)}h old), refreshing`);
      }
    }

    // ── Step 1: Get tier thresholds + neighbourhood insights in parallel ──
    const [thresholds, neighbourhoodData] = await Promise.all([
      fetchTierThresholds(city, resolvedCountry, monthName, currency, PERPLEXITY_API_KEY),
      fetchNeighbourhoodInsights(city, resolvedCountry, monthName, stayDuration, PERPLEXITY_API_KEY, currency),
    ]);

    const { budgetCeiling, midCeiling, premiumCeiling } = thresholds;

    // ── Step 2: SerpAPI hotel searches — 4 tiers + vacation rentals ──
    const commonParams: Record<string, string> = {
      engine: "google_hotels",
      q: `hotels in ${city}, ${resolvedCountry}`,
      check_in_date: checkIn || "",
      check_out_date: checkOut || "",
      adults: String(adults),
      children: String(children),
      currency: currency,
      hl: "en",
      gl: "us",
    };

    // Only include date params if provided
    if (!checkIn || !checkOut) {
      delete commonParams.check_in_date;
      delete commonParams.check_out_date;
    }

    const [budgetRes, midRes, premiumRes, luxuryRes, rentalRes] = await Promise.allSettled([
      searchHotels({ ...commonParams, max_price: String(budgetCeiling) }, SERPAPI_KEY),
      searchHotels({ ...commonParams, min_price: String(budgetCeiling), max_price: String(midCeiling) }, SERPAPI_KEY),
      searchHotels({ ...commonParams, min_price: String(midCeiling), max_price: String(premiumCeiling) }, SERPAPI_KEY),
      searchHotels({ ...commonParams, min_price: String(premiumCeiling) }, SERPAPI_KEY),
      searchHotels({
        ...commonParams,
        q: `apartments in ${city}, ${resolvedCountry}`,
        vacation_rentals: "true",
      }, SERPAPI_KEY),
    ]);

    // ── Step 3: Extract structured data ──
    const tierLabels = ["budget", "midRange", "premium", "luxury"] as const;
    const tierResults = [budgetRes, midRes, premiumRes, luxuryRes];
    const tierStarRatings = ["2-3★", "3-4★", "4-5★", "5★+"];
    const tierLabelNames = ["Budget", "Mid-Range", "Premium", "Luxury"];

    const tiers: Record<string, any> = {};
    for (let i = 0; i < 4; i++) {
      const res = tierResults[i];
      const raw = res.status === "fulfilled" ? res.value : null;
      const tierData = raw ? extractTierData(raw) : {
        resultCount: 0, lowestPrice: null, highestPrice: null,
        medianPrice: null, topProperties: [], priceInsights: null,
      };
      tiers[tierLabels[i]] = tierData;
    }

    // Extract vacation rental data
    const rentalRaw = rentalRes.status === "fulfilled" ? rentalRes.value : null;
    const vacationRentals = rentalRaw ? extractTierData(rentalRaw) : null;

    // ── Build personalised recommendation if we have profile data ──
    let personalRecommendation: string | null = neighbourhoodData.personalRecommendation;
    if (!personalRecommendation && (groupType || travelCompanions || styleTags?.length)) {
      const profileParts: string[] = [];
      if (groupType || travelCompanions) profileParts.push(`travelling ${groupType === "solo" ? "solo" : `as ${groupType || travelCompanions}`}`);
      if (tripDuration) profileParts.push(`${tripDuration}-day trip`);
      if (styleTags?.length) profileParts.push(`style: ${styleTags.join(", ")}`);
      if (travelPace !== undefined) profileParts.push(travelPace < 0.4 ? "relaxed pace" : travelPace > 0.6 ? "fast-paced" : "moderate pace");
      const profileContext = profileParts.join(", ");

      // Determine best tier based on actual data
      const availableTier = tiers.midRange?.medianPrice ? "mid-range" : tiers.budget?.medianPrice ? "budget" : "mid-range";
      const topNeighbourhood = neighbourhoodData.neighbourhoods?.[0]?.name || "the city centre";

      try {
        const recText = await callClaude(
          "",
          `Given a traveller ${profileContext} visiting ${city} in ${monthName}, generate ONE sentence recommending the best accommodation tier and neighbourhood. Be specific — name the tier, name the neighbourhood, and give one reason why. Available neighbourhoods: ${neighbourhoodData.neighbourhoods?.map((n: any) => n.name).join(", ") || topNeighbourhood}. Format: "For [profile], [specific recommendation with reason]." Return only the sentence.`,
          { model: SONNET }
        );
        personalRecommendation = recText.trim() || null;
        // Strip quotes if wrapped
        if (personalRecommendation?.startsWith('"') && personalRecommendation?.endsWith('"')) {
          personalRecommendation = personalRecommendation.slice(1, -1);
        }
      } catch (e) {
        console.error("Personal recommendation error:", e);
      }
    }

    // ── Build price categories in the format the frontend expects ──
    const priceCategories = tierLabels.map((key, i) => {
      const t = tiers[key];
      const bookingAdvice = neighbourhoodData.bookingAdvice;
      return {
        category: key,
        label: tierLabelNames[i],
        starRating: tierStarRatings[i],
        lowPrice: t.lowestPrice,
        highPrice: t.highestPrice,
        medianPrice: t.medianPrice,
        currency: currency,
        typicalInclusions: t.topProperties?.[0]?.amenities?.slice(0, 3) || [],
        bookingAdvance: bookingAdvice?.[key] || null,
        topProperties: t.topProperties,
        priceInsights: t.priceInsights,
        resultCount: t.resultCount,
      };
    });

    // ── Build hotel vs apartment comparison ──
    let hotelVsApartment = null;
    const rentalCtx = neighbourhoodData.vacationRentalContext;
    if (rentalCtx && typeof rentalCtx === "object" && rentalCtx.bestForApartments) {
      hotelVsApartment = rentalCtx;
    } else if (vacationRentals && vacationRentals.resultCount > 0) {
      hotelVsApartment = {
        bestForApartments: "Apartments work well for families and longer stays where self-catering and extra space are valuable.",
        priceComparison: vacationRentals.medianPrice
          ? `Vacation rentals in ${city} typically start around ${currency} ${vacationRentals.lowestPrice}/night, with a median of ${currency} ${vacationRentals.medianPrice}/night.`
          : `Vacation rentals are available in ${city} at various price points.`,
        whatToKnow: "Check individual listings for minimum stay requirements and cancellation policies.",
      };
    }

    // ── Build overview sentence ──
    const medianPrices = priceCategories.filter(p => p.medianPrice).map(p => p.medianPrice!);
    const overallMedian = medianPrices.length ? median(medianPrices) : null;
    const currencySymbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥", AUD: "A$", CAD: "C$",
      CHF: "CHF ", SGD: "S$", HKD: "HK$", NZD: "NZ$", ZAR: "R", BRL: "R$",
      MXN: "MX$", THB: "฿", KRW: "₩", AED: "AED ", SEK: "kr",
    };
    const sym = currencySymbols[currency] || `${currency} `;
    const overview = overallMedian
      ? `Hotels in ${city} in ${monthName} range widely, with a median price around ${sym}${overallMedian}/night. ${neighbourhoodData.bookingAdvice?.seasonType === "peak" ? "This is peak season — book early for the best options." : neighbourhoodData.bookingAdvice?.seasonType === "off" ? "This is off-season, so you'll find good availability and lower prices." : "Availability is generally good for this period."}`
      : `${city} offers accommodation across all price ranges in ${monthName}.`;

    // ── Final result ──
    const result = {
      city,
      country: resolvedCountry,
      travelMonth: monthName,
      overview,
      personalRecommendation,
      priceCategories,
      neighbourhoods: neighbourhoodData.neighbourhoods || [],
      areaGuidance: {
        centralVsOuter: neighbourhoodData.neighbourhoods?.length > 1
          ? `${neighbourhoodData.neighbourhoods[0]?.name} is the most central option, while ${neighbourhoodData.neighbourhoods[neighbourhoodData.neighbourhoods.length - 1]?.name} offers a quieter alternative.`
          : "Central areas offer convenience but outer neighbourhoods can be quieter and more affordable.",
        priceVsConvenience: "Central hotels cost more but save on transport. Budget options further out can offer great value if you don't mind a short commute.",
        noiseVsQuiet: "Areas near markets and nightlife are vibrant but can be noisy. Residential neighbourhoods offer peace at the expense of walkability.",
      },
      hotelVsApartment,
      vacationRentals: vacationRentals ? {
        resultCount: vacationRentals.resultCount,
        lowestPrice: vacationRentals.lowestPrice,
        medianPrice: vacationRentals.medianPrice,
        topProperties: vacationRentals.topProperties,
      } : null,
      practicalInsights: neighbourhoodData.practicalInsights || [],
      travellerCurrency: currency,
      bookingUrl: `https://www.google.com/travel/hotels?q=${encodeURIComponent(`${city}, ${resolvedCountry}`)}&dates=${checkIn || ""}to${checkOut || ""}`,
      dataSource: "serpapi_live",
      fetchedAt: new Date().toISOString(),
      stayDuration,
      disclaimer: "Prices are live estimates from Google Hotels and may vary. Final rates depend on booking platform and property.",
      lastUpdated: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    };

    console.log(`Successfully fetched live stay insights for ${city}: ${priceCategories.filter(p => p.resultCount > 0).length}/4 tiers have data`);

    // ── Write to cache ──
    if (checkIn && checkOut) {
      try {
        await supabase
          .from("stay_insights_cache")
          .upsert({
            city: normCity,
            country: normCountry,
            check_in: checkIn,
            check_out: checkOut,
            currency,
            adults,
            children,
            data_json: result,
            fetched_at: new Date().toISOString(),
          }, { onConflict: "city,country,check_in,check_out,currency,adults,children" });
        console.log(`Cached stay insights for ${city}`);
      } catch (cacheErr) {
        console.error("Failed to write cache:", cacheErr);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-stay-insights:", error);

    // Surface rate limit / payment errors
    if (error instanceof Error) {
      if (error.message.includes("429")) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (error.message.includes("402")) {
        return new Response(JSON.stringify({ error: "API credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch stay insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
