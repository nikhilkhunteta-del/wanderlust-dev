import { TimingInsight } from "@/types/flightInsights";
import { CalendarClock } from "lucide-react";

interface TimingInsightCardProps {
  insight: TimingInsight | null;
}

export const TimingInsightCard = ({ insight }: TimingInsightCardProps) => {
  if (!insight) {
    return null;
  }

  return (
    <div className="bg-muted/30 rounded-xl p-5 border border-border/30">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <CalendarClock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1">{insight.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
};
