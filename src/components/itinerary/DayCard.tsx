import { ItineraryDay } from "@/types/itinerary";
import { TimeSlotCard } from "./TimeSlotCard";
import { Calendar } from "lucide-react";

interface DayCardProps {
  day: ItineraryDay;
}

export const DayCard = ({ day }: DayCardProps) => {
  return (
    <article className="bg-card rounded-xl border border-border/50 overflow-hidden">
      {/* Day Header */}
      <div className="bg-muted/50 px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center text-primary-foreground font-semibold">
            {day.dayNumber}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              Day {day.dayNumber}
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground">
              {day.theme}
            </h3>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="p-4 space-y-3">
        {day.slots.map((slot) => (
          <TimeSlotCard key={slot.period} slot={slot} />
        ))}
      </div>
    </article>
  );
};
