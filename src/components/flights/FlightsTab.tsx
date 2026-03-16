import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMonthName } from "@/lib/formatMonth";
import { Loader2, Plane, ChevronDown, Route, Calendar, ArrowLeftRight, Info, ExternalLink, Ticket, Search } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { VisaStatusCallout } from "./VisaStatusCallout";

interface FlightsTabProps {
  departureCity: string;
  destinationCity: string;
  destinationCountry: string;
  travelMonth: string;
  tripDuration?: number;
  onSwitchTab?: (tab: string) => void;
}

interface OriginResult {
  airport: string;
  lowestPrice: number;
  priceLevel: string | null;
  typicalRange: number[] | null;
  bestFlight: BestFlight | null;
}

interface BestFlight {
  totalDuration: number | null;
  durationRange: { min: number; p75: number } | null;
  stops: number;
  mostCommonStops: number;
  layoverAirports: string[];
  mostCommonHubs: string[];
  airlines: string[];
  carbonEmissions: number | null;
}

interface TicketingInsight {
  roundTripPrice: number;
  combinedOneWayPrice: number;
  outboundPrice: number;
  returnPrice: number;
  cheaperOption: "oneWay" | "roundTrip";
  saving: number;
  savingPerPerson: number;
  savingPercentage: number;
  meaningful: boolean;
  dataReliable?: boolean;
}

interface GatewayAirportData {
  airport: string;
  city: string;
  lowestPrice: number;
  saving: number;
  transferTime: number;
  transferMode: string;
  note: string;
  isGateway: boolean;
}

interface FlightInsightsData {
  route: {
    origin: { city: string; airport: string };
    destination: { city: string; airport: string };
  };
  pricing: {
    lowestPrice: number | null;
    priceLevel: string | null;
    typicalRange: number[] | null;
    priceHistory: any;
  };
  bestFlight: BestFlight | null;
  currency: string;
  searchDates: { outbound: string; return: string };
  originResults: OriginResult[];
  cheapestOrigin: { airport: string; lowestPrice: number; airlines: string[] } | null;
  primaryOrigin: { airport: string; lowestPrice: number | null };
  originSavingOpportunity: boolean;
  originSaving: number;
  weeklyPricing: { week: string; date: string; lowestPrice: number | null }[];
  bestWeek: { week: string; date: string; lowestPrice: number } | null;
  worstWeek: { week: string; date: string; lowestPrice: number } | null;
  destSavingOpportunities: any[];
  alternativeAirportsChecked: number;
  gatewayAirport?: GatewayAirportData | null;
  gatewayTransferInfo?: string | null;
  routeIntelligence: string;
  ticketingInsight?: TicketingInsight | null;
  ticketingContext?: string | null;
  synthesis: {
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
  };
}

// Hardcoded destination airport mapping (temporary — will expand)
const DEST_AIRPORTS: Record<string, string> = {
  jaipur: "JAI", delhi: "DEL", mumbai: "BOM", tokyo: "NRT", paris: "CDG",
  london: "LHR", "new york": "JFK", rome: "FCO", bangkok: "BKK",
  istanbul: "IST", dubai: "DXB", singapore: "SIN", sydney: "SYD",
  barcelona: "BCN", lisbon: "LIS", marrakech: "RAK", kyoto: "KIX",
  amsterdam: "AMS", berlin: "BER", milan: "MXP", "hong kong": "HKG",
  toronto: "YYZ", "san francisco": "SFO", "los angeles": "LAX",
  chicago: "ORD", frankfurt: "FRA", madrid: "MAD", vienna: "VIE",
  prague: "PRG", budapest: "BUD", athens: "ATH", cairo: "CAI",
  "kuala lumpur": "KUL", bali: "DPS", hanoi: "HAN", "ho chi minh city": "SGN",
  "buenos aires": "EZE", lima: "LIM", "mexico city": "MEX",
  "cape town": "CPT", nairobi: "NBO", casablanca: "CMN",
  "chiang mai": "CNX", "luang prabang": "LPQ", ubud: "DPS",
  "siem reap": "REP", colombo: "CMB", kathmandu: "KTM",
  "phnom penh": "PNH", yangon: "RGN", vientiane: "VTE",
  taipei: "TPE", seoul: "ICN", osaka: "KIX", beijing: "PEK",
  shanghai: "PVG", guangzhou: "CAN", manila: "MNL", jakarta: "CGK",
  chennai: "MAA", kolkata: "CCU", bangalore: "BLR",
  hyderabad: "HYD", goa: "GOI", varanasi: "VNS", udaipur: "UDR",
  jodhpur: "JDH", amritsar: "ATQ", kochi: "COK",
  porto: "OPO", seville: "SVQ", florence: "FLR", venice: "VCE",
  dubrovnik: "DBV", split: "SPU", santorini: "JTR", crete: "HER",
  edinburgh: "EDI", reykjavik: "KEF", copenhagen: "CPH", oslo: "OSL",
  stockholm: "ARN", helsinki: "HEL", zurich: "ZRH", geneva: "GVA",
  nice: "NCE", lyon: "LYS", munich: "MUC", hamburg: "HAM",
  warsaw: "WAW", krakow: "KRK", bucharest: "OTP", sofia: "SOF",
  tallinn: "TLL", riga: "RIX", vilnius: "VNO",
  marrakesh: "RAK", fez: "FEZ", tunis: "TUN", accra: "ACC",
  lagos: "LOS", "dar es salaam": "DAR", zanzibar: "ZNZ",
  johannesburg: "JNB", "addis ababa": "ADD",
  seattle: "SEA", boston: "BOS", miami: "MIA", denver: "DEN",
  "washington dc": "IAD", atlanta: "ATL", houston: "IAH",
  vancouver: "YVR", montreal: "YUL", havana: "HAV",
  "san jose": "SJO", bogota: "BOG", santiago: "SCL",
  "rio de janeiro": "GIG", "sao paulo": "GRU", quito: "UIO",
  cusco: "CUZ", cartagena: "CTG", medellin: "MDE",
  auckland: "AKL", queenstown: "ZQN", melbourne: "MEL", perth: "PER",
  fiji: "NAN", "phuket": "HKT", "koh samui": "USM",
  muscat: "MCT", doha: "DOH", amman: "AMM", beirut: "BEY",
  "tel aviv": "TLV", tbilisi: "TBS", yerevan: "EVN", baku: "GYD",
};

