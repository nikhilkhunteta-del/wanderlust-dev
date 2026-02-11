import { ExtensionSuggestion } from "@/types/itinerary";
import { PlusCircle, Sparkles } from "lucide-react";

interface ExtensionSectionProps {
  suggestions: ExtensionSuggestion[];
}

export const ExtensionSection = ({ suggestions }: ExtensionSectionProps) => {
  if (!suggestions || suggestions.length === 0) return null;

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
          </article>
        ))}
      </div>
    </div>
  );
};
