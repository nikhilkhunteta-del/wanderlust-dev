import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMonthName } from "@/lib/formatMonth";
import { Loader2, Plane, ChevronDown } from "lucide-react";

interface FlightsTabProps {
  departureCity: string;
  destinationCity: string;
  destinationCountry: string;
  travelMonth: string;
  tripDuration?: number;
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
  stops: number;
  layoverAirports: string[];
  airlines: string[];
  carbonEmissions: number | null;
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
  routeIntelligence: string;
  synthesis: {
    priceVerdict: string;
    bookingTiming: string;
    bestWeekReason: string;
    insight_route: string;
    insight_flexibility: string;
    insight_hiddencosts: string | null;
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

export const FlightsTab = ({
  departureCity,
  destinationCity,
  destinationCountry,
  travelMonth,
  tripDuration = 7,
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
          passengers: 2,
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
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-10 pb-16">
      {/* Section 1: Route Header */}
      <RouteHeader data={data} sym={sym} />

      {/* Section 2: Price Feasibility Card */}
      <PriceFeasibilityCard data={data} sym={sym} />
    </div>
  );
};

// === Section 1: Route Header ===
function RouteHeader({ data, sym }: { data: FlightInsightsData; sym: string }) {
  const [airportsExpanded, setAirportsExpanded] = useState(false);
  const multipleOrigins = data.originResults.length > 1;

  return (
    <div className="text-center">
      {/* City names with plane */}
      <div className="flex items-center justify-center gap-4">
        <span className="text-2xl font-bold text-foreground">{data.route.origin.city}</span>
        <Plane className="w-5 h-5 text-muted-foreground" />
        <span className="text-2xl font-bold text-foreground">{data.route.destination.city}</span>
      </div>

      {/* Airport codes */}
      <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
        {multipleOrigins ? (
          <button
            onClick={() => setAirportsExpanded(!airportsExpanded)}
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            {data.originResults.length} airports checked
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${airportsExpanded ? "rotate-180" : ""}`} />
          </button>
        ) : (
          <span>{data.route.origin.airport}</span>
        )}
        <span>→</span>
        <span>{data.route.destination.airport}</span>
      </div>

      {/* Expanded airport list */}
      {multipleOrigins && airportsExpanded && (
        <div className="mt-2 text-sm text-muted-foreground">
          {data.originResults.map((r, i) => (
            <span key={r.airport}>
              {i > 0 && <span className="mx-1.5">·</span>}
              <span className="font-medium text-foreground/80">{r.airport}</span>
              <span> — {sym}{r.lowestPrice.toLocaleString()}</span>
            </span>
          ))}
        </div>
      )}

      {/* Journey summary */}
      {data.bestFlight && (
        <p className="mt-3 text-[13px] text-muted-foreground">
          Typical journey: {data.bestFlight.totalDuration ? formatDuration(data.bestFlight.totalDuration) : "—"}
          {" · "}
          {formatStops(data.bestFlight.stops)}
          {data.bestFlight.stops > 0 && data.bestFlight.layoverAirports[0] && (
            <> via {data.bestFlight.layoverAirports[0]}</>
          )}
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
    low: { label: "Good value for this route", color: "text-green-700", bg: "bg-green-50" },
    typical: { label: "Typical pricing", color: "text-muted-foreground", bg: "bg-muted/50" },
    high: { label: "Higher than usual", color: "text-amber-700", bg: "bg-amber-50" },
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
            Typical round-trip · Economy · 2 passengers
          </p>

          {/* Price range */}
          {pricing.typicalRange ? (
            <p className="text-4xl font-bold text-foreground">
              {sym}{pricing.typicalRange[0]?.toLocaleString()} — {sym}{pricing.typicalRange[1]?.toLocaleString()}
            </p>
          ) : pricing.lowestPrice ? (
            <p className="text-4xl font-bold text-foreground">
              From {sym}{pricing.lowestPrice.toLocaleString()}
            </p>
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
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full ${levelConfig.bg} ${levelConfig.color}`}>
              {levelConfig.label}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px bg-border/60 mx-2" />
        <div className="block md:hidden h-px bg-border/60 my-5" />

        {/* Right side: context */}
        <div className="flex-1 md:w-[40%] flex flex-col justify-center gap-3">
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
