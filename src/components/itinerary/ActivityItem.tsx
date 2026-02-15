import { Activity } from "@/types/itinerary";
import { MapPin, Utensils, Camera, Mountain, Sparkles, ShoppingBag, Moon, Clock, Star, Leaf, ExternalLink } from "lucide-react";
import { getYourGuideSearchUrl, shouldShowTourLink } from "@/lib/getYourGuideLinks";

interface ActivityItemProps {
  activity: Activity;
  city?: string;
  country?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  culture: <Camera className="w-3.5 h-3.5" />,
  nature: <Mountain className="w-3.5 h-3.5" />,
  food: <Utensils className="w-3.5 h-3.5" />,
  adventure: <Sparkles className="w-3.5 h-3.5" />,
  relaxation: <Sparkles className="w-3.5 h-3.5" />,
  shopping: <ShoppingBag className="w-3.5 h-3.5" />,
  nightlife: <Moon className="w-3.5 h-3.5" />,
};

export const ActivityItem = ({ activity, city, country }: ActivityItemProps) => {
  const icon = categoryIcons[activity.category] || <MapPin className="w-3.5 h-3.5" />;
  const showTourLink = city && shouldShowTourLink(activity.title);

  return (
    <div className="flex gap-3 py-2.5 group">
      {/* Time */}
      <div className="flex-shrink-0 w-14 text-[11px] text-muted-foreground/60 font-medium pt-1.5">
        {activity.time}
      </div>

      {/* Icon dot */}
      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted/50 border border-border/30 text-muted-foreground/60 group-hover:text-primary/70 group-hover:border-primary/20 flex items-center justify-center transition-colors">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Title — strong */}
          <h4 className="font-medium text-sm text-foreground leading-tight">
            {activity.title}
          </h4>
          {activity.isMustDo && (
            <span className="inline-flex items-center gap-0.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-semibold">
              <Star className="w-2.5 h-2.5 fill-primary" />
              Highlight
            </span>
          )}
        </div>
        {/* Description — subtle */}
        <p className="text-xs text-muted-foreground/60 mt-0.5 leading-relaxed line-clamp-2">
          {activity.description}
        </p>
        {/* Meta — very subtle */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {activity.location && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40">
              <MapPin className="w-2 h-2" />
              {activity.location}
            </span>
          )}
          {activity.seasonalNote && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-600/70 dark:text-amber-400/70">
              <Leaf className="w-2 h-2" />
              {activity.seasonalNote}
            </span>
          )}
          {showTourLink && (
            <a
              href={getYourGuideSearchUrl(activity.title, city!, country)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/40 hover:text-primary transition-colors"
            >
              Check availability
              <ExternalLink className="w-2 h-2" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
