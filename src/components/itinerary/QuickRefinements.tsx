import { Leaf, Utensils, Landmark, Coffee, Loader2 } from "lucide-react";

interface QuickRefinementsProps {
  dayNumber: number;
  onRefineDay: (dayNumber: number, adjustment: string) => void;
  isRefining: boolean;
  refiningDay: number | null;
}

const refinements = [
  { label: "More nature", icon: Leaf, adjustment: "Add more nature, parks, and outdoor activities" },
  { label: "More food", icon: Utensils, adjustment: "Add more food experiences, tastings, and restaurant discoveries" },
  { label: "More culture", icon: Landmark, adjustment: "Add more cultural sites, museums, and historical experiences" },
  { label: "Add rest", icon: Coffee, adjustment: "Reduce activities and add more rest time, cafe stops, and leisurely moments" },
];

export const QuickRefinements = ({ dayNumber, onRefineDay, isRefining, refiningDay }: QuickRefinementsProps) => {
  const isThisDayRefining = isRefining && refiningDay === dayNumber;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {refinements.map((r) => {
        const Icon = r.icon;
        return (
          <button
            key={r.label}
            onClick={() => onRefineDay(dayNumber, r.adjustment)}
            disabled={isRefining}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary bg-muted/40 hover:bg-primary/5 border border-transparent hover:border-primary/20 px-2.5 py-1 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isThisDayRefining ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {r.label}
          </button>
        );
      })}
    </div>
  );
};
