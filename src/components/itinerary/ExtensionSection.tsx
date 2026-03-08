import { useState } from "react";
import { ExtensionSuggestion } from "@/types/itinerary";
import { PlusCircle, Sparkles, ArrowRight, RefreshCw, Info } from "lucide-react";

interface ExtensionSectionProps {
  suggestions: ExtensionSuggestion[];
  tripDuration: number;
  totalDays: number;
  onAddDay: (suggestion: ExtensionSuggestion) => void;
  onSwapDay: (suggestion: ExtensionSuggestion, dayNumber: number) => void;
}

export const ExtensionSection = ({
  suggestions,
  tripDuration,
  totalDays,
  onAddDay,
  onSwapDay,
}: ExtensionSectionProps) => {
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);

  if (!suggestions || suggestions.length === 0) return null;

  const newDayNum = totalDays + 1;
  const wouldExceedDuration = newDayNum > tripDuration;

  return (
    <div className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-xl p-5 md:p-6 border border-violet-500/20">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2.5 mb-4 text-violet-700 dark:text-violet-400">
        <div className="p-1.5 rounded-lg bg-violet-500/10">
          <PlusCircle className="w-4 h-4" />
        </div>
        If You Had One More Day
      </h3>
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <article
            key={index}
            className="bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 hover:border-violet-500/30 transition-colors"
          >
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              {suggestion.title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {suggestion.description}
            </p>
            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              {suggestion.highlights.map((highlight) => (
                <span
                  key={highlight}
                  className="text-xs bg-violet-500/10 text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full"
                >
                  {highlight}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onAddDay(suggestion)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-700 dark:text-violet-400 hover:text-violet-900 dark:hover:text-violet-300 transition-colors"
                >
                  Add as Day {newDayNum}
                  <ArrowRight className="w-3 h-3" />
                </button>
                <span className="text-border/40">·</span>
                <button
                  onClick={() =>
                    setSwappingIndex(swappingIndex === index ? null : index)
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Swap with a day
                </button>
              </div>

              {/* Swap day picker */}
              {swappingIndex === index && (
                <div className="flex items-center gap-1.5 flex-wrap animate-fade-in">
                  <span className="text-xs text-muted-foreground mr-1">Replace:</span>
                  {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        onSwapDay(suggestion, d);
                        setSwappingIndex(null);
                      }}
                      className="w-7 h-7 rounded-full text-[11px] font-bold bg-muted/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}

              {/* Duration warning */}
              {wouldExceedDuration && (
                <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60 mt-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  This would extend your trip to {newDayNum} days — update your travel dates to include it.
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
