import { WeatherInsight } from "@/types/weather";
import { formatMonthName } from "@/lib/formatMonth";
import { TrendingUp, TrendingDown, Minus, Sparkles, Camera, Armchair } from "lucide-react";

interface WeeklyInsightsProps {
  insights: WeatherInsight[];
  bestTimeToVisit: string;
}

export const WeeklyInsights = ({ insights, bestTimeToVisit }: WeeklyInsightsProps) => {
  const getIcon = (type: WeatherInsight["type"], text: string) => {
    if (text.toLowerCase().includes("photography")) return <Camera className="w-4 h-4" />;
    if (text.toLowerCase().includes("golden") || text.toLowerCase().includes("relaxation")) return <Armchair className="w-4 h-4" />;
    switch (type) {
      case "favorable": return <TrendingUp className="w-4 h-4" />;
      case "unfavorable": return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  // #8 Standardised sidebar card colours: green=positive, amber=negative, border-only=neutral
  const getStyles = (type: WeatherInsight["type"]) => {
    switch (type) {
      case "favorable": return {
        bg: "bg-emerald-50 dark:bg-emerald-950/30",
        border: "border-emerald-200/50 dark:border-emerald-800/30",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
        iconColor: "text-emerald-600 dark:text-emerald-400",
      };
      case "unfavorable": return {
        bg: "bg-amber-50 dark:bg-amber-950/30",
        border: "border-amber-200/50 dark:border-amber-800/30",
        iconBg: "bg-amber-100 dark:bg-amber-900/50",
        iconColor: "text-amber-600 dark:text-amber-400",
      };
      default: return {
        bg: "bg-transparent", border: "border-border/50",
        iconBg: "bg-muted", iconColor: "text-muted-foreground",
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">Weekly Insights</h3>
      </div>

      {/* Best time callout */}
      <div className="p-4 rounded-xl bg-primary/5 border border-primary/15">
        <p className="text-sm font-medium text-foreground">{bestTimeToVisit}</p>
      </div>

      <div className="space-y-2.5">
        {insights.map((insight, index) => {
          const styles = getStyles(insight.type);
          return (
            <div key={index} className={`flex items-start gap-3 p-3.5 rounded-xl ${styles.bg} border ${styles.border}`}>
              <div className={`p-1.5 rounded-lg ${styles.iconBg} mt-0.5`}>
                <span className={styles.iconColor}>{getIcon(insight.type, insight.text)}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
