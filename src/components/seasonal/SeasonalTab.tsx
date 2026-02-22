import { useRef } from "react";
import { useSeasonalHighlights } from "@/hooks/useCityData";
import { SeasonalEventCard } from "./SeasonalEventCard";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { SeasonalHighlight, SeasonalSection } from "@/types/seasonalHighlights";
import { Loader2, Sparkles, PartyPopper, Utensils, Sun, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeasonalTabProps {
  city: string;
  country: string;
  travelMonth: string;
  userInterests?: string[];
  travelCompanions?: string;
  styleTags?: string[];
  onSwitchTab?: (tab: string) => void;
}

const MONTH_DISPLAY: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "your visit",
};

const SECTION_CONFIG: Record<SeasonalSection, { title: string; icon: React.ReactNode; description: string }> = {
  festivals_cultural: {
    title: "Festivals & Cultural Moments",
    icon: <PartyPopper className="w-5 h-5" />,
    description: "Celebrations, traditions, and cultural events happening now",
  },
  food_traditions: {
    title: "Seasonal Food & Local Traditions",
    icon: <Utensils className="w-5 h-5" />,
    description: "Flavors and customs unique to this time of year",
  },
  weather_driven: {
    title: "Weather-Driven Experiences",
    icon: <Sun className="w-5 h-5" />,
    description: "Activities and natural moments at their best right now",
  },
};

const SECTION_ORDER: SeasonalSection[] = ["festivals_cultural", "food_traditions", "weather_driven"];

export const SeasonalTab = ({
  city,
  country,
  travelMonth,
  userInterests,
  travelCompanions,
  styleTags,
  onSwitchTab,
}: SeasonalTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useSeasonalHighlights(
    city, country, travelMonth, userInterests, travelCompanions, styleTags
  );
  const monthDisplay = MONTH_DISPLAY[travelMonth] || travelMonth;
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
            Researching what's happening in {monthDisplay}…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to load seasonal highlights</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load seasonal highlights"}
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Group highlights by section
  const grouped: Record<SeasonalSection, SeasonalHighlight[]> = {
    festivals_cultural: [],
    food_traditions: [],
    weather_driven: [],
  };

  for (const h of data.highlights) {
    const section = h.section && grouped[h.section] ? h.section : "festivals_cultural";
    grouped[section].push(h);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold text-foreground">
                What's Happening in {monthDisplay}
              </h2>
              <p className="text-muted-foreground text-sm">
                Verified events and time-sensitive experiences
              </p>
            </div>
          </div>
          <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
        </div>

        {/* Single opening statement only — no duplicate intro */}
        <p className="text-lg text-foreground/75 leading-relaxed max-w-3xl">
          {data.openingStatement}
        </p>
      </div>

      {/* Grouped sections */}
      {SECTION_ORDER.map((sectionKey) => {
        const items = grouped[sectionKey];
        if (items.length === 0) return null;
        const config = SECTION_CONFIG[sectionKey];

        return (
          <section key={sectionKey} className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className="text-primary/70">{config.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
                <p className="text-sm text-muted-foreground">{config.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((highlight, index) => (
                <SeasonalEventCard key={index} highlight={highlight} city={city} country={country} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Empty state */}
      {data.highlights.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No specific seasonal events found for {monthDisplay}.</p>
          <p className="text-sm mt-1">Check the Highlights tab for year-round experiences.</p>
        </div>
      )}

      {/* CTA to itinerary */}
      <div className="mt-8 border-t border-border/50 pt-8">
        <div className="bg-gradient-to-r from-accent/60 to-accent/30 rounded-xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-lg font-semibold text-foreground mb-1">
              Plan your days around these {monthDisplay} moments
            </h4>
            <p className="text-sm text-muted-foreground">
              See how these experiences fit into a day-by-day itinerary.
            </p>
          </div>
          <Button
            onClick={() => onSwitchTab?.("itinerary")}
            className="gap-2 shrink-0"
          >
            View Itinerary
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
