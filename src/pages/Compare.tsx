import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CityRecommendation } from "@/types/recommendations";
import { TravelProfile } from "@/types/travelProfile";
import { CITY_COLORS } from "@/types/comparison";
import { useComparisonData } from "@/hooks/useComparisonData";
import { formatMonthName } from "@/lib/formatMonth";
import { Header } from "@/components/shared/Header";
import { VerdictCard } from "@/components/compare/VerdictCard";
import { ComparisonSpiderChart } from "@/components/compare/ComparisonSpiderChart";
import { WeightSliders } from "@/components/compare/WeightSliders";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import { WhyNotSection } from "@/components/compare/WhyNotSection";
import { MultiCityCTA } from "@/components/compare/MultiCityCTA";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface CompareState {
  cities: CityRecommendation[];
  profile: TravelProfile;
}

const Compare = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as CompareState | undefined;
  const [spiderPulse, setSpiderPulse] = useState(false);

  useEffect(() => {
    if (!state?.cities || !state?.profile) {
      navigate("/");
    }
  }, [state, navigate]);

  if (!state?.cities || !state?.profile) return null;

  const { cities, profile } = state;

  const {
    cityScores,
    ranked,
    weights,
    setWeights,
    resetWeights,
    isLoading,
    allLoaded,
    rawData,
  } = useComparisonData(cities, profile);

  const handleWeightChanged = useCallback(() => {
    setSpiderPulse(true);
    setTimeout(() => setSpiderPulse(false), 300);
  }, []);

  // Fetch AI verdict once all data is loaded
  const { data: verdict, isLoading: isLoadingVerdict } = useQuery({
    queryKey: ["compare-verdict", ranked.map((r) => r.city.city).join(","), ranked.map((r) => r.weightedTotal.toFixed(1)).join(",")],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("compare-cities", {
        body: {
          ranked: ranked.map((r) => ({
            city: r.city.city,
            score: r.weightedTotal,
            personalMatch: r.personalMatch.score,
            weatherFit: r.weatherFit.score,
            gettingThere: r.gettingThere.score,
            safety: r.safety.score,
          })),
          profile,
        },
      });
      if (error) throw error;
      return data;
    },
    enabled: allLoaded && ranked.length === 3,
    staleTime: 5 * 60 * 1000,
  });

  const handleAxisClick = (dim: string, citySlug: string) => {
    const AXIS_TO_TAB: Record<string, string> = {
      personalMatch: "highlights",
      weatherFit: "weather",
      gettingThere: "flights",
      safety: "ground",
      seasonalEvents: "seasonal",
      accommodationValue: "stays",
    };
    const tab = AXIS_TO_TAB[dim] || "highlights";
    const city = cities.find(
      (c) => c.city.toLowerCase().replace(/\s+/g, "-") === citySlug
    );
    if (city) {
      navigate(`/city/${citySlug}`, {
        state: { city, profile, activeTab: tab },
      });
    }
  };

  const month = formatMonthName(profile.travelMonth);
  const partyLabel = profile.travelCompanions || profile.groupType || "solo";

  return (
    <div className="min-h-screen bg-background">
      <Header rightContent={
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to recommendations
        </button>
      } />

      <main className="page-container py-10 space-y-10">
        {/* 1. Header */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-foreground">
            Your three recommendations, compared
          </h1>
          <p className="text-sm text-muted-foreground">
            Based on your travel profile · {profile.departureCity || "Flexible departure"} · {month} · {profile.tripDuration} days · {partyLabel}
          </p>
          <div className="flex justify-center gap-3 flex-wrap">
            {cities.map((city, i) => (
              <span
                key={city.city}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: CITY_COLORS[i] }}
              >
                {city.city}
              </span>
            ))}
          </div>
        </section>

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Gathering data across all dimensions…
            </p>
            <div className="grid grid-cols-3 gap-4 w-full max-w-xl">
              {cities.map((c) => (
                <div key={c.city} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content — show as data loads */}
        {cityScores.length === 3 && (
          <>
            {/* 2. Verdict */}
            <VerdictCard
              ranked={ranked}
              verdict={verdict}
              isLoadingVerdict={isLoadingVerdict}
              travelMonth={profile.travelMonth}
            />

            {/* 3. Spider Chart */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground text-center">
                At a glance
              </h2>
              <div
                className="transition-opacity duration-300"
                style={{ opacity: spiderPulse ? 0.6 : 1 }}
              >
                <ComparisonSpiderChart
                  cityScores={cityScores}
                  onAxisClick={handleAxisClick}
                />
              </div>

              {/* 4. Weight sliders */}
              <div className="text-center">
                <WeightSliders
                  weights={weights}
                  onChange={setWeights}
                  onReset={resetWeights}
                  ranked={ranked}
                  originalCities={cities}
                  onWeightChanged={handleWeightChanged}
                />
              </div>
            </section>

            {/* 5. Comparison Table */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Dimension breakdown
              </h2>
              <ComparisonTable
                cityScores={cityScores}
                allCities={cities}
                profile={profile}
                groundData={rawData.ground.map((g) => g.data)}
              />
            </section>

            {/* 6. Why Not */}
            <WhyNotSection
              ranked={ranked}
              whyNot={verdict?.whyNot ?? null}
            />

            {/* 7. Multi-city CTA */}
            <MultiCityCTA
              ranked={ranked}
              profile={profile}
              cities={cities}
            />
          </>
        )}
      </main>
    </div>
  );
};

export default Compare;
