import { useState, useEffect } from "react";
import { NearbyCityOption, NearbyCityDiscoveryResponse, MultiCityRoute } from "@/types/multiCity";
import { discoverNearbyCities, buildRouteFromSuggestion } from "@/lib/multiCity";
import { Globe, ArrowRight, Train, Plane, Bus, Ship, Car, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MultiCitySuggestionProps {
  city: string;
  country: string;
  tripDuration: number;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  tripStyle: string;
  budgetLevel: string;
  gatewayCity?: string;
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

const shouldSuggestMultiCity = (tripDuration: number, nearbyCityOptions: NearbyCityOption[]) => {
  const longEnough = tripDuration >= 5;
  const hasNearbyMatch = nearbyCityOptions.length > 0;
  const mostDaysPerCity = tripDuration - 2;
  const viableRatio = mostDaysPerCity >= 2;
  return longEnough && hasNearbyMatch && viableRatio;
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
  gatewayCity,
  onSelectMultiCity,
  isMultiCityActive,
  onRevertToSingleCity,
}: MultiCitySuggestionProps) => {
  const [discovery, setDiscovery] = useState<NearbyCityDiscoveryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (hasLoaded || tripDuration < 5) return;

    const fetchDiscovery = async () => {
      setIsLoading(true);
      try {
        const result = await discoverNearbyCities({
          originCity: city,
          originCountry: country,
          totalDays: tripDuration,
          travelMonth,
          userInterests,
          adventureTypes,
          tripStyle,
          budgetLevel,
          gatewayCity,
        });
        setDiscovery(result);
      } catch (err) {
        console.error("Failed to discover nearby cities:", err);
      } finally {
        setIsLoading(false);
        setHasLoaded(true);
      }
    };

    fetchDiscovery();
  }, [hasLoaded, tripDuration]);

  if (tripDuration < 5) return null;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-xl p-5 md:p-6 border border-indigo-500/20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Discovering nearby destinations...</span>
        </div>
      </div>
    );
  }

  const suggestions = discovery?.suggestions || [];
  if (!shouldSuggestMultiCity(tripDuration, suggestions)) return null;

  // Active multi-city state — compact summary
  if (isMultiCityActive) {
    return (
      <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-xl p-5 md:p-6 border border-indigo-500/30">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <Globe className="w-4 h-4" />
            </div>
            Multi-City Journey Active
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
      </div>
    );
  }

  const mainCityDays = discovery?.mainCityDays || tripDuration;

  const handleAddCity = (suggestion: NearbyCityOption) => {
    const route = buildRouteFromSuggestion(
      city,
      country,
      tripDuration,
      suggestion,
      mainCityDays
    );
    onSelectMultiCity(route);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-base flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
        <div className="p-1.5 rounded-lg bg-indigo-500/10">
          <Globe className="w-4 h-4" />
        </div>
        Worth combining with your {city} trip
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => (
          <NearbyCityCard
            key={suggestion.city}
            suggestion={suggestion}
            mainCity={city}
            mainCityDays={mainCityDays}
            onAdd={() => handleAddCity(suggestion)}
          />
        ))}
      </div>
    </div>
  );
};

// ── Individual nearby city card ──

interface NearbyCityCardProps {
  suggestion: NearbyCityOption;
  mainCity: string;
  mainCityDays: number;
  onAdd: () => void;
}

const NearbyCityCard = ({ suggestion, mainCity, mainCityDays, onAdd }: NearbyCityCardProps) => {
  const TransportIcon = transportIcons[suggestion.transportMode] || Train;

  return (
    <div className="bg-card rounded-xl border border-border/60 p-4 hover:border-indigo-500/30 transition-colors space-y-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{suggestion.city}</span>
            {suggestion.isGatewayCity && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
              >
                Already on your route
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{suggestion.country}</span>
        </div>
      </div>

      {/* Transport info */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <TransportIcon className="w-3.5 h-3.5" />
        <span>{suggestion.journeyTime} by {suggestion.transportMode}</span>
      </div>

      {/* Match reason */}
      <p className="text-xs leading-relaxed text-muted-foreground">
        {suggestion.whyItMatches}
      </p>

      {/* Day split */}
      <div className="text-xs font-medium text-foreground/80 bg-muted/40 rounded-lg px-3 py-2 flex items-center gap-1.5">
        <span>{mainCity}: {mainCityDays}d</span>
        <ArrowRight className="w-3 h-3 text-muted-foreground/50" />
        <span>{suggestion.city}: {suggestion.suggestedDays || 2}d</span>
      </div>

      {/* CTA */}
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-1.5 text-xs border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-500/5"
        onClick={onAdd}
      >
        Add to my itinerary
        <ChevronRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};
