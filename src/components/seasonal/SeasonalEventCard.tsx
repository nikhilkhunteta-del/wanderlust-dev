import { SeasonalHighlight } from "@/types/seasonalHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { MapPin } from "lucide-react";

interface SeasonalEventCardProps {
  highlight: SeasonalHighlight;
  city: string;
  country: string;
}

export const SeasonalEventCard = ({ highlight, city, country }: SeasonalEventCardProps) => {
  // Merge whySeasonal insight into description as a final sentence
  const description = highlight.whySeasonal
    ? `${highlight.description.replace(/\.\s*$/, '')}. ${highlight.whySeasonal.replace(/\.\s*$/, '')}.`
    : highlight.description;

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Image */}
      <div className="aspect-[3/2] overflow-hidden">
        <ResolvedImage
          request={{ type: 'seasonal', city, country, entityName: highlight.title }}
          alt={highlight.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          showAttribution
          fallbackCategory="cultural"
        />
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          {highlight.title}
        </h3>

        {/* Date + location */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3 text-sm text-muted-foreground">
          <span>{highlight.timing}</span>
          {highlight.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {highlight.location}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>
    </article>
  );
};

/* Hero variant — full-width with text overlay */
interface SeasonalHeroCardProps {
  highlight: SeasonalHighlight;
  city: string;
  country: string;
}

export const SeasonalHeroCard = ({ highlight, city, country }: SeasonalHeroCardProps) => {
  const description = highlight.whySeasonal
    ? `${highlight.description.replace(/\.\s*$/, '')}. ${highlight.whySeasonal.replace(/\.\s*$/, '')}.`
    : highlight.description;

  return (
    <article className="relative w-full overflow-hidden rounded-xl" style={{ height: '50vh', minHeight: 320 }}>
      <ResolvedImage
        request={{ type: 'seasonal', city, country, entityName: highlight.title }}
        alt={highlight.title}
        className="absolute inset-0 w-full h-full"
        showAttribution
        fallbackCategory="cultural"
      />
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      {/* Text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <span
          className="block mb-2 text-white/70"
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}
        >
          {highlight.timing}
        </span>
        <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-2">
          {highlight.title}
        </h3>
        {highlight.location && (
          <div className="flex items-center gap-1.5 mb-3">
            <MapPin className="w-4 h-4 text-white/70 flex-shrink-0" />
            <span className="text-sm text-white/80">{highlight.location}</span>
          </div>
        )}
        <p className="text-sm text-white/80 leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>
    </article>
  );
};
