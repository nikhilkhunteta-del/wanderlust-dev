import { MonthRanking } from "@/types/weather";
import { BarChart3, CalendarX, Info } from "lucide-react";
import { formatMonthName } from "@/lib/formatMonth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MonthComparisonProps {
  monthRanking: MonthRanking;
  month: string;
}

const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MonthComparison = ({ monthRanking, month }: MonthComparisonProps) => {
  const displayMonth = formatMonthName(month);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">How {displayMonth} Ranks</h3>
      </div>

      {/* Visual rank bar — #6 redesigned */}
      <div className="rounded-xl bg-card border border-border/50 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">Month ranking</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3.5 h-3.5 text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Based on {monthRanking.dataYears} years of historical data from Open-Meteo. Actual conditions may vary.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className="text-sm font-semibold">#{monthRanking.rank} of {monthRanking.totalMonths}</span>
        </div>
        <div className="flex gap-1.5 items-center">
          {Array.from({ length: 12 }).map((_, i) => {
            const isCurrent = i + 1 === monthRanking.rank;
            return (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex-1 flex justify-center"
                    >
                      <div
                        className="rounded-full transition-colors cursor-default"
                        style={{
                          width: isCurrent ? 14 : 10,
                          height: isCurrent ? 14 : 10,
                          backgroundColor: isCurrent ? "#EA580C" : "#D1D5DB",
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {allMonths[i]}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">← Better for weather</span>
          <span className="text-[10px] text-muted-foreground">Worse →</span>
        </div>
      </div>

      {/* Ranking insight */}
      {monthRanking.rankingInsight && (
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
          <p className="text-sm text-foreground leading-relaxed">{monthRanking.rankingInsight}</p>
        </div>
      )}

      {/* Avoid months note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
        <CalendarX className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground leading-relaxed">{monthRanking.avoidMonths}</p>
      </div>

      {/* Data confidence footnote */}
      <p className="text-xs text-muted-foreground/70">
        Based on {monthRanking.dataYears} years of historical data from Open-Meteo. Actual conditions may vary.
      </p>
    </div>
  );
};
