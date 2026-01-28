import { ContextualInsight } from "@/types/healthNotices";
import { Wind, Mountain, Thermometer, Bug, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ContextualHealthInsightsProps {
  insights: ContextualInsight[];
}

const iconMap: Record<ContextualInsight["type"], React.ElementType> = {
  air_quality: Wind,
  altitude: Mountain,
  heat: Thermometer,
  mosquito: Bug,
  other: Info,
};

export const ContextualHealthInsights = ({
  insights,
}: ContextualHealthInsightsProps) => {
  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Seasonal & Environmental Considerations</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((insight, index) => {
          const Icon = iconMap[insight.type] || Info;
          return (
            <Card key={index} className="bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
