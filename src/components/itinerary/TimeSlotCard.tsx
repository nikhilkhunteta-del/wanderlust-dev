import { TimeSlot as TimeSlotType } from "@/types/itinerary";
import { ActivityItem } from "./ActivityItem";
import { Sunrise, Sun, Moon } from "lucide-react";

interface TimeSlotProps {
  slot: TimeSlotType;
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

export const TimeSlotCard = ({ slot }: TimeSlotProps) => {
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
      <div className="space-y-1">
        {slot.activities.map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
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
