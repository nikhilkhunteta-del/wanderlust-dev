import { useEffect, useState, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { useCityHighlights, useHealthData } from "@/hooks/useCityData";
import { useTabPrefetch } from "@/hooks/useTabPrefetch";
import { Header } from "@/components/shared/Header";
import { HighlightsTab } from "@/components/city/HighlightsTab";
import { ItineraryTab } from "@/components/itinerary/ItineraryTab";
import { SeasonalTab } from "@/components/seasonal/SeasonalTab";
import { WeatherTab } from "@/components/weather/WeatherTab";
import { OnTheGroundTab } from "@/components/ground/OnTheGroundTab";
import { HealthNoticesTab } from "@/components/health/HealthNoticesTab";
import { FlightsTab } from "@/components/flights/FlightsTab";
import { StaysTab } from "@/components/stays/StaysTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LocationState {
  city: CityRecommendation;
  profile: TravelProfile;
  allCities?: CityRecommendation[];
}

function buildDefaultProfile(cityName: string): TravelProfile {
  const now = new Date();
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return {
    interestScores: { culture: 0.5, nature: 0.3, beach: 0.3, food: 0.5, nightlife: 0.2, shopping: 0.2, photography: 0.3, wellness: 0.2 },
    adventureLevel: 0.3,
    adventureTypes: [],
    travelMonth: monthNames[now.getMonth()],
    tripDuration: 7,
    departureCity: "",
    preferredRegions: [],
    isFlexibleOnRegion: true,
    weatherPreference: 0.6,
    travelPace: 0.5,
    travelCompanions: "",
    groupType: "solo",
    styleTags: [],
    summary: `Exploring ${cityName}`,
    completenessScore: 0.3,
    followUpQuestion: null,
  };
}

const CityDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cityName } = useParams<{ cityName: string }>();
  const [activeTab, setActiveTab] = useState("highlights");

  const state = location.state as LocationState | undefined;

  // Derive city & profile from router state, or build fallbacks from URL param
  const { city, profile } = useMemo(() => {
    if (state?.city && state?.profile) {
      return { city: state.city, profile: state.profile };
    }

    // Fallback: parse city name from URL (supports "City" or "City, Country" via query param)
    const urlCity = cityName ? decodeURIComponent(cityName) : null;
    if (!urlCity) return { city: null, profile: null };

    const searchParams = new URLSearchParams(location.search);
    const urlCountry = searchParams.get("country") || "";

    const fallbackCity: CityRecommendation = {
      city: urlCity,
      country: urlCountry,
      rationale: `Discover what ${urlCity} has to offer.`,
      tags: [],
      imageQuery: `${urlCity} ${urlCountry} cityscape travel`.trim(),
    };

    return {
      city: fallbackCity,
      profile: buildDefaultProfile(urlCity),
    };
  }, [state, cityName, location.search]);

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
    travelCompanions: profile.travelCompanions,
    groupType: profile.groupType,
  } : null;

  // Build flight request for prefetching
  const flightRequest = city && profile && profile.departureCity ? {
    departureCity: profile.departureCity,
    destinationCity: city.city,
    destinationCountry: city.country,
    travelMonth: profile.travelMonth,
  } : null;

  const { data: highlights, isLoading, error } = useCityHighlights(highlightsRequest);

  // Health data for conditional tab rendering
  const { data: healthData } = useHealthData(
    city?.city ?? "",
    city?.country ?? "",
    profile?.travelMonth ?? ""
  );
  const healthRiskLevel = healthData?.healthRiskLevel ?? null;
  const showHealthTab = healthRiskLevel === null || healthRiskLevel !== "low";
  // Tab prefetching
  // Build itinerary request for prefetching
  const interests = profile ? Object.entries(profile.interestScores)
    .filter(([_, score]) => score > 0)
    .map(([interest]) => interest) : [];

  const itineraryRequest = city && profile ? {
    city: city.city,
    country: city.country,
    tripDuration: profile.tripDuration,
    travelMonth: profile.travelMonth,
    userInterests: interests,
    adventureTypes: profile.adventureTypes,
    settings: {
      tripStyle: "balanced" as const,
      focusInterest: interests[0] || "",
      budgetLevel: "mid" as const,
      diningPreference: "mixed" as const,
      mustDoExperiences: [],
      includeFreeTime: true,
    },
  } : null;

  const { prefetchAdjacentTabs } = useTabPrefetch({
    city: city?.city ?? "",
    country: city?.country ?? "",
    travelMonth: profile?.travelMonth ?? "",
    highlightsRequest,
    flightRequest,
    itineraryRequest,
  });

  // Handle tab change with prefetching
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
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

  // If we truly have no city (no state and no URL param), redirect home
  useEffect(() => {
    if (!city) {
      navigate("/");
    }
  }, [city, navigate]);

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
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                Why This City
              </TabsTrigger>
              <TabsTrigger
                value="weather"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                How It Feels
              </TabsTrigger>
              <TabsTrigger
                value="seasonal"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                While You're There
              </TabsTrigger>
              <TabsTrigger
                value="itinerary"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                Your Days
              </TabsTrigger>
              <TabsTrigger
                value="flights"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                Getting There
              </TabsTrigger>
              <TabsTrigger
                value="stays"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                Your Base
              </TabsTrigger>
              <TabsTrigger
                value="ground"
                className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
              >
                Before You Go
              </TabsTrigger>
              {showHealthTab && (
                <TabsTrigger
                  value="health"
                  className="px-4 h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent whitespace-nowrap"
                >
                  Stay Well
                </TabsTrigger>
              )}
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
            travelMonth={profile.travelMonth}
            onSwitchTab={handleTabChange}
          />
        </TabsContent>

        <TabsContent value="itinerary" className="mt-0">
          <ItineraryTab city={city} profile={profile} highlights={highlights ?? null} onSwitchTab={handleTabChange} />
        </TabsContent>

        <TabsContent value="seasonal" className="mt-0">
          <SeasonalTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
            userInterests={interests}
            travelCompanions={profile.travelCompanions || profile.groupType}
            styleTags={profile.styleTags}
            onSwitchTab={handleTabChange}
          />
        </TabsContent>

        <TabsContent value="weather" className="mt-0">
          <WeatherTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
            onSwitchTab={handleTabChange}
          />
        </TabsContent>

        <TabsContent value="flights" className="mt-0">
          <FlightsTab
            departureCity={profile.departureCity}
            destinationCity={city.city}
            destinationCountry={city.country}
            travelMonth={profile.travelMonth}
            tripDuration={profile.tripDuration}
            onSwitchTab={handleTabChange}
          />
        </TabsContent>

        <TabsContent value="stays" className="mt-0">
          <StaysTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
            departureCity={profile.departureCity}
            travelCompanions={profile.travelCompanions}
            groupType={profile.groupType}
            tripDuration={profile.tripDuration}
            styleTags={profile.styleTags}
            travelPace={profile.travelPace}
          />
        </TabsContent>

        <TabsContent value="ground" className="mt-0">
          <OnTheGroundTab
            city={city.city}
            country={city.country}
            travelMonth={profile.travelMonth}
            showCompactHealth={!showHealthTab}
          />
        </TabsContent>

        <TabsContent value="health" className="mt-0">
          <HealthNoticesTab
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
