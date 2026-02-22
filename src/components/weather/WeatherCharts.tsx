import { useMemo } from "react";
import { DailyWeather, WeeklyWeather, ChartSummary } from "@/types/weather";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Line,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TemperatureUnit, formatTempValue } from "./TemperatureToggle";
import { Lightbulb, MapPin, Thermometer, ThermometerSnowflake, CloudRain, Sun } from "lucide-react";
import { formatMonthName } from "@/lib/formatMonth";

interface WeatherChartsProps {
  dailyData: DailyWeather[];
  weeklyData: WeeklyWeather[];
  month: string;
  unit: TemperatureUnit;
  chartSummary: ChartSummary;
}

export const WeatherCharts = ({ dailyData, weeklyData, month, unit, chartSummary }: WeatherChartsProps) => {
  const tempSymbol = unit === "fahrenheit" ? "°F" : "°C";
  const displayMonth = formatMonthName(month);

  const convertedDailyData = useMemo(() => {
    return dailyData.map((day) => ({
      ...day,
      high: formatTempValue(day.high, unit),
      low: formatTempValue(day.low, unit),
    }));
  }, [dailyData, unit]);

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <div className="space-y-12">
      {/* Temperature Chart — #7 card container with padding, #9 month name */}
      <Card className="border-[hsl(220,13%,91%)] p-6">
        <div className="pb-2">
          <h4 className="text-base font-semibold">Temperature Through {displayMonth}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">How highs and lows shift across {displayMonth}</p>
        </div>
        <CardContent className="pt-2">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={convertedDailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°`} className="text-muted-foreground" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}${tempSymbol}`]} labelFormatter={(l) => `Day ${l}`} />
                <Area type="monotone" dataKey="high" fill="url(#tempGradient)" stroke="none" legendType="none" />
                <Line type="monotone" dataKey="high" stroke="hsl(25, 95%, 53%)" strokeWidth={2} dot={false} name="High" />
                <Line type="monotone" dataKey="low" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={false} name="Low" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rainfall Chart — #7 spacing + card container, #9 month name */}
      <Card className="border-[hsl(220,13%,91%)] p-6">
        <div className="pb-2">
          <h4 className="text-base font-semibold">Rainfall in {displayMonth}</h4>
          <p className="text-sm text-muted-foreground mt-0.5">Daily precipitation across the month</p>
        </div>
        <CardContent className="pt-2">
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} className="text-muted-foreground" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value} mm`, "Rainfall"]} labelFormatter={(l) => `Day ${l}`} />
                <Bar dataKey="rainfall" fill="hsl(199, 89%, 48%)" radius={[3, 3, 0, 0]} maxBarSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* #5 Chart Summary — 2×2 card grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h4 className="text-base font-semibold">What the Data Tells Us</h4>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-[hsl(220,13%,91%)] bg-card p-4 flex items-start gap-3">
            <Thermometer className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">{chartSummary.warmestWeek}</p>
          </div>
          <div className="rounded-xl border border-[hsl(220,13%,91%)] bg-card p-4 flex items-start gap-3">
            <ThermometerSnowflake className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">{chartSummary.coolestMornings}</p>
          </div>
          <div className="rounded-xl border border-[hsl(220,13%,91%)] bg-card p-4 flex items-start gap-3">
            <CloudRain className="w-4 h-4 text-sky-500 mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground leading-relaxed">{chartSummary.rainLikelihood}</p>
          </div>
          <div className="rounded-xl border border-[hsl(220,13%,91%)] bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm text-muted-foreground">Outdoor comfort:</span>
              <div className="flex gap-0.5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${i < chartSummary.outdoorComfortScore ? "bg-primary" : "bg-muted-foreground/20"}`}
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground">{chartSummary.outdoorComfortScore}/10</span>
            </div>
            <p className="text-xs text-muted-foreground/70">Outdoor comfort for a typical tourist (1 = very challenging, 10 = ideal)</p>
            {chartSummary.outdoorComfortExplanation && (
              <p className="text-xs text-muted-foreground italic">{chartSummary.outdoorComfortExplanation}</p>
            )}
          </div>
        </div>

        {/* Planning note */}
        {chartSummary.planningNote && (
          <div className="flex items-start gap-2 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-foreground">{chartSummary.planningNote}</p>
          </div>
        )}
      </div>
    </div>
  );
};
