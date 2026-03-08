import { CityScores, CITY_COLORS, DIMENSION_LABELS, DimensionWeights } from "@/types/comparison";
import { formatMonthName } from "@/lib/formatMonth";
import { Trophy } from "lucide-react";

interface VerdictCardProps {
  ranked: CityScores[];
  verdict: {
    verdictParagraph: string;
    runnerUpReason: string;
  } | null;
  isLoadingVerdict: boolean;
  travelMonth: string;
}

export const VerdictCard = ({ ranked, verdict, isLoadingVerdict, travelMonth }: VerdictCardProps) => {
  const top = ranked[0];
  const runner = ranked[1];
  const month = formatMonthName(travelMonth);

  return (
    <div
      className="rounded-xl border border-border/50 p-6 md:p-8"
      style={{ backgroundColor: "#FFFBEB", borderLeftWidth: "4px", borderLeftColor: "#EA580C" }}
    >
      <div className="flex items-start gap-3 mb-3">
        <Trophy className="w-6 h-6 flex-shrink-0" style={{ color: "#EA580C" }} />
        <h2 className="text-xl font-display font-semibold text-foreground">
          Your strongest match: {top.city.city}
        </h2>
      </div>

      {isLoadingVerdict ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      ) : (
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">
          {verdict?.verdictParagraph ||
            `${top.city.city} leads for your ${month} trip with a weighted score of ${top.weightedTotal.toFixed(1)}/10.`}
        </p>
      )}

      <p className="text-xs text-muted-foreground">
        Runner-up: <span className="font-medium">{runner.city.city}</span>
        {verdict?.runnerUpReason ? ` · ${verdict.runnerUpReason}` : ` · Score: ${runner.weightedTotal.toFixed(1)}/10`}
      </p>
    </div>
  );
};
