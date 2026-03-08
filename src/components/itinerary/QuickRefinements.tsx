import { Leaf, Utensils, Landmark, Moon, Loader2 } from "lucide-react";

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
  { label: "Add rest", icon: Moon, adjustment: "Reduce activities and add more rest time, cafe stops, and leisurely moments" },
];

export const QuickRefinements = ({ dayNumber, onRefineDay, isRefining, refiningDay }: QuickRefinementsProps) => {
  const isThisDayRefining = isRefining && refiningDay === dayNumber;

  return (
    <div className="pt-3 mt-3 border-t border-border/40">
      <p className="text-[11px] text-muted-foreground/60 mb-2">Adjust this day:</p>
      <div className="flex items-center gap-2 flex-wrap">
        {refinements.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.label}
              onClick={() => onRefineDay(dayNumber, r.adjustment)}
              disabled={isRefining}
              className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground rounded-full px-3 py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#F3F4F6' }}
              onMouseEnter={(e) => { (e.currentTarget.style.backgroundColor = '#E5E7EB'); }}
              onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = '#F3F4F6'); }}
            >
              {isThisDayRefining ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