function getDestAirport(city: string): string {
  return DEST_AIRPORTS[city.toLowerCase().trim()] || "";
}

function getCurrencySymbol(currency: string): string {
  const map: Record<string, string> = {
    GBP: "£", USD: "$", EUR: "€", INR: "₹", AUD: "A$", CAD: "C$",
    JPY: "¥", SGD: "S$", HKD: "HK$", THB: "฿", AED: "د.إ", TRY: "₺",
  };
  return map[currency] || currency + " ";
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatStops(stops: number): string {
  if (stops === 0) return "Direct";
  if (stops === 1) return "1 stop";
  return `${stops} stops`;
}

function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00");
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildGoogleFlightsUrl(originCity: string, destCity: string, monthName: string): string {
  const year = new Date().getFullYear();
  const q = `flights from ${originCity} to ${destCity} ${monthName} ${year}`.replace(/\s+/g, "+");
  return `https://www.google.com/travel/flights?q=${q}`;
}

export const FlightsTab = ({
  departureCity,
  destinationCity,
  destinationCountry,
  travelMonth,
  tripDuration = 7,
  onSwitchTab,
}: FlightsTabProps) => {
  const monthName = formatMonthName(travelMonth);
  const destAirport = getDestAirport(destinationCity);

  const { data, isLoading, error } = useQuery<FlightInsightsData>({
    queryKey: ["flight-insights-v2", departureCity, destinationCity, travelMonth],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-flight-insights", {
        body: {
          originCity: departureCity,
          destinationCity,
          destinationCountry,
          destinationAirport: destAirport,
          travelMonth: monthName,
          travelYear: new Date().getFullYear().toString(),
          tripDuration,
          passengers: 1,
          cabinClass: "economy",
          currency: "GBP",
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    enabled: !!departureCity && !!destAirport,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (!departureCity) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No departure city specified. Getting There insights require a departure city.
          </p>
        </div>
      </div>
    );
  }

  if (!destAirport) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Airport data not available for {destinationCity} yet.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Checking live flight data for {departureCity} → {destinationCity}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">Unable to load flight data</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Please try again later."}
          </p>
        </div>
      </div>
    );
  }

  const sym = getCurrencySymbol(data.currency);

  return (
    <div className="pb-16">
      {/* Section 1: Route Header — warm gradient hero */}
      <div style={{ background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)" }} className="py-12">
        <div className="page-container">
          <RouteHeader data={data} sym={sym} />
        </div>
      </div>

      <div className="page-container pt-10">
        {/* Section 2: Price Feasibility Card */}
        <PriceFeasibilityCard data={data} sym={sym} monthName={monthName} />

        {/* Gateway Route Options — shown when gateway city exists */}
        {data.gatewayAirport && (
          <>
            <div className="my-10 h-px w-full" style={{ background: "#E7E5E4" }} />
            <GatewayRouteOptions data={data} sym={sym} monthName={monthName} />
          </>
        )}

        {/* Divider */}
        <div className="my-10 h-px w-full" style={{ background: "#E7E5E4" }} />

        <WaysToPayLess data={data} sym={sym} />

        {/* Divider */}
        <div className="my-10 h-px w-full" style={{ background: "#E7E5E4" }} />

        <BestTimeToFly data={data} sym={sym} monthName={monthName} />

        {/* Divider */}
        <div className="my-10 h-px w-full" style={{ background: "#E7E5E4" }} />

        <SmartFlyingInsights data={data} />

        {/* Divider */}
        <div className="my-10 h-px w-full" style={{ background: "#E7E5E4" }} />

        <OneWayVsRoundTrip data={data} sym={sym} />

        {/* Visa status callout */}
        <div className="my-10">
          <VisaStatusCallout
            city={destinationCity}
            country={destinationCountry}
            travelMonth={travelMonth}
            onSwitchTab={onSwitchTab}
          />
        </div>
      </div>

      {/* Section 6: Book Your Flights CTA — dark warm background */}
      <BookFlightsCTA data={data} monthName={monthName} travelMonth={travelMonth} />
    </div>
  );
};

