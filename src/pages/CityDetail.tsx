import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { useCityHighlights } from "@/hooks/useCityData";
import { useTabPrefetch } from "@/hooks/useTabPrefetch";
import { Header } from "@/components/shared/Header";
import { HighlightsTab } from "@/components/city/HighlightsTab";
import { ItineraryTab } from "@/components/itinerary/ItineraryTab";
import { SeasonalTab } from "@/components/seasonal/SeasonalTab";
import { WeatherTab } from "@/components/weather/WeatherTab";
import { TravelAdvisoryTab } from "@/components/travel/TravelAdvisoryTab";
import { HealthNoticesTab } from "@/components/health/HealthNoticesTab";
import { SituationalTab } from "@/components/situational/SituationalTab";
import { FlightsTab } from "@/components/flights/FlightsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocationState {
  city: CityRecommendation;
  profile: TravelProfile;
}

const CityDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("highlights");

  const state = location.state as LocationState | undefined;
  const city = state?.city;
  const profile = state?.profile;

  // Build highlights request
  const highlightsRequest = city && profile ? {
    city: city.city,
    country: city.country,
    rationale: city.rationale,
    userInterests: Object.entries(profile.interestScores)
      .filter(([_, score]) => score > 0)
      .map(([interest]) => interest),
    adventureTypes: profile.adventureTypes,
    travelMonth: profile.travelMonth,
    styleTags: profile.styleTags,
  } : null;

  // Build flight request for prefetching
  const flightRequest = city && profile && profile.departureCity ? {
    departureCity: profile.departureCity,
    destinationCity: city.city,
    destinationCountry: city.country,
    travelMonth: profile.travelMonth,
  } : null;

  const { data: highlights, isLoading, error } = useCityHighlights(highlightsRequest);

  // Tab prefetching
  const { prefetchAdjacentTabs } = useTabPrefetch({
    city: city?.city ?? "",
    country: city?.country ?? "",
    travelMonth: profile?.travelMonth ?? "",
    highlightsRequest,
    flightRequest,
  });

  // Handle tab change with prefetching
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      // Prefetch adjacent tabs after a small delay to prioritize current tab
      setTimeout(() => {
        prefetchAdjacentTabs(value);
      }, 100);
    },
    [prefetchAdjacentTabs]
  );

  // Prefetch adjacent tabs on initial load
  useEffect(() => {
    if (city && profile) {
      prefetchAdjacentTabs("highlights");
    }
  }, [city, profile, prefetchAdjacentTabs]);

  useEffect(() => {
    if (!city || !profile) {
      navigate("/");
    }
  }, [city, profile, navigate]);

  if (!city || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header rightContent={`${city.city}, ${city.country}`} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="sticky top-[65px] z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-6xl mx-auto px-4 overflow-x-auto">
            <TabsList className="h-12 bg-transparent gap-0 p-0 w-max">
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
                value="flights"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Flights
              </TabsTrigger>
              <TabsTrigger
                value="travel"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Advisory
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Health
              </TabsTrigger>
              <TabsTrigger
                value="situational"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Situational
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="highlights" className="mt-0">
          <HighlightsTab
            city={city.city}
            country={city.country}
            highlights={highlights ?? null}
            isLoading={isLoading}
            error={error instanceof Error ? error.message : error ? String(error) : null}
          />
        </TabsContent>

        <TabsContent value="itinerary" className="mt-0">
          <ItineraryTab city={city} profile={profile} highlights={highlights ?? null} />
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

        <TabsContent value="flights" className="mt-0">
          <FlightsTab
            departureCity={profile.departureCity}
            destinationCity={city.city}
            destinationCountry={city.country}
            travelMonth={profile.travelMonth}
          />
        </TabsContent>

        <TabsContent value="travel" className="mt-0">
          <TravelAdvisoryTab city={city.city} country={city.country} />
        </TabsContent>

        <TabsContent value="health" className="mt-0">
          <HealthNoticesTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
          />
        </TabsContent>

        <TabsContent value="situational" className="mt-0">
          <SituationalTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CityDetail;
