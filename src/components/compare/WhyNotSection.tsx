import { CityScores, CITY_COLORS } from "@/types/comparison";

interface WhyNotSectionProps {
  ranked: CityScores[];
  whyNot: { city: string; reason: string }[] | null;
}

export const WhyNotSection = ({ ranked, whyNot }: WhyNotSectionProps) => {
  // Only show for cities ranked 2nd and 3rd
  const others = ranked.slice(1);

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-foreground">Why not?</h3>
      <div className="space-y-3">
        {others.map((cs, i) => {
          const whyNotEntry = whyNot?.find((w) => w.city === cs.city.city);
          // Find original index in the unsorted list to get the right color
          const colorIdx = i + 1; // 2nd and 3rd cities

          return (
            <div
              key={cs.city.city}
              className="rounded-lg border border-border/50 px-4 py-3 flex items-start gap-3"
              style={{ borderLeftWidth: "3px", borderLeftColor: CITY_COLORS[colorIdx] }}
            >
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">{cs.city.city}</span>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {whyNotEntry?.reason ||
                    `Scored ${cs.weightedTotal.toFixed(1)}/10 — a strong option but edges were found in other areas.`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