// === Section 1: Route Header ===
function RouteHeader({ data, sym }: { data: FlightInsightsData; sym: string }) {
  // Sort origins by price ascending
  const sortedOrigins = [...data.originResults].sort((a, b) => a.lowestPrice - b.lowestPrice);
  const cheapestAirport = sortedOrigins[0]?.airport;
  const primaryAirport = data.primaryOrigin?.airport;

  const destOpps = data.destSavingOpportunities || [];
  const altAirportsChecked = data.alternativeAirportsChecked || 0;

  return (
    <div className="text-center">
      {/* City names with plane */}
      <div className="flex items-center justify-center gap-4">
        <span className="font-bold text-foreground" style={{ fontSize: "32px" }}>{data.route.origin.city}</span>
        <Plane className="text-[#EA580C]" style={{ width: "20px", height: "20px" }} />
        <span className="font-bold text-foreground" style={{ fontSize: "32px" }}>{data.route.destination.city}</span>
      </div>

      {/* Search summary strip */}
      <div className="flex items-center justify-center gap-1.5 mt-3" style={{ fontSize: "13px", color: "#6B7280" }}>
        <Search style={{ width: "13px", height: "13px", flexShrink: 0 }} />
        <span>
          {data.gatewayAirport
            ? `Checked ${data.originResults.length} departure ${data.originResults.length === 1 ? "airport" : "airports"} · Flying into ${data.route.destination.city} or ${data.gatewayAirport.city} · 4 date windows · one-way vs round-trip`
            : `Checked ${data.originResults.length} departure ${data.originResults.length === 1 ? "airport" : "airports"} · ${Math.max(1, altAirportsChecked + 1)} arrival ${altAirportsChecked + 1 === 1 ? "option" : "options"} · 4 date windows · one-way vs round-trip`
          }
        </span>
      </div>

      {/* Departure airport comparison strip */}
      <div className="mt-5">
        <div className="flex gap-3 overflow-x-auto pb-2 justify-center" style={{ scrollbarWidth: "thin" }}>
          {sortedOrigins.map((r) => {
            const isCheapest = r.airport === cheapestAirport && sortedOrigins.length > 1;
            const isPrimary = r.airport === primaryAirport;
            return (
              <div
                key={r.airport}
                className="flex-shrink-0 rounded-lg px-4 py-3 text-center"
                style={{
                  border: isCheapest ? "2px solid #16A34A" : "1px solid hsl(var(--border))",
                  minWidth: "120px",
                  background: "white",
                }}
              >
                <div className="font-bold text-foreground" style={{ fontSize: "16px" }}>{r.airport}</div>
                <div className="text-muted-foreground" style={{ fontSize: "12px" }}>{data.route.origin.city}</div>
                <div className="font-bold text-foreground mt-1.5" style={{ fontSize: "18px" }}>
                  {sym}{Math.round(r.lowestPrice / 2).toLocaleString()}
                </div>
                {isCheapest && (
                  <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
                    Lowest
                  </span>
                )}
                {isPrimary && !isCheapest && (
                  <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
                    Main hub
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-muted-foreground italic mt-2" style={{ fontSize: "13px" }}>All prices are one-way equivalent for comparison</p>
      </div>

      {/* Nearby arrival airports strip */}
      <div className="mt-4">
        <p className="text-muted-foreground font-medium mb-2" style={{ fontSize: "13px" }}>Nearby arrival airports checked</p>

        {/* Gateway airport always shown first if present */}
        {data.gatewayAirport ? (
          <div className="flex gap-3 overflow-x-auto pb-2 justify-center" style={{ scrollbarWidth: "thin" }}>
            {/* Gateway card — always first */}
            <div
              className="flex-shrink-0 rounded-lg px-4 py-3 text-center"
              style={{
                border: "2px solid #3B82F6",
                minWidth: "120px",
                background: "#EFF6FF",
              }}
            >
              <div className="font-bold text-foreground" style={{ fontSize: "16px" }}>{data.gatewayAirport.airport}</div>
              <div className="text-muted-foreground" style={{ fontSize: "12px" }}>{data.gatewayAirport.city}</div>
              <div className="font-bold text-foreground mt-1.5" style={{ fontSize: "18px" }}>
                {sym}{Math.round(data.gatewayAirport.lowestPrice / 2).toLocaleString()}
              </div>
              <span className="inline-block mt-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1E40AF" }}>
                Main hub
              </span>
            </div>

            {/* Direct destination card */}
            <div
              className="flex-shrink-0 rounded-lg px-4 py-3 text-center"
              style={{
                border: "1px solid hsl(var(--border))",
                minWidth: "120px",
                background: "white",
              }}
            >
              <div className="font-bold text-foreground" style={{ fontSize: "16px" }}>{data.route.destination.airport}</div>
              <div className="text-muted-foreground" style={{ fontSize: "12px" }}>{data.route.destination.city}</div>
              {data.pricing.lowestPrice ? (
                <div className="font-bold text-foreground mt-1.5" style={{ fontSize: "18px" }}>
                  {sym}{Math.round(data.pricing.lowestPrice / 2).toLocaleString()}
                </div>
              ) : (
                <div className="text-muted-foreground mt-1.5" style={{ fontSize: "14px" }}>No data</div>
              )}
            </div>

            {/* Any other alt destination opps */}
            {destOpps.filter((opp: any) => opp.airport !== data.gatewayAirport?.airport).map((opp: any, i: number) => {
              const meaningful = opp.priceSaving >= 40;
              return (
                <div
                  key={opp.airport || i}
                  className="flex-shrink-0 rounded-lg px-4 py-3 text-center"
                  style={{
                    border: meaningful ? "2px solid #16A34A" : "1px solid hsl(var(--border))",
                    minWidth: "120px",
                    background: "white",
                    opacity: meaningful ? 1 : 0.6,
                  }}
                >
                  <div className="font-bold text-foreground" style={{ fontSize: "16px" }}>{opp.airport}</div>
                  <div className="text-muted-foreground" style={{ fontSize: "12px" }}>{opp.city}</div>
                  {meaningful ? (
                    <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
                      Save ~{sym}{Math.round(opp.priceSaving / 2).toLocaleString()}/pp
                    </span>
                  ) : (
                    <p className="text-muted-foreground mt-1.5" style={{ fontSize: "11px" }}>
                      No meaningful saving vs {data.route.destination.airport}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : altAirportsChecked === 0 ? (
          <p className="text-muted-foreground" style={{ fontSize: "13px" }}>No alternative arrival airports within 350km</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 justify-center" style={{ scrollbarWidth: "thin" }}>
            {destOpps.map((opp: any, i: number) => {
              const meaningful = opp.priceSaving >= 40;
              return (
                <div
                  key={opp.airport || i}
                  className="flex-shrink-0 rounded-lg px-4 py-3 text-center"
                  style={{
                    border: meaningful ? "2px solid #16A34A" : "1px solid hsl(var(--border))",
                    minWidth: "120px",
                    background: "white",
                    opacity: meaningful ? 1 : 0.6,
                  }}
                >
                  <div className="font-bold text-foreground" style={{ fontSize: "16px" }}>{opp.airport}</div>
                  <div className="text-muted-foreground" style={{ fontSize: "12px" }}>{opp.city}</div>
                  {meaningful ? (
                    <span className="inline-block mt-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
                      Save ~{sym}{Math.round(opp.priceSaving / 2).toLocaleString()}/pp
                    </span>
                  ) : (
                    <p className="text-muted-foreground mt-1.5" style={{ fontSize: "11px" }}>
                      No meaningful saving vs {data.route.destination.airport}
                    </p>
                  )}
                </div>
              );
            })}
            {destOpps.length === 0 && altAirportsChecked > 0 && (
              <p className="text-muted-foreground" style={{ fontSize: "13px" }}>
                {altAirportsChecked} nearby {altAirportsChecked === 1 ? "airport" : "airports"} checked — no meaningful savings found
              </p>
            )}
          </div>
        )}
      </div>

      {/* Journey summary */}
      {data.bestFlight && (
        <p className="mt-4 text-[13px] text-muted-foreground">
          Typical journey:{" "}
          {data.bestFlight.durationRange
            ? `${formatDuration(data.bestFlight.durationRange.min)} — ${formatDuration(data.bestFlight.durationRange.p75)}`
            : data.bestFlight.totalDuration
              ? formatDuration(data.bestFlight.totalDuration)
              : "—"}
          {" · "}
          {formatStops(data.bestFlight.mostCommonStops ?? data.bestFlight.stops)}
          {(data.bestFlight.mostCommonStops ?? data.bestFlight.stops) > 0 && (() => {
            const hubs = data.bestFlight!.mostCommonHubs;
            if (hubs && hubs.length >= 2) return <> via {hubs[0]} or {hubs[1]}</>;
            if (hubs && hubs.length === 1) return <> via {hubs[0]}</>;
            if (data.bestFlight!.layoverAirports[0]) return <> via {data.bestFlight!.layoverAirports[0]}</>;
            return null;
          })()}
        </p>
      )}
    </div>
  );
}

// === Section 2: Price Feasibility Card ===
function PriceFeasibilityCard({ data, sym }: { data: FlightInsightsData; sym: string }) {
  const pricing = data.pricing;
  const synthesis = data.synthesis;
  const showCheapestNote =
    data.cheapestOrigin &&
    data.primaryOrigin &&
    data.cheapestOrigin.airport !== data.primaryOrigin.airport;

  const priceLevelConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: "Good value for this route", color: "#166534", bg: "#DCFCE7" },
    typical: { label: "Typical pricing", color: "#374151", bg: "#F3F4F6" },
    high: { label: "Higher than usual", color: "#92400E", bg: "#FEF3C7" },
  };

  const levelConfig = priceLevelConfig[pricing.priceLevel || "typical"] || priceLevelConfig.typical;

  return (
    <div
      className="mt-8 rounded-lg border p-6 md:p-8"
      style={{ borderColor: "#E5E7EB" }}
    >
      <div className="flex flex-col md:flex-row md:gap-8">
        {/* Left side: pricing */}
        <div className="flex-1 md:w-[60%]">
          {/* Label */}
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
            Typical round-trip · Economy · Per person
          </p>

          {/* Price range — per person (data is for 2 pax) */}
          {pricing.typicalRange ? (
            <>
              <p className="text-foreground" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.1 }}>
                {sym}{Math.round(pricing.typicalRange[0] / 2).toLocaleString()} — {sym}{Math.round(pricing.typicalRange[1] / 2).toLocaleString()}
                <span style={{ fontSize: "18px", fontWeight: 400 }} className="ml-2 text-muted-foreground">per person</span>
              </p>
            </>
          ) : pricing.lowestPrice ? (
            <>
              <p className="text-foreground" style={{ fontSize: "42px", fontWeight: 800, lineHeight: 1.1 }}>
                From {sym}{Math.round(pricing.lowestPrice / 2).toLocaleString()}
                <span style={{ fontSize: "18px", fontWeight: 400 }} className="ml-2 text-muted-foreground">per person</span>
              </p>
            </>
          ) : (
            <p className="text-4xl font-bold text-muted-foreground">Price unavailable</p>
          )}

          {/* Cheapest origin note */}
          {showCheapestNote && (
            <p className="mt-2 text-[13px] italic text-muted-foreground">
              Lowest fares from {data.cheapestOrigin!.airport}
            </p>
          )}

          {/* Price level badge */}
          <div className="mt-3">
            <span
              className="inline-block text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: levelConfig.bg, color: levelConfig.color }}
            >
              {levelConfig.label}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border/60 mx-2" />
        <div className="block md:hidden h-px bg-border/60 my-5" />

        {/* Right side: context */}
        <div className="flex-1 md:w-[40%] flex flex-col justify-center gap-3">
          {synthesis?.priceTrend && (
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              {synthesis.priceTrend}
            </p>
          )}
          {synthesis?.priceVerdict && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {synthesis.priceVerdict}
            </p>
          )}
          {synthesis?.bookingTiming && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {synthesis.bookingTiming}
            </p>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="mt-6 text-[11px] text-muted-foreground/70">
        Indicative pricing from live market data. Actual fares vary by booking date and availability.
      </p>
    </div>
  );
}

// === Gateway Route Options ===
function GatewayRouteOptions({ data, sym }: { data: FlightInsightsData; sym: string }) {
  const gw = data.gatewayAirport;
  if (!gw) return null;

  const mainPricePP = data.pricing.lowestPrice ? Math.round(data.pricing.lowestPrice / 2) : null;
  const gwPricePP = Math.round(gw.lowestPrice / 2);
  const savingPP = gw.saving > 0 ? Math.round(gw.saving / 2) : 0;
  const gwMoreExpensive = gw.saving < 0 ? Math.round(Math.abs(gw.saving) / 2) : 0;

  const formatTransferTime = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Extract first sentence from gatewayTransferInfo for the summary line
  const transferSummary = data.gatewayTransferInfo
    ? data.gatewayTransferInfo.split(/[.!]\s/)[0] + "."
    : null;

  return (
    <div>
      <h3
        className="font-bold text-foreground"
        style={{ fontSize: "22px", borderLeft: "3px solid #3B82F6", paddingLeft: "8px" }}
      >
        Your route options into {data.route.destination.city}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* Card A — Fly direct to destination */}
        <div
          className="rounded-lg border p-5 flex flex-col"
          style={{ borderColor: "#E5E7EB", background: "white" }}
        >
          <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Fly direct to {data.route.destination.city}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {data.route.destination.airport} — {data.route.destination.city} Airport
          </p>
          {mainPricePP ? (
            <p className="font-extrabold text-foreground mt-3" style={{ fontSize: "24px" }}>
              {sym}{mainPricePP.toLocaleString()} <span className="font-normal text-muted-foreground" style={{ fontSize: "14px" }}>per person</span>
            </p>
          ) : (
            <p className="text-muted-foreground mt-3" style={{ fontSize: "14px" }}>Pricing unavailable</p>
          )}
          <div className="mt-3">
            <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E" }}>
              Limited international flights
            </span>
          </div>
          <div className="flex-1" />
        </div>

        {/* Card B — Fly via gateway */}
        <div
          className="rounded-lg p-5 flex flex-col"
          style={{ borderLeft: "3px solid #3B82F6", border: "1px solid #BFDBFE", borderLeftWidth: "3px", borderLeftColor: "#3B82F6", background: "#EFF6FF" }}
        >
          <p className="text-[12px] font-medium uppercase tracking-wide" style={{ color: "#1E40AF" }}>
            Fly via {gw.city} <span style={{ fontWeight: 400, textTransform: "none" }}>— recommended for international</span>
          </p>
          <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
            {gw.airport} — {gw.city} Airport
          </p>
          <p className="font-extrabold text-foreground mt-3" style={{ fontSize: "24px" }}>
            {sym}{gwPricePP.toLocaleString()} <span className="font-normal text-muted-foreground" style={{ fontSize: "14px" }}>per person</span>
          </p>

          <p className="text-sm text-muted-foreground mt-2">
            Transfer to {data.route.destination.city}: ~{formatTransferTime(gw.transferTime)} by {gw.transferMode}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#DBEAFE", color: "#1E40AF" }}>
              Main international hub
            </span>
            {savingPP > 0 && (
              <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#DCFCE7", color: "#166534" }}>
                Saves {sym}{savingPP}/pp
              </span>
            )}
            {gwMoreExpensive > 0 && (
              <span className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: "#F3F4F6", color: "#374151" }}>
                {sym}{gwMoreExpensive} more but significantly more flight options
              </span>
            )}
          </div>

          <p className="text-[13px] italic mt-3" style={{ color: "#6B7280" }}>
            {gw.note}
          </p>
          <div className="flex-1" />
        </div>
      </div>

      {/* Transfer info summary */}
      {transferSummary && (
        <p className="text-sm text-muted-foreground mt-4">
          <span className="font-medium text-foreground">From {gw.city} to {data.route.destination.city}:</span>{" "}
          {transferSummary}
        </p>
      )}
    </div>
  );
}

// === Section 3: Ways to Pay Less ===
function WaysToPayLess({ data, sym }: { data: FlightInsightsData; sym: string }) {
  const hasOriginSaving = data.originSavingOpportunity;
  const hasDestSavings = data.destSavingOpportunities && data.destSavingOpportunities.length > 0;

  if (!hasOriginSaving && !hasDestSavings) return null;

  return (
    <div className="mt-10">
      <h3
        className="font-bold text-foreground mb-5"
        style={{ fontSize: "22px", borderLeft: "3px solid #EA580C", paddingLeft: "8px" }}
      >
        Ways to pay less on this route
      </h3>

      <div className="space-y-4">
        {/* Origin saving card */}
        {hasOriginSaving && data.cheapestOrigin && data.primaryOrigin && (
          <div
            className="rounded-lg p-5"
            style={{
              borderLeft: "3px solid #D97706",
              background: "#FFFBEB",
            }}
          >
            <span
              className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full mb-3"
              style={{ background: "#FDE68A", color: "#92400E" }}
            >
              Origin saving
            </span>

            <p className="text-base font-bold text-foreground">
              Fly from {data.cheapestOrigin.airport} instead of {data.primaryOrigin.airport}
            </p>

            <p className="text-[15px] text-foreground mt-1.5">
              Save approximately {sym}{Math.round(data.originSaving / 2).toLocaleString()} per person
            </p>

            {data.cheapestOrigin.airlines && data.cheapestOrigin.airlines.length > 0 && (
              <p className="text-[13px] text-muted-foreground mt-2">
                Airlines on this route: {[...new Set(data.cheapestOrigin.airlines)].join(" · ")}
              </p>
            )}

            {data.synthesis?.originTransferNote && (
              <p className="text-[13px] text-muted-foreground mt-1">
                {data.synthesis.originTransferNote}
              </p>
            )}
          </div>
        )}

        {/* Destination saving cards */}
        {hasDestSavings &&
          data.destSavingOpportunities.map((opp: any, i: number) => (
            <div
              key={opp.airport || i}
              className="rounded-lg p-5"
              style={{
                borderLeft: "3px solid #16A34A",
                background: "#F0FDF4",
              }}
            >
              <span
                className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full mb-3"
                style={{ background: "#BBF7D0", color: "#14532D" }}
              >
                Nearby airport
              </span>

              <p className="text-base font-bold text-foreground">
                Fly into {opp.city} instead of {data.route.destination.city}
              </p>

              <p className="text-[15px] text-foreground mt-1.5">
                Save approximately {sym}{Math.round(opp.priceSaving / 2).toLocaleString()} per person
              </p>

              <p className="text-sm text-muted-foreground mt-2">
                Ground transfer to {data.route.destination.city}: ~
                {opp.groundTransferMinutes >= 60
                  ? `${Math.floor(opp.groundTransferMinutes / 60)}h ${opp.groundTransferMinutes % 60}m`
                  : `${opp.groundTransferMinutes}m`}
                {" "}by {opp.transferMode} — ~{opp.transferCost}
              </p>

              <p className="text-[13px] text-muted-foreground italic mt-2">
                Factor in transfer time and cost before deciding
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

// === Section 4: Best Time to Fly ===
function BestTimeToFly({ data, sym, monthName }: { data: FlightInsightsData; sym: string; monthName: string }) {
  const weeks = data.weeklyPricing;
  if (!weeks || weeks.length === 0) return null;

  const bestDate = data.bestWeek?.date;
  const worstDate = data.worstWeek?.date;

  const chartData = weeks.slice(0, 4).map((week) => {
    const pricePerPerson = week.lowestPrice != null ? Math.round(week.lowestPrice / 2) : null;
    const isBest = week.date === bestDate;
    const isWorst = week.date === worstDate;
    return {
      label: week.date,
      price: pricePerPerson,
      displayPrice: pricePerPerson != null ? pricePerPerson : 0,
      isBest,
      isWorst,
      hasData: pricePerPerson != null,
      tag: isBest ? "Best value" : isWorst ? "Higher demand" : null,
    };
  });

  // Find max for Y axis
  const prices = chartData.filter(d => d.hasData).map(d => d.price!);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  // Use a placeholder height for no-data bars
  const noDataHeight = Math.round(maxPrice * 0.3);

  const getBarColor = (entry: typeof chartData[0]) => {
    if (!entry.hasData) return "#D1D5DB";
    if (entry.isBest) return "#16A34A";
    if (entry.isWorst) return "#D97706";
    return "rgba(234, 88, 12, 0.4)";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    if (!d.hasData) return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">No data for this week</div>
    );
    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
        <p className="text-sm font-medium text-foreground">{d.label}</p>
        <p className="text-sm text-foreground">{sym}{d.price!.toLocaleString()} per person</p>
        {d.tag && (
          <span
            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1"
            style={{
              background: d.isBest ? "#BBF7D0" : "#FDE68A",
              color: d.isBest ? "#14532D" : "#92400E",
            }}
          >{d.tag}</span>
        )}
      </div>
    );
  };

  const bestWeek = chartData.find(d => d.isBest && d.hasData);

  return (
    <div>
      <h3
        className="font-bold text-foreground"
        style={{ fontSize: "22px", borderLeft: "3px solid #EA580C", paddingLeft: "8px" }}
      >
        Best time to fly in {monthName}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        How fares compare across the month
      </p>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.map(d => ({ ...d, displayPrice: d.hasData ? d.price! : noDataHeight }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <XAxis dataKey="label" tick={{ fontSize: 13 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${sym}${v}`}
              domain={[0, Math.ceil(maxPrice * 1.15)]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
            <Bar dataKey="displayPrice" radius={[4, 4, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={getBarColor(entry)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {bestWeek && (
        <p className="mt-4 text-sm font-medium" style={{ color: "#16A34A" }}>
          Best week: {bestWeek.label} at {sym}{bestWeek.price!.toLocaleString()} per person
        </p>
      )}

      {data.synthesis?.bestWeekReason && (
        <p className="mt-1 text-sm text-muted-foreground italic">
          {data.synthesis.bestWeekReason}
        </p>
      )}
    </div>
  );
}

// === Section 5: Smart Flying Insights ===
function SmartFlyingInsights({ data }: { data: FlightInsightsData }) {
  const s = data.synthesis;
  if (!s) return null;

  const sym = getCurrencySymbol(data.currency);

  const borderColors: Record<string, string> = {
    "The journey": "#3B82F6",
    "When to book": "#EA580C",
    "Be flexible": "#8B5CF6",
    "Carbon context": "#0D9488",
    "Watch out for": "#0D9488",
    "Round-trip vs two one-ways": "#16A34A",
  };

  const cards: { icon: React.ElementType; title: string; body: React.ReactNode }[] = [
    { icon: Route, title: "The journey", body: s.insight_route },
    { icon: Calendar, title: "When to book", body: s.bookingTiming },
    { icon: ArrowLeftRight, title: "Be flexible", body: s.insight_timing || s.insight_flexibility },
  ];

  if (s.insight_hiddencosts) {
    cards.push({ icon: Info, title: "Watch out for", body: s.insight_hiddencosts });
  } else if (data.bestFlight?.carbonEmissions) {
    const kgCO2 = Math.round(data.bestFlight.carbonEmissions / 1000);
    const comparison = s.carbonComparison ? ` — ${s.carbonComparison}` : "";
    cards.push({
      icon: Info,
      title: "Carbon context",
      body: `This route produces approximately ${kgCO2} kg CO₂ per passenger${comparison}.`,
    });
  }

  // Ticketing insight removed — now in dedicated section

  const validCards = cards.filter(c => c.body);
  if (validCards.length === 0) return null;

  return (
    <div>
      <h3
        className="font-bold text-foreground mb-5"
        style={{ fontSize: "22px", borderLeft: "3px solid #EA580C", paddingLeft: "8px" }}
      >
        Smart flying insights
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {validCards.map((card, i) => {
          const Icon = card.icon;
          const borderColor = borderColors[card.title] || "#E7E5E4";
          return (
            <div
              key={i}
              className="rounded-lg border p-5"
              style={{ borderLeftWidth: "3px", borderLeftColor: borderColor }}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[15px] font-bold text-foreground mb-1">{card.title}</h4>
                  {typeof card.body === "string" ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                  ) : (
                    card.body
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// === Section: One-way vs Round-trip Comparison ===
function OneWayVsRoundTrip({ data, sym }: { data: FlightInsightsData; sym: string }) {
  const ti = data.ticketingInsight;
  const origin = data.route.origin;
  const dest = data.route.destination;

  const noData = !ti || (ti.outboundPrice === 0 && ti.returnPrice === 0);
  const unreliable = ti && ti.dataReliable === false;

  return (
    <div>
      <h3
        className="font-bold text-foreground"
        style={{ fontSize: "22px", borderLeft: "3px solid #EA580C", paddingLeft: "8px" }}
      >
        One-way vs round-trip
      </h3>
      <p className="text-muted-foreground mt-1 mb-5" style={{ fontSize: "14px" }}>
        We priced both options so you don't have to
      </p>

      {noData || unreliable ? (
        <p className="text-muted-foreground" style={{ fontSize: "14px" }}>
          We were unable to retrieve independent one-way pricing for this route — search Google Flights directly to compare one-way options.
        </p>
      ) : (
        <>
          {/* Three-column comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Outbound one-way */}
            <div className="rounded-lg border p-5 text-center">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Outbound only</p>
              <p className="text-sm text-muted-foreground mt-1">{origin.airport} → {dest.airport}</p>
              <p className="font-extrabold text-foreground mt-2" style={{ fontSize: "24px" }}>
                {ti!.outboundPrice > 0 ? `${sym}${ti!.outboundPrice.toLocaleString()}` : "—"}
              </p>
              {ti!.outboundPrice > 0 && <p className="text-muted-foreground" style={{ fontSize: "12px" }}>per person</p>}
              {data.searchDates?.outbound && (
                <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>{formatDisplayDate(data.searchDates.outbound)}</p>
              )}
            </div>

            {/* Return one-way */}
            <div className="rounded-lg border p-5 text-center">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Return only</p>
              <p className="text-sm text-muted-foreground mt-1">{dest.airport} → {origin.airport}</p>
              <p className="font-extrabold text-foreground mt-2" style={{ fontSize: "24px" }}>
                {ti!.returnPrice > 0 ? `${sym}${ti!.returnPrice.toLocaleString()}` : "—"}
              </p>
              {ti!.returnPrice > 0 && <p className="text-muted-foreground" style={{ fontSize: "12px" }}>per person</p>}
              {data.searchDates?.return && (
                <p className="text-muted-foreground mt-1" style={{ fontSize: "12px" }}>{formatDisplayDate(data.searchDates.return)}</p>
              )}
            </div>

            {/* Round-trip */}
            <div className="rounded-lg border p-5 text-center">
              <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wide">Round-trip</p>
              <p className="text-sm text-muted-foreground mt-1">{origin.airport} ⇄ {dest.airport}</p>
              <p className="font-extrabold text-foreground mt-2" style={{ fontSize: "24px" }}>
                {sym}{ti!.roundTripPrice.toLocaleString()}
              </p>
              <p className="text-muted-foreground" style={{ fontSize: "12px" }}>per person</p>
            </div>
          </div>

          {/* Verdict */}
          {(() => {
            const saving = ti!.saving || Math.abs(ti!.roundTripPrice - ti!.combinedOneWayPrice);
            const savingPct = ti!.savingPercentage || Math.round((saving / Math.max(ti!.roundTripPrice, ti!.combinedOneWayPrice)) * 100);
            const isMeaningful = ti!.meaningful;

            if (!isMeaningful) {
              return (
                <div className="mt-4 rounded-lg px-5 py-4" style={{ background: "#F3F4F6" }}>
                  <p className="text-sm font-medium" style={{ color: "#374151" }}>
                    Prices are similar either way — round-trip is simpler to manage
                  </p>
                </div>
              );
            }

            if (ti!.cheaperOption === "oneWay") {
              return (
                <div className="mt-4 rounded-lg px-5 py-4" style={{ background: "#F0FDF4" }}>
                  <p className="text-sm font-medium" style={{ color: "#166534" }}>
                    Two one-ways save you {sym}{ti!.savingPerPerson || saving} per person ({savingPct}%) — book outbound and return separately
                  </p>
                </div>
              );
            }

            return (
              <div className="mt-4 rounded-lg px-5 py-4" style={{ background: "#F0FDF4" }}>
                <p className="text-sm font-medium" style={{ color: "#166534" }}>
                  Round-trip saves you {sym}{ti!.savingPerPerson || saving} per person ({savingPct}%) — book as one ticket
                </p>
              </div>
            );
          })()}

          {/* Caveat */}
          <p className="mt-3 italic" style={{ fontSize: "12px", color: "#9CA3AF" }}>
            Separate bookings offer no protection if one flight is disrupted — consider travel insurance
          </p>
        </>
      )}
    </div>
  );
}


// === Section 6: Book Your Flights CTA ===
function BookFlightsCTA({ data, monthName, travelMonth }: { data: FlightInsightsData; monthName: string; travelMonth: string }) {
  const originCity = data.route.origin.city;
  const destCity = data.route.destination.city;
  const originIATA = data.route.origin.airport;
  const destIATA = data.route.destination.airport;
  const year = new Date().getFullYear();
  const gw = data.gatewayAirport;

  // Google Flights: simple query format
  const gfQuery = `flights from ${originCity} to ${destCity} ${monthName} ${year}`.replace(/\s+/g, "+");
  const googleFlightsUrl = `https://www.google.com/travel/flights?q=${gfQuery}`;

  // Gateway Google Flights URL
  const gwGfQuery = gw
    ? `flights from ${originCity} to ${gw.city} ${monthName} ${year}`.replace(/\s+/g, "+")
    : "";
  const gatewayGoogleFlightsUrl = gw ? `https://www.google.com/travel/flights?q=${gwGfQuery}` : "";

  // Skyscanner
  const outDate = data.searchDates.outbound.replace(/-/g, "").slice(2);
  const retDate = data.searchDates.return.replace(/-/g, "").slice(2);
  const skyscannerUrl = `https://www.skyscanner.net/transport/flights/${originIATA}/${destIATA}/${outDate}/${retDate}/`;

  // Kayak
  const kayakUrl = `https://www.kayak.com/flights/${originIATA}-${destIATA}/${data.searchDates.outbound}/${data.searchDates.return}/2adults`;

  return (
    <div className="mt-12" style={{ background: "#1C1917" }}>
      <div className="page-container py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Left side */}
          <div>
            <h3 className="text-[17px] font-bold" style={{ color: "#FFFFFF" }}>
              Ready to check live fares?
            </h3>
            <p className="text-sm mt-1" style={{ color: "#D6D3D1" }}>
              Search directly on your preferred platform — prices update in real time
            </p>
          </div>

          {/* Right side */}
          <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
            {gw ? (
              <>
                <a
                  href={gatewayGoogleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ background: "#EA580C", color: "#FFFFFF" }}
                >
                  Search flights to {destCity} (via {gw.city}) →
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <a
                  href={googleFlightsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ background: "transparent", color: "#D6D3D1", border: "1px solid #57534E" }}
                >
                  Search flights direct to {destIATA} →
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </>
            ) : (
              <a
                href={googleFlightsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                style={{ background: "#EA580C", color: "#FFFFFF" }}
              >
                Search on Google Flights
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <p className="text-sm" style={{ color: "#A8A29E" }}>
              Also check:{" "}
              <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 transition-opacity" style={{ color: "#D6D3D1" }}>Skyscanner</a>
              {" · "}
              <a href={kayakUrl} target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 transition-opacity" style={{ color: "#D6D3D1" }}>Kayak</a>
            </p>

            <a
              href={gw ? gatewayGoogleFlightsUrl : googleFlightsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] hover:opacity-80 transition-opacity"
              style={{ color: "#A8A29E" }}
            >
              Track price changes: Set a Google Flights alert for this route →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseMonthNumber(month: string): number {
  const map: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
    jan: 1, feb: 2, mar: 3, apr: 4, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  return map[month.toLowerCase().trim()] || 1;
}
