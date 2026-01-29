import { ItineraryDay } from "@/types/itinerary";
import { TimeSlotCard } from "./TimeSlotCard";
import { Calendar, MapPin } from "lucide-react";

interface DayCardProps {
  day: ItineraryDay;
}

export const DayCard = ({ day }: DayCardProps) => {
  return (
    <article className="bg-card rounded-xl border border-border/50 overflow-hidden hover:border-primary/30 transition-colors duration-300 shadow-sm hover:shadow-md">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent px-5 md:px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm">
              {day.dayNumber}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
              <MapPin className="w-2.5 h-2.5 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
              <Calendar className="w-3 h-3" />
              Day {day.dayNumber}
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground truncate">
              {day.theme}
            </h3>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      <div className="p-4 md:p-5 space-y-4">
        {Array.isArray(day.slots) && day.slots.map((slot) => (
          <TimeSlotCard key={slot.period} slot={slot} />
        ))}
      </div>
    </article>
  );
};
