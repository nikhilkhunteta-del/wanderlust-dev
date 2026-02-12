import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { CityHighlights } from "@/types/cityHighlights";
import {
  CityItinerary,
  ItinerarySettings,
  ItineraryDay,
  DayTrip,
  DEFAULT_ITINERARY_SETTINGS,
} from "@/types/itinerary";
import { getCityItinerary } from "@/lib/itinerary";
import { DayCard } from "./DayCard";
import { RefinementPanel } from "./RefinementPanel";
import { DayTripSection } from "./DayTripSection";
import { ExtensionSection } from "./ExtensionSection";
import { ShareMenu } from "./ShareMenu";
import { CuratedToursSection } from "./CuratedToursSection";
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
  const [itinerary, setItinerary] = useState<CityItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [selectedMapDay, setSelectedMapDay] = useState<number | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refiningDay, setRefiningDay] = useState<number | null>(null);

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

  const interests = Object.entries(profile.interestScores)
    .filter(([_, score]) => score > 0)
    .map(([interest]) => interest);

  const highlightExperiences = highlights?.experiences.map((e) => e.title) || [];

  const fetchItinerary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getCityItinerary({
        city: city.city,
        country: city.country,
        tripDuration: profile.tripDuration,
        travelMonth: profile.travelMonth,
        userInterests: interests,
        adventureTypes: profile.adventureTypes,
        settings,
      });

      setItinerary(result);
    } catch (err) {
      console.error("Failed to fetch itinerary:", err);
      setError(err instanceof Error ? err.message : "Failed to generate itinerary");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefineDay = useCallback(
    async (dayNumber: number, adjustment: string) => {
      if (!itinerary) return;
      setIsRefining(true);
      setRefiningDay(dayNumber);

      try {
        const result = await getCityItinerary({
          city: city.city,
          country: city.country,
          tripDuration: profile.tripDuration,
          travelMonth: profile.travelMonth,
          userInterests: interests,
          adventureTypes: profile.adventureTypes,
          settings,
          regenerateDay: dayNumber,
          adjustment,
        });

        // The response has a `regeneratedDay` field for per-day updates
        const regenerated = (result as any).regeneratedDay as ItineraryDay | undefined;
        if (regenerated) {
          setItinerary((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              days: prev.days.map((d) =>
                d.dayNumber === dayNumber ? { ...regenerated, dayNumber } : d
              ),
            };
          });
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
    [itinerary, city, profile, interests, settings]
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

  useEffect(() => {
    fetchItinerary();
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
          <p className="text-muted-foreground text-sm">{error}</p>
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
            Your {profile.tripDuration}-Day Adventure
          </h2>
          <p className="text-muted-foreground mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-primary/60" />
            Personalized for your {settings.tripStyle} travel style
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map / List Toggle */}
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
          {/* Mobile Only Customize Button */}
          <div className="lg:hidden">
            <RefinementPanel
              settings={settings}
              onSettingsChange={setSettings}
              onUpdate={fetchItinerary}
              isUpdating={isLoading}
              interests={interests}
              highlightExperiences={highlightExperiences}
            />
          </div>
        </div>
      </div>

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
        {/* Itinerary Days */}
        <div className="flex-1 min-w-0 space-y-5">
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

          {/* Curated Tours & Experiences */}
          <div
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{ animationDelay: `${(itinerary.days.length + 3) * 100}ms` }}
          >
            <CuratedToursSection
              itinerary={itinerary}
              cityName={city.city}
              country={city.country}
              userInterests={interests}
            />
          </div>
        </div>

        {/* Desktop Refinement Panel */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <div className="sticky top-[120px]">
            <RefinementPanel
              settings={settings}
              onSettingsChange={setSettings}
              onUpdate={fetchItinerary}
              isUpdating={isLoading}
              interests={interests}
              highlightExperiences={highlightExperiences}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
