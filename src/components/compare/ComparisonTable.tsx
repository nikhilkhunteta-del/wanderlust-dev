import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CityScores, CITY_COLORS, CITY_BG_COLORS, DIMENSION_LABELS, DimensionWeights } from "@/types/comparison";
import { ChevronDown, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CityRecommendation } from "@/types/recommendations";
import { TravelProfile } from "@/types/travelProfile";

interface ComparisonTableProps {
  cityScores: CityScores[];
  allCities?: CityRecommendation[];
  profile?: TravelProfile;
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

export const ComparisonTable = ({ cityScores, allCities, profile }: ComparisonTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const navigate = useNavigate();

  const sorted = [...cityScores].sort((a, b) => b.weightedTotal - a.weightedTotal);
  const topCity = sorted[0];

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
                {cityScores.map((cs) => (
                  <div key={cs.city.city} className="p-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cs[dim].summary}
                    </p>
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
          const isWinner = cs === topCity;
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
          {cityScores.map((cs) => {
            const isWinner = cs === topCity;
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
