import { useRef, useEffect } from "react";
import { useFlightInsights } from "@/hooks/useCityData";
import { supabase } from "@/integrations/supabase/client";
import { RouteOverview } from "./RouteOverview";
import { FlightSearchControls } from "./FlightSearchControls";
import { PriceSnapshotCard } from "./PriceSnapshotCard";
import { TimingInsightCard } from "./TimingInsightCard";
import { AirportComparisonCard } from "./AirportComparisonCard";
import { SmartInsights } from "./SmartInsights";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { Loader2, Plane, Info } from "lucide-react";

interface FlightsTabProps {
  departureCity: string;
  destinationCity: string;
  destinationCountry: string;
  travelMonth: string;
}

export const FlightsTab = ({
  departureCity,
  destinationCity,
  destinationCountry,
  travelMonth,
}: FlightsTabProps) => {
  const request = departureCity
    ? { departureCity, destinationCity, destinationCountry, travelMonth }
    : null;

  const { data, isLoading, isFetching, error, dataUpdatedAt } = useFlightInsights(request);
  const initialLoadTime = useRef<number | null>(null);
  
  // Track if data came from cache (loaded instantly)
  if (data && !initialLoadTime.current) {
    initialLoadTime.current = Date.now();
  }
  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  // === TEST CALL: fetch-flight-insights (remove after verification) ===
  const testCallMade = useRef(false);
  useEffect(() => {
    if (testCallMade.current || !departureCity || !destinationCity) return;
    testCallMade.current = true;
    
    console.log("[FlightsTab] Testing fetch-flight-insights...");
    supabase.functions.invoke("fetch-flight-insights", {
      body: {
        originCity: departureCity,
        destinationCity: destinationCity,
        destinationAirport: "JAI", // hardcoded for test
        travelMonth: travelMonth || "April",
        travelYear: "2026",
        tripDuration: 7,
        passengers: 2,
        cabinClass: "economy",
        currency: "GBP",
      },
    }).then(({ data: testData, error: testError }) => {
      if (testError) {
        console.error("[fetch-flight-insights TEST] Error:", testError);
      } else {
        console.log("[fetch-flight-insights TEST] Full response:", JSON.stringify(testData, null, 2));
      }
    });
  }, [departureCity, destinationCity, travelMonth]);
  // === END TEST CALL ===

  if (!departureCity) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No departure city specified. Flight insights require a departure city.
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
            Analyzing flight routes from {departureCity}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Plane className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">Unable to load flight insights</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load flight data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-semibold">Flight Insights</h2>
          </div>
          <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
        </div>
        <p className="text-muted-foreground">
          Indicative pricing and route information for your trip
        </p>
      </div>

      <div className="space-y-8">
        {/* Route Overview */}
        <RouteOverview
          originCity={data.originCity}
          originAirports={data.originAirports}
          destinationCity={data.destinationCity}
          destinationCountry={data.destinationCountry}
          destinationAirports={data.destinationAirports}
        />

        {/* Flight Search Controls */}
        <FlightSearchControls
          originAirports={data.originAirports}
          destinationAirports={data.destinationAirports}
          travelMonth={data.travelMonth}
        />

        {/* Price Snapshot */}
        <PriceSnapshotCard snapshot={data.priceSnapshot} travelMonth={data.travelMonth} />

        {/* Timing Insight */}
        <TimingInsightCard insight={data.timingInsight} />

        {/* Airport Comparisons */}
        <AirportComparisonCard comparisons={data.airportComparisons} />

        {/* Smart Insights */}
        <SmartInsights insights={data.smartInsights} />

        {/* Footer */}
        <footer className="flex items-start gap-2 text-xs text-muted-foreground pt-4 border-t border-border/50">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p>{data.disclaimer}</p>
            <p className="mt-1">Last updated: {data.lastUpdated}</p>
          </div>
        </footer>
      </div>
    </div>
  );
};
