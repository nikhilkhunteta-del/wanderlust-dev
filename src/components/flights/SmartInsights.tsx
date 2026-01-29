import { SmartInsight } from "@/types/flightInsights";
import { Plane, Clock, Calendar, Map, Lightbulb } from "lucide-react";

interface SmartInsightsProps {
  insights: SmartInsight[];
}

const iconMap = {
  plane: Plane,
  clock: Clock,
  calendar: Calendar,
  map: Map,
  lightbulb: Lightbulb,
};

export const SmartInsights = ({ insights }: SmartInsightsProps) => {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <section>
      <h3 className="font-semibold text-foreground mb-4">Smart Flying Insights</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = iconMap[insight.icon] || Lightbulb;
          return (
            <div
              key={index}
              className="bg-muted/30 rounded-lg p-4 border border-border/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
