import { SeasonalItem } from "@/types/seasonalHighlights";
import { ExternalLink, Calendar, CheckCircle2 } from "lucide-react";

interface CompactEventItemProps {
  item: SeasonalItem;
}

export const CompactEventItem = ({ item }: CompactEventItemProps) => {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/30 last:border-b-0">
      <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
          {item.verified && (
            <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{item.date_range}</p>
      </div>
      <a
        href={item.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
      >
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
};
