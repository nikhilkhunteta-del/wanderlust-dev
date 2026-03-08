import { useState } from "react";
import { Footprints, Bus, Gauge } from "lucide-react";
import { BudgetBreakdown } from "@/types/itinerary";

interface PacingStatsProps {
  walkingKm?: number;
  transitMinutes?: number;
  paceLabel?: string;
  estimatedBudget?: number;
  budgetBreakdown?: BudgetBreakdown;
  budgetCurrency?: string;
}

const paceConfig: Record<string, { label: string; color: string }> = {
  leisurely: { label: "Leisurely", color: "text-emerald-600 dark:text-emerald-400" },
  moderate: { label: "Moderate", color: "text-amber-600 dark:text-amber-400" },
  active: { label: "Active", color: "text-rose-600 dark:text-rose-400" },
};

export const PacingStats = ({ walkingKm, transitMinutes, paceLabel, estimatedBudget, budgetBreakdown, budgetCurrency }: PacingStatsProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!walkingKm && !transitMinutes && !paceLabel && !estimatedBudget) return null;

  const pace = paceConfig[paceLabel || "moderate"] || paceConfig.moderate;
  const currency = budgetCurrency || "£";

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
      {estimatedBudget != null && (
        <span
          className="inline-flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full cursor-pointer hover:bg-muted/70 transition-colors relative"
          onMouseEnter={() => setShowBreakdown(true)}
          onMouseLeave={() => setShowBreakdown(false)}
          onClick={() => setShowBreakdown(!showBreakdown)}
        >
          <span className="text-sm leading-none">💰</span>
          ~{currency}{estimatedBudget} /person
          {showBreakdown && budgetBreakdown && (
            <span className="absolute top-full left-0 mt-1.5 bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 text-[11px] whitespace-nowrap shadow-lg z-20">
              Entrance fees: ~{currency}{budgetBreakdown.entranceFees} · Food: ~{currency}{budgetBreakdown.food} · Transport: ~{currency}{budgetBreakdown.transport}
              <span className="block text-muted-foreground/50 mt-0.5 italic">Estimate only · excludes accommodation</span>
            </span>
          )}
        </span>
      )}
    </div>
  );
};
