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
import { Input } from "@/components/ui/input";
import { ArrowLeft, RefreshCw, ArrowRight, Sparkles, Check } from "lucide-react";
import { usePrefetchCityImages } from "@/hooks/useImagePack";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<CityRecommendation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [excludedCities, setExcludedCities] = useState<string[]>([]);
  const [replacingCity, setReplacingCity] = useState<string | null>(null);
  const [saveEmail, setSaveEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
    fetchRecommendations([]);
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
        onRetry={profile ? () => fetchRecommendations(excludedCities) : handleStartOver}
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
          <h1 className="text-4xl md:text-5xl font-display font-semibold">
            Your Perfect Destinations
          </h1>
        </div>

        {/* Destination Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {recommendations.map((rec) => (
            <div key={`${rec.city}-${rec.country}`} className="flex flex-col">
              <DestinationCard
                recommendation={rec}
                onExplore={() => handleExploreCity(rec)}
                departureCity={profile?.departureCity}
              />
              <button
                type="button"
                onClick={() => handleBeenHere(rec.city)}
                disabled={replacingCity !== null}
                className="mt-2 self-center text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {replacingCity === rec.city ? 'Finding a replacement…' : 'Been here? Replace →'}
              </button>
            </div>
          ))}
        </div>

        {/* Save Travel Profile */}
        {profile && !isSaved && (
          <div className="max-w-md mx-auto mb-12 p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Save your travel profile</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Want smarter recommendations next time? We'll remember your travel style.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!saveEmail.trim()) return;
                setIsSaving(true);
                try {
                  const profileData = {
                    interestScores: profile.interestScores,
                    primaryInterest: profile.primaryInterest,
                    travelCompanions: profile.travelCompanions,
                    adventureLevel: profile.adventureLevel,
                    styleTags: profile.styleTags,
                    noveltyPreference: profile.noveltyPreference,
                    foodDepth: profile.foodDepth,
                  };
                  const { error } = await supabase
                    .from("saved_travel_profiles" as any)
                    .upsert(
                      { email: saveEmail.trim().toLowerCase(), profile_json: profileData, updated_at: new Date().toISOString() } as any,
                      { onConflict: "email" }
                    );
                  if (error) throw error;
                  setIsSaved(true);
                  toast({ title: "Done — we'll remember you next time." });
                } catch (err) {
                  console.error("Failed to save profile:", err);
                  toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
                } finally {
                  setIsSaving(false);
                }
              }}
              className="flex gap-2"
            >
              <Input
                type="email"
                required
                placeholder="your@email.com"
                value={saveEmail}
                onChange={(e) => setSaveEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isSaving} className="gap-1.5 shrink-0 gradient-sunset text-primary-foreground">
                {isSaving ? "Saving…" : "Save my profile →"}
              </Button>
            </form>
          </div>
        )}
        {isSaved && (
          <div className="max-w-md mx-auto mb-12 p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <p className="text-sm font-medium">Done — we'll remember you next time.</p>
            </div>
          </div>
        )}


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
            onClick={() => fetchRecommendations(excludedCities)}
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
