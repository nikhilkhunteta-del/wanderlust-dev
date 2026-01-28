import { AdvisoryLevel } from "@/types/travelAdvisory";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, AlertCircle, XCircle } from "lucide-react";

interface AdvisoryBannerProps {
  level: AdvisoryLevel;
  levelLabel: string;
  summary: string;
  advisoriesVary: boolean;
}

const levelConfig: Record<AdvisoryLevel, {
  icon: React.ElementType;
  bgClass: string;
  iconClass: string;
  borderClass: string;
}> = {
  normal: {
    icon: Shield,
    bgClass: "bg-emerald-500/10",
    iconClass: "text-emerald-500",
    borderClass: "border-emerald-500/30",
  },
  increased_caution: {
    icon: AlertTriangle,
    bgClass: "bg-amber-500/10",
    iconClass: "text-amber-500",
    borderClass: "border-amber-500/30",
  },
  reconsider_travel: {
    icon: AlertCircle,
    bgClass: "bg-orange-500/10",
    iconClass: "text-orange-500",
    borderClass: "border-orange-500/30",
  },
  avoid_travel: {
    icon: XCircle,
    bgClass: "bg-red-500/10",
    iconClass: "text-red-500",
    borderClass: "border-red-500/30",
  },
};

export const AdvisoryBanner = ({
  level,
  levelLabel,
  summary,
  advisoriesVary,
}: AdvisoryBannerProps) => {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        config.bgClass,
        config.borderClass
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-lg", config.bgClass)}>
          <Icon className={cn("w-6 h-6", config.iconClass)} />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold">{levelLabel}</h3>
            {advisoriesVary && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                Advisory levels vary by source
              </span>
            )}
          </div>
          <p className="text-muted-foreground leading-relaxed">{summary}</p>
        </div>
      </div>
    </div>
  );
};
