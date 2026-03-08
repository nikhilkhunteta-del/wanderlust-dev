import { useState, useEffect, useCallback } from "react";
import { NearbyCityOption, NearbyCityDiscoveryResponse, MultiCityRoute } from "@/types/multiCity";
import { discoverNearbyCities, buildRouteFromSuggestion } from "@/lib/multiCity";
import { Globe, ArrowRight, Train, Plane, Bus, Ship, Car, Loader2, ChevronRight, Minus, Plus, AlertTriangle } from "lucide-react";
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
  // Track which suggestion is in "split preview" mode
  const [previewSuggestion, setPreviewSuggestion] = useState<NearbyCityOption | null>(null);
  const [previewMainDays, setPreviewMainDays] = useState(0);
  const [previewAddedDays, setPreviewAddedDays] = useState(0);

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

  const openSplitPreview = useCallback((suggestion: NearbyCityOption) => {
    const mainDays = discovery?.mainCityDays || (tripDuration - (suggestion.suggestedDays || 2));
    const addedDays = suggestion.suggestedDays || 2;
    setPreviewSuggestion(suggestion);
    setPreviewMainDays(Math.max(2, mainDays));
    setPreviewAddedDays(Math.max(2, addedDays));
  }, [discovery, tripDuration]);

  const adjustSplit = useCallback((target: "main" | "added", delta: number) => {
    const hasTravelDay = previewSuggestion?.needsTravelDay;
    const effectiveTotal = hasTravelDay ? tripDuration - 1 : tripDuration;

    if (target === "main") {
      const newMain = previewMainDays + delta;
      const newAdded = effectiveTotal - newMain;
      if (newMain < 2 || newAdded < 2) return;
      setPreviewMainDays(newMain);
      setPreviewAddedDays(newAdded);
    } else {
      const newAdded = previewAddedDays + delta;
      const newMain = effectiveTotal - newAdded;
      if (newMain < 2 || newAdded < 2) return;
      setPreviewAddedDays(newAdded);
      setPreviewMainDays(newMain);
    }
  }, [previewMainDays, previewAddedDays, previewSuggestion, tripDuration]);

  const confirmSplit = useCallback(() => {
    if (!previewSuggestion) return;
    const route = buildRouteFromSuggestion(
      city,
      country,
      tripDuration,
      previewSuggestion,
      previewMainDays,
    );
    setPreviewSuggestion(null);
    onSelectMultiCity(route);
  }, [previewSuggestion, city, country, tripDuration, previewMainDays, onSelectMultiCity]);

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

  // Active multi-city state — compact summary (Fix 7: more visible revert button)
  if (isMultiCityActive) {
    // Build route label from suggestions
    const routeLabel = suggestions.length > 0
      ? `${city} → ${suggestions.map((s) => s.city).join(" → ")}`
      : `Multi-City Journey`;

    return (
      <div className="bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-xl p-5 md:p-6 border border-indigo-500/30">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-display font-semibold text-base flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
            <div className="p-1.5 rounded-lg bg-indigo-500/10">
              <Globe className="w-4 h-4" />
            </div>
            <span>Multi-City Journey · <span className="font-bold">{routeLabel}</span></span>
          </h3>
          <button
            onClick={onRevertToSingleCity}
            className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            style={{ borderColor: '#D1D5DB' }}
          >
            ← Single city only
          </button>
        </div>
      </div>
    );
  }

  const mainCityDays = discovery?.mainCityDays || tripDuration;

  // ── Split Preview Mode ──
  if (previewSuggestion) {
    const TransportIcon = transportIcons[previewSuggestion.transportMode] || Train;
    const effectiveTotal = previewSuggestion.needsTravelDay ? tripDuration - 1 : tripDuration;

    return (
      <div className="space-y-4">
        <h3 className="font-display font-semibold text-base flex items-center gap-2.5 text-indigo-700 dark:text-indigo-400">
          <div className="p-1.5 rounded-lg bg-indigo-500/10">
            <Globe className="w-4 h-4" />
          </div>
          Your journey
        </h3>

        <div className="bg-card rounded-xl border border-indigo-500/30 p-5 space-y-4">
          {/* Main city row */}
          <DaySplitRow
            cityName={city}
            days={previewMainDays}
            onMinus={() => adjustSplit("main", -1)}
            onPlus={() => adjustSplit("main", 1)}
            minDays={2}
            maxDays={effectiveTotal - 2}
          />

          {/* Transport connector */}
          <div className="flex items-center gap-2 pl-6 text-xs text-muted-foreground">
            <div className="w-px h-4 bg-border" />
            <TransportIcon className="w-3.5 h-3.5" />
            <span>{previewSuggestion.journeyTime} by {previewSuggestion.transportMode}</span>
          </div>

          {/* Added city row */}
          <DaySplitRow
            cityName={previewSuggestion.city}
            days={previewAddedDays}
            onMinus={() => adjustSplit("added", -1)}
            onPlus={() => adjustSplit("added", 1)}
            minDays={2}
            maxDays={effectiveTotal - 2}
            isGateway={previewSuggestion.isGatewayCity}
          />

          {/* Travel day note */}
          {previewSuggestion.needsTravelDay && (
            <p className="text-xs text-muted-foreground/70 italic pl-6">
              +1 travel day included (journey &gt; 2 hours)
            </p>
          )}

          {/* Practical / month warning */}
          {previewSuggestion.practicalNote && (
            <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                {previewSuggestion.practicalNote}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
            <Button
              size="sm"
              className="gap-1.5"
              onClick={confirmSplit}
            >
              Generate this itinerary
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setPreviewSuggestion(null)}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Suggestion Cards ──
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
            onAdd={() => openSplitPreview(suggestion)}
          />
        ))}
      </div>
    </div>
  );
};

// ── Editable day split row ──

interface DaySplitRowProps {
  cityName: string;
  days: number;
  onMinus: () => void;
  onPlus: () => void;
  minDays: number;
  maxDays: number;
  isGateway?: boolean;
}

const DaySplitRow = ({ cityName, days, onMinus, onPlus, minDays, maxDays, isGateway }: DaySplitRowProps) => (
  <div className="flex items-center gap-3">
    <span className="font-semibold text-sm min-w-0 flex-1 flex items-center gap-2">
      {cityName}
      {isGateway && (
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
        >
          Already on your route
        </Badge>
      )}
    </span>
    <div className="flex items-center gap-2">
      <button
        onClick={onMinus}
        disabled={days <= minDays}
        className="w-7 h-7 rounded-md border border-border hover:border-primary/50 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus className="w-3 h-3" />
      </button>
      <span className="text-sm font-medium min-w-[50px] text-center">
        {days} {days === 1 ? "day" : "days"}
      </span>
      <button
        onClick={onPlus}
        disabled={days >= maxDays}
        className="w-7 h-7 rounded-md border border-border hover:border-primary/50 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  </div>
);

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
        {suggestion.needsTravelDay && (
          <span className="text-muted-foreground/50 ml-1">+1 travel</span>
        )}
      </div>

      {/* Practical warning */}
      {suggestion.practicalNote && (
        <div className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{suggestion.practicalNote}</span>
        </div>
      )}

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
