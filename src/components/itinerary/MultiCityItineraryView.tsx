import { useState, useRef, useCallback, lazy, Suspense } from "react";
import { MultiCityItinerary, MultiCityRoute, CityTransition } from "@/types/multiCity";
import { DayCard } from "./DayCard";
import { CollapsedDayCard } from "./CollapsedDayCard";
import { TravelTransitionCard } from "./TravelTransitionCard";
import { JourneyCompletion } from "./JourneyCompletion";
import { Loader2, Lightbulb, BookOpen } from "lucide-react";

const MultiCityMap = lazy(() =>
  import("./MultiCityMap").then((m) => ({ default: m.MultiCityMap }))
);

interface MultiCityItineraryViewProps {
  itinerary: MultiCityItinerary;
  route: MultiCityRoute;
  isLoading: boolean;
  error: Error | null;
  cityName: string;
  tripDuration: number;
}

// Generate narrative chapter titles
function getChapterTitle(city: string, index: number): string {
  return `Chapter ${index + 1}`;
}

export const MultiCityItineraryView = ({
  itinerary,
  route,
  isLoading,
  error,
  cityName,
  tripDuration,
}: MultiCityItineraryViewProps) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleDay = useCallback((dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) {
        next.delete(dayNumber);
      } else {
        next.add(dayNumber);
      }
      return next;
    });
  }, []);

  const expandAllInChapter = useCallback((days: typeof itinerary.days) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      const allExpanded = days.every((d) => next.has(d.dayNumber));
      if (allExpanded) {
        days.forEach((d) => next.delete(d.dayNumber));
      } else {
        days.forEach((d) => next.add(d.dayNumber));
      }
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Creating your {route.totalDays}-day multi-city journey...
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {route.stops.map((s) => s.city).join(" → ")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to generate multi-city itinerary</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  // Regional map
  const mapSection = (
    <div className="mb-8">
      <Suspense
        fallback={
          <div className="h-[420px] bg-muted/30 rounded-xl flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <MultiCityMap route={route} days={itinerary.days} selectedCity={null} />
      </Suspense>
    </div>
  );

  // Group days by city
  const cityGroups: { city: string; days: typeof itinerary.days; transition?: CityTransition }[] = [];
  let currentCity = "";

  itinerary.days.forEach((day) => {
    if (day.cityName !== currentCity) {
      const transition = itinerary.cityTransitions?.find(
        (t) => t.toCity === day.cityName && t.dayNumber === day.dayNumber
      );
      cityGroups.push({ city: day.cityName, days: [day], transition });
      currentCity = day.cityName;
    } else {
      cityGroups[cityGroups.length - 1].days.push(day);
    }
  });

  return (
    <div className="space-y-6">
      {/* Regional Map — ONE map only */}
      {mapSection}

      {/* Journey Chapters */}
      {cityGroups.map((group, groupIndex) => {
        const stopIndex = route.stops.findIndex((s) => s.city === group.city);
        const stop = route.stops[stopIndex];
        const leg = group.transition
          ? route.legs.find((l) => l.to === group.city)
          : undefined;

        return (
          <div
            key={`${group.city}-${groupIndex}`}
            ref={(el) => { chapterRefs.current[group.city] = el; }}
            className="scroll-mt-[120px]"
          >
            {/* Travel Transition Card between chapters */}
            {group.transition && (
              <TravelTransitionCard transition={group.transition} leg={leg} />
            )}

            {/* Chapter Header */}
            <div className="mb-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                    {stopIndex + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary/70 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        {getChapterTitle(group.city, groupIndex)}
                      </span>
                    </div>
                    <h3 className="font-display font-semibold text-xl leading-tight text-foreground">
                      {group.city}
                    </h3>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-[52px]">
                <p className="text-sm text-muted-foreground">
                  {group.days.length} {group.days.length === 1 ? "day" : "days"}
                  {stop?.country && ` · ${stop.country}`}
                </p>
                <button
                  onClick={() => expandAllInChapter(group.days)}
                  className="text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  {group.days.every((d) => expandedDays.has(d.dayNumber)) ? "Collapse all" : "Expand all"}
                </button>
              </div>
            </div>

            {/* Day cards */}
            <div className="space-y-3 ml-0 md:ml-[52px]">
              {group.days.map((day) => (
                <div
                  key={day.dayNumber}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-200"
                  style={{
                    animationDelay: `${groupIndex * 60}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  {expandedDays.has(day.dayNumber) ? (
                    <DayCard
                      day={day}
                      city={group.city}
                      country={stop?.country || ""}
                      isRefining={false}
                      refiningDay={null}
                    />
                  ) : (
                    <CollapsedDayCard
                      day={day}
                      onClick={() => toggleDay(day.dayNumber)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl p-5 md:p-6 border border-amber-500/20">
          <h3 className="font-semibold flex items-center gap-2.5 mb-4 text-amber-700 dark:text-amber-400">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Lightbulb className="w-4 h-4" />
            </div>
            Multi-City Travel Tips
          </h3>
          <ul className="space-y-2.5">
            {itinerary.tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-3 items-start">
                <span className="text-amber-500 mt-1.5 text-xs">◆</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Journey Completion */}
      <JourneyCompletion
        cityName={route.stops.map((s) => s.city).join(" → ")}
        tripDuration={tripDuration}
      />
    </div>
  );
};
