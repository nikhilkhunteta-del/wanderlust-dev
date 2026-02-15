import { CityTransition } from "@/types/multiCity";
import { Train, Plane, Bus, Ship, Car, ArrowRight, MapPin } from "lucide-react";

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

const transportDescriptions: Record<string, string> = {
  train: "Travel by rail through the countryside",
  flight: "A short flight connects these destinations",
  bus: "A scenic bus ride awaits",
  ferry: "Cross the waters to your next destination",
  drive: "A drive through changing landscapes",
};

export const TravelTransitionCard = ({ transition, leg }: TravelTransitionCardProps) => {
  const TransportIcon = transportIcons[transition.transportMode] || Train;
  const description = transportDescriptions[transition.transportMode] || "Journey onward";

  return (
    <div className="relative my-6">
      {/* Connecting line */}
      <div className="absolute left-7 top-0 bottom-0 w-px bg-gradient-to-b from-border via-violet-300/40 to-border dark:from-border dark:via-violet-500/30 dark:to-border" />

      <div className="relative ml-3 bg-gradient-to-r from-violet-500/[0.04] via-indigo-500/[0.04] to-transparent border border-violet-500/15 rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/15 to-indigo-500/15 flex items-center justify-center flex-shrink-0">
            <TransportIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Route */}
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1">
              <span>{transition.fromCity}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
              <span>{transition.toCity}</span>
            </div>

            {/* Details */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {transition.travelTime}
              </span>
              {leg?.distanceKm && (
                <span>{leg.distanceKm} km</span>
              )}
              <span className="capitalize">{transition.transportMode}</span>
            </div>

            {/* Narrative description */}
            <p className="text-sm text-muted-foreground italic leading-relaxed">
              {transition.tip || description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
