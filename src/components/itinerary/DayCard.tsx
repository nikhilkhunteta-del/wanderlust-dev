import { ItineraryDay } from "@/types/itinerary";
import { TimeSlotCard } from "./TimeSlotCard";
import { PacingStats } from "./PacingStats";
import { QuickRefinements } from "./QuickRefinements";
import { Calendar, MapPin } from "lucide-react";

interface DayCardProps {
  day: ItineraryDay;
  onRefineDay?: (dayNumber: number, adjustment: string) => void;
  isRefining?: boolean;
  refiningDay?: number | null;
}

export const DayCard = ({ day, onRefineDay, isRefining = false, refiningDay = null }: DayCardProps) => {
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
              {day.neighbourhood && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-primary/70 normal-case tracking-normal">{day.neighbourhood}</span>
                </>
              )}
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground truncate">
              {day.theme}
            </h3>
            {day.neighbourhoodVibe && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                {day.neighbourhoodVibe}
              </p>
            )}
          </div>
        </div>

        {/* Pacing Stats */}
        <div className="mt-3">
          <PacingStats
            walkingKm={day.estimatedWalkingKm}
            transitMinutes={day.estimatedTransitMinutes}
            paceLabel={day.paceLabel}
          />
        </div>
      </div>

      {/* Time Slots */}
      <div className="p-4 md:p-5 space-y-4">
        {Array.isArray(day.slots) && day.slots.map((slot) => (
          <TimeSlotCard key={slot.period} slot={slot} />
        ))}

        {/* Quick Refinements */}
        {onRefineDay && (
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">Quick adjust this day:</p>
            <QuickRefinements
              dayNumber={day.dayNumber}
              onRefineDay={onRefineDay}
              isRefining={isRefining}
              refiningDay={refiningDay}
            />
          </div>
        )}
      </div>
    </article>
  );
};
