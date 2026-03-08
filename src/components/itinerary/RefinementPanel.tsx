import { useState, useMemo } from "react";
import {
  ItinerarySettings,
  TripStyle,
  BudgetLevel,
  DiningPreference,
} from "@/types/itinerary";
import { MultiCityRoute, CitySettings } from "@/types/multiCity";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  RefreshCw, Settings2, Minus, Plus,
  Landmark, Utensils, Trees, ShoppingBag, Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RefinementPanelProps {
  settings: ItinerarySettings;
  onSettingsChange: (settings: ItinerarySettings) => void;
  onUpdate: () => void;
  isUpdating: boolean;
  interests: string[];
  highlightExperiences: string[];
  tripDuration: number;
  onTripDurationChange?: (days: number) => void;
  // Multi-city props
  isMultiCity?: boolean;
  multiCityRoute?: MultiCityRoute | null;
  citySettings?: Record<string, CitySettings>;
  onCitySettingsChange?: (citySettings: Record<string, CitySettings>) => void;
  selectedCity?: string;
  onSelectedCityChange?: (city: string) => void;
}

const tripStyleOptions: { value: TripStyle; label: string; description: string }[] = [
  { value: "relaxed", label: "Relaxed", description: "1-2 activities, late starts" },
  { value: "balanced", label: "Balanced", description: "Mix of activities & downtime" },
  { value: "fast-paced", label: "Fast-paced", description: "Maximize experiences" },
];

const budgetOptions: { value: BudgetLevel; label: string }[] = [
  { value: "value", label: "Value" },
  { value: "mid", label: "Mid-range" },
  { value: "premium", label: "Premium" },
];

type DiningChoice = "local-street" | "casual" | "fine-dining";

const diningChoices: { value: DiningChoice; label: string }[] = [
  { value: "local-street", label: "Street Food" },
  { value: "casual", label: "Casual" },
  { value: "fine-dining", label: "Fine Dining" },
];

const focusOptions: { value: string; label: string; icon: typeof Landmark }[] = [
  { value: "culture", label: "Culture & history", icon: Landmark },
  { value: "food", label: "Food & markets", icon: Utensils },
  { value: "nature", label: "Nature & parks", icon: Trees },
  { value: "shopping", label: "Shopping & craft", icon: ShoppingBag },
  { value: "", label: "Balanced", icon: Sparkles },
];

const tripStyleLabel: Record<TripStyle, string> = {
  relaxed: "Relaxed",
  balanced: "Balanced",
  "fast-paced": "Fast-paced",
};

const budgetLabel: Record<BudgetLevel, string> = {
  value: "Value",
  mid: "Mid-range",
  premium: "Premium",
};

