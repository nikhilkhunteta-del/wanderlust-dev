import { useState, useCallback, lazy, Suspense, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { CityHighlights } from "@/types/cityHighlights";
import {
  CityItinerary,
  ItinerarySettings,
  ItineraryDay,
  DayTrip,
  ItineraryRequest,
  DEFAULT_ITINERARY_SETTINGS,
} from "@/types/itinerary";
import { MultiCityRoute, MultiCityItineraryRequest } from "@/types/multiCity";
import { getCityItinerary } from "@/lib/itinerary";
import { useCityItinerary, useMultiCityItinerary } from "@/hooks/useCityData";
import { MultiCityItineraryView } from "./MultiCityItineraryView";
import { DayCard } from "./DayCard";
import { CollapsedDayCard } from "./CollapsedDayCard";
import { DaySelector } from "./DaySelector";
import { StickyTimeline } from "./StickyTimeline";
import { JourneyCompletion } from "./JourneyCompletion";
import { RefinementPanel } from "./RefinementPanel";
import { DayTripSection } from "./DayTripSection";
import { ExtensionSection } from "./ExtensionSection";
import { ShareMenu } from "./ShareMenu";
import { MultiCitySuggestion } from "./MultiCitySuggestion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const ItineraryMap = lazy(() =>
  import("./ItineraryMap").then((m) => ({ default: m.ItineraryMap }))
);

interface ItineraryTabProps {
  city: CityRecommendation;
  profile: TravelProfile;
  highlights: CityHighlights | null;
  onSwitchTab?: (tab: string) => void;
}

