import { WeatherRisk } from "@/types/weather";
import { AlertTriangle, ShieldCheck, CloudLightning, ThermometerSun, CloudRain, Wind, Snowflake } from "lucide-react";

interface WeatherWatchProps {
  risks: WeatherRisk[];
}

const riskIcons: Record<string, React.ElementType> = {
  "Extreme heat": ThermometerSun,
  "Heat advisory": ThermometerSun,
  "Heavy rainfall": CloudRain,
  "Frequent rain": CloudRain,
  "Near-freezing mornings": Snowflake,
  "Low visibility": Wind,
  "Stable conditions": ShieldCheck,
};

const severityStyles = {
  high: { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-200/50 dark:border-rose-800/30", icon: "text-rose-500" },
  moderate: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200/50 dark:border-amber-800/30", icon: "text-amber-500" },
  low: { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200/50 dark:border-emerald-800/30", icon: "text-emerald-500" },
};

export const WeatherWatch = ({ risks }: WeatherWatchProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        <h3 className="text-lg font-semibold">Weather Watch</h3>
      </div>
      <div className="space-y-3">
        {risks.map((risk, i) => {
          const styles = severityStyles[risk.severity];
          const Icon = riskIcons[risk.risk] || CloudLightning;
          return (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl ${styles.bg} border ${styles.border}`}>
              <Icon className={`w-5 h-5 ${styles.icon} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm font-medium text-foreground">{risk.risk}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{risk.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
