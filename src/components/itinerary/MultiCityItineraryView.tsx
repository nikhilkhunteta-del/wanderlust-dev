import { useState, useRef, useCallback, lazy, Suspense, useMemo } from "react";
import { MultiCityItinerary, MultiCityRoute, MultiCityDay, CityTransition } from "@/types/multiCity";
import { Activity } from "@/types/itinerary";
import { DayCard } from "./DayCard";
import { CollapsedDayCard } from "./CollapsedDayCard";
import { TravelTransitionCard } from "./TravelTransitionCard";
import { DepartureEpilogueCard } from "./DepartureEpilogueCard";
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
  onSwitchTab?: (tab: string) => void;
  onScrollToTop?: () => void;
  onRefineDay?: (dayNumber: number, adjustment: string, cityName?: string, countryName?: string) => void;
  isRefining?: boolean;
  refiningDay?: number | null;
  lockedActivities?: Set<string>;
  onToggleLock?: (activityTitle: string) => void;
  onReplaceActivity?: (dayNumber: number, period: string, activityIndex: number, newActivity: Activity) => void;
}

// Generic tip patterns to filter out
const GENERIC_TIP_PATTERNS = [
  /hydrat/i,
  /sun\s*(protection|screen|block)/i,
  /sunscreen/i,
  /cloth(ing|es)/i,
  /dress\s*(light|appropriate|comfortable)/i,
  /ride[- ]?sharing\s*app/i,
  /uber|ola|grab/i,
  /stay\s*cool/i,
  /wear\s*(comfortable|light|loose)/i,
  /water\s*bottle/i,
  /hat\s*(and|or)\s*sunglasses/i,
];

function isGenericTip(tip: string): boolean {
  return GENERIC_TIP_PATTERNS.some((pattern) => pattern.test(tip));
}

