import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface HealthStatusBannerProps {
  hasActiveAlerts: boolean;
  alertSummary: string;
}

export const HealthStatusBanner = ({
  hasActiveAlerts,
  alertSummary,
}: HealthStatusBannerProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        hasActiveAlerts
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-emerald-500/10 border-emerald-500/30"
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "p-3 rounded-lg",
            hasActiveAlerts ? "bg-amber-500/10" : "bg-emerald-500/10"
          )}
        >
          {hasActiveAlerts ? (
            <AlertTriangle className="w-6 h-6 text-amber-500" />
          ) : (
            <CheckCircle className="w-6 h-6 text-emerald-500" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {hasActiveAlerts
              ? "Active health notice present"
              : "No major current health alerts"}
          </h3>
          {hasActiveAlerts && alertSummary && (
            <p className="text-muted-foreground mt-1">{alertSummary}</p>
          )}
          {!hasActiveAlerts && (
            <p className="text-muted-foreground mt-1">
              No significant health alerts are currently in effect for this destination.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