export const ItineraryTab = ({ city, profile, highlights, onSwitchTab }: ItineraryTabProps) => {
  const queryClient = useQueryClient();
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [selectedDay, setSelectedDay] = useState(1);
  const [isRefining, setIsRefining] = useState(false);
  const [refiningDay, setRefiningDay] = useState<number | null>(null);
  const [isMultiCityActive, setIsMultiCityActive] = useState(false);
  const [multiCityRoute, setMultiCityRoute] = useState<MultiCityRoute | null>(null);

  const interests = useMemo(
    () =>
      Object.entries(profile.interestScores)
        .filter(([_, score]) => score > 0)
        .map(([interest]) => interest),
    [profile.interestScores]
  );

  const [settings, setSettings] = useState<ItinerarySettings>(() => {
    const topInterests = Object.entries(profile.interestScores)
      .filter(([_, score]) => score > 0)
      .map(([interest]) => interest);

    return {
      ...DEFAULT_ITINERARY_SETTINGS,
      focusInterest: topInterests[0] || "",
      mustDoExperiences: highlights?.experiences.slice(0, 2).map((e) => e.title) || [],
    };
  });

  const highlightExperiences = highlights?.experiences.map((e) => e.title) || [];

  const itineraryRequest = useMemo<ItineraryRequest>(
    () => ({
      city: city.city,
      country: city.country,
      tripDuration: profile.tripDuration,
      travelMonth: profile.travelMonth,
      userInterests: interests,
      adventureTypes: profile.adventureTypes,
      settings,
    }),
    [city.city, city.country, profile.tripDuration, profile.travelMonth, interests, profile.adventureTypes, settings]
  );

  const { data: itinerary, isLoading, error, refetch } = useCityItinerary(itineraryRequest);

  const multiCityItineraryRequest = useMemo<MultiCityItineraryRequest | null>(() => {
    if (!multiCityRoute || !isMultiCityActive) return null;
    return {
      route: multiCityRoute,
      travelMonth: profile.travelMonth,
      userInterests: interests,
      adventureTypes: profile.adventureTypes,
      tripStyle: settings.tripStyle,
      budgetLevel: settings.budgetLevel,
      diningPreference: settings.diningPreference,
      includeFreeTime: settings.includeFreeTime,
    };
  }, [multiCityRoute, isMultiCityActive, profile, interests, settings]);

  const {
    data: multiCityItinerary,
    isLoading: isMultiCityLoading,
    error: multiCityError,
  } = useMultiCityItinerary(multiCityItineraryRequest);

  const handleSelectDay = useCallback((dayNumber: number) => {
    setSelectedDay(dayNumber);
    const ref = dayRefs.current[dayNumber];
    if (ref) {
      ref.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleRefineDay = useCallback(
    async (dayNumber: number, adjustment: string) => {
      if (!itinerary) return;
      setIsRefining(true);
      setRefiningDay(dayNumber);

      try {
        const result = await getCityItinerary({
          ...itineraryRequest,
          regenerateDay: dayNumber,
          adjustment,
        });

        const regenerated = (result as any).regeneratedDay as ItineraryDay | undefined;
        if (regenerated) {
          queryClient.setQueryData<CityItinerary>(
            ["city-itinerary", itineraryRequest.city, itineraryRequest.country, itineraryRequest.tripDuration, itineraryRequest.travelMonth, itineraryRequest.settings],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                days: old.days.map((d) =>
                  d.dayNumber === dayNumber ? { ...regenerated, dayNumber } : d
                ),
              };
            }
          );
          toast.success(`Day ${dayNumber} refreshed`);
        }
      } catch (err) {
        console.error("Failed to refine day:", err);
        toast.error("Couldn't refresh this day. Try again.");
      } finally {
        setIsRefining(false);
        setRefiningDay(null);
      }
    },
    [itinerary, itineraryRequest, queryClient]
  );

  const handleReplaceDayWithTrip = useCallback(
    (trip: DayTrip) => {
      if (!trip.suggestedDayToReplace) return;
      handleRefineDay(
        trip.suggestedDayToReplace,
        `Replace the full day with a day trip to ${trip.destination}. Include: travel there, exploring, and return. Focus on: ${trip.description}`
      );
    },
    [handleRefineDay]
  );

  const handleSelectMultiCity = useCallback((route: MultiCityRoute) => {
    setMultiCityRoute(route);
    setIsMultiCityActive(true);
  }, []);

  const handleRevertToSingleCity = useCallback(() => {
    setIsMultiCityActive(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Creating your {profile.tripDuration}-day itinerary...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to generate itinerary</p>
          <p className="text-muted-foreground text-sm">{error instanceof Error ? error.message : "Unknown error"}</p>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  const isMultiCityMode = isMultiCityActive && multiCityRoute;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {isMultiCityMode
              ? `Your ${profile.tripDuration}-Day Regional Journey`
              : `Your ${profile.tripDuration}-Day Adventure`}
          </h2>
          <p className="text-muted-foreground mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
            {isMultiCityMode
              ? `${multiCityRoute!.stops.map(s => s.city).join(" → ")}`
              : `Personalized for your ${settings.tripStyle} travel style`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ShareMenu itinerary={itinerary} cityName={city.city} tripDuration={profile.tripDuration} />
          {!isMultiCityMode && (
            <div className="lg:hidden">
              <RefinementPanel
                settings={settings}
                onSettingsChange={setSettings}
                onUpdate={() => refetch()}
                isUpdating={isLoading}
                interests={interests}
                highlightExperiences={highlightExperiences}
              />
            </div>
          )}
        </div>
      </div>

      {/* Multi-City Suggestion */}
      {profile.tripDuration >= 8 && (
        <div className="mb-6">
          <MultiCitySuggestion
            city={city.city}
            country={city.country}
            tripDuration={profile.tripDuration}
            travelMonth={profile.travelMonth}
            userInterests={interests}
            adventureTypes={profile.adventureTypes}
            tripStyle={settings.tripStyle}
            budgetLevel={settings.budgetLevel}
            onSelectMultiCity={handleSelectMultiCity}
            isMultiCityActive={isMultiCityActive}
            onRevertToSingleCity={handleRevertToSingleCity}
          />
        </div>
      )}

      {/* Sticky Timeline */}
      {isMultiCityMode ? (
        <StickyTimeline mode="multi" route={multiCityRoute!} />
      ) : (
        <StickyTimeline
          mode="single"
          days={itinerary.days}
          selectedDay={selectedDay}
          onSelectDay={handleSelectDay}
        />
      )}

      {/* JOURNEY CONTENT — Only ONE mode renders */}
      {isMultiCityMode ? (
        /* ── Multi-City Journey ── */
        <MultiCityItineraryView
          itinerary={multiCityItinerary!}
          route={multiCityRoute!}
          isLoading={isMultiCityLoading}
          error={multiCityError}
          cityName={city.city}
          tripDuration={profile.tripDuration}
        />
      ) : (
        /* ── Single-City Journey ── */
        <div className="flex gap-6 lg:gap-8">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Day Selector Chips — mobile only (desktop uses right rail) */}
            <div className="sticky top-[120px] z-10 bg-background/95 backdrop-blur-sm py-3 -mx-1 px-1 border-b border-border/30 mb-2 xl:hidden">
              <DaySelector
                days={itinerary.days}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
              />
            </div>

            {/* Map for selected day only */}
            <div className="mb-4">
              <Suspense
                fallback={
                  <div className="h-[300px] bg-muted/30 rounded-xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                }
              >
                <ItineraryMap days={itinerary.days} selectedDay={selectedDay} />
              </Suspense>
            </div>

            {/* Day Cards — selected expanded, others collapsed */}
            {itinerary.days.map((day) => (
              <div
                key={day.dayNumber}
                ref={(el) => { dayRefs.current[day.dayNumber] = el; }}
                className="scroll-mt-[180px]"
              >
                {day.dayNumber === selectedDay ? (
                  <div className="animate-in fade-in slide-in-from-bottom-3 duration-300">
                    <DayCard
                      day={day}
                      city={city.city}
                      country={city.country}
                      onRefineDay={handleRefineDay}
                      isRefining={isRefining}
                      refiningDay={refiningDay}
                    />
                  </div>
                ) : (
                  <CollapsedDayCard
                    day={day}
                    onClick={() => handleSelectDay(day.dayNumber)}
                  />
                )}
              </div>
            ))}

            {/* Day Trips */}
            {itinerary.dayTrips && itinerary.dayTrips.length > 0 && (
              <DayTripSection
                dayTrips={itinerary.dayTrips}
                onReplaceDayWithTrip={handleReplaceDayWithTrip}
              />
            )}

            {/* Extension Suggestions */}
            {itinerary.extensionSuggestions && itinerary.extensionSuggestions.length > 0 && (
              <ExtensionSection
                suggestions={itinerary.extensionSuggestions}
                tripDuration={profile.tripDuration}
                totalDays={itinerary.days.length}
                onAddDay={(suggestion) => {
                  const newDayNum = itinerary.days.length + 1;
                  handleRefineDay(
                    newDayNum,
                    `Add a new Day ${newDayNum} based on: ${suggestion.title}. Include these highlights: ${suggestion.highlights.join(", ")}. ${suggestion.description}`
                  );
                }}
                onSwapDay={(suggestion, dayNumber) => {
                  handleRefineDay(
                    dayNumber,
                    `Replace this day entirely with: ${suggestion.title}. Include these highlights: ${suggestion.highlights.join(", ")}. ${suggestion.description}`
                  );
                }}
              />
            )}

            {/* Journey Completion */}
            <JourneyCompletion
              cityName={city.city}
              tripDuration={profile.tripDuration}
              onShare={() => {
                const shareBtn = document.querySelector('[data-share-trigger]') as HTMLButtonElement;
                shareBtn?.click();
              }}
            />
          </div>

          {/* Desktop Refinement Panel */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-[120px]">
              <RefinementPanel
                settings={settings}
                onSettingsChange={setSettings}
                onUpdate={() => refetch()}
                isUpdating={isLoading}
                interests={interests}
                highlightExperiences={highlightExperiences}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