export const RefinementPanel = ({
  settings,
  onSettingsChange,
  onUpdate,
  isUpdating,
  interests,
  highlightExperiences,
  tripDuration,
  onTripDurationChange,
  isMultiCity = false,
  multiCityRoute,
  citySettings,
  onCitySettingsChange,
  selectedCity,
  onSelectedCityChange,
}: RefinementPanelProps) => {
  // Multi-select dining state derived from settings
  const [selectedDining, setSelectedDining] = useState<DiningChoice[]>(() => {
    if (settings.diningPreference === "mixed") return [];
    return [settings.diningPreference as DiningChoice].filter(Boolean);
  });

  const updateSetting = <K extends keyof ItinerarySettings>(
    key: K,
    value: ItinerarySettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleDining = (choice: DiningChoice) => {
    let updated: DiningChoice[];
    if (selectedDining.includes(choice)) {
      updated = selectedDining.filter((d) => d !== choice);
    } else {
      updated = [...selectedDining, choice];
    }
    setSelectedDining(updated);

    // Map to DiningPreference for the AI
    if (updated.length === 0) {
      updateSetting("diningPreference", "mixed");
    } else if (updated.length === 1) {
      updateSetting("diningPreference", updated[0] as DiningPreference);
    } else {
      updateSetting("diningPreference", "mixed");
    }
  };

  const diningDisplayLabel = useMemo(() => {
    if (selectedDining.length === 0) return "Mixed";
    return selectedDining
      .map((d) => diningChoices.find((c) => c.value === d)?.label || d)
      .join(" + ");
  }, [selectedDining]);

  const toggleMustDo = (experience: string) => {
    const current = settings.mustDoExperiences;
    const updated = current.includes(experience)
      ? current.filter((e) => e !== experience)
      : [...current, experience];
    updateSetting("mustDoExperiences", updated);
  };

  const handleDurationChange = (delta: number) => {
    const newDuration = tripDuration + delta;
    if (newDuration < 2 || newDuration > 14) return;
    const confirmed = window.confirm(
      `Changing to ${newDuration} days will update your full itinerary — continue?`
    );
    if (confirmed) {
      onTripDurationChange?.(newDuration);
    }
  };

  // Multi-city: city selector
  const cities = multiCityRoute?.stops.map((s) => s.city) || [];
  const isPerCity = isMultiCity && selectedCity && selectedCity !== "all";

  // Button label changes based on multi-city context
  const updateButtonLabel = isMultiCity
    ? isPerCity
      ? `Update ${selectedCity} chapter only`
      : "Regenerate full journey"
    : "Update Itinerary";

  // Settings summary
  const summaryLine = `${tripStyleLabel[settings.tripStyle]} pace · ${budgetLabel[settings.budgetLevel]} budget · ${diningDisplayLabel} dining`;

  const panelContent = (
    <div className="space-y-6">
      {/* Multi-City Selector */}
      {isMultiCity && cities.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Customising</Label>
          <Select
            value={selectedCity || "all"}
            onValueChange={(v) => onSelectedCityChange?.(v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Trip Duration */}
      {onTripDurationChange && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Trip duration</Label>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleDurationChange(-1)}
              disabled={tripDuration <= 2}
              className="w-8 h-8 rounded-lg border border-border hover:border-primary/50 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-semibold text-foreground min-w-[60px] text-center">
              {tripDuration} days
            </span>
            <button
              onClick={() => handleDurationChange(1)}
              disabled={tripDuration >= 14}
              className="w-8 h-8 rounded-lg border border-border hover:border-primary/50 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Trip Style */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Trip Style</Label>
        <div className="grid grid-cols-3 gap-2">
          {tripStyleOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateSetting("tripStyle", option.value)}
              className={`p-3 rounded-lg border text-center transition-all ${
                settings.tripStyle === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {option.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Level */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Budget Level</Label>
        <div className="flex gap-2">
          {budgetOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateSetting("budgetLevel", option.value)}
              className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                settings.budgetLevel === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dining Preference — multi-select */}
      <div>
        <Label className="text-sm font-medium mb-1 block">Dining preference</Label>
        <p className="text-[10px] text-muted-foreground mb-3">
          Select one or more — or leave as Mixed for a varied spread
        </p>
        <div className="grid grid-cols-3 gap-2">
          {diningChoices.map((option) => (
            <button
              key={option.value}
              onClick={() => toggleDining(option.value)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                selectedDining.includes(option.value)
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        {selectedDining.length === 0 && (
          <div className="mt-2 text-center text-xs text-muted-foreground/60 italic">
            Mixed — AI-curated variety
          </div>
        )}
      </div>

      {/* Settings Summary */}
      <div className="rounded-lg px-3 py-2 text-center bg-muted/30">
        <p className="text-xs text-muted-foreground italic">{summaryLine}</p>
      </div>

      {/* Itinerary Focus */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Itinerary focus</Label>
        <div className="grid grid-cols-2 gap-2">
          {focusOptions.map((option) => {
            const Icon = option.icon;
            const isActive = settings.focusInterest === option.value;
            return (
              <button
                key={option.value}
                onClick={() => updateSetting("focusInterest", option.value)}
                className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                  isActive
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-primary/50"
                } ${option.value === "" ? "col-span-2" : ""}`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pin to your itinerary (Must-Do Experiences) */}
      {highlightExperiences.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-1 block">Pin to your itinerary</Label>
          <p className="text-[10px] text-muted-foreground mb-3">
            Ticked experiences will always be included — regardless of other settings
          </p>
          <div className="space-y-2.5 max-h-48 overflow-y-auto">
            {highlightExperiences.map((experience) => (
              <label
                key={experience}
                className="flex items-start gap-2.5 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={settings.mustDoExperiences.includes(experience)}
                  onCheckedChange={() => toggleMustDo(experience)}
                  className="mt-0.5 flex-shrink-0"
                />
                <span className="leading-snug line-clamp-2">{experience}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Free Time Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-3">
          <Label className="text-sm font-medium">Include Free Time</Label>
          <p className="text-xs text-muted-foreground leading-snug">
            Shortens some afternoon schedules — leaves room for wandering, rest, or spontaneous discovery
          </p>
        </div>
        <Switch
          checked={settings.includeFreeTime}
          onCheckedChange={(checked) => updateSetting("includeFreeTime", checked)}
        />
      </div>

      {/* Update Button */}
      <Button
        onClick={onUpdate}
        disabled={isUpdating}
        className="w-full gradient-sunset text-primary-foreground border-0 gap-2"
      >
        {isUpdating ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Updating...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            {updateButtonLabel}
          </>
        )}
      </Button>
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 lg:hidden shadow-sm">
            <Settings2 className="w-4 h-4" />
            Customize
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[340px] overflow-y-auto bg-card">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Customize Itinerary
            </SheetTitle>
            <SheetDescription>
              Adjust settings to regenerate your trip plan
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            {panelContent}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: Side panel content (wrapper handled by parent) */}
      <div className="hidden lg:block bg-card rounded-xl border border-border/50 p-5 shadow-sm">
        <h3 className="font-semibold mb-5 flex items-center gap-2.5 text-foreground">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Settings2 className="w-4 h-4 text-primary" />
          </div>
          Customize Trip
        </h3>
        {panelContent}
      </div>
    </>
  );
};
