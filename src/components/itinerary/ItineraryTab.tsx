import { useState, useEffect } from "react";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { CityHighlights } from "@/types/cityHighlights";
import {
  CityItinerary,
  ItinerarySettings,
  DEFAULT_ITINERARY_SETTINGS,
} from "@/types/itinerary";
import { getCityItinerary } from "@/lib/itinerary";
import { DayCard } from "./DayCard";
import { RefinementPanel } from "./RefinementPanel";
import { Loader2, Lightbulb } from "lucide-react";

interface ItineraryTabProps {
  city: CityRecommendation;
  profile: TravelProfile;
  highlights: CityHighlights | null;
}

export const ItineraryTab = ({ city, profile, highlights }: ItineraryTabProps) => {
  const [itinerary, setItinerary] = useState<CityItinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-semibold">
            Your {profile.tripDuration}-Day Itinerary
          </h2>
          <p className="text-muted-foreground mt-1">
            Personalized for your {settings.tripStyle} travel style
          </p>
        </div>
        <RefinementPanel
          settings={settings}
          onSettingsChange={setSettings}
          onUpdate={fetchItinerary}
          isUpdating={isLoading}
          interests={interests}
          highlightExperiences={highlightExperiences}
        />
      </div>

      {/* Main Content */}
      <div className="flex gap-8">
        {/* Itinerary Days */}
        <div className="flex-1 space-y-6">
          {itinerary.days.map((day) => (
            <DayCard key={day.dayNumber} day={day} />
          ))}

          {/* Tips Section */}
          {itinerary.tips && itinerary.tips.length > 0 && (
            <div className="bg-muted/50 rounded-xl p-6 border border-border/50">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                Travel Tips
              </h3>
              <ul className="space-y-2">
                {itinerary.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-foreground">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Desktop Refinement Panel */}
        <div className="hidden lg:block">
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
  );
};
