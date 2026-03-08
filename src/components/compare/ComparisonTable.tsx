import { useState } from "react";
import { CityScores, CITY_COLORS, CITY_BG_COLORS, DIMENSION_LABELS, DimensionWeights } from "@/types/comparison";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComparisonTableProps {
  cityScores: CityScores[];
}

const DIMENSIONS: (keyof DimensionWeights)[] = [
  "personalMatch",
  "weatherFit",
  "gettingThere",
  "safety",
  "seasonalEvents",
  "accommodationValue",
];

function ScoreBadge({ score, isTop }: { score: number; isTop: boolean }) {
  const color = score >= 8 ? "bg-emerald-500/15 text-emerald-700" :
    score >= 5 ? "bg-amber-500/15 text-amber-700" :
    "bg-red-500/15 text-red-700";

  return (
    <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-semibold", color, isTop && "ring-2 ring-primary/30")}>
      {score}
    </span>
  );
}

export const ComparisonTable = ({ cityScores }: ComparisonTableProps) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

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

      {/* Rows */}
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

      {/* Total row */}
      <div className="grid grid-cols-4 gap-0 bg-muted/40 border-t border-border/50">
        <div className="p-3 text-sm font-semibold text-foreground">
          Weighted Total
        </div>
        {cityScores.map((cs, i) => {
          const isTop = cs === [...cityScores].sort((a, b) => b.weightedTotal - a.weightedTotal)[0];
          return (
            <div
              key={cs.city.city}
              className="p-3 text-center"
              style={isTop ? { backgroundColor: CITY_BG_COLORS[i] } : undefined}
            >
              <span className="text-lg font-bold" style={{ color: CITY_COLORS[i] }}>
                {cs.weightedTotal.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/10</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
