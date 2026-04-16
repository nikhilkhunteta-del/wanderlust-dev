import { CityWeather } from "@/types/weather";
import { formatMonthName } from "@/lib/formatMonth";

interface UsefulInsightsProps {
  weather: CityWeather;
  month: string;
  primaryInterest?: string;
}

interface InsightCard {
  title: string;
  body: string;
  priority: number; // lower = earlier
}

export const UsefulInsights = ({ weather, month, primaryInterest }: UsefulInsightsProps) => {
  const displayMonth = formatMonthName(month);
  const isActive = primaryInterest === "active-sport" || primaryInterest === "nature-outdoors";

  const cards: InsightCard[] = [];

  // Activity timing (from chartSummary explanation / sensory) — highest priority for active users
  if (weather.chartSummary?.outdoorComfortExplanation) {
    cards.push({
      title: "Best time of day for activity",
      body: weather.chartSummary.outdoorComfortExplanation.replace(/^What drives this score:\s*/i, ""),
      priority: isActive ? 0 : 3,
    });
  }

  // Best week to visit
  if (weather.chartSummary?.planningNote) {
    cards.push({
      title: "Best week within the month",
      body: weather.chartSummary.planningNote,
      priority: 1,
    });
  } else if (weather.bestTimeToVisit) {
    cards.push({
      title: "Best week within the month",
      body: weather.bestTimeToVisit,
      priority: 1,
    });
  }

  // Rainfall practical note
  if (weather.chartSummary?.rainLikelihood) {
    cards.push({
      title: "Rainfall outlook",
      body: weather.chartSummary.rainLikelihood,
      priority: 2,
    });
  }

  // Temperature swing / mornings
  if (weather.chartSummary?.coolestMornings) {
    cards.push({
      title: "Mornings & layers",
      body: weather.chartSummary.coolestMornings,
      priority: 4,
    });
  }

  // Weather risk → only if at least moderate
  const topRisk = weather.weatherRisks?.find((r) => r.severity !== "low");
  if (topRisk) {
    cards.push({
      title: `Watch for ${topRisk.risk.toLowerCase()}`,
      body: topRisk.detail,
      priority: 5,
    });
  }

  // Month ranking — plain sentence in a card, no visual
  if (weather.monthRanking?.rankingInsight) {
    cards.push({
      title: `${displayMonth} compared to other months`,
      body: weather.monthRanking.rankingInsight,
      priority: 6,
    });
  }

  // Favorable insight (e.g. golden hour) — pull one if we have room
  const favorable = weather.insights?.find((i) => i.type === "favorable");
  if (favorable) {
    cards.push({
      title: "Worth knowing",
      body: favorable.text,
      priority: 7,
    });
  }

  const ordered = cards.sort((a, b) => a.priority - b.priority).slice(0, 5);

  if (ordered.length === 0) return null;

  return (
    <section className="space-y-5">
      <h3 className="text-xl md:text-2xl font-display font-semibold text-foreground">
        Useful insights for your trip
      </h3>
      <div className="grid md:grid-cols-2 gap-4">
        {ordered.map((card, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border/40 bg-accent/30 p-5"
          >
            <h4 className="text-sm font-semibold text-foreground mb-2">
              {card.title}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {card.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
