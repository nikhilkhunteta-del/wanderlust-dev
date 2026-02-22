import { SeasonalHighlight, SeasonalCategory, SeasonalUrgency } from "@/types/seasonalHighlights";
import { ExternalLink, Calendar, Sparkles, Leaf, Utensils, Church, Music, Star, Clock, Flame, Trophy, MapPin, Heart, AlertCircle } from "lucide-react";
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
  sport: {
    label: "Sport",
    icon: <Trophy className="w-3 h-3" />,
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
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

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    // Return a readable name
    if (hostname.includes("wikipedia")) return "Wikipedia";
    if (hostname.includes("timeout")) return "Time Out";
    if (hostname.includes("lonelyplanet")) return "Lonely Planet";
    if (hostname.includes("tripadvisor")) return "TripAdvisor";
    // Capitalize first part
    const parts = hostname.split(".");
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return "Source";
  }
}

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
          {highlight.matchesInterests && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Heart className="w-3 h-3" />
              Matches your interests
            </span>
          )}
          {highlight.notToBeMissed && !highlight.matchesInterests && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
              <AlertCircle className="w-3 h-3" />
              Not to be missed
            </span>
          )}
        </div>
        {/* AI-generated label */}
        {highlight.isAiGenerated && (
          <div className="absolute top-3 right-3 z-10">
            <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-muted/80 text-muted-foreground backdrop-blur-sm">
              Seasonal insight
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Timing & Location */}
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-primary/70 flex-shrink-0" />
          <span className="text-sm font-medium text-primary/80">{highlight.timing}</span>
        </div>
        {highlight.location && (
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground">{highlight.location}</span>
          </div>
        )}

        <h3 className="text-lg font-semibold text-foreground mb-1.5">
          {highlight.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {highlight.description}
        </p>

        {/* Why seasonal callout */}
        {highlight.whySeasonal && (
          <div className="bg-accent/50 rounded-lg px-3 py-2 mb-2">
            <p className="text-xs text-accent-foreground/80 italic leading-relaxed">
              <Sparkles className="w-3 h-3 inline mr-1 text-primary/60" />
              {highlight.whySeasonal}
            </p>
          </div>
        )}

        {/* Miss note for time-sensitive events */}
        {highlight.missNote && (
          <p className="text-xs text-muted-foreground/70 italic mb-4">
            {highlight.missNote}
          </p>
        )}

        {/* Source link */}
        <div className="mt-auto pt-2">
          {highlight.sourceUrl ? (
            <a
              href={highlight.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Source: {highlight.sourceName || extractDomain(highlight.sourceUrl)} →
            </a>
          ) : highlight.wikipediaUrl ? (
            <a
              href={highlight.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Wikipedia →
            </a>
          ) : highlight.isAiGenerated ? (
            <span className="text-xs text-muted-foreground/60">Seasonal insight</span>
          ) : null}
        </div>
      </div>
    </article>
  );
};
