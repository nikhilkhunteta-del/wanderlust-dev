import { CityTransition } from "@/types/multiCity";
import { Train, Plane, Bus, Ship, Car, Clock, Route, Ticket } from "lucide-react";

interface TravelTransitionCardProps {
  transition: CityTransition;
  leg?: { distanceKm?: number };
}

const transportIcons: Record<string, typeof Train> = {
  train: Train,
  flight: Plane,
  bus: Bus,
  ferry: Ship,
  drive: Car,
};

const transportLabels: Record<string, string> = {
  train: "By rail",
  flight: "By air",
  bus: "By road",
  ferry: "By sea",
  drive: "By car",
};

export const TravelTransitionCard = ({ transition, leg }: TravelTransitionCardProps) => {
  const TransportIcon = transportIcons[transition.transportMode] || Train;
  const label = transportLabels[transition.transportMode] || "Onward";

  return (
    <div className="relative my-8">
      {/* Vertical route line */}
      <div className="absolute left-[22px] top-0 bottom-0 flex flex-col items-center">
        <div className="w-px flex-1 bg-gradient-to-b from-transparent via-primary/20 to-primary/40" />
        <div className="w-2.5 h-2.5 rounded-full border-2 border-primary/40 bg-background flex-shrink-0" />
        <div className="w-px flex-1 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />
      </div>

      {/* Card */}
      <div className="ml-12 bg-gradient-to-br from-muted/40 via-background to-muted/20 border border-border/40 rounded-xl p-5 relative overflow-hidden">
        {/* Subtle decorative line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="flex items-start gap-4">
          {/* Transport icon */}
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/10 flex items-center justify-center flex-shrink-0">
            <TransportIcon className="w-5 h-5 text-primary/70" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Chapter transition label */}
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">
              Chapter Transition
            </p>

            {/* Route */}
            <h4 className="font-display font-semibold text-foreground leading-tight mb-2">
              {transition.fromCity}
              <span className="text-muted-foreground/40 mx-2">→</span>
              {transition.toCity}
            </h4>

            {/* Detail chips */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                {transition.travelTime}
              </span>
              {leg?.distanceKm && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full">
                  <Route className="w-3 h-3" />
                  {leg.distanceKm} km
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs bg-muted/60 text-muted-foreground px-2.5 py-1 rounded-full">
                <Ticket className="w-3 h-3" />
                {label}
              </span>
            </div>

            {/* Narrative tip */}
            {transition.tip && (
              <p className="text-sm text-muted-foreground/70 leading-relaxed italic border-l-2 border-primary/15 pl-3">
                {transition.tip}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
