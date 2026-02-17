import { SeasonalItem } from "@/types/seasonalHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { ExternalLink, Calendar, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediumEventCardProps {
  item: SeasonalItem;
  city: string;
  country: string;
}

export const MediumEventCard = ({ item, city, country }: MediumEventCardProps) => {
  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col border border-border/40">
      <div className="relative aspect-[16/9] overflow-hidden">
        <ResolvedImage
          request={{
            type: "seasonal",
            city,
            country,
            entityName: item.title,
          }}
          alt={item.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          showAttribution
          fallbackCategory="cultural"
        />
        {item.verified && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100/90 text-green-800 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>
        )}
        {item.secondary_tags?.length > 0 && (
          <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1">
            {item.secondary_tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/40 text-white/90 backdrop-blur-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-primary/70 flex-shrink-0" />
          <span className="text-sm font-medium text-primary/80">{item.date_range}</span>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1.5">
          {item.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2 flex-1">
          {item.description}
        </p>

        {item.location && (
          <p className="text-xs text-muted-foreground mb-3">
            📍 {item.location}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(item.source_url, "_blank")}
          >
            <ExternalLink className="w-3 h-3" />
            {item.source_name}
          </Button>
          <span className="text-xs text-muted-foreground">
            Score: {item.impact_score}/10
          </span>
        </div>
      </div>
    </article>
  );
};
