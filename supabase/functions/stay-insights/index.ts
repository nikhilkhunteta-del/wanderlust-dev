import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MONTH_NAMES: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "any month",
};

const DEPARTURE_CURRENCY: Record<string, string> = {
  london: "GBP", manchester: "GBP", edinburgh: "GBP", birmingham: "GBP",
  "new york": "USD", "los angeles": "USD", chicago: "USD", miami: "USD",
  "san francisco": "USD", seattle: "USD", boston: "USD", dallas: "USD",
  mumbai: "INR", delhi: "INR", bangalore: "INR", chennai: "INR",
  hyderabad: "INR", pune: "INR", kolkata: "INR", ahmedabad: "INR",
  jaipur: "INR", kochi: "INR",
  sydney: "AUD", melbourne: "AUD", brisbane: "AUD", perth: "AUD",
  toronto: "CAD", vancouver: "CAD", montreal: "CAD",
  paris: "EUR", berlin: "EUR", amsterdam: "EUR", rome: "EUR",
  madrid: "EUR", barcelona: "EUR", munich: "EUR", vienna: "EUR",
  brussels: "EUR", lisbon: "EUR", dublin: "EUR", milan: "EUR",
  tokyo: "JPY", osaka: "JPY", singapore: "SGD",
  "hong kong": "HKD", dubai: "AED", "abu dhabi": "AED",
  zurich: "CHF", geneva: "CHF", stockholm: "SEK",
  bangkok: "THB", seoul: "KRW", shanghai: "CNY", beijing: "CNY",
  auckland: "NZD", "cape town": "ZAR", "são paulo": "BRL",
  "mexico city": "MXN", "kuala lumpur": "MYR", manila: "PHP",
  jakarta: "IDR",
};

function getTravellerCurrency(departureCity?: string): string | null {
  if (!departureCity) return null;
  return DEPARTURE_CURRENCY[departureCity.toLowerCase().trim()] || null;
}

