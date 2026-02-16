import { MonthRanking } from "@/types/weather";
import { BarChart3, CalendarX } from "lucide-react";

interface MonthComparisonProps {
  monthRanking: MonthRanking;
  month: string;
}

export const MonthComparison = ({ monthRanking, month }: MonthComparisonProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">How {month} compares</h3>
      </div>

      {/* Visual rank bar */}
      <div className="rounded-xl bg-card border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Month ranking</span>
          <span className="text-sm font-semibold">#{monthRanking.rank} of {monthRanking.totalMonths}</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-colors ${
                i < monthRanking.rank
                  ? i + 1 === monthRanking.rank
                    ? "bg-primary"
                    : "bg-primary/30"
                  : "bg-muted-foreground/10"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] text-muted-foreground">Best</span>
          <span className="text-[10px] text-muted-foreground">Worst</span>
        </div>
      </div>

      {/* Avoid months note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
        <CalendarX className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">{monthRanking.avoidMonths}</p>
      </div>
    </div>
  );
};
