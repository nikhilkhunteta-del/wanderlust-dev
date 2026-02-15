import { useState, lazy, Suspense } from "react";
import { MultiCityItinerary, MultiCityRoute, CityTransition } from "@/types/multiCity";
import { DayCard } from "./DayCard";
import { Loader2, Lightbulb, Train, Plane, Bus, Ship, Car, ArrowRight, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";

const MultiCityMap = lazy(() =>
  import("./MultiCityMap").then((m) => ({ default: m.MultiCityMap }))
);

interface MultiCityItineraryViewProps {
  itinerary: MultiCityItinerary;
  route: MultiCityRoute;
  isLoading: boolean;
  error: Error | null;
}

const transportIcons: Record<string, typeof Train> = {
  train: Train,
  flight: Plane,
  bus: Bus,
  ferry: Ship,
  drive: Car,
};

export const MultiCityItineraryView = ({
  itinerary,
  route,
  isLoading,
  error,
}: MultiCityItineraryViewProps) => {
  const [showMap, setShowMap] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Creating your {route.totalDays}-day multi-city journey...
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {route.stops.map((s) => s.city).join(" → ")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to generate multi-city itinerary</p>
          <p className="text-muted-foreground text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!itinerary) return null;

  // Group days by city
  const cityGroups: { city: string; days: typeof itinerary.days; transition?: CityTransition }[] = [];
  let currentCity = "";

  itinerary.days.forEach((day) => {
    if (day.cityName !== currentCity) {
      const transition = itinerary.cityTransitions?.find(
        (t) => t.toCity === day.cityName && t.dayNumber === day.dayNumber
      );
      cityGroups.push({ city: day.cityName, days: [day], transition });
      currentCity = day.cityName;
    } else {
      cityGroups[cityGroups.length - 1].days.push(day);
    }
  });

  return (
    <div className="space-y-5">
      {/* Route overview strip + map toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-1 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {route.stops.map((stop, i) => (
            <div key={stop.city} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground ${
                    i === 0 ? "bg-primary" : "bg-violet-500"
                  }`}
                >
                  {i + 1}
                </div>
                <span className="text-sm font-medium">{stop.city}</span>
                <span className="text-xs text-muted-foreground">({stop.days}d)</span>
              </div>
              {i < route.stops.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/40" />
              )}
            </div>
          ))}
        </div>
        <Button
          variant={showMap ? "default" : "outline"}
          size="sm"
          className="gap-2 shadow-sm"
          onClick={() => setShowMap(!showMap)}
        >
          {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
          {showMap ? "List view" : "Map view"}
        </Button>
      </div>

      {/* Map View */}
      {showMap && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Button
              variant={selectedCity === null ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedCity(null)}
            >
              All cities
            </Button>
            {route.stops.map((stop) => (
              <Button
                key={stop.city}
                variant={selectedCity === stop.city ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setSelectedCity(stop.city)}
              >
                {stop.city}
              </Button>
            ))}
          </div>
          <Suspense
            fallback={
              <div className="h-[420px] bg-muted/30 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <MultiCityMap route={route} days={itinerary.days} selectedCity={selectedCity} />
          </Suspense>
        </div>
      )}

      {/* City groups with days */}
      {cityGroups.map((group, groupIndex) => {
        const stopIndex = route.stops.findIndex((s) => s.city === group.city);
        const TransportIcon = group.transition
          ? transportIcons[group.transition.transportMode] || Train
          : null;

        return (
          <div key={`${group.city}-${groupIndex}`}>
            {/* Travel transition card */}
            {group.transition && TransportIcon && (
              <div className="flex items-center gap-3 py-3 px-4 mb-3 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 border border-violet-500/15 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <TransportIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {group.transition.fromCity}
                    <ArrowRight className="w-3 h-3 inline mx-1.5 text-muted-foreground/50" />
                    {group.transition.toCity}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.transition.travelTime} by {group.transition.transportMode}
                    {group.transition.tip && ` · ${group.transition.tip}`}
                  </p>
                </div>
              </div>
            )}

            {/* City header */}
            <div className="flex items-center gap-3 mb-4 px-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 ${
                  stopIndex === 0 ? "bg-primary" : "bg-violet-500"
                }`}
              >
                {stopIndex + 1}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg leading-tight">
                  {group.city}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {group.days.length} {group.days.length === 1 ? "day" : "days"}
                  {route.stops[stopIndex]?.country && `, ${route.stops[stopIndex].country}`}
                </p>
              </div>
            </div>

            {/* Day cards */}
            {group.days.map((day, dayIndex) => (
              <div
                key={day.dayNumber}
                className="mb-5 animate-in fade-in slide-in-from-bottom-4"
                style={{
                  animationDelay: `${(groupIndex * 3 + dayIndex) * 80}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <DayCard
                  day={day}
                  city={group.city}
                  country={route.stops[stopIndex]?.country || ""}
                  isRefining={false}
                  refiningDay={null}
                />
              </div>
            ))}
          </div>
        );
      })}

      {/* Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl p-5 md:p-6 border border-amber-500/20 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-semibold flex items-center gap-2.5 mb-4 text-amber-700 dark:text-amber-400">
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <Lightbulb className="w-4 h-4" />
            </div>
            Multi-City Travel Tips
          </h3>
          <ul className="space-y-2.5">
            {itinerary.tips.map((tip, index) => (
              <li key={index} className="text-sm text-muted-foreground flex gap-3 items-start">
                <span className="text-amber-500 mt-1.5 text-xs">◆</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
