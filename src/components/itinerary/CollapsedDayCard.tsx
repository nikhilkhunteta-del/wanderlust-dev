import { useMemo } from "react";
import { ItineraryDay } from "@/types/itinerary";
import { MapPin, ChevronRight, Footprints } from "lucide-react";

interface CollapsedDayCardProps {
  day: ItineraryDay;
  onClick: () => void;
}

export const CollapsedDayCard = ({ day, onClick }: CollapsedDayCardProps) => {
  const activityCount = useMemo(
    () => (day.slots ?? []).reduce((sum, s) => sum + (s.activities?.length ?? 0), 0),
    [day.slots]
  );

  const periods = useMemo(
    () =>
      (day.slots ?? [])
        .filter((s) => s.activities?.length > 0)
        .map((s) => s.period.charAt(0).toUpperCase() + s.period.slice(1)),
    [day.slots]
  );

  const showWalking = (day.estimatedWalkingKm ?? 0) >= 5;

  return (
    <button
      onClick={onClick}
      className="w-full text-left group bg-card/40 rounded-lg border border-border/30 hover:border-primary/20 px-4 py-3.5 transition-all duration-200 hover:bg-card/70"
    >
      <div className="flex items-start gap-3">
        {/* Day badge — brand orange */}
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs flex-shrink-0 mt-0.5">
          {day.dayNumber}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Row 1: Theme + Neighbourhood */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-foreground/90 group-hover:text-foreground transition-colors truncate">
              {day.theme}
            </h4>
            {day.neighbourhood && (
              <span className="flex items-center gap-0.5 text-[11px] text-primary/60 flex-shrink-0">
                <MapPin className="w-2.5 h-2.5" />
                {day.neighbourhood}
              </span>
            )}
          </div>

          {/* Row 2: Mood line + activity count + walking */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground/60">
            {day.moodLine && (
              <>
                <span className="text-muted-foreground/50">{day.moodLine}</span>
                <span className="text-border/40">·</span>
              </>
            )}
            <span>
              {activityCount} activities{periods.length > 0 && ` · ${periods.join(", ")}`}
            </span>
            {showWalking && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[11px] font-medium">
                <Footprints className="w-3 h-3" />
                ~{Math.round(day.estimatedWalkingKm!)}km walking
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors flex-shrink-0 mt-1.5" />
      </div>
    </button>
  );
};
