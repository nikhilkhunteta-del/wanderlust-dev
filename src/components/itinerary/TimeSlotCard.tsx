import { TimeSlot as TimeSlotType, Activity } from "@/types/itinerary";
import { ActivityItem } from "./ActivityItem";
import { Sunrise, Sun, Moon, ArrowRight } from "lucide-react";

interface TimeSlotProps {
  slot: TimeSlotType;
  city?: string;
  country?: string;
  dayTheme?: string;
  travelMonth?: string;
  userInterests?: string[];
  lockedActivities?: Set<string>;
  onToggleLock?: (activityTitle: string) => void;
  onReplaceActivity?: (period: string, activityIndex: number, newActivity: Activity) => void;
}

const periodConfig = {
  morning: {
    label: "Morning",
    Icon: Sunrise,
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200/50 dark:border-amber-800/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  afternoon: {
    label: "Afternoon",
    Icon: Sun,
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    borderColor: "border-sky-200/50 dark:border-sky-800/30",
    iconBg: "bg-sky-100 dark:bg-sky-900/50",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  evening: {
    label: "Evening",
    Icon: Moon,
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-violet-200/50 dark:border-violet-800/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
};

export const TimeSlotCard = ({
  slot,
  city,
  country,
  dayTheme,
  travelMonth,
  userInterests,
  lockedActivities,
  onToggleLock,
  onReplaceActivity,
}: TimeSlotProps) => {
  const config = periodConfig[slot.period];
  const { Icon } = config;

  return (
    <div className={`rounded-lg border ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-1.5 rounded-md ${config.iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
        </div>
        <span className="text-sm font-medium text-foreground">{config.label}</span>
      </div>
      <div className="space-y-0">
        {slot.activities.map((activity, index) => (
          <div key={`${activity.title}-${index}`}>
            <ActivityItem
              activity={activity}
              city={city}
              country={country}
              dayTheme={dayTheme}
              period={slot.period}
              travelMonth={travelMonth}
              userInterests={userInterests}
              isLocked={lockedActivities?.has(activity.title)}
              onToggleLock={onToggleLock ? () => onToggleLock(activity.title) : undefined}
              onReplaceActivity={
                onReplaceActivity
                  ? (newAct) => onReplaceActivity(slot.period, index, newAct)
                  : undefined
              }
            />
            {/* Transition line */}
            {activity.transitTo && index < slot.activities.length - 1 && (
              <TransitionLine text={activity.transitTo} />
            )}
          </div>
        ))}
        {slot.activities.length === 0 && (
          <p className="text-sm text-muted-foreground italic flex items-center gap-2 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            Free time for exploration
          </p>
        )}
      </div>
    </div>
  );
};

function TransitionLine({ text }: { text: string }) {
  // Check if transition exceeds 30 min
  const minMatch = text.match(/(\d+)\s*min/);
  const minutes = minMatch ? parseInt(minMatch[1], 10) : 0;
  const isLong = minutes >= 30;

  return (
    <div className={`flex items-center gap-1.5 py-1 pl-[74px] text-[11px] ${isLong ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/40"}`}>
      <ArrowRight className="w-2.5 h-2.5 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}
