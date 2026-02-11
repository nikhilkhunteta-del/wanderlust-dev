import { Footprints, Bus, Gauge } from "lucide-react";

interface PacingStatsProps {
  walkingKm?: number;
  transitMinutes?: number;
  paceLabel?: string;
}

const paceConfig: Record<string, { label: string; color: string }> = {
  leisurely: { label: "Leisurely", color: "text-emerald-600 dark:text-emerald-400" },
  moderate: { label: "Moderate", color: "text-amber-600 dark:text-amber-400" },
  active: { label: "Active", color: "text-rose-600 dark:text-rose-400" },
};

export const PacingStats = ({ walkingKm, transitMinutes, paceLabel }: PacingStatsProps) => {
  if (!walkingKm && !transitMinutes && !paceLabel) return null;

  const pace = paceConfig[paceLabel || "moderate"] || paceConfig.moderate;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
      {walkingKm != null && (
        <span className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
          <Footprints className="w-3 h-3" />
          ~{walkingKm.toFixed(1)} km walking
        </span>
      )}
      {transitMinutes != null && (
        <span className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
          <Bus className="w-3 h-3" />
          ~{transitMinutes} min transit
        </span>
      )}
      {paceLabel && (
        <span className={`inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full ${pace.color}`}>
          <Gauge className="w-3 h-3" />
          {pace.label} pace
        </span>
      )}
    </div>
  );
};
