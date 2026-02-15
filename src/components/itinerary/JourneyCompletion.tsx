import { Plane, BedDouble, Bookmark, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JourneyCompletionProps {
  cityName: string;
  tripDuration: number;
  onViewFlights?: () => void;
  onViewStays?: () => void;
  onSave?: () => void;
  onShare?: () => void;
}

export const JourneyCompletion = ({
  cityName,
  tripDuration,
  onViewFlights,
  onViewStays,
  onSave,
  onShare,
}: JourneyCompletionProps) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 md:p-10 text-center">
      {/* Decorative elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative">
        <div className="inline-flex items-center gap-2 text-primary mb-4">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium tracking-wide uppercase">Journey Complete</span>
          <Sparkles className="w-5 h-5" />
        </div>

        <h3 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-3">
          Ready to make this journey real?
        </h3>
        <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto mb-8 leading-relaxed">
          Your {tripDuration}-day {cityName} itinerary is ready. Take the next step and turn this plan into an unforgettable trip.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onViewFlights && (
            <Button onClick={onViewFlights} className="gap-2 shadow-md">
              <Plane className="w-4 h-4" />
              View flights
            </Button>
          )}
          {onViewStays && (
            <Button onClick={onViewStays} variant="outline" className="gap-2 shadow-sm">
              <BedDouble className="w-4 h-4" />
              View stays
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} variant="outline" className="gap-2 shadow-sm">
              <Bookmark className="w-4 h-4" />
              Save itinerary
            </Button>
          )}
          {onShare && (
            <Button onClick={onShare} variant="ghost" className="gap-2">
              <Share2 className="w-4 h-4" />
              Share trip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
