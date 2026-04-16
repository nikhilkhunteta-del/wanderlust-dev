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
            <div
              key={i}
              className="grid grid-cols-[140px_1fr] border-b border-border/60"
            >
              <div className="bg-muted/40 px-4 py-5 flex flex-col justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {insight.label}
                </p>
                <p
                  className={`mt-1 text-2xl font-semibold leading-tight ${
                    isFirst ? "text-primary" : "text-foreground"
                  }`}
                >
                  {insight.stat}
                </p>
              </div>
              <div className="px-5 py-5 flex items-center">
                <p className="text-[15px] text-muted-foreground leading-relaxed">
                  {insight.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
