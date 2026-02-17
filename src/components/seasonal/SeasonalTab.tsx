import { useState } from "react";
import { useSeasonalHighlights } from "@/hooks/useCityData";
import { HeroEventCard } from "./HeroEventCard";
import { MediumEventCard } from "./MediumEventCard";
import { CompactEventItem } from "./CompactEventItem";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { SeasonalItem } from "@/types/seasonalHighlights";
import { Loader2, Sparkles, ArrowRight, Clock, AlertTriangle, ChevronDown, ChevronUp, Flame, Zap, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SeasonalTabProps {
  city: string;
  country: string;
  travelMonth: string;
  onSwitchTab?: (tab: string) => void;
}

const MONTH_DISPLAY: Record<string, string> = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
  flexible: "your visit",
};

export const SeasonalTab = ({ city, country, travelMonth, onSwitchTab }: SeasonalTabProps) => {
  const { data, isLoading, isFetching, error, dataUpdatedAt } = useSeasonalHighlights(city, country, travelMonth);
  const [showNiche, setShowNiche] = useState(false);
  const monthDisplay = MONTH_DISPLAY[travelMonth] || travelMonth;

  const isFromCache = data && !isLoading && dataUpdatedAt < Date.now() - 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Searching for verified events in {monthDisplay}…
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

  // Deduplicate by event_id (in case backend missed any)
  const seen = new Set<string>();
  const uniqueItems: SeasonalItem[] = [];
  for (const item of data.items) {
    const key = item.event_id || `${item.title.toLowerCase().replace(/\s+/g, "-")}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  // Sort by impact_score descending
  uniqueItems.sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));

  // Section A: Trip-defining (impact >= 8), max 3
  const heroEvents = uniqueItems.filter((i) => (i.impact_score ?? 0) >= 8).slice(0, 3);
  // Section B: Happening while there (impact 4–7)
  const mediumEvents = uniqueItems.filter((i) => {
    const s = i.impact_score ?? 0;
    return s >= 4 && s < 8 && !heroEvents.includes(i);
  });
  // Section C: Niche (impact <= 3)
  const nicheEvents = uniqueItems.filter((i) => {
    const s = i.impact_score ?? 0;
    return s < 4 && !heroEvents.includes(i) && !mediumEvents.includes(i);
  });

  const fetchedDate = data.fetchedAt ? new Date(data.fetchedAt) : null;
  const lastCheckedStr = fetchedDate
    ? fetchedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const hasAnyEvents = uniqueItems.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-semibold text-foreground">
                What's On in {monthDisplay}
              </h2>
              <p className="text-muted-foreground text-sm">
                Source-verified events ranked by trip impact
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastCheckedStr && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Last verified: {lastCheckedStr}
              </span>
            )}
            <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
          </div>
        </div>

        {data.status === "degraded" && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-5 py-3 mt-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Some results may be less reliable — primary search returned limited results.
            </p>
          </div>
        )}

        {data.monthOpener && (
          <p className="text-lg text-foreground/75 leading-relaxed max-w-3xl mt-4">
            {data.monthOpener}
          </p>
        )}
      </div>

      {/* Section A — Trip-defining moments */}
      {heroEvents.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <Flame className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-xl font-display font-semibold text-foreground">
                Trip-defining moments this month
              </h3>
              <p className="text-sm text-muted-foreground">
                Major events that will shape your experience
              </p>
            </div>
          </div>
          <div className="space-y-6">
            {heroEvents.map((item) => (
              <HeroEventCard
                key={item.event_id || item.title}
                item={item}
                city={city}
                country={country}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section B — Things happening */}
      {mediumEvents.length > 0 && (
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-secondary" />
            <div>
              <h3 className="text-xl font-display font-semibold text-foreground">
                Things happening while you're there
              </h3>
              <p className="text-sm text-muted-foreground">
                Worth knowing about — concerts, exhibitions, seasonal highlights
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mediumEvents.map((item) => (
              <MediumEventCard
                key={item.event_id || item.title}
                item={item}
                city={city}
                country={country}
              />
            ))}
          </div>
        </section>
      )}

      {/* Section C — Niche happenings */}
      {nicheEvents.length > 0 && (
        <section className="mb-10">
          <button
            onClick={() => setShowNiche(!showNiche)}
            className="flex items-center gap-3 mb-4 w-full text-left group"
          >
            <Coffee className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="text-lg font-display font-semibold text-foreground">
                Local & niche happenings
              </h3>
              <p className="text-sm text-muted-foreground">
                {nicheEvents.length} smaller events — conferences, workshops, meetups
              </p>
            </div>
            {showNiche ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {showNiche && (
            <div className="bg-card rounded-xl border border-border/40 px-5 py-2">
              {nicheEvents.map((item) => (
                <CompactEventItem key={item.event_id || item.title} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!hasAnyEvents && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="font-medium text-lg">No major verified events found for {monthDisplay}.</p>
          <p className="text-sm mt-1">Check the Highlights tab for year-round experiences.</p>
        </div>
      )}

      {/* CTA to itinerary */}
      {hasAnyEvents && (
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
              View Itinerary
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
