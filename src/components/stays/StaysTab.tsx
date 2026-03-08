import { useRef, useMemo } from "react";
import { useStayInsights } from "@/hooks/useCityData";
import { PriceCategoryCard } from "./PriceCategoryCard";
import { NeighbourhoodCard } from "./NeighbourhoodCard";
import { AreaGuidance } from "./AreaGuidance";
import { PracticalStayInsights } from "./PracticalStayInsights";
import { StaySearchControls } from "./StaySearchControls";
import { PersonalRecommendation } from "./PersonalRecommendation";
import { HotelVsApartmentSection } from "./HotelVsApartmentSection";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { Loader2, Building2, Info } from "lucide-react";
import { stripMarkdown } from "@/lib/stripMarkdown";

interface StaysTabProps {
  city: string;
  country: string;
  travelMonth: string;
  departureCity?: string;
  travelCompanions?: string;
  groupType?: string;
  tripDuration?: number;
  styleTags?: string[];
  travelPace?: number;
}

export const StaysTab = ({
  city, country, travelMonth, departureCity,
  travelCompanions, groupType, tripDuration, styleTags, travelPace,
}: StaysTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useStayInsights(
    city, country, travelMonth, departureCity, travelCompanions, groupType, tripDuration, styleTags, travelPace,
  );
  const initialLoadTime = useRef<number | null>(null);
  const searchCtaRef = useRef<HTMLDivElement>(null);

  if (data && !initialLoadTime.current) {
    initialLoadTime.current = Date.now();
  }
  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  // Deduplicate neighbourhood images — detect duplicate URLs via entityName-based query
  const neighbourhoodsWithDedup = useMemo(() => {
    if (!data?.neighbourhoods) return [];
    const seen = new Set<string>();
    return data.neighbourhoods.map((n) => {
      const baseQuery = `${n.name} ${city} residential street buildings`;
      if (seen.has(baseQuery)) {
        // This shouldn't happen since names differ, but guard anyway
        return { ...n, alternateQuery: true };
      }
      seen.add(baseQuery);
      return { ...n, alternateQuery: false };
    });
  }, [data?.neighbourhoods, city]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Checking live hotel prices in {city}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">Unable to load stay insights</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load stay data"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Compute total properties checked across all tiers
  const totalProperties = data.priceCategories.reduce(
    (sum, cat) => sum + (cat.resultCount || 0), 0
  ) + (data.vacationRentals?.resultCount || 0);

  const isLive = data.dataSource === "serpapi_live";
  const fetchedDate = data.fetchedAt
    ? new Date(data.fetchedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : data.lastUpdated;

  // Hotel median for comparison (use midRange tier)
  const hotelMedian = data.priceCategories.find(c => c.category === "midRange")?.medianPrice ?? null;

  // Build stay duration subtitle
  const stayDuration = data.stayDuration;
  const checkinLabel = data.fetchedAt ? (() => {
    // Try to derive from data context
    return null;
  })() : null;

  const scrollToSearch = () => {
    searchCtaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
          {stripMarkdown(data.overview)}
        </p>

        {/* Data freshness indicator */}
        {isLive && totalProperties > 0 && (
          <p className="text-xs text-muted-foreground/70 mt-2">
            Live pricing data · {totalProperties} properties checked · {fetchedDate}
          </p>
        )}
      </div>

      <div className="space-y-10">
        {/* Personal Recommendation */}
        {data.personalRecommendation && (
          <PersonalRecommendation recommendation={data.personalRecommendation} />
        )}

        {/* Price Categories */}
        <section>
          <h3 className="text-lg font-semibold text-foreground">
            {isLive ? "Live Prices" : "Typical Prices"} in {data.travelMonth}
          </h3>
          {stayDuration && (
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Prices shown for a {stayDuration}-night stay ·{" "}
              <button
                onClick={scrollToSearch}
                className="text-primary hover:underline"
              >
                Adjust below ↓
              </button>
            </p>
          )}
          {!stayDuration && <div className="mb-4" />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.priceCategories.map((category, index) => (
              <PriceCategoryCard
                key={index}
                category={category}
                fetchedAt={data.fetchedAt}
              />
            ))}
          </div>
        </section>

        {/* Best Neighbourhoods */}
        {neighbourhoodsWithDedup.length > 0 && (
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Best Neighbourhoods to Stay{" "}
              <span className="text-sm font-normal text-muted-foreground">
                · {neighbourhoodsWithDedup.length} areas
              </span>
            </h3>
            <div className={`grid gap-5 ${
              neighbourhoodsWithDedup.length === 1
                ? "grid-cols-1"
                : neighbourhoodsWithDedup.length === 2
                  ? "sm:grid-cols-2"
                  : "sm:grid-cols-2 lg:grid-cols-3"
            }`}>
              {neighbourhoodsWithDedup.map((neighbourhood, index) => (
                <NeighbourhoodCard
                  key={index}
                  neighbourhood={neighbourhood}
                  city={city}
                  country={country}
                  alternateQuery={neighbourhood.alternateQuery}
                />
              ))}
            </div>
          </section>
        )}

        {/* Hotel vs Apartment */}
        {data.hotelVsApartment && (
          <HotelVsApartmentSection
            data={data.hotelVsApartment}
            vacationRentals={data.vacationRentals}
            currency={data.travellerCurrency || data.priceCategories[0]?.currency}
            hotelMedianPrice={hotelMedian}
          />
        )}

        {/* Area Guidance */}
        <AreaGuidance guidance={data.areaGuidance} />

        {/* Practical Insights */}
        <PracticalStayInsights insights={data.practicalInsights} />

        {/* Search Controls */}
        <div ref={searchCtaRef}>
          <StaySearchControls city={city} country={country} travelMonth={travelMonth} />
        </div>

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
