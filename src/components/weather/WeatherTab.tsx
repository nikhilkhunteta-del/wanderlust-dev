import { useState, useEffect } from "react";
import { CityWeather } from "@/types/weather";
import { getCityWeather } from "@/lib/weather";
import { WeatherVerdict } from "./WeatherVerdict";
import { WeatherStats } from "./WeatherStats";
import { WeatherCharts } from "./WeatherCharts";
import { WeeklyInsights } from "./WeeklyInsights";
import { PackingTips } from "./PackingTips";
import { Loader2, CloudOff } from "lucide-react";

interface WeatherTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

export const WeatherTab = ({ city, country, travelMonth }: WeatherTabProps) => {
  const [weather, setWeather] = useState<CityWeather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getCityWeather({ city, country, travelMonth });
        setWeather(data);
      } catch (err) {
        console.error("Failed to fetch weather:", err);
        setError(err instanceof Error ? err.message : "Failed to load weather data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();
  }, [city, country, travelMonth]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading weather data for {travelMonth}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <CloudOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-destructive mb-2 font-medium">Unable to load weather data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-8">
      {/* Verdict */}
      <WeatherVerdict verdict={weather.verdict} month={travelMonth} city={city} />

      {/* Key Stats */}
      <WeatherStats stats={weather.stats} />

      {/* Charts and Insights Grid */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Charts - Takes 2 columns */}
        <div className="lg:col-span-2">
          <WeatherCharts
            dailyData={weather.dailyData}
            weeklyData={weather.weeklyData}
            month={travelMonth}
          />
        </div>

        {/* Sidebar - Insights and Packing */}
        <div className="space-y-6">
          <WeeklyInsights insights={weather.insights} />
          <PackingTips tips={weather.packingTips} bestTimeToVisit={weather.bestTimeToVisit} />
        </div>
      </div>
    </div>
  );
};
