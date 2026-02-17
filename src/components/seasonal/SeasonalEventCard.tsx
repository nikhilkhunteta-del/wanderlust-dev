import { SeasonalItem, SeasonalCategory, SeasonalConfidence } from "@/types/seasonalHighlights";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, Sparkles, Leaf, Utensils, Music, Star, Trophy, CheckCircle2, HelpCircle } from "lucide-react";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface SeasonalEventCardProps {
  item: SeasonalItem;
  city: string;
  country: string;
}

const categoryConfig: Record<SeasonalCategory, { label: string; icon: React.ReactNode; color: string }> = {
  festival: {
    label: "Festival",
    icon: <Sparkles className="w-3 h-3" />,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
  cultural: {
    label: "Cultural",
    icon: <Star className="w-3 h-3" />,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  seasonal_nature: {
    label: "Nature",
    icon: <Leaf className="w-3 h-3" />,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  },
  seasonal_food: {
    label: "Food",
    icon: <Utensils className="w-3 h-3" />,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  },
  sports: {
    label: "Sports",
    icon: <Trophy className="w-3 h-3" />,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  other: {
    label: "Experience",
    icon: <Star className="w-3 h-3" />,
    color: "bg-muted text-muted-foreground",
  },
};

const confidenceConfig: Record<SeasonalConfidence, { label: string; icon: React.ReactNode; className: string }> = {
  high: {
    label: "Verified",
    icon: <CheckCircle2 className="w-3 h-3" />,
    className: "text-green-600 dark:text-green-400",
  },
  medium: {
    label: "Likely",
    icon: <HelpCircle className="w-3 h-3" />,
    className: "text-amber-600 dark:text-amber-400",
  },
  low: {
    label: "Unconfirmed",
    icon: <HelpCircle className="w-3 h-3" />,
    className: "text-muted-foreground",
  },
};

export const SeasonalEventCard = ({ item, city, country }: SeasonalEventCardProps) => {
  const category = categoryConfig[item.category] || categoryConfig.other;
  const confidence = confidenceConfig[item.confidence] || confidenceConfig.low;

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col border border-border/40">
      {/* Image */}
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
        {/* Badges overlay */}
        <div className="absolute top-3 left-3 z-10 flex flex-wrap gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${category.color}`}>
            {category.icon}
            {category.label}
          </span>
          {item.confidence === "high" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Timing */}
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

        {/* Source link */}
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
          <span className={`inline-flex items-center gap-1 text-xs ${confidence.className}`}>
            {confidence.icon}
            {confidence.label}
          </span>
        </div>
      </div>
    </article>
  );
};
