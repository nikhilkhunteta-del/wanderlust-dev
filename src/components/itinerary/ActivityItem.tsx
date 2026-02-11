import { Activity } from "@/types/itinerary";
import { MapPin, Utensils, Camera, Mountain, Sparkles, ShoppingBag, Moon, Clock, Star, Leaf } from "lucide-react";

interface ActivityItemProps {
  activity: Activity;
}

const categoryIcons: Record<string, React.ReactNode> = {
  culture: <Camera className="w-4 h-4" />,
  nature: <Mountain className="w-4 h-4" />,
  food: <Utensils className="w-4 h-4" />,
  adventure: <Sparkles className="w-4 h-4" />,
  relaxation: <Sparkles className="w-4 h-4" />,
  shopping: <ShoppingBag className="w-4 h-4" />,
  nightlife: <Moon className="w-4 h-4" />,
};

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const icon = categoryIcons[activity.category] || <MapPin className="w-4 h-4" />;

  return (
    <div className="flex gap-3 py-3 group hover:bg-background/50 rounded-lg px-2 -mx-2 transition-colors">
      <div className="flex-shrink-0 w-16 text-xs text-muted-foreground font-medium flex items-start gap-1.5 pt-1">
        <Clock className="w-3 h-3" />
        {activity.time}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2.5">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-background border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 flex items-center justify-center transition-colors shadow-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-foreground leading-tight group-hover:text-primary transition-colors">
                {activity.title}
              </h4>
              {activity.isMustDo && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md border border-primary/20">
                  <Star className="w-3 h-3 fill-primary" />
                  Must-do
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {activity.description}
            </p>
            {activity.location && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
                <MapPin className="w-2.5 h-2.5" />
                {activity.location}
              </span>
            )}
            {activity.seasonalNote && (
              <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 mt-1 bg-amber-500/5 px-2 py-0.5 rounded-full">
                <Leaf className="w-2.5 h-2.5" />
                {activity.seasonalNote}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
