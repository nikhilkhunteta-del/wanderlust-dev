import { WeatherInsight } from "@/types/weather";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface WeeklyInsightsProps {
  insights: WeatherInsight[];
}

export const WeeklyInsights = ({ insights }: WeeklyInsightsProps) => {
  const getIcon = (type: WeatherInsight["type"]) => {
    switch (type) {
      case "favorable":
        return <TrendingUp className="w-4 h-4" />;
      case "unfavorable":
        return <TrendingDown className="w-4 h-4" />;
      default:
        return <Minus className="w-4 h-4" />;
    }
  };

  const getStyles = (type: WeatherInsight["type"]) => {
    switch (type) {
      case "favorable":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200/50 dark:border-emerald-800/30",
          iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
          iconColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "unfavorable":
        return {
          bg: "bg-rose-50 dark:bg-rose-950/30",
          border: "border-rose-200/50 dark:border-rose-800/30",
          iconBg: "bg-rose-100 dark:bg-rose-900/50",
          iconColor: "text-rose-600 dark:text-rose-400",
        };
      default:
        return {
          bg: "bg-muted/50",
          border: "border-border/50",
          iconBg: "bg-muted",
          iconColor: "text-muted-foreground",
        };
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Weekly Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const styles = getStyles(insight.type);
          return (
            <div
              key={index}
              className={`flex items-start gap-3 p-4 rounded-xl ${styles.bg} border ${styles.border}`}
            >
              <div className={`p-2 rounded-lg ${styles.iconBg}`}>
                <span className={styles.iconColor}>{getIcon(insight.type)}</span>
              </div>
              <p className="text-sm text-foreground leading-relaxed pt-1">{insight.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