async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  try {
    const resp = await fetch(`https://open.er-api.com/v6/latest/${from}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.rates?.[to] ?? null;
  } catch {
    return null;
  }
}

function buildPrompt(
  city: string,
  country: string,
  monthName: string,
  travellerCurrency: string | null,
  localCurrency: string,
  profileContext: string,
): string {
  const currencyInstruction = travellerCurrency && travellerCurrency !== localCurrency
    ? `Provide prices in the local currency of the destination (${localCurrency}). Also provide approximate converted prices in ${travellerCurrency} for traveller convenience using fields travellerLowPrice and travellerHighPrice on each price category.`
    : `Provide all prices in ${localCurrency}.`;

  return `You are a travel accommodation expert. Generate comprehensive stay insights for ${city}, ${country} during ${monthName}.

${profileContext ? `Traveller context: ${profileContext}` : ""}

Provide a JSON response with this exact structure:
{
  "localCurrency": "${localCurrency}",
  ${profileContext ? `"personalRecommendation": "For [traveller profile], [specific recommendation naming a tier and neighbourhood with one reason]. Keep to one sentence.",` : ""}
  "priceCategories": [
    {
      "category": "budget",
      "label": "Budget",
      "starRating": "2-3★",
      "lowPrice": <number in ${localCurrency}>,
      "highPrice": <number in ${localCurrency}>,
      "currency": "${localCurrency}",
      ${travellerCurrency && travellerCurrency !== localCurrency ? `"travellerLowPrice": <number in ${travellerCurrency}>,
      "travellerHighPrice": <number in ${travellerCurrency}>,
      "travellerCurrency": "${travellerCurrency}",` : ""}
      "typicalInclusions": ["wifi", "breakfast", etc - 2-3 items],
      "bookingAdvance": "Book X weeks ahead in ${monthName}" (specific to this tier and whether ${monthName} is peak/shoulder/off-season for ${city})
    },
    {
      "category": "midRange",
      "label": "Mid-Range",
      "starRating": "3-4★",
      "lowPrice": <number>,
      "highPrice": <number>,
      "currency": "${localCurrency}",
      ${travellerCurrency && travellerCurrency !== localCurrency ? `"travellerLowPrice": <number>,
      "travellerHighPrice": <number>,
      "travellerCurrency": "${travellerCurrency}",` : ""}
      "typicalInclusions": [2-3 items],
      "bookingAdvance": "Book X weeks ahead in ${monthName}"
    },
    {
      "category": "premium",
      "label": "Premium",
      "starRating": "4-5★",
      "lowPrice": <number>,
      "highPrice": <number>,
      "currency": "${localCurrency}",
      ${travellerCurrency && travellerCurrency !== localCurrency ? `"travellerLowPrice": <number>,
      "travellerHighPrice": <number>,
      "travellerCurrency": "${travellerCurrency}",` : ""}
      "typicalInclusions": [2-3 items],
      "bookingAdvance": "Book X weeks ahead in ${monthName}"
    },
    {
      "category": "luxury",
      "label": "Luxury",
      "starRating": "5★+",
      "lowPrice": <number>,
      "highPrice": <number>,
      "currency": "${localCurrency}",
      ${travellerCurrency && travellerCurrency !== localCurrency ? `"travellerLowPrice": <number>,
      "travellerHighPrice": <number>,
      "travellerCurrency": "${travellerCurrency}",` : ""}
      "typicalInclusions": [2-3 items],
      "bookingAdvance": "Book X weeks ahead in ${monthName}"
    }
  ],
  "neighbourhoods": [
    {
      "name": "Neighbourhood name",
      "description": "2-3 sentence description of vibe, what it's like to stay here, and who it suits best",
      "bestFor": ["culture", "nightlife", "families", "beach", "budget", "luxury", "shopping", "quiet"] - pick 2-3 relevant tags,
      "imageQuery": "[neighbourhood name] ${city} area street"
    }
  ] - provide 3-5 neighbourhoods. IMPORTANT: imageQuery must be "[neighbourhood name] ${city} area street", never just "${city}" or "${city} sign",
  "areaGuidance": {
    "centralVsOuter": "Brief guidance on central vs outer areas trade-offs",
    "priceVsConvenience": "Brief guidance on price vs convenience trade-offs",
    "noiseVsQuiet": "Brief guidance on lively vs peaceful area options"
  },
  "hotelVsApartment": {
    "bestForApartments": "2 sentences on who benefits most from apartments vs hotels in ${city} (families, longer stays, self-catering, etc.)",
    "priceComparison": "2 sentences on typical price difference between apartments and hotels per night for similar quality in ${city} in ${monthName}",
    "whatToKnow": "2 sentences on practical considerations: are short-term rentals common, well-regulated, minimum stays, areas where apartments dominate"
  },
  "practicalInsights": [
    {
      "icon": "calendar" | "coins" | "users" | "building" | "info",
      "title": "Short insight title",
      "description": "Concise practical tip"
    }
  ] - provide 3-5 insights covering seasonality, taxes, apartment vs hotel, crowd levels
}

Important guidelines:
- Prices should reflect typical rates for ${monthName} (consider seasonality)
- ${currencyInstruction}
- When mentioning any prices or monetary amounts in descriptions, tips, insights, or the overview, always use currency symbols (£, $, €, ₹) not ISO codes (GBP, USD, INR).
${travellerCurrency && travellerCurrency !== localCurrency ? `- CRITICAL: When the traveller's currency (${travellerCurrency}) differs from local currency (${localCurrency}), always show the traveller's currency first with the local currency in brackets. Example: "£18–45/night (approx. ₹2,000–5,000)". Never show only local currency figures.` : ""}
- Be specific to ${city}'s actual neighbourhoods and accommodation scene
- Neighbourhoods should be real, well-known areas
- Keep descriptions concise and informative
- Use neutral, factual language - no promotional content
- Practical insights should be genuinely useful for trip planning
- bookingAdvance should reflect actual booking patterns: budget tiers in high season need 2-3 weeks, premium/luxury in peak season need 6-8 weeks
- If Airbnb/apartment rental is NOT a practical option in ${city}, set hotelVsApartment to null

Return ONLY valid JSON, no markdown or explanation.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { city, country, travelMonth, departureCity, travelCompanions, groupType, tripDuration, styleTags, travelPace } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ error: "City is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedCountry = country || city;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`Generating stay insights for ${city}, ${resolvedCountry} in ${travelMonth}`);

    const monthName = MONTH_NAMES[travelMonth?.toLowerCase()] || travelMonth || "your travel dates";
    const travellerCurrency = getTravellerCurrency(departureCity);

    // Determine local currency via a simple mapping
    const COUNTRY_CURRENCY: Record<string, string> = {
      india: "INR", japan: "JPY", "united kingdom": "GBP", usa: "USD",
      "united states": "USD", thailand: "THB", morocco: "MAD",
      portugal: "EUR", spain: "EUR", france: "EUR", italy: "EUR",
      germany: "EUR", greece: "EUR", turkey: "TRY", mexico: "MXN",
      brazil: "BRL", australia: "AUD", canada: "CAD", "new zealand": "NZD",
      "south africa": "ZAR", singapore: "SGD", malaysia: "MYR",
      indonesia: "IDR", philippines: "PHP", vietnam: "VND",
      "south korea": "KRW", china: "CNY", "hong kong": "HKD",
      uae: "AED", "united arab emirates": "AED", switzerland: "CHF",
      sweden: "SEK", norway: "NOK", denmark: "DKK", egypt: "EGP",
      colombia: "COP", peru: "PEN", argentina: "ARS", chile: "CLP",
      "czech republic": "CZK", czechia: "CZK", poland: "PLN",
      hungary: "HUF", romania: "RON", croatia: "EUR", nepal: "NPR",
      "sri lanka": "LKR", cambodia: "KHR", myanmar: "MMK", kenya: "KES",
      tanzania: "TZS", iceland: "ISK", jordan: "JOD", israel: "ILS",
    };
    const localCurrency = COUNTRY_CURRENCY[resolvedCountry.toLowerCase()] || "USD";

    // Build traveller profile context
    const profileParts: string[] = [];
    if (groupType || travelCompanions) {
      profileParts.push(`travelling ${groupType === "solo" ? "solo" : `as ${groupType || travelCompanions}`}`);
    }
    if (tripDuration) profileParts.push(`${tripDuration}-day trip`);
    if (styleTags?.length) profileParts.push(`style: ${styleTags.join(", ")}`);
    if (travelPace !== undefined) {
      profileParts.push(travelPace < 0.4 ? "relaxed pace" : travelPace > 0.6 ? "fast-paced" : "moderate pace");
    }
    const profileContext = profileParts.length > 0
      ? profileParts.join(", ") + ` in ${monthName}`
      : "";

    const prompt = buildPrompt(city, resolvedCountry, monthName, travellerCurrency, localCurrency, profileContext);

    const models = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite", "openai/gpt-5-mini"];
    let response: Response | null = null;
    for (const model of models) {
      console.log("Trying model:", model);
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are a travel accommodation expert. Respond only with valid JSON." },
            { role: "user", content: prompt },
          ],
          ...(model.startsWith("google/") ? { temperature: 0.7 } : {}),
        }),
      });
      if (response.ok) break;
      const errorText = await response.text();
      console.error(`AI gateway error with ${model}:`, response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }
    if (!response || !response.ok) throw new Error("AI gateway returned 500");

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse JSON from AI response");
      insights = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse stay insights");
    }

    // If AI didn't provide traveller prices but we have exchange rate data, compute them
    if (travellerCurrency && travellerCurrency !== localCurrency) {
      const rate = await fetchExchangeRate(localCurrency, travellerCurrency);
      if (rate) {
        for (const cat of insights.priceCategories || []) {
          if (!cat.travellerLowPrice && cat.lowPrice) {
            cat.travellerLowPrice = Math.round(cat.lowPrice * rate);
            cat.travellerHighPrice = Math.round(cat.highPrice * rate);
            cat.travellerCurrency = travellerCurrency;
          }
        }
      }
    }

    // Build booking URL
    const monthMap: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04",
      may: "05", jun: "06", jul: "07", aug: "08",
      sep: "09", oct: "10", nov: "11", dec: "12",
    };
    const monthNum = monthMap[travelMonth?.toLowerCase()] || "01";
    const year = new Date().getFullYear();
    const targetYear = new Date().getMonth() + 1 > parseInt(monthNum) ? year + 1 : year;
    const checkin = `${targetYear}-${monthNum}-15`;
    const checkout = `${targetYear}-${monthNum}-17`;
    const destination = encodeURIComponent(`${city}, ${resolvedCountry}`);
    const bookingUrl = `https://www.google.com/travel/hotels?q=${destination}&dates=${checkin}to${checkout}`;

    const result = {
      city,
      country: resolvedCountry,
      travelMonth: monthName,
      overview: insights.overview,
      personalRecommendation: insights.personalRecommendation || null,
      priceCategories: insights.priceCategories,
      neighbourhoods: insights.neighbourhoods,
      areaGuidance: insights.areaGuidance,
      hotelVsApartment: insights.hotelVsApartment || null,
      practicalInsights: insights.practicalInsights,
      travellerCurrency: travellerCurrency || null,
      bookingUrl,
      disclaimer: "Prices shown are indicative ranges based on historical patterns and may vary. Always verify current rates when booking.",
      lastUpdated: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    };

    console.log(`Successfully generated stay insights for ${city}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in stay-insights function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate stay insights" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
