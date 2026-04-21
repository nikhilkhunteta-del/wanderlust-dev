import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { CityHighlights } from "@/types/cityHighlights";
import { Header } from "@/components/shared/Header";
import { ItineraryTab } from "@/components/itinerary/ItineraryTab";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationState {
  city: CityRecommendation;
  profile: TravelProfile;
  highlights: CityHighlights | null;
}

function buildDefaultProfile(cityName: string): TravelProfile {
  const now = new Date();
  const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  return {
    interestScores: { 'culture-experiences': 0.5, 'sun-rest': 0.3, 'nature-adventure': 0.3, 'food-nightlife': 0.5, 'wellness': 0.2, 'celebration': 0 },
    primaryInterest: '',
    adventureLevel: 0.3,
    adventureTypes: [],
    bucketListExperiences: [],
    culturalMoments: [],
    travelMonth: monthNames[now.getMonth()],
    tripDuration: 7,
    departureCity: "",
    travelCompanions: "",
    groupType: "solo",
    noveltyPreference: "classics",
    foodDepth: "",
    styleTags: [],
    summary: `Exploring ${cityName}`,
    completenessScore: 0.3,
    followUpQuestion: null,
  };
}

const ItineraryBuilder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cityName } = useParams<{ cityName: string }>();

  const state = location.state as LocationState | undefined;

  const { city, profile, highlights } = useMemo(() => {
    if (state?.city && state?.profile) {
      return { city: state.city, profile: state.profile, highlights: state.highlights ?? null };
    }

    const urlCity = cityName ? decodeURIComponent(cityName) : null;
    if (!urlCity) return { city: null, profile: null, highlights: null };

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
      highlights: null,
    };
  }, [state, cityName, location.search]);

  if (!city || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        rightContent={
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              {city.city}, {city.country}
            </span>
            <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
              {profile.tripDuration} days
            </span>
          </div>
        }
      />

      {/* Back to city button */}
      <div className="page-container pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {city.city}
        </Button>
      </div>

      <ItineraryTab city={city} profile={profile} highlights={highlights} />
    </div>
  );
};

export default ItineraryBuilder;
