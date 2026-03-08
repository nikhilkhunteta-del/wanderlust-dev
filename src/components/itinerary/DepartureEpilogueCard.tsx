import { MultiCityDay } from "@/types/multiCity";
import { Plane } from "lucide-react";

interface DepartureEpilogueCardProps {
  day: MultiCityDay;
  city: string;
}

export const DepartureEpilogueCard = ({ day, city }: DepartureEpilogueCardProps) => {
  const activities = day.slots?.flatMap((s) => s.activities) || [];

  return (
    <div className="rounded-xl border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30 bg-muted/20">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Plane className="w-4.5 h-4.5 text-primary" />
        </div>
        <div>
          <h4 className="font-display font-semibold text-base text-foreground">
            Departure Day — {city}
          </h4>
          <p className="text-xs text-muted-foreground">
            Day {day.dayNumber} · Return to {city} for your flight
          </p>
        </div>
      </div>

      {/* Activities by period */}
      <div className="px-5 py-4 space-y-3">
        {day.slots?.map((slot) => (
          <div key={slot.period}>
            {slot.activities.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider capitalize">
                  {slot.period}
                </span>
                {slot.activities.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pl-2">
                    <span className="text-xs text-muted-foreground/60 min-w-[60px] pt-0.5">
                      {activity.time}
                    </span>
                    <div>
                      <p className="text-sm text-foreground">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Tip from transition */}
        {day.theme && (
          <p className="text-xs text-muted-foreground/70 italic border-l-2 border-primary/15 pl-3 mt-3">
            {day.theme}
          </p>
        )}
      </div>
    </div>
  );
};
