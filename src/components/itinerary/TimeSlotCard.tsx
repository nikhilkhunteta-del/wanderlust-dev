import { TimeSlot as TimeSlotType } from "@/types/itinerary";
import { ActivityItem } from "./ActivityItem";
import { Sun, CloudSun, Moon } from "lucide-react";

interface TimeSlotProps {
  slot: TimeSlotType;
}

const periodConfig = {
  morning: {
    label: "Morning",
    icon: <Sun className="w-4 h-4" />,
    bg: "bg-amber-50 dark:bg-amber-950/20",
    border: "border-amber-200 dark:border-amber-800",
  },
  afternoon: {
    label: "Afternoon",
    icon: <CloudSun className="w-4 h-4" />,
    bg: "bg-sky-50 dark:bg-sky-950/20",
    border: "border-sky-200 dark:border-sky-800",
  },
  evening: {
    label: "Evening",
    icon: <Moon className="w-4 h-4" />,
    bg: "bg-indigo-50 dark:bg-indigo-950/20",
    border: "border-indigo-200 dark:border-indigo-800",
  },
};

export const TimeSlotCard = ({ slot }: TimeSlotProps) => {
  const config = periodConfig[slot.period];

  return (
    <div className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground/80">
        {config.icon}
        {config.label}
      </div>
      <div className="divide-y divide-border/50">
        {slot.activities.map((activity, index) => (
          <ActivityItem key={index} activity={activity} />
        ))}
      </div>
    </div>
  );
};
