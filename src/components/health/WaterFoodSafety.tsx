import { WaterSafetyLevel } from "@/types/healthNotices";
import { cn } from "@/lib/utils";
import { Droplets, UtensilsCrossed, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface WaterFoodSafetyProps {
  waterSafety: {
    level: WaterSafetyLevel;
    description: string;
  };
  foodSafetyTips: string[];
}

const waterLevelConfig: Record<WaterSafetyLevel, {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  safe: {
    label: "Safe",
    icon: CheckCircle,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
  },
  caution: {
    label: "Caution",
    icon: AlertTriangle,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
  },
  not_recommended: {
    label: "Not Recommended",
    icon: XCircle,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
  },
};

export const WaterFoodSafety = ({
  waterSafety,
  foodSafetyTips,
}: WaterFoodSafetyProps) => {
  const config = waterLevelConfig[waterSafety.level];
  const WaterIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Water Safety */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Water Safety</h3>
        <div
          className={cn(
            "rounded-xl border p-4 flex items-start gap-4",
            config.bgClass,
            `border-${waterSafety.level === 'safe' ? 'emerald' : waterSafety.level === 'caution' ? 'amber' : 'red'}-500/30`
          )}
        >
          <div className={cn("p-2 rounded-lg", config.bgClass)}>
            <Droplets className={cn("w-5 h-5", config.colorClass)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold">Tap Water:</span>
              <span className={cn("flex items-center gap-1", config.colorClass)}>
                <WaterIcon className="w-4 h-4" />
                {config.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{waterSafety.description}</p>
          </div>
        </div>
      </div>

      {/* Food Safety */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Food Safety Tips</h3>
        <div className="space-y-3">
          {foodSafetyTips.map((tip, index) => (
            <div key={index} className="flex items-start gap-3">
              <UtensilsCrossed className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
