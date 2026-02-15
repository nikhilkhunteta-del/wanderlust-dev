import { ItineraryDay } from "@/types/itinerary";
import { MapPin, ChevronRight, Star } from "lucide-react";

interface CollapsedDayCardProps {
  day: ItineraryDay;
  onClick: () => void;
}

export const CollapsedDayCard = ({ day, onClick }: CollapsedDayCardProps) => {
  const heroActivity = (day.slots ?? [])
    .flatMap((s) => s.activities ?? [])
    .find((a) => a.isMustDo) ??
    (day.slots ?? [])[0]?.activities?.[0];

  return (
    <button
      onClick={onClick}
      className="w-full text-left group bg-card/40 rounded-lg border border-border/30 hover:border-primary/20 px-4 py-3 transition-all duration-200 hover:bg-card/70"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground/70 font-bold text-xs flex-shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          {day.dayNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm text-foreground/80 truncate group-hover:text-foreground transition-colors">
            {day.theme}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50 mt-0.5">
            {day.neighbourhood && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2 h-2" />
                {day.neighbourhood}
              </span>
            )}
            {heroActivity && (
              <>
                <span className="text-border/50">·</span>
                <span className="truncate flex items-center gap-1">
                  {heroActivity.isMustDo && <Star className="w-2 h-2 fill-primary/50 text-primary/50" />}
                  {heroActivity.title}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors flex-shrink-0" />
      </div>
    </button>
  );
};
