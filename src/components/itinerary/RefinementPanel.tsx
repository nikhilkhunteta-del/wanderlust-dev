import {
  ItinerarySettings,
  TripStyle,
  BudgetLevel,
  DiningPreference,
} from "@/types/itinerary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Settings2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface RefinementPanelProps {
  settings: ItinerarySettings;
  onSettingsChange: (settings: ItinerarySettings) => void;
  onUpdate: () => void;
  isUpdating: boolean;
  interests: string[];
  highlightExperiences: string[];
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

const diningOptions: { value: DiningPreference; label: string }[] = [
  { value: "local-street", label: "Street Food" },
  { value: "casual", label: "Casual" },
  { value: "fine-dining", label: "Fine Dining" },
  { value: "mixed", label: "Mixed" },
];

export const RefinementPanel = ({
  settings,
  onSettingsChange,
  onUpdate,
  isUpdating,
  interests,
  highlightExperiences,
}: RefinementPanelProps) => {
  const updateSetting = <K extends keyof ItinerarySettings>(
    key: K,
    value: ItinerarySettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const toggleMustDo = (experience: string) => {
    const current = settings.mustDoExperiences;
    const updated = current.includes(experience)
      ? current.filter((e) => e !== experience)
      : [...current, experience];
    updateSetting("mustDoExperiences", updated);
  };

  const focusIndex = interests.indexOf(settings.focusInterest);
  const sliderValue = focusIndex >= 0 ? focusIndex : 0;

  const PanelContent = () => (
    <div className="space-y-6">
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

      {/* Focus Interest */}
      {interests.length > 1 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Emphasize: {settings.focusInterest || interests[0] || "All interests"}
          </Label>
          <Slider
            value={[sliderValue]}
            min={0}
            max={interests.length - 1}
            step={1}
            onValueChange={([value]) => updateSetting("focusInterest", interests[value])}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            {interests.slice(0, 3).map((interest) => (
              <span key={interest} className="capitalize">{interest}</span>
            ))}
          </div>
        </div>
      )}

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

      {/* Dining Preference */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Dining Style</Label>
        <div className="grid grid-cols-2 gap-2">
          {diningOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => updateSetting("diningPreference", option.value)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
                settings.diningPreference === option.value
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-primary/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Must-Do Experiences */}
      {highlightExperiences.length > 0 && (
        <div>
          <Label className="text-sm font-medium mb-3 block">Must-Do Experiences</Label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {highlightExperiences.map((experience) => (
              <label
                key={experience}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <Checkbox
                  checked={settings.mustDoExperiences.includes(experience)}
                  onCheckedChange={() => toggleMustDo(experience)}
                />
                <span className="truncate">{experience}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Free Time Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-sm font-medium">Include Free Time</Label>
          <p className="text-xs text-muted-foreground">
            Add unplanned exploration time
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
            Update Itinerary
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
            <PanelContent />
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
        <PanelContent />
      </div>
    </>
  );
};
