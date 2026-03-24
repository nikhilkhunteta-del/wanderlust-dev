import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CityScores, CITY_COLORS, CITY_BG_COLORS, DIMENSION_LABELS, DimensionWeights } from "@/types/comparison";
import { ChevronDown, Trophy, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CityRecommendation } from "@/types/recommendations";
import { TravelProfile } from "@/types/travelProfile";
import { useCityHeroImage } from "@/hooks/useResolvedImage";

interface ComparisonTableProps {
  cityScores: CityScores[];
  allCities?: CityRecommendation[];
  profile?: TravelProfile;
  groundData?: any[];
}

// Hook that checks image_cache table first, then falls back to resolve-image
function useCachedCityHero(city: string | null, country: string | null) {
  const cacheKey = city && country
    ? `city_hero:${city.toLowerCase()}:${country.toLowerCase()}`
    : null;

  // Step 1: Check the image_cache table directly
  const { data: cachedUrl, isLoading: isCacheLoading } = useQuery({
    queryKey: ["image-cache-check", cacheKey],
    queryFn: async () => {
      const { data } = await supabase
        .from("image_cache")
        .select("image_url")
        .eq("cache_key", cacheKey!)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();
      return data?.image_url || null;
    },
    enabled: !!cacheKey,
    staleTime: 30 * 60 * 1000,
  });

  // Step 2: Only call resolve-image if cache miss
  const heroImage = useCityHeroImage(
    cachedUrl ? null : city, // skip resolve-image if we have a cached URL
    cachedUrl ? null : country
  );

  return {
    url: cachedUrl || heroImage.data?.url || null,
    isLoading: isCacheLoading || (!cachedUrl && heroImage.isLoading),
  };
}

const DIMENSIONS: (keyof DimensionWeights)[] = [
  "personalMatch",
  "weatherFit",
  "gettingThere",
  "safety",
  "seasonalEvents",
  "accommodationValue",
];

function getScoreBadgeStyle(score: number): { bg: string; text: string } {
  if (score >= 8) return { bg: "#D1FAE5", text: "#065F46" };
  if (score >= 5) return { bg: "#FEF3C7", text: "#92400E" };
  return { bg: "#FEE2E2", text: "#991B1B" };
}

function ScoreBadge({ score, isTop }: { score: number; isTop: boolean }) {
  const style = getScoreBadgeStyle(score);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold",
        isTop && "ring-2 ring-primary/30"
      )}
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {score}
    </span>
  );
}

function SafetyExpandedRow({ cs, groundItem }: { cs: CityScores; groundItem: any }) {
  if (!groundItem) {
    return (
      <p className="text-xs text-muted-foreground leading-relaxed">
        {cs.safety.summary}
      </p>
    );
  }

  const advisories = groundItem.advisories || [];
  const ukAdvisory = advisories.find((a: any) => a.source === "UK FCDO");
  const usAdvisory = advisories.find((a: any) => a.source === "US State Dept");
  const caAdvisory = advisories.find((a: any) => a.source === "Canada DFATD" || a.source === "Canada");

  const alerts = groundItem.currentIssues || [];
  const alertSummary = alerts.length > 0
    ? alerts.slice(0, 2).map((a: any) => a.title || a.summary).join("; ")
    : "None reported";

  const keyRisk = groundItem.safetyGuidance?.topRisk || groundItem.keyRisk || "None specific";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Shield className="w-3 h-3" />
        <span>
          UK FCDO: {ukAdvisory?.level || "N/A"} · US State Dept: {usAdvisory?.level || "N/A"} · Canada: {caAdvisory?.level || "N/A"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Current alerts: {alertSummary}
      </p>
      <p className="text-xs text-muted-foreground">
        Key risk: {keyRisk}
      </p>
      <p className="text-[10px] text-muted-foreground/60 mt-1">
        Based on UK FCDO, US State Dept, and Canada DFATD advisories for {cs.city.city} specifically
      </p>
    </div>
  );
}

