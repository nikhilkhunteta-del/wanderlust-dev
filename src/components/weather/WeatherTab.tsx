import { useState } from "react";
import { useCityWeather } from "@/hooks/useCityData";
import { WeatherVerdict } from "./WeatherVerdict";
import { WeatherStats } from "./WeatherStats";
import { WeatherCharts } from "./WeatherCharts";
import { WeeklyInsights } from "./WeeklyInsights";
import { WeatherWatch } from "./WeatherWatch";
import { SensoryNarrative } from "./SensoryNarrative";
import { MonthComparison } from "./MonthComparison";
import { TemperatureToggle, TemperatureUnit } from "./TemperatureToggle";

import { Loader2, CloudOff, CloudSun, ArrowRight } from "lucide-react";
import { formatMonthName } from "@/lib/formatMonth";

interface WeatherTabProps {
  city: string;
  country: string;
  travelMonth: string;
  onSwitchTab?: (tab: string) => void;
}

export const WeatherTab = ({ city, country, travelMonth, onSwitchTab }: WeatherTabProps) => {
  const [tempUnit, setTempUnit] = useState<TemperatureUnit>("celsius");
  const { data: weather, isLoading, error } = useCityWeather(city, country, travelMonth);
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
      {/* Header row: Verdict + controls */}
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

      {/* Weather Watch */}
      {weather.weatherRisks && weather.weatherRisks.length > 0 && (
        <WeatherWatch risks={weather.weatherRisks} />
      )}

      {/* Weather impact cross-tab note */}
      <div className="flex items-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/30">
        <CloudSun className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground">
          Packing suggestions based on {displayMonth}'s weather are included in the <span className="font-medium">Stay Well</span> tab.
        </p>
      </div>

      {/* Closing CTA → While You're There */}
      {onSwitchTab && (
        <div className="mt-4 border-t border-border/50 pt-8">
          <div className="bg-gradient-to-r from-accent/60 to-accent/30 rounded-xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-lg font-semibold text-foreground mb-1">
                See what's happening in {displayMonth}
              </h4>
              <p className="text-sm text-muted-foreground">
                Festivals, seasonal food, and experiences unique to this time of year.
              </p>
            </div>
            <button
              onClick={() => onSwitchTab("seasonal")}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
            >
              See what's happening in {displayMonth}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
