import { SensoryPeriod } from "@/types/weather";
import { Sunrise, Sun, Moon } from "lucide-react";

interface SensoryNarrativeProps {
  periods: SensoryPeriod[];
  month: string;
}

const periodConfig = {
  morning: { icon: Sunrise, label: "Morning", gradient: "from-amber-500/10 to-orange-500/5" },
  afternoon: { icon: Sun, label: "Afternoon", gradient: "from-sky-500/10 to-blue-500/5" },
  evening: { icon: Moon, label: "Evening", gradient: "from-indigo-500/10 to-purple-500/5" },
};

export const SensoryNarrative = ({ periods, month }: SensoryNarrativeProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">What your days will feel like</h3>
      <div className="grid gap-3">
        {periods.map((period) => {
          const config = periodConfig[period.period];
          const Icon = config.icon;
          return (
            <div
              key={period.period}
              className={`flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r ${config.gradient} border border-border/30`}
            >
              <div className="p-2 rounded-lg bg-background/80 shrink-0">
                <Icon className="w-4 h-4 text-foreground/70" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                <p className="text-sm text-foreground mt-1 leading-relaxed">{period.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
