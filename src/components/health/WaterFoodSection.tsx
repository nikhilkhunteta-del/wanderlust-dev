import { cn } from "@/lib/utils";
import { Droplets, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface WaterFoodSectionProps {
  waterSafety: {
    status: "safe" | "caution" | "unsafe";
    reason: string;
  };
  foodSafety: string;
}

const waterConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  safe: { label: "Safe", icon: CheckCircle, colorClass: "text-emerald-500", bgClass: "bg-emerald-500/10" },
  caution: { label: "Caution", icon: AlertTriangle, colorClass: "text-amber-500", bgClass: "bg-amber-500/10" },
  unsafe: { label: "Unsafe", icon: XCircle, colorClass: "text-red-500", bgClass: "bg-red-500/10" },
};

export const WaterFoodSection = ({ waterSafety, foodSafety }: WaterFoodSectionProps) => {
  const config = waterConfig[waterSafety.status] || waterConfig.caution;
  const WaterIcon = config.icon;

  return (
    <section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Water Safety */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Water Safety</h3>
          <div className={cn("rounded-xl border p-4 flex items-start gap-4", config.bgClass, "border-border/50")}>
            <div className={cn("p-2 rounded-lg", config.bgClass)}>
              <Droplets className={cn("w-5 h-5", config.colorClass)} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">Tap Water:</span>
                <span className={cn("flex items-center gap-1 text-sm", config.colorClass)}>
                  <WaterIcon className="w-4 h-4" />
                  {config.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{waterSafety.reason}</p>
            </div>
          </div>
        </div>

        {/* Food Safety */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Food Safety</h3>
          {foodSafety ? (
            <ul className="space-y-2">
              {foodSafety.split(/(?<=\.)\s+/).filter(Boolean).map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                  <span className="mt-2 w-1 h-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                  {point.trim()}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No specific food safety concerns for this destination.</p>
          )}
        </div>
      </div>
    </section>
  );
};
