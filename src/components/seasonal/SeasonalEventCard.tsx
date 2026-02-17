import { SeasonalHighlight, SeasonalCategory, SeasonalUrgency } from "@/types/seasonalHighlights";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Calendar, Sparkles, Leaf, Utensils, Church, Music, Star, Clock, Flame } from "lucide-react";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface SeasonalEventCardProps {
  highlight: SeasonalHighlight;
  city: string;
  country: string;
}

const categoryConfig: Record<SeasonalCategory, { label: string; icon: React.ReactNode; color: string }> = {
  cultural: { 
    label: "Cultural", 
    icon: <Sparkles className="w-3 h-3" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
  },
  natural: { 
    label: "Natural", 
    icon: <Leaf className="w-3 h-3" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
  },
  food: { 
    label: "Food", 
    icon: <Utensils className="w-3 h-3" />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
  },
  religious: { 
    label: "Religious", 
    icon: <Church className="w-3 h-3" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
  },
  music: { 
    label: "Music", 
    icon: <Music className="w-3 h-3" />,
    color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
  },
  other: { 
    label: "Experience", 
    icon: <Star className="w-3 h-3" />,
    color: "bg-muted text-muted-foreground"
  },
};

const urgencyConfig: Record<NonNullable<SeasonalUrgency>, { label: string; icon: React.ReactNode }> = {
  only_this_month: {
    label: "Only this month",
    icon: <Flame className="w-3 h-3" />,
  },
  best_this_month: {
    label: "Best this month",
    icon: <Star className="w-3 h-3" />,
  },
  short_window: {
    label: "Short seasonal window",
    icon: <Clock className="w-3 h-3" />,
  },
};

export const SeasonalEventCard = ({ highlight, city, country }: SeasonalEventCardProps) => {
  const category = categoryConfig[highlight.category] || categoryConfig.other;
  const urgency = highlight.urgency ? urgencyConfig[highlight.urgency] : null;

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col border border-border/40">
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <ResolvedImage
          request={{
            type: 'seasonal',
            city,
            country,
            entityName: highlight.title,
          }}
          alt={highlight.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          showAttribution
          fallbackCategory="cultural"
        />
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${category.color}`}>
            {category.icon}
            {category.label}
          </span>
          {urgency && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {urgency.icon}
              {urgency.label}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Timing */}
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-primary/70 flex-shrink-0" />
          <span className="text-sm font-medium text-primary/80">{highlight.timing}</span>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1.5">
          {highlight.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {highlight.description}
        </p>

        {/* Why seasonal callout */}
        {highlight.whySeasonal && (
          <div className="bg-accent/50 rounded-lg px-3 py-2 mb-4 flex-1">
            <p className="text-xs text-accent-foreground/80 italic leading-relaxed">
              <Sparkles className="w-3 h-3 inline mr-1 text-primary/60" />
              {highlight.whySeasonal}
            </p>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2 mt-auto">
          {highlight.wikipediaUrl && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => window.open(highlight.wikipediaUrl!, "_blank")}
            >
              <ExternalLink className="w-3 h-3" />
              Wikipedia
            </Button>
          )}
          {highlight.officialUrl && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => window.open(highlight.officialUrl!, "_blank")}
            >
              <ExternalLink className="w-3 h-3" />
              Official Site
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => window.open(highlight.googleSearchUrl, "_blank")}
          >
            <Search className="w-3 h-3" />
            Search
          </Button>
        </div>
      </div>
    </article>
  );
};
