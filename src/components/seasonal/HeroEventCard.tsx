import { SeasonalItem } from "@/types/seasonalHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { ExternalLink, CheckCircle2, Calendar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroEventCardProps {
  item: SeasonalItem;
  city: string;
  country: string;
}

export const HeroEventCard = ({ item, city, country }: HeroEventCardProps) => {
  return (
    <article className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border/30 bg-card">
      {/* Cinematic image */}
      <div className="relative aspect-[21/9] overflow-hidden">
        <ResolvedImage
          request={{
            type: "seasonal",
            city,
            country,
            entityName: item.title,
          }}
          alt={item.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-700"
          showAttribution
          fallbackCategory="cultural"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Impact badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-md">
            <Star className="w-3 h-3" />
            Trip-Defining
          </span>
        </div>

        {/* Verified badge */}
        {item.verified && (
          <div className="absolute top-4 right-4 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100/90 text-green-800 backdrop-blur-sm">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>
        )}

        {/* Bottom content over image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-white/80" />
            <span className="text-sm font-medium text-white/90">{item.date_range}</span>
          </div>
          <h3 className="font-display text-2xl md:text-3xl font-semibold text-white mb-2">
            {item.title}
          </h3>
          {item.secondary_tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {item.secondary_tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/20 text-white/90 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content below image */}
      <div className="p-6">
        <p className="text-foreground/80 leading-relaxed mb-3">
          {item.description}
        </p>

        {item.why_it_matters && (
          <div className="bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm font-medium text-primary/90">
              💡 Why this matters for your trip
            </p>
            <p className="text-sm text-foreground/70 mt-1">
              {item.why_it_matters}
            </p>
          </div>
        )}

        {item.location && (
          <p className="text-xs text-muted-foreground mb-3">
            📍 {item.location}
          </p>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/30">
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
            Impact: {item.impact_score}/10
          </span>
        </div>
      </div>
    </article>
  );
};
