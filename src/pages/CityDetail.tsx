import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { CityHighlights } from "@/types/cityHighlights";
import { getCityHighlights } from "@/lib/cityHighlights";
import { Header } from "@/components/shared/Header";
import { HighlightsTab } from "@/components/city/HighlightsTab";
import { ItineraryTab } from "@/components/itinerary/ItineraryTab";
import { SeasonalTab } from "@/components/seasonal/SeasonalTab";
import { WeatherTab } from "@/components/weather/WeatherTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocationState {
  city: CityRecommendation;
  profile: TravelProfile;
}

const CityDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [highlights, setHighlights] = useState<CityHighlights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const state = location.state as LocationState | undefined;
  const city = state?.city;
  const profile = state?.profile;

  useEffect(() => {
    if (!city || !profile) {
      navigate("/");
      return;
    }

    const fetchHighlights = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get top interests from the profile
        const topInterests = Object.entries(profile.interestScores)
          .filter(([_, score]) => score > 0)
          .map(([interest]) => interest);

        const highlightsData = await getCityHighlights({
          city: city.city,
          country: city.country,
          rationale: city.rationale,
          userInterests: topInterests,
          adventureTypes: profile.adventureTypes,
          travelMonth: profile.travelMonth,
          styleTags: profile.styleTags,
        });

        setHighlights(highlightsData);
      } catch (err) {
        console.error("Failed to fetch highlights:", err);
        setError(err instanceof Error ? err.message : "Failed to load highlights");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlights();
  }, [city, profile, navigate]);

  if (!city || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header rightContent={`${city.city}, ${city.country}`} />

      <Tabs defaultValue="highlights" className="w-full">
        <div className="sticky top-[65px] z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4">
            <TabsList className="h-12 bg-transparent gap-0 p-0">
              <TabsTrigger
                value="highlights"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Highlights
              </TabsTrigger>
              <TabsTrigger
                value="itinerary"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Itinerary
              </TabsTrigger>
              <TabsTrigger
                value="seasonal"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Seasonal
              </TabsTrigger>
              <TabsTrigger
                value="weather"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Weather
              </TabsTrigger>
              <TabsTrigger
                value="travel"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                disabled
              >
                Travel Info
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="highlights" className="mt-0">
          <HighlightsTab
            city={city.city}
            country={city.country}
            highlights={highlights}
            isLoading={isLoading}
            error={error}
          />
        </TabsContent>

        <TabsContent value="itinerary" className="mt-0">
          <ItineraryTab city={city} profile={profile} highlights={highlights} />
        </TabsContent>

        <TabsContent value="seasonal" className="mt-0">
          <SeasonalTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
          />
        </TabsContent>

        <TabsContent value="weather" className="mt-0">
          <WeatherTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
          />
        </TabsContent>

        <TabsContent value="travel">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center text-muted-foreground">
            Travel Info tab coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CityDetail;
