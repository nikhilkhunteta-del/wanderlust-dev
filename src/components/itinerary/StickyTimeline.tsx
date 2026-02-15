import { ItineraryDay } from "@/types/itinerary";
import { MultiCityRoute } from "@/types/multiCity";

interface StickyTimelineProps {
  mode: "single" | "multi";
  // Single-city props
  days?: ItineraryDay[];
  selectedDay?: number;
  onSelectDay?: (dayNumber: number) => void;
  // Multi-city props
  route?: MultiCityRoute;
  onScrollToChapter?: (city: string) => void;
}

export const StickyTimeline = ({
  mode,
  days,
  selectedDay,
  onSelectDay,
  route,
  onScrollToChapter,
}: StickyTimelineProps) => {
  if (mode === "single" && days) {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 hidden xl:flex flex-col items-center gap-1">
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-full py-2 px-1.5 shadow-lg">
          {days.map((day) => {
            const isActive = day.dayNumber === selectedDay;
            return (
              <button
                key={day.dayNumber}
                onClick={() => onSelectDay?.(day.dayNumber)}
                className={`block w-7 h-7 rounded-full text-[10px] font-bold transition-all duration-200 mb-0.5 last:mb-0 ${
                  isActive
                    ? "bg-primary text-primary-foreground scale-110 shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={`Day ${day.dayNumber}: ${day.theme}`}
              >
                {day.dayNumber}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === "multi" && route) {
    return (
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 hidden xl:flex flex-col items-center gap-1">
        <div className="bg-card/90 backdrop-blur-md border border-border/50 rounded-full py-2 px-1.5 shadow-lg">
          {route.stops.map((stop, i) => (
            <button
              key={stop.city}
              onClick={() => onScrollToChapter?.(stop.city)}
              className="group block w-8 h-8 rounded-full text-[9px] font-bold transition-all duration-200 mb-0.5 last:mb-0 text-muted-foreground hover:bg-muted hover:text-foreground relative"
              title={stop.city}
            >
              {i + 1}
              <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 bg-card border border-border/50 text-xs font-medium px-2 py-1 rounded-md shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {stop.city}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return null;
};
