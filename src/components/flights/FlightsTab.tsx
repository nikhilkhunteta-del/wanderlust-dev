import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatMonthName } from "@/lib/formatMonth";
import { Loader2, Plane, ChevronDown, Route, Calendar, ArrowLeftRight, Info, ExternalLink } from "lucide-react";

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
  durationRange: { min: number; p75: number } | null;
  stops: number;
  mostCommonStops: number;
  layoverAirports: string[];
  mostCommonHubs: string[];
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
    insight_timing: string;
    insight_hiddencosts: string | null;
    carbonComparison: string | null;
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

      {/* Section 3: Ways to Pay Less */}
      <WaysToPayLess data={data} sym={sym} />

      {/* Section 4: Best Time to Fly */}
      <BestTimeToFly data={data} sym={sym} monthName={monthName} />

      {/* Section 5: Smart Flying Insights */}
      <SmartFlyingInsights data={data} />

      {/* Section 6: Book Your Flights CTA */}
      <BookFlightsCTA data={data} monthName={monthName} travelMonth={travelMonth} />
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
              <span> — {sym}{Math.round(r.lowestPrice / 2).toLocaleString()}/pp</span>
            </span>
          ))}
        </div>
      )}

      {/* Journey summary */}
      {data.bestFlight && (
        <p className="mt-3 text-[13px] text-muted-foreground">
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
            Typical round-trip · Economy · Per person
          </p>

          {/* Price range — per person (data is for 2 pax) */}
          {pricing.typicalRange ? (
            <>
              <p className="text-4xl font-bold text-foreground">
                {sym}{Math.round(pricing.typicalRange[0] / 2).toLocaleString()} — {sym}{Math.round(pricing.typicalRange[1] / 2).toLocaleString()} per person
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                Total for 2 passengers: {sym}{pricing.typicalRange[0]?.toLocaleString()} — {sym}{pricing.typicalRange[1]?.toLocaleString()}
              </p>
            </>
          ) : pricing.lowestPrice ? (
            <>
              <p className="text-4xl font-bold text-foreground">
                From {sym}{Math.round(pricing.lowestPrice / 2).toLocaleString()} per person
              </p>
              <p className="text-[13px] text-muted-foreground mt-1.5">
                Total for 2 passengers: {sym}{pricing.lowestPrice.toLocaleString()}
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

// === Section 3: Ways to Pay Less ===
function WaysToPayLess({ data, sym }: { data: FlightInsightsData; sym: string }) {
  const hasOriginSaving = data.originSavingOpportunity;
  const hasDestSavings = data.destSavingOpportunities && data.destSavingOpportunities.length > 0;

  if (!hasOriginSaving && !hasDestSavings) return null;

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-foreground mb-5">
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

  const weekLabels = ["Early", "Mid-early", "Mid-late", "Late"];

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-foreground">
        Best time to fly in {monthName}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        How fares compare across the month
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {weeks.slice(0, 4).map((week, i) => {
          const isBest = data.bestWeek && week.date === data.bestWeek.date;
          const isWorst = data.worstWeek && week.date === data.worstWeek.date;

          let borderStyle = "border";
          let tag: { label: string; bg: string; color: string } | null = null;

          if (isBest) {
            borderStyle = "border border-l-[3px] border-l-[#16A34A]";
            tag = { label: "Best value", bg: "#BBF7D0", color: "#14532D" };
          } else if (isWorst) {
            borderStyle = "border border-l-[3px] border-l-[#D97706]";
            tag = { label: "Higher demand", bg: "#FDE68A", color: "#92400E" };
          }

          return (
            <div key={week.date || i} className={`rounded-lg p-4 ${borderStyle}`}>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {weekLabels[i] || week.week} {monthName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{week.date}</p>
              <p className="text-[22px] font-bold text-foreground mt-2">
                {week.lowestPrice != null ? `${sym}${Math.round(week.lowestPrice / 2).toLocaleString()}` : (
                  <span className="text-muted-foreground text-base font-normal">No data</span>
                )}
              </p>
              {tag && (
                <span
                  className="inline-block text-[11px] font-medium px-2.5 py-0.5 rounded-full mt-2"
                  style={{ background: tag.bg, color: tag.color }}
                >
                  {tag.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {data.synthesis?.bestWeekReason && (
        <p className="mt-4 text-sm text-muted-foreground italic">
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

  const cards: { icon: React.ElementType; title: string; body: string | null }[] = [
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

  const validCards = cards.filter(c => c.body);
  if (validCards.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="text-lg font-bold text-foreground mb-5">
        Smart flying insights
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {validCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="rounded-lg border p-5">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-foreground mb-1">{card.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
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

  // Google Flights: simple query format
  const gfQuery = `flights from ${originCity} to ${destCity} ${monthName} ${year}`.replace(/\s+/g, "+");
  const googleFlightsUrl = `https://www.google.com/travel/flights?q=${gfQuery}`;

  // Skyscanner: /transport/flights/IATA/IATA/YYMMDD/YYMMDD/
  const outDate = data.searchDates.outbound.replace(/-/g, "").slice(2); // YYMMDD
  const retDate = data.searchDates.return.replace(/-/g, "").slice(2);
  const skyscannerUrl = `https://www.skyscanner.net/transport/flights/${originIATA}/${destIATA}/${outDate}/${retDate}/`;

  // Kayak: /flights/IATA-IATA/YYYY-MM-DD/YYYY-MM-DD/2adults
  const kayakUrl = `https://www.kayak.com/flights/${originIATA}-${destIATA}/${data.searchDates.outbound}/${data.searchDates.return}/2adults`;

  return (
    <div className="mt-12 border-t pt-8" style={{ borderColor: "#E5E7EB" }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left side */}
        <div>
          <h3 className="text-[17px] font-bold text-foreground">
            Ready to check live fares?
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Search directly on your preferred platform — prices update in real time
          </p>
        </div>

        {/* Right side */}
        <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
          <a
            href={googleFlightsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Search on Google Flights
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <p className="text-sm text-muted-foreground">
            Also check:{" "}
            <a href={skyscannerUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Skyscanner</a>
            {" · "}
            <a href={kayakUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">Kayak</a>
          </p>

          <a
            href={googleFlightsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            Track price changes: Set a Google Flights alert for this route →
          </a>
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
