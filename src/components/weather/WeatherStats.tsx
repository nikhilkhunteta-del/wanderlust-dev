import { WeatherStats as WeatherStatsType } from "@/types/weather";
import { Thermometer, ThermometerSnowflake, Sun, CloudRain, Droplets, CloudDrizzle } from "lucide-react";
import { TemperatureUnit, formatTempValue } from "./TemperatureToggle";

interface WeatherStatsProps {
  stats: WeatherStatsType;
  unit: TemperatureUnit;
  month: string;
}

export const WeatherStats = ({ stats, unit, month }: WeatherStatsProps) => {
  const tempSymbol = unit === "fahrenheit" ? "°F" : "°C";

  const statItems = [
    {
      icon: Thermometer,
      label: "Daytime High",
      value: `${formatTempValue(stats.avgHighTemp, unit)}${tempSymbol}`,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
      borderColor: "border-orange-200/50 dark:border-orange-800/30",
    },
    {
      icon: ThermometerSnowflake,
      label: "Night Low",
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
    {
      icon: Droplets,
      label: "Humidity",
      value: `${stats.humidity}%`,
      color: "text-teal-500",
      bgColor: "bg-teal-50 dark:bg-teal-950/30",
      borderColor: "border-teal-200/50 dark:border-teal-800/30",
    },
    {
      icon: CloudDrizzle,
      label: "Rainy Days",
      value: `${stats.rainyDays}`,
      subtext: `of ~${30} days`,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
      borderColor: "border-indigo-200/50 dark:border-indigo-800/30",
    },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">What it feels like in {month}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item) => (
          <div
            key={item.label}
            className={`rounded-xl ${item.bgColor} border ${item.borderColor} p-4 text-center transition-all duration-300`}
          >
            <div className={`inline-flex p-1.5 rounded-lg ${item.bgColor} mb-2`}>
              <item.icon className={`w-4 h-4 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold text-foreground mb-0.5">
              {item.value}
            </div>
            <div className="text-xs text-muted-foreground">
              {item.label}
              {item.subtext && <span className="block opacity-70">{item.subtext}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
