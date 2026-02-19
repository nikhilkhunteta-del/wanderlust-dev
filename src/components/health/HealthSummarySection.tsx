interface HealthSummarySectionProps {
  summary: string;
  hasActiveAlerts: boolean;
}

export const HealthSummarySection = ({ summary, hasActiveAlerts }: HealthSummarySectionProps) => {
  if (!summary) return null;

  if (hasActiveAlerts) {
    return (
      <section>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="border-l-[3px] border-emerald-500 pl-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      </div>
    </section>
  );
};
