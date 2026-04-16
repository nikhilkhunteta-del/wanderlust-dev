import { useState } from "react";
import { useCityWeather } from "@/hooks/useCityData";
import { WeatherVerdict } from "./WeatherVerdict";
import { WeatherStats } from "./WeatherStats";
import { WeatherCharts } from "./WeatherCharts";
import { UsefulInsights } from "./UsefulInsights";
import { TemperatureToggle, TemperatureUnit } from "./TemperatureToggle";

import { Loader2, CloudOff } from "lucide-react";
import { formatMonthName } from "@/lib/formatMonth";

interface WeatherTabProps {
  city: string;
  country: string;
  travelMonth: string;
  primaryInterest?: string;
  onSwitchTab?: (tab: string) => void;
}

export const WeatherTab = ({ city, country, travelMonth, primaryInterest }: WeatherTabProps) => {
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>("celsius");
  const { data: weather, isLoading, error } = useCityWeather(city, country, travelMonth, primaryInterest);
  const displayMonth = formatMonthName(travelMonth);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading weather data for {displayMonth}...</p>
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
    <div className="page-container py-8 space-y-10">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end gap-3">
          <TemperatureToggle unit={tempUnit} onUnitChange={setTempUnit} />
        </div>
        <WeatherVerdict
          verdict={weather.verdict}
          month={travelMonth}
          city={city}
          monthRanking={weather.monthRanking}
        />
      </div>

      <WeatherStats stats={weather.stats} unit={tempUnit} month={travelMonth} />

      <div className="py-4">
        <WeatherCharts
          dailyData={weather.dailyData}
          weeklyData={weather.weeklyData}
          month={travelMonth}
          unit={tempUnit}
          chartSummary={weather.chartSummary}
        />
      </div>

      <UsefulInsights insights={weather.usefulInsights} />
    </div>
  );
};
