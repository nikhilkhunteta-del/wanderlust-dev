import { StayInsight } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Coins, Users, Building2, Info } from "lucide-react";
import { stripMarkdown } from "@/lib/stripMarkdown";

interface PracticalStayInsightsProps {
  insights: StayInsight[];
}

const iconMap = {
  calendar: Calendar,
  coins: Coins,
  users: Users,
  building: Building2,
  info: Info,
};

export const PracticalStayInsights = ({ insights }: PracticalStayInsightsProps) => {
  if (!insights || insights.length === 0) return null;

  // Fix lonely card: if odd number, use full-width for last card
  const isOdd = insights.length % 2 !== 0;

  return (
    <section>
      <h3 className="text-lg font-semibold text-foreground mb-4">Practical Stay Tips</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const IconComponent = iconMap[insight.icon] || Info;
          const isLastAndAlone = isOdd && index === insights.length - 1;
          return (
            <Card
              key={index}
              className={`bg-card/50 border-border/50 ${isLastAndAlone ? "sm:col-span-2" : ""}`}
            >
              <CardContent className="p-4 flex gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <IconComponent className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm text-foreground mb-1">
                    {stripMarkdown(insight.title)}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {stripMarkdown(insight.description)}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
