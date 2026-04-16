import { WeatherStats as WeatherStatsType } from "@/types/weather";
import { TemperatureUnit, formatTempValue } from "./TemperatureToggle";
import { formatMonthName } from "@/lib/formatMonth";

interface WeatherStatsProps {
  stats: WeatherStatsType;
  unit: TemperatureUnit;
  month: string;
}

export const WeatherStats = ({ stats, unit, month }: WeatherStatsProps) => {
  const tempSymbol = unit === "fahrenheit" ? "°F" : "°C";

  const items = [
    { label: "Daytime High", value: `${formatTempValue(stats.avgHighTemp, unit)}${tempSymbol}` },
    { label: "Night Low", value: `${formatTempValue(stats.avgLowTemp, unit)}${tempSymbol}` },
    { label: "Sunshine Hours", value: `${stats.sunshineHours}h` },
    { label: "Rainy Days", value: `${stats.rainyDays}` },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">What it feels like in {formatMonthName(month)}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center text-center">
            <span
              className="font-display font-bold text-foreground"
              style={{ fontSize: 48, lineHeight: 1.1 }}
            >
              {item.value}
            </span>
            <span className="text-muted-foreground mt-1 text-[13px]">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
