import { WeatherStats as WeatherStatsType } from "@/types/weather";
import { Thermometer, ThermometerSnowflake, Sun, CloudRain } from "lucide-react";
import { TemperatureUnit, formatTempValue } from "./TemperatureToggle";

interface WeatherStatsProps {
  stats: WeatherStatsType;
  unit: TemperatureUnit;
}

export const WeatherStats = ({ stats, unit }: WeatherStatsProps) => {
  const tempSymbol = unit === "fahrenheit" ? "°F" : "°C";

  const statItems = [
    {
      icon: Thermometer,
      label: "Avg High",
      value: `${formatTempValue(stats.avgHighTemp, unit)}${tempSymbol}`,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200/50 dark:border-orange-800/30",
    },
    {
      icon: ThermometerSnowflake,
      label: "Avg Low",
      value: `${formatTempValue(stats.avgLowTemp, unit)}${tempSymbol}`,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/30",
      borderColor: "border-blue-200/50 dark:border-blue-800/30",
    },
    {
      icon: Sun,
      label: "Sunshine",
      value: `${stats.sunshineHours}h`,
      subtext: "per day",
      color: "text-amber-500",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
      borderColor: "border-amber-200/50 dark:border-amber-800/30",
    },
    {
      icon: CloudRain,
      label: "Rainfall",
      value: `${stats.totalRainfall}mm`,
      subtext: "total",
      color: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/30",
      borderColor: "border-sky-200/50 dark:border-sky-800/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl ${item.bgColor} border ${item.borderColor} p-4 md:p-5 text-center transition-all duration-300`}
        >
          <div className={`inline-flex p-2 rounded-lg ${item.bgColor} mb-3`}>
            <item.icon className={`w-5 h-5 ${item.color}`} />
          </div>
          <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
            {item.value}
          </div>
          <div className="text-sm text-muted-foreground">
            {item.label}
            {item.subtext && <span className="block text-xs opacity-70">{item.subtext}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
