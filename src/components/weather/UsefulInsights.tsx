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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((insight, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card/60 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70 mb-2">
              {insight.label}
            </p>
            <p className="text-[15px] text-foreground leading-relaxed">{insight.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
