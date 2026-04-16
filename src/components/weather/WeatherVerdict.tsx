import { MonthRanking } from "@/types/weather";
import { formatMonthName } from "@/lib/formatMonth";

interface WeatherVerdictProps {
  verdict: string;
  month: string;
  city: string;
  monthRanking: MonthRanking;
}

export const WeatherVerdict = ({ verdict, month, city, monthRanking }: WeatherVerdictProps) => {
  const displayMonth = formatMonthName(month);

  return (
    <div className="space-y-3 max-w-3xl">
      <h2 className="text-2xl md:text-3xl font-display font-semibold text-foreground leading-snug">
        {displayMonth} in {city}: {verdict}
      </h2>
      {monthRanking.rankingInsight && (
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
          {monthRanking.rankingInsight}
        </p>
      )}
    </div>
  );
};
