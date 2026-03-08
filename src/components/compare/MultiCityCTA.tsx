import { CityScores } from "@/types/comparison";
import { useNavigate } from "react-router-dom";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MultiCityCTAProps {
  ranked: CityScores[];
  profile: TravelProfile;
  cities: CityRecommendation[];
}

export const MultiCityCTA = ({ ranked, profile, cities }: MultiCityCTAProps) => {
  const navigate = useNavigate();

  // Only show if trip is 10+ days
  if (profile.tripDuration < 10) return null;

  const cityNames = cities.map((c) => c.city);
  const gatewayCitySlug = cities[0].city.toLowerCase().replace(/\s+/g, "-");

  const handleBuildMultiCity = () => {
    navigate(`/city/${gatewayCitySlug}`, {
      state: {
        city: cities[0],
        profile,
        activateMultiCity: true,
        multiCityCities: cities,
      },
    });
  };

  return (
    <section
      className="rounded-xl p-6 md:p-8"
      style={{ backgroundColor: "#1C1917" }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5" style={{ color: "#EA580C" }} />
            <h3 className="text-lg font-display font-semibold" style={{ color: "#FFFFFF" }}>
              What if you visited all three?
            </h3>
          </div>
          <p className="text-sm" style={{ color: "#D6D3D1" }}>
            Your {profile.tripDuration} days could cover {cityNames.join(", ")} — here's how.
          </p>
        </div>

        <Button
          onClick={handleBuildMultiCity}
          className="gap-2 flex-shrink-0"
          style={{ backgroundColor: "#EA580C", color: "#FFFFFF" }}
        >
          Build a multi-city itinerary
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </section>
  );
};
