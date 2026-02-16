import { useState, useRef } from "react";
import { useCityWeather } from "@/hooks/useCityData";
import { WeatherVerdict } from "./WeatherVerdict";
import { WeatherStats } from "./WeatherStats";
import { WeatherCharts } from "./WeatherCharts";
import { WeeklyInsights } from "./WeeklyInsights";
import { PackingTips } from "./PackingTips";
import { WeatherWatch } from "./WeatherWatch";
import { SensoryNarrative } from "./SensoryNarrative";
import { MonthComparison } from "./MonthComparison";
import { TemperatureToggle, TemperatureUnit } from "./TemperatureToggle";
import { DataFreshness } from "@/components/shared/DataFreshness";
import { Loader2, CloudOff } from "lucide-react";

interface WeatherTabProps {
  city: string;
  country: string;
  travelMonth: string;
}

export const WeatherTab = ({ city, country, travelMonth }: WeatherTabProps) => {
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>("celsius");
  const { data: weather, isLoading, isFetching, error, dataUpdatedAt } = useCityWeather(city, country, travelMonth);
  const initialLoadTime = useRef<number | null>(null);

  if (weather && !initialLoadTime.current) {
    initialLoadTime.current = Date.now();
  }
  const isFromCache = weather && !isLoading && dataUpdatedAt < Date.now() - 100;

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
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Failed to load weather data"}
          </p>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-10">
      {/* Header row: Verdict + controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end gap-3">
          <DataFreshness isFetching={isFetching && !isLoading} isFromCache={!!isFromCache} />
          <TemperatureToggle unit={tempUnit} onUnitChange={setTempUnit} />
        </div>
        <WeatherVerdict
          verdict={weather.verdict}
          month={travelMonth}
          city={city}
          monthRanking={weather.monthRanking}
        />
      </div>

      {/* Travel comfort signals */}
      <WeatherStats stats={weather.stats} unit={tempUnit} month={travelMonth} />

      {/* Sensory narrative */}
      <SensoryNarrative periods={weather.sensoryNarrative} month={travelMonth} />

      {/* Charts + Sidebar grid */}
      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <WeatherCharts
            dailyData={weather.dailyData}
            weeklyData={weather.weeklyData}
            month={travelMonth}
            unit={tempUnit}
            chartSummary={weather.chartSummary}
          />
        </div>
        <div className="space-y-6">
          <WeeklyInsights insights={weather.insights} bestTimeToVisit={weather.bestTimeToVisit} />
          <MonthComparison monthRanking={weather.monthRanking} month={travelMonth} />
        </div>
      </div>

      {/* Weather Watch & Packing */}
      <div className="grid md:grid-cols-2 gap-6">
        <WeatherWatch risks={weather.weatherRisks} />
        <PackingTips tips={weather.packingTips} notNeeded={weather.notNeeded} />
      </div>
    </div>
  );
};
