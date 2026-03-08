import { CityScores, CITY_COLORS } from "@/types/comparison";

interface WhyNotSectionProps {
  ranked: CityScores[];
  whyNot: { city: string; reason: string }[] | null;
}

export const WhyNotSection = ({ ranked, whyNot }: WhyNotSectionProps) => {
  const others = ranked.slice(1);
  const runner = others[0];
  const third = others[1];

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-lg font-semibold text-foreground">The honest trade-offs</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Why {runner?.city.city} and {third?.city.city} didn't top the list for your trip.
        </p>
      </div>
      <div className="space-y-3">
        {others.map((cs, i) => {
          const whyNotEntry = whyNot?.find((w) => w.city === cs.city.city);
          const colorIdx = i + 1;

          return (
            <div
              key={cs.city.city}
              className="rounded-lg border border-border/50 px-4 py-3"
              style={{ borderLeftWidth: "3px", borderLeftColor: CITY_COLORS[colorIdx] }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: CITY_COLORS[colorIdx] }}
              >
                {cs.city.city}
              </span>
              <p className="text-sm text-muted-foreground mt-0.5">
                {whyNotEntry?.reason ||
                  `Scored ${cs.weightedTotal.toFixed(1)}/10 — a strong option but edges were found in other areas.`}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
