import { DayTrip } from "@/types/itinerary";
import { MapPin, Clock, ArrowRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DayTripSectionProps {
  dayTrips: DayTrip[];
  onReplaceDayWithTrip?: (trip: DayTrip) => void;
}

export const DayTripSection = ({ dayTrips, onReplaceDayWithTrip }: DayTripSectionProps) => {
  if (!dayTrips || dayTrips.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-xl p-5 md:p-6 border border-emerald-500/20">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2.5 mb-4 text-emerald-700 dark:text-emerald-400">
        <div className="p-1.5 rounded-lg bg-emerald-500/10">
          <MapPin className="w-4 h-4" />
        </div>
        Day Trips & Nearby Escapes
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {dayTrips.map((trip, index) => (
          <article
            key={index}
            className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground">{trip.destination}</h4>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="w-3 h-3" />
                  {trip.travelTime}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {trip.description}
            </p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {(trip.matchedInterests || []).map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full capitalize"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {interest}
                </span>
              ))}
            </div>
            {trip.suggestedDayToReplace && onReplaceDayWithTrip && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5 px-2 h-7"
                onClick={() => onReplaceDayWithTrip(trip)}
              >
                Swap with Day {trip.suggestedDayToReplace}
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
};
