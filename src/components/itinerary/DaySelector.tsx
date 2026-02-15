import { useRef, useEffect } from "react";
import { ItineraryDay } from "@/types/itinerary";

interface DaySelectorProps {
  days: ItineraryDay[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
}

export const DaySelector = ({ days, selectedDay, onSelectDay }: DaySelectorProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollRef.current) return;
    const activeChip = scrollRef.current.querySelector(`[data-day="${selectedDay}"]`) as HTMLElement;
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedDay]);

  return (
    <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {days.map((day) => {
        const isActive = day.dayNumber === selectedDay;
        return (
          <button
            key={day.dayNumber}
            data-day={day.dayNumber}
            onClick={() => onSelectDay(day.dayNumber)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                : "bg-card text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              isActive ? "bg-primary-foreground/20" : "bg-muted"
            }`}>
              {day.dayNumber}
            </span>
            <span className="truncate max-w-[120px]">{day.theme}</span>
          </button>
        );
      })}
    </div>
  );
};
