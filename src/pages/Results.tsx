import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TravelProfile } from "@/types/travelProfile";
import { CityRecommendation } from "@/types/recommendations";
import { getDestinationRecommendations } from "@/lib/recommendations";
import { Header } from "@/components/shared/Header";
import { buildProfileSummary } from "@/lib/profileSummary";
import { ResultsLoading } from "@/components/results/ResultsLoading";
import { ResultsError } from "@/components/results/ResultsError";
import { DestinationCard } from "@/components/results/DestinationCard";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, ArrowRight } from "lucide-react";
import { usePrefetchCityImages } from "@/hooks/useImagePack";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CityRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludedCities, setExcludedCities] = useState<string[]>([]);
  const [replacingCity, setReplacingCity] = useState<string | null>(null);

  const profile = location.state?.profile as TravelProfile | undefined;

  const fetchRecommendations = async (excluded: string[] = []) => {
    if (!profile) {
      setError("No travel profile found. Please complete the questionnaire first.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await getDestinationRecommendations(profile, excluded.length > 0 ? excluded : undefined);
      setRecommendations(results);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError(err instanceof Error ? err.message : "Failed to get recommendations");
    } finally {
      setIsLoading(false);
      setReplacingCity(null);
    }
  };

  const handleBeenHere = async (cityName: string) => {
    const newExcluded = [...excludedCities, cityName];
    setExcludedCities(newExcluded);
    setReplacingCity(cityName);
    await fetchRecommendations(newExcluded);
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  // Prefetch images for recommended cities
  const citiesToPrefetch = recommendations?.map(r => ({ city: r.city, country: r.country })) || null;
  // Extract top interests from profile's interestScores
  const userInterests = profile?.interestScores 
    ? Object.entries(profile.interestScores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([key]) => key)
    : [];
  usePrefetchCityImages(citiesToPrefetch, userInterests);

  const handleExploreCity = (city: CityRecommendation) => {
    const citySlug = city.city.toLowerCase().replace(/\s+/g, "-");
    navigate(`/city/${citySlug}`, { state: { city, profile, allCities: recommendations } });
  };

  const handleStartOver = () => {
    navigate("/");
  };

  if (isLoading) {
    return <ResultsLoading />;
  }

  if (error) {
    return (
      <ResultsError
        message={error}
        onRetry={profile ? fetchRecommendations : handleStartOver}
      />
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <div className="min-h-screen gradient-warm">
      <Header rightContent="Your Destinations" />

      <main className="page-container py-12">
        {/* Intro Section */}
        <div className="text-center mb-12">
          {profile && (
            <p className="text-base md:text-lg text-muted-foreground italic mb-6 max-w-2xl mx-auto leading-relaxed">
              {buildProfileSummary(profile)}
            </p>
          )}
          <h1 className="text-4xl md:text-5xl font-display font-semibold mb-4">
            Your Perfect Destinations
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {profile?.summary || "Based on your preferences, we've curated three destinations that match your travel style."}
          </p>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {recommendations.map((rec) => (
            <DestinationCard
              key={`${rec.city}-${rec.country}`}
              recommendation={rec}
              onExplore={() => handleExploreCity(rec)}
              departureCity={profile?.departureCity}
            />
          ))}
        </div>

        {/* Compare CTA */}
        {recommendations.length >= 3 && profile && (
          <div className="text-center mb-8">
            <Button
              onClick={() => navigate("/compare", { state: { cities: recommendations, profile } })}
              className="gap-2"
              style={{ backgroundColor: "#EA580C", color: "#FFFFFF" }}
            >
              Compare all three cities
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleStartOver}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Start Over
          </Button>
          <Button
            variant="outline"
            onClick={fetchRecommendations}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Get New Suggestions
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Results;
