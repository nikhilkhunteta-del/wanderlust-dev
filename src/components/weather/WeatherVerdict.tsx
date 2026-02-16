import { MonthRanking } from "@/types/weather";
import { CloudSun, TrendingUp, Shield } from "lucide-react";

interface WeatherVerdictProps {
  verdict: string;
  month: string;
  city: string;
  monthRanking: MonthRanking;
}

const ratingConfig = {
  excellent: { label: "Excellent", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  good: { label: "Good", color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/20" },
  mixed: { label: "Mixed", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  poor: { label: "Challenging", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" },
};

export const WeatherVerdict = ({ verdict, month, city, monthRanking }: WeatherVerdictProps) => {
  const config = ratingConfig[monthRanking.rating];

  return (
    <div className="space-y-4">
      {/* Rating Badge Row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bg} ${config.border} border ${config.color}`}>
          <TrendingUp className="w-3.5 h-3.5" />
          {config.label} month to visit
        </span>
        <span className="text-sm text-muted-foreground">
          Ranked #{monthRanking.rank} of {monthRanking.totalMonths} months
        </span>
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
          <Shield className="w-3 h-3" />
          {monthRanking.confidence} confidence
        </span>
      </div>

      {/* Verdict Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500/8 via-blue-500/5 to-indigo-500/8 border border-sky-500/15 p-6 md:p-8">
        <div className="absolute top-4 right-4 opacity-10">
          <CloudSun className="w-20 h-20 text-sky-500" />
        </div>
        <div className="relative">
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
            {month} in {city}
          </h2>
          <p className="text-lg md:text-xl font-display text-foreground leading-relaxed max-w-3xl">
            {verdict}
          </p>
        </div>
      </div>
    </div>
  );
};
