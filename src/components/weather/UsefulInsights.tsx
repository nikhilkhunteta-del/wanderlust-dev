import { UsefulInsight } from "@/types/weather";

interface UsefulInsightsProps {
  insights: UsefulInsight[];
}

export const UsefulInsights = ({ insights }: UsefulInsightsProps) => {
  if (!insights || insights.length === 0) return null;
  const rows = insights.slice(0, 6);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-semibold tracking-tight">Useful insights for your trip</h3>
      <div className="border-t border-border/60">
        {rows.map((insight, i) => {
          const isFirst = i === 0;
          return (
            <div key={i} className="py-6 border-b border-border/60">
              <p
                className={`text-[11px] font-semibold uppercase tracking-wider mb-2 ${
                  isFirst ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {insight.label}
              </p>
              <p className="text-[16px] text-foreground leading-relaxed">
                {insight.body}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
