import { useState, useCallback, lazy, Suspense, useMemo } from "react";
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
import { RefinementPanel } from "./RefinementPanel";
import { DayTripSection } from "./DayTripSection";
import { ExtensionSection } from "./ExtensionSection";
import { ShareMenu } from "./ShareMenu";
import { MultiCitySuggestion } from "./MultiCitySuggestion";
import { Loader2, Lightbulb, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ItineraryMap = lazy(() =>
  import("./ItineraryMap").then((m) => ({ default: m.ItineraryMap }))
);

interface ItineraryTabProps {
  city: CityRecommendation;
  profile: TravelProfile;
  highlights: CityHighlights | null;
}

export const ItineraryTab = ({ city, profile, highlights }: ItineraryTabProps) => {
  const queryClient = useQueryClient();

  const [showMap, setShowMap] = useState(false);
  const [selectedMapDay, setSelectedMapDay] = useState<number | null>(null);
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

  // Build the request object for React Query
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

  // Multi-city itinerary request — only built when a route is selected
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
          // Patch the cached itinerary in-place
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

  if (!itinerary) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-semibold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {isMultiCityActive && multiCityRoute
              ? `Your ${profile.tripDuration}-Day Multi-City Journey`
              : `Your ${profile.tripDuration}-Day Adventure`}
          </h2>
          <p className="text-muted-foreground mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
            {isMultiCityActive && multiCityRoute
              ? `${multiCityRoute.stops.map(s => s.city).join(" → ")}`
              : `Personalized for your ${settings.tripStyle} travel style`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={showMap ? "default" : "outline"}
            size="sm"
            className="gap-2 shadow-sm"
            onClick={() => setShowMap(!showMap)}
          >
            {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
            {showMap ? "List view" : "Map view"}
          </Button>
          <ShareMenu itinerary={itinerary} cityName={city.city} tripDuration={profile.tripDuration} />
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

      {/* Map View */}
      {showMap && (
        <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Button
              variant={selectedMapDay === null ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedMapDay(null)}
            >
              All days
            </Button>
            {itinerary.days.map((day) => (
              <Button
                key={day.dayNumber}
                variant={selectedMapDay === day.dayNumber ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setSelectedMapDay(day.dayNumber)}
              >
                Day {day.dayNumber}
              </Button>
            ))}
          </div>
          <Suspense
            fallback={
              <div className="h-[400px] bg-muted/30 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ItineraryMap days={itinerary.days} selectedDay={selectedMapDay} />
          </Suspense>
        </div>
      )}

      {/* Main Content */}
      <div className="flex gap-6 lg:gap-8">
        <div className="flex-1 min-w-0 space-y-5">
          {/* Multi-city itinerary replaces single-city when active */}
          {isMultiCityActive && multiCityRoute ? (
            <MultiCityItineraryView
              itinerary={multiCityItinerary!}
              route={multiCityRoute}
              isLoading={isMultiCityLoading}
              error={multiCityError}
            />
          ) : (
            <>
              {itinerary.days.map((day, index) => (
                <div
                  key={day.dayNumber}
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
                >
                  <DayCard
                    day={day}
                    city={city.city}
                    country={city.country}
                    onRefineDay={handleRefineDay}
                    isRefining={isRefining}
                    refiningDay={refiningDay}
                  />
                </div>
              ))}

              {/* Tips Section */}
              {itinerary.tips && itinerary.tips.length > 0 && (
                <div
                  className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl p-5 md:p-6 border border-amber-500/20 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${itinerary.days.length * 100}ms` }}
                >
                  <h3 className="font-semibold flex items-center gap-2.5 mb-4 text-amber-700 dark:text-amber-400">
                    <div className="p-1.5 rounded-lg bg-amber-500/10">
                      <Lightbulb className="w-4 h-4" />
                    </div>
                    Local Tips & Insights
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

              {/* Day Trips */}
              {itinerary.dayTrips && itinerary.dayTrips.length > 0 && (
                <div
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${(itinerary.days.length + 1) * 100}ms` }}
                >
                  <DayTripSection
                    dayTrips={itinerary.dayTrips}
                    onReplaceDayWithTrip={handleReplaceDayWithTrip}
                  />
                </div>
              )}

              {/* Extension Suggestions */}
              {itinerary.extensionSuggestions && itinerary.extensionSuggestions.length > 0 && (
                <div
                  className="animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${(itinerary.days.length + 2) * 100}ms` }}
                >
                  <ExtensionSection suggestions={itinerary.extensionSuggestions} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Desktop Refinement Panel — only for single-city */}
        {!isMultiCityActive && (
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
        )}
      </div>
    </div>
  );
};
