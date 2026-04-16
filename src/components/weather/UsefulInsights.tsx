import { UsefulInsight } from "@/types/weather";

interface UsefulInsightsProps {
  insights: UsefulInsight[];
}

export const UsefulInsights = ({ insights }: UsefulInsightsProps) => {
  if (!insights || insights.length === 0) return null;
  const cards = insights.slice(0, 6);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold tracking-tight">Useful insights for your trip</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 auto-rows-fr">
        {cards.map((insight, i) => {
          const isFirst = i === 0;
          return (
            <div
              key={i}
              className="bg-card rounded-xl border border-border/50 p-6 h-full"
              style={{ borderWidth: "0.5px" }}
            >
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider mb-3 ${
                  isFirst ? "text-primary/80" : "text-muted-foreground"
                }`}
              >
                {insight.label}
              </p>
              <p
                className="text-[16px] text-foreground"
                style={{ lineHeight: 1.6 }}
              >
                {insight.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
