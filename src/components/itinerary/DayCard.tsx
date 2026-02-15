import { useState } from "react";
import { ItineraryDay } from "@/types/itinerary";
import { TimeSlotCard } from "./TimeSlotCard";
import { PacingStats } from "./PacingStats";
import { QuickRefinements } from "./QuickRefinements";
import { Calendar, MapPin, ChevronDown } from "lucide-react";

interface DayCardProps {
  day: ItineraryDay;
  city?: string;
  country?: string;
  onRefineDay?: (dayNumber: number, adjustment: string) => void;
  isRefining?: boolean;
  refiningDay?: number | null;
}

export const DayCard = ({ day, city, country, onRefineDay, isRefining = false, refiningDay = null }: DayCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Split slots: first slot (hero/morning) always visible, rest behind "View full day"
  const slots = Array.isArray(day.slots) ? day.slots : [];
  const heroSlot = slots[0];
  const remainingSlots = slots.slice(1);
  const hasMore = remainingSlots.length > 0;

  return (
    <article className="bg-card rounded-xl border border-border/50 overflow-hidden transition-colors duration-300 shadow-sm">
      {/* Day Header */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/3 to-transparent px-5 md:px-6 py-4 border-b border-border/30">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-lg shadow-sm flex-shrink-0">
            {day.dayNumber}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground/70 uppercase tracking-wider mb-0.5">
              <Calendar className="w-3 h-3" />
              Day {day.dayNumber}
              {day.neighbourhood && (
                <>
                  <span className="text-border">·</span>
                  <span className="text-primary/60 normal-case tracking-normal flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5" />
                    {day.neighbourhood}
                  </span>
                </>
              )}
            </div>
            <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
              {day.theme}
            </h3>
            {day.neighbourhoodVibe && (
              <p className="text-xs text-muted-foreground/60 mt-0.5 line-clamp-1 italic">
                {day.neighbourhoodVibe}
              </p>
            )}
          </div>
        </div>

        {/* Pacing Stats — compact row */}
        <div className="mt-2.5">
          <PacingStats
            walkingKm={day.estimatedWalkingKm}
            transitMinutes={day.estimatedTransitMinutes}
            paceLabel={day.paceLabel}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-5 space-y-3">
        {/* Hero slot always visible */}
        {heroSlot && (
          <TimeSlotCard slot={heroSlot} city={city} country={country} />
        )}

        {/* Remaining slots — collapsible */}
        {hasMore && (
          <>
            {isExpanded ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                {remainingSlots.map((slot) => (
                  <TimeSlotCard key={slot.period} slot={slot} city={city} country={country} />
                ))}
              </div>
            ) : null}

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-primary/80 hover:text-primary rounded-lg border border-dashed border-border/50 hover:border-primary/30 transition-all duration-200 bg-muted/20 hover:bg-primary/5"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              {isExpanded ? "Show less" : `View full day · ${remainingSlots.length} more`}
            </button>
          </>
        )}

        {/* Quick Refinements */}
        {onRefineDay && (
          <div className="pt-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground/60 mb-2">Adjust this day:</p>
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
