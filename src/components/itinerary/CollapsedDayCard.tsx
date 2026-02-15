import { ItineraryDay } from "@/types/itinerary";
import { MapPin, ChevronRight } from "lucide-react";

interface CollapsedDayCardProps {
  day: ItineraryDay;
  onClick: () => void;
}

export const CollapsedDayCard = ({ day, onClick }: CollapsedDayCardProps) => {
  const activityCount = (day.slots ?? []).reduce(
    (sum, slot) => sum + (slot.activities?.length ?? 0),
    0
  );
  const heroActivity = (day.slots ?? [])
    .flatMap((s) => s.activities ?? [])
    .find((a) => a.isMustDo) ??
    (day.slots ?? [])[0]?.activities?.[0];

  return (
    <button
      onClick={onClick}
      className="w-full text-left group bg-card/60 backdrop-blur-sm rounded-lg border border-border/40 hover:border-primary/30 p-4 transition-all duration-200 hover:shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {day.dayNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {day.theme}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            {day.neighbourhood && (
              <span className="flex items-center gap-1">
                <MapPin className="w-2.5 h-2.5" />
                {day.neighbourhood}
              </span>
            )}
            {heroActivity && (
              <>
                <span className="text-border">·</span>
                <span className="truncate">{heroActivity.title}</span>
              </>
            )}
            <span className="text-border">·</span>
            <span>{activityCount} stops</span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </button>
  );
};
