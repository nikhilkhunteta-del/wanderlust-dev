import { Activity } from "@/types/itinerary";
import { MapPin, Utensils, Camera, Mountain, Sparkles, ShoppingBag, Moon, Clock } from "lucide-react";

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
    <div className="flex gap-3 py-3">
      <div className="flex-shrink-0 w-16 text-xs text-muted-foreground font-medium flex items-start gap-1 pt-0.5">
        <Clock className="w-3 h-3" />
        {activity.time}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground leading-tight">
              {activity.title}
              {activity.isMustDo && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
                  Must-do
                </span>
              )}
            </h4>
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
              {activity.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
