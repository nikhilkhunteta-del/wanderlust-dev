import { SeasonalHighlight, SeasonalCategory } from "@/types/seasonalHighlights";
import { UnsplashImageDisplay } from "@/components/shared/UnsplashImage";
import { Button } from "@/components/ui/button";
import { ExternalLink, Search, Calendar, Sparkles, Leaf, Utensils, Church, Music, Star } from "lucide-react";

interface SeasonalEventCardProps {
  highlight: SeasonalHighlight;
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
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  },
};

export const SeasonalEventCard = ({ highlight }: SeasonalEventCardProps) => {
  const category = categoryConfig[highlight.category] || categoryConfig.other;

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <UnsplashImageDisplay
          query={highlight.imageQuery}
          alt={highlight.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          showAttribution
        />
        <div className="absolute top-3 left-3 z-10">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${category.color}`}>
            {category.icon}
            {category.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start gap-2 mb-2">
          <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <span className="text-sm text-muted-foreground">{highlight.timing}</span>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {highlight.title}
        </h3>

        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">
          {highlight.description}
        </p>

        {/* Links */}
        <div className="flex flex-wrap gap-2">
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
