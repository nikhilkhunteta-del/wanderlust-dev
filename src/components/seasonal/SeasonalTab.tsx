import { useRef } from "react";
import { useSeasonalHighlights } from "@/hooks/useCityData";
import { SeasonalEventCard, SeasonalHeroCard } from "./SeasonalEventCard";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { SeasonalHighlight, SeasonalSection } from "@/types/seasonalHighlights";
import { Loader2, ArrowRight } from "lucide-react";
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

const SECTION_TITLES: Record<SeasonalSection, string> = {
  festivals_cultural: "Festivals & Cultural Moments",
  food_traditions: "Seasonal Food & Local Traditions",
  weather_driven: "Weather-Driven Experiences",
};

const SECTION_ORDER: SeasonalSection[] = ["festivals_cultural", "food_traditions", "weather_driven"];

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    if (hostname.includes("wikipedia")) return "Wikipedia";
    if (hostname.includes("timeout")) return "Time Out";
    if (hostname.includes("lonelyplanet")) return "Lonely Planet";
    if (hostname.includes("tripadvisor")) return "TripAdvisor";
    const parts = hostname.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "Source";
  }
}

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

  if (!data) return null;

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

  // Collect all source URLs for footnote
  const sources: { name: string; url: string }[] = [];
  for (const h of data.highlights) {
    const url = h.sourceUrl || h.wikipediaUrl;
    if (url && !sources.find((s) => s.url === url)) {
      sources.push({ name: h.sourceName || extractDomain(url), url });
    }
  }

  // Pick the first highlight overall as the hero
  const allHighlights = SECTION_ORDER.flatMap((key) => grouped[key]);
  const heroHighlight = allHighlights[0];

  return (
    <div className="page-container pt-7 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-display font-semibold text-foreground">
          What's happening in {monthDisplay}
        </h2>
        <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
      </div>

      {/* Opening statement — editorial italic, no container */}
      {data.openingStatement && (
        <p className="text-lg italic text-muted-foreground leading-relaxed mb-10 max-w-3xl">
          {data.openingStatement}
        </p>
      )}

      {/* Hero card — first event */}
      {heroHighlight && (
        <div className="mb-12">
          <SeasonalHeroCard highlight={heroHighlight} city={city} country={country} />
        </div>
      )}

      {/* Grouped sections — remaining events */}
      {SECTION_ORDER.map((sectionKey) => {
        // Skip hero highlight from the remaining cards
        const items = grouped[sectionKey].filter((h) => h !== heroHighlight);
        if (items.length === 0) return null;

        return (
          <section key={sectionKey} className="mb-12">
            <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-6">
              {SECTION_TITLES[sectionKey]}
            </h3>
            {items.length === 1 ? (
              <SeasonalEventCard highlight={items[0]} city={city} country={country} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((highlight, index) => (
                  <SeasonalEventCard key={index} highlight={highlight} city={city} country={country} />
                ))}
              </div>
            )}
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
          <Button onClick={() => onSwitchTab?.("itinerary")} className="gap-2 shrink-0">
            Plan your days
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Source footnotes */}
      {sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border/30">
          <p className="text-xs text-muted-foreground/60">
            Sources:{" "}
            {sources.map((s, i) => (
              <span key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-muted-foreground transition-colors underline"
                >
                  {s.name}
                </a>
                {i < sources.length - 1 && ", "}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};