export const ComparisonTable = ({ cityScores, allCities, profile, groundData }: ComparisonTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const navigate = useNavigate();

  // Find the winner by highest weightedTotal
  const highestTotal = Math.max(...cityScores.map((cs) => cs.weightedTotal));
  const winnerIndex = cityScores.findIndex((cs) => cs.weightedTotal === highestTotal);

  const handleExplore = (cs: CityScores) => {
    const slug = cs.city.city.toLowerCase().replace(/\s+/g, "-");
    navigate(`/city/${slug}`, {
      state: { city: cs.city, profile, allCities, activeTab: "highlights" },
    });
  };

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-4 gap-0 bg-muted/30 border-b border-border/50">
        <div className="p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Dimension
        </div>
        {cityScores.map((cs, i) => (
          <div key={cs.city.city} className="p-3 text-center">
            <span
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: CITY_COLORS[i] }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CITY_COLORS[i] }} />
              {cs.city.city}
            </span>
          </div>
        ))}
      </div>

      {/* Dimension rows */}
      {DIMENSIONS.map((dim) => {
        const topScore = Math.max(...cityScores.map((cs) => cs[dim].score));
        const isExpanded = expandedRow === dim;

        return (
          <div key={dim} className="border-b border-border/30 last:border-b-0">
            <button
              className="w-full grid grid-cols-4 gap-0 hover:bg-muted/20 transition-colors"
              onClick={() => setExpandedRow(isExpanded ? null : dim)}
            >
              <div className="p-3 flex items-center gap-2 text-sm font-medium text-foreground text-left">
                {DIMENSION_LABELS[dim]}
                <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
              </div>
              {cityScores.map((cs, i) => {
                const isTop = cs[dim].score === topScore && topScore > 0;
                return (
                  <div
                    key={cs.city.city}
                    className="p-3 flex flex-col items-center gap-1"
                    style={isTop ? { backgroundColor: CITY_BG_COLORS[i] } : undefined}
                  >
                    <ScoreBadge score={cs[dim].score} isTop={isTop} />
                  </div>
                );
              })}
            </button>

            {isExpanded && (
              <div className="grid grid-cols-4 gap-0 bg-muted/10 border-t border-border/20">
                <div className="p-3" />
                {cityScores.map((cs, i) => (
                  <div key={cs.city.city} className="p-3">
                    {dim === "safety" && groundData?.[i] ? (
                      <SafetyExpandedRow cs={cs} groundItem={groundData[i]} />
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cs[dim].summary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Weighted Total row */}
      <div
        className="grid grid-cols-4 gap-0 border-t border-border/50"
        style={{ backgroundColor: "#1C1917", minHeight: "64px" }}
      >
        <div className="p-4 flex items-center text-sm font-semibold text-white">
          Weighted Total
        </div>
        {cityScores.map((cs, i) => {
          const isWinner = i === winnerIndex;
          return (
            <div
              key={cs.city.city}
              className="p-4 flex items-center justify-center gap-1.5"
              style={isWinner ? { borderTop: "3px solid #EA580C" } : undefined}
            >
              {isWinner && <Trophy className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="font-bold text-white" style={{ fontSize: "22px" }}>
                {cs.weightedTotal.toFixed(1)}
              </span>
              <span className="text-xs text-white/50">/10</span>
            </div>
          );
        })}
      </div>

      {/* Explore CTAs */}
      {profile && (
        <div className="grid grid-cols-4 gap-0 border-t border-border/30 bg-muted/10">
          <div className="p-3" />
          {cityScores.map((cs, i) => {
            const isWinner = i === winnerIndex;
            return (
              <div key={cs.city.city} className="p-3 flex justify-center">
                <Button
                  size="sm"
                  variant={isWinner ? "default" : "outline"}
                  className={cn(
                    "text-xs",
                    isWinner && "bg-[#EA580C] hover:bg-[#EA580C]/90 text-white"
                  )}
                  onClick={() => handleExplore(cs)}
                >
                  Explore {cs.city.city} →
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
