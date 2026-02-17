import { useRef } from "react";
import { useStayInsights } from "@/hooks/useCityData";
import { PriceCategoryCard } from "./PriceCategoryCard";
import { NeighbourhoodCard } from "./NeighbourhoodCard";
import { AreaGuidance } from "./AreaGuidance";
import { PracticalStayInsights } from "./PracticalStayInsights";
import { StaySearchControls } from "./StaySearchControls";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { Loader2, Building2, Info } from "lucide-react";

interface StaysTabProps {
  city: string;
  country: string;
  travelMonth: string;
  departureCity?: string;
}

export const StaysTab = ({ city, country, travelMonth, departureCity }: StaysTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useStayInsights(city, country, travelMonth, departureCity);
  const initialLoadTime = useRef<number | null>(null);

  if (data && !initialLoadTime.current) {
    initialLoadTime.current = Date.now();
  }
  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Analyzing accommodation options in {city}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to load stay data";
    const isCredits = errorMsg.toLowerCase().includes("credit") || errorMsg.toLowerCase().includes("402");
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">
            {isCredits ? "Service temporarily unavailable" : "Unable to load stay insights"}
          </p>
          <p className="text-muted-foreground text-sm">
            {isCredits
              ? "Our AI service is currently at capacity. Please try again in a few minutes."
              : errorMsg}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-semibold">Hotels & Stays</h2>
          </div>
          <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
        </div>
        <p className="text-muted-foreground max-w-2xl">
          {data.overview}
        </p>
      </div>

      <div className="space-y-10">
        {/* Price Categories */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Typical Prices in {data.travelMonth}
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.priceCategories.map((category, index) => (
              <PriceCategoryCard key={index} category={category} />
            ))}
          </div>
        </section>

        {/* Best Neighbourhoods */}
        <section>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Best Neighbourhoods to Stay
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.neighbourhoods.map((neighbourhood, index) => (
              <NeighbourhoodCard key={index} neighbourhood={neighbourhood} city={city} country={country} />
            ))}
          </div>
        </section>

        {/* Area Guidance */}
        <AreaGuidance guidance={data.areaGuidance} />

        {/* Practical Insights */}
        <PracticalStayInsights insights={data.practicalInsights} />

        {/* Search Controls */}
        <StaySearchControls city={city} country={country} travelMonth={travelMonth} />

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
