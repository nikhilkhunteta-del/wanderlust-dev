import { useState, useEffect, useRef } from "react";
import { MultiCityRoute, MultiCityRequest } from "@/types/multiCity";
import { getMultiCityRoute } from "@/lib/multiCity";
import { Globe, ArrowRight, Train, Plane, Bus, Ship, Car, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MultiCitySuggestionProps {
  city: string;
  country: string;
  tripDuration: number;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  tripStyle: string;
  budgetLevel: string;
  onSelectMultiCity: (route: MultiCityRoute) => void;
  isMultiCityActive: boolean;
  onRevertToSingleCity: () => void;
}

const transportIcons: Record<string, typeof Train> = {
  train: Train,
  flight: Plane,
  bus: Bus,
  ferry: Ship,
  drive: Car,
};

export const MultiCitySuggestion = ({
  city,
  country,
  tripDuration,
  travelMonth,
  userInterests,
  adventureTypes,
  tripStyle,
  budgetLevel,
  onSelectMultiCity,
  isMultiCityActive,
  onRevertToSingleCity,
}: MultiCitySuggestionProps) => {
  const [route, setRoute] = useState<MultiCityRoute | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);

  const shouldSuggestMultiCity = tripDuration >= 8;

  useEffect(() => {
    if (!shouldSuggestMultiCity || hasLoaded || tripDuration <= 4) return;

    const fetchRoute = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getMultiCityRoute({
          originCity: city,
          originCountry: country,
          totalDays: tripDuration,
          travelMonth,
          userInterests,
          adventureTypes,
          tripStyle,
          budgetLevel,
        });
        setRoute(result.route);
      } catch (err) {
        console.error("Failed to fetch multi-city route:", err);
        setError("Could not generate route suggestions");
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    };

    fetchRoute();
  }, [shouldSuggestMultiCity, hasLoaded, tripDuration]);

  // Render mini map
  useEffect(() => {
    if (!route || !mapContainerRef.current) return;

    if (miniMapRef.current) {
      miniMapRef.current.remove();
      miniMapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      dragging: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const points: [number, number][] = [];

    route.stops.forEach((stop, i) => {
      points.push([stop.lat, stop.lng]);
      const color = i === 0 ? "hsl(var(--primary))" : "#8b5cf6";
      L.marker([stop.lat, stop.lng], {
        icon: L.divIcon({
          className: "custom-marker",
          html: `<div style="
            background: ${color};
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: 700;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${i + 1}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
      }).addTo(map);
    });

    if (points.length > 1) {
      L.polyline(points, {
        color: "#8b5cf6",
        weight: 2,
        opacity: 0.6,
        dashArray: "6, 8",
      }).addTo(map);
    }

    map.fitBounds(L.latLngBounds(points), { padding: [20, 20], maxZoom: 7 });
    miniMapRef.current = map;

    return () => {
      map.remove();
      miniMapRef.current = null;
    };
  }, [route]);

  // Don't render for short trips
  if (tripDuration <= 4 || !shouldSuggestMultiCity) return null;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-xl p-5 md:p-6 border border-indigo-500/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Exploring multi-city routes...</span>
        </div>
      </div>
    );
  }

  if (error || !route) return null;

  // Active multi-city state
  if (isMultiCityActive) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-xl p-5 md:p-6 border border-indigo-500/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <Globe className="w-4 h-4" />
            </div>
            Multi-City Journey
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onRevertToSingleCity}
          >
            Switch to {city} only
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          {route.stops.map((stop, i) => (
            <div key={stop.city} className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {stop.city}
                <span className="text-xs text-muted-foreground ml-1">({stop.days}d)</span>
              </span>
              {i < route.stops.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{route.routeRationale}</p>
      </div>
    );
  }

  // Suggestion card
  return (
    <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-xl p-5 md:p-6 border border-indigo-500/20 hover:border-indigo-500/30 transition-colors">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2.5 mb-4 text-indigo-700 dark:text-indigo-400">
        <div className="p-1.5 rounded-lg bg-indigo-500/10">
          <Globe className="w-4 h-4" />
        </div>
        Make this a multi-city journey
      </h3>

      <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
        With {tripDuration} days, you could explore a regional route beyond {city}.
      </p>

      <div className="flex gap-4 flex-col sm:flex-row">
        {/* Route stops */}
        <div className="flex-1 space-y-3">
          {route.stops.map((stop, i) => {
            const leg = route.legs[i - 1];
            const TransportIcon = leg ? (transportIcons[leg.transportMode] || Train) : null;

            return (
              <div key={stop.city}>
                {leg && TransportIcon && (
                  <div className="flex items-center gap-2 pl-3 py-1 text-xs text-muted-foreground">
                    <div className="w-px h-3 bg-border" />
                    <TransportIcon className="w-3 h-3" />
                    <span>{leg.travelTime}</span>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground flex-shrink-0 mt-0.5 ${
                      i === 0 ? "bg-primary" : "bg-violet-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{stop.city}</span>
                      <span className="text-xs text-muted-foreground">
                        {stop.days} {stop.days === 1 ? "day" : "days"}
                      </span>
                    </div>
                    <div className="flex gap-1.5 mt-1 flex-wrap">
                      {stop.highlights.slice(0, 3).map((h) => (
                        <span
                          key={h}
                          className="text-[11px] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded-full"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini route map */}
        <div className="w-full sm:w-48 h-36 rounded-lg overflow-hidden border border-border/50 flex-shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => onSelectMultiCity(route)}
        >
          Explore this route
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
        <span className="text-xs text-muted-foreground">
          Your {city} itinerary stays available
        </span>
      </div>
    </div>
  );
};
