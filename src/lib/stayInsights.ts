import { supabase } from "@/integrations/supabase/client";
import { StayInsightsData, StayInsightsRequest } from "@/types/stayInsights";

// Currency mapping from departure city
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

function getCurrencyForCity(city?: string): string {
  if (!city) return "USD";
  return DEPARTURE_CURRENCY[city.toLowerCase().trim()] || "USD";
}

function getDefaultDates(travelMonth: string): { checkIn: string; checkOut: string } {
  const MONTH_MAP: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const monthKey = travelMonth.toLowerCase().slice(0, 3);
  const monthIndex = MONTH_MAP[monthKey] ?? 0;
  const today = new Date();
  let year = today.getFullYear();
  if (monthIndex < today.getMonth() || (monthIndex === today.getMonth() && today.getDate() > 15)) {
    year += 1;
  }
  const checkIn = new Date(year, monthIndex, 15);
  const checkOut = new Date(year, monthIndex, 18);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { checkIn: fmt(checkIn), checkOut: fmt(checkOut) };
}

export async function getStayInsights(
  request: StayInsightsRequest
): Promise<StayInsightsData> {
  const currency = request.currency || getCurrencyForCity(request.departureCity);
  const dates = request.checkIn && request.checkOut
    ? { checkIn: request.checkIn, checkOut: request.checkOut }
    : getDefaultDates(request.travelMonth);

  const { data, error } = await supabase.functions.invoke<StayInsightsData>(
    "fetch-stay-insights",
    {
      body: {
        ...request,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        adults: request.adults || 2,
        children: request.children || 0,
        currency,
      },
    }
  );

  if (error) {
    console.error("Error calling fetch-stay-insights function:", error);
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