export const MultiCityItineraryView = ({
  itinerary,
  route,
  isLoading,
  error,
  cityName,
  tripDuration,
  onSwitchTab,
  onScrollToTop,
  onRefineDay,
  isRefining = false,
  refiningDay = null,
  lockedActivities,
  onToggleLock,
  onReplaceActivity,
}: MultiCityItineraryViewProps) => {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const chapterRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggleDay = useCallback((dayNumber: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  }, []);

  const expandAllInChapter = useCallback((days: MultiCityDay[]) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      const allExpanded = days.every((d) => next.has(d.dayNumber));
      if (allExpanded) days.forEach((d) => next.delete(d.dayNumber));
      else days.forEach((d) => next.add(d.dayNumber));
      return next;
    });
  }, []);

  const handleRefineDay = useCallback(
    (dayNumber: number, adjustment: string) => {
      if (!onRefineDay || !itinerary) return;
      const day = itinerary.days.find((d) => d.dayNumber === dayNumber);
      const stop = day ? route.stops.find((s) => s.city === day.cityName) : undefined;
      onRefineDay(dayNumber, adjustment, day?.cityName, stop?.country);
    },
    [onRefineDay, itinerary, route]
  );

  const handleReplaceActivity = useCallback(
    (dayNumber: number, period: string, activityIndex: number, newActivity: Activity) => {
      onReplaceActivity?.(dayNumber, period, activityIndex, newActivity);
    },
    [onReplaceActivity]
  );

  // Group days by city
  const cityGroups = useMemo(() => {
    if (!itinerary?.days) return [];
    const groups: { city: string; days: MultiCityDay[]; transition?: CityTransition }[] = [];
    let currentCity = "";
    itinerary.days.forEach((day) => {
      if (day.cityName !== currentCity) {
        const transition = itinerary.cityTransitions?.find(
          (t) => t.toCity === day.cityName && t.dayNumber === day.dayNumber
        );
        groups.push({ city: day.cityName, days: [day], transition });
        currentCity = day.cityName;
      } else {
        groups[groups.length - 1].days.push(day);
      }
    });
    return groups;
  }, [itinerary]);

  // Detect departure epilogue: last chapter same city as first, only 1 day
  const { renderGroups, departureEpilogue } = useMemo(() => {
    if (
      cityGroups.length >= 3 &&
      cityGroups[cityGroups.length - 1].city === cityGroups[0].city &&
      cityGroups[cityGroups.length - 1].days.length === 1
    ) {
      return {
        renderGroups: cityGroups.slice(0, -1),
        departureEpilogue: cityGroups[cityGroups.length - 1],
      };
    }
    return { renderGroups: cityGroups, departureEpilogue: null };
  }, [cityGroups]);

  // Total budget from all days (including epilogue)
  const totalBudget = useMemo(() => {
    if (!itinerary?.days) return null;
    const daysWithBudget = itinerary.days.filter((d) => d.estimatedDailyBudget != null);
    if (daysWithBudget.length === 0) return null;
    const total = daysWithBudget.reduce((s, d) => s + (d.estimatedDailyBudget || 0), 0);
    const currency = (daysWithBudget[0] as any).budgetCurrency || "£";
    // Count unique cities
    const uniqueCities = new Set(daysWithBudget.map((d) => d.cityName));
    return { total, days: daysWithBudget.length, cities: uniqueCities.size, currency };
  }, [itinerary]);

  // Filter tips
  const filteredTips = useMemo(() => {
    if (!itinerary?.tips) return [];
    return itinerary.tips.filter((tip) => !isGenericTip(tip));
  }, [itinerary]);

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

  const allCities = route.stops.map((s) => s.city);

  return (
    <div className="space-y-6">
      {/* Regional Map */}
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

      {/* Journey Chapters */}
      {renderGroups.map((group, groupIndex) => {
        const stop = route.stops.find((s) => s.city === group.city);
        const leg = group.transition
          ? route.legs.find((l) => l.to === group.city)
          : undefined;

        // Fix 1: chapter-scoped budget
        const chapterBudget = group.days.reduce((sum, day) => sum + (day.estimatedDailyBudget || 0), 0);
        const chapterCurrency = (group.days.find((d) => (d as any).budgetCurrency) as any)?.budgetCurrency || "£";

        return (
          <div
            key={`${group.city}-${groupIndex}`}
            ref={(el) => { chapterRefs.current[group.city] = el; }}
            className="scroll-mt-[120px]"
          >
            {/* Travel Transition Card */}
            {group.transition && (
              <TravelTransitionCard transition={group.transition} leg={leg} />
            )}

            {/* Chapter Header — Fix 2: sequential chapter number */}
            <div className="mb-5">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
                    {groupIndex + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-primary/70 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" />
                        Chapter {groupIndex + 1}
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
                      travelMonth={undefined}
                      userInterests={undefined}
                      onRefineDay={onRefineDay ? handleRefineDay : undefined}
                      isRefining={isRefining}
                      refiningDay={refiningDay}
                      lockedActivities={lockedActivities}
                      onToggleLock={onToggleLock}
                      onReplaceActivity={onReplaceActivity ? handleReplaceActivity : undefined}
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

            {/* Per-chapter budget summary — Fix 1 */}
            {chapterBudget > 0 && (
              <div className="ml-0 md:ml-[52px] mt-3 bg-muted/30 rounded-lg border border-border/30 px-4 py-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Estimated {group.city} spend:</span>{" "}
                ~{chapterCurrency}{Math.round(chapterBudget)} per person · {group.days.length} {group.days.length === 1 ? "day" : "days"} · excludes accommodation
              </div>
            )}
          </div>
        );
      })}

      {/* Fix 5: Departure epilogue card */}
      {departureEpilogue && (
        <>
          {departureEpilogue.transition && (
            <TravelTransitionCard transition={departureEpilogue.transition} leg={route.legs.find((l) => l.to === departureEpilogue.city)} />
          )}
          <DepartureEpilogueCard
            day={departureEpilogue.days[0]}
            city={departureEpilogue.city}
          />
        </>
      )}

      {/* Tips — Fix 6: filtered */}
      {filteredTips.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl p-5 md:p-6 border border-amber-500/20">
          <h3 className="font-semibold flex items-center gap-2.5 mb-4 text-amber-700 dark:text-amber-400">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Lightbulb className="w-4 h-4" />
            </div>
            Multi-City Travel Tips
          </h3>
          <ul className="space-y-2.5">
            {filteredTips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-3 items-start">
                <span className="text-amber-500 mt-1.5 text-xs">◆</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Full trip budget total */}
      {totalBudget && (
        <div className="bg-muted/30 rounded-xl border border-border/30 px-5 py-4 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Estimated total activities budget:</span>{" "}
          ~{totalBudget.currency}{Math.round(totalBudget.total)} per person across {totalBudget.days} days in {totalBudget.cities} {totalBudget.cities === 1 ? "city" : "cities"} · excludes flights and accommodation
        </div>
      )}

      {/* Journey Completion */}
      <JourneyCompletion
        cityName={allCities.join(" → ")}
        tripDuration={tripDuration}
        onSwitchTab={onSwitchTab}
        onShare={undefined}
        isMultiCity={true}
        cities={allCities}
        onScrollToTop={onScrollToTop}
      />
    </div>
  );
};
