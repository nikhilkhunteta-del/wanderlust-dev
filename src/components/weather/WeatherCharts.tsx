import { useMemo } from "react";
import { DailyWeather, WeeklyWeather, ChartSummary } from "@/types/weather";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Area, Line,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TemperatureUnit, formatTempValue } from "./TemperatureToggle";
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

    </div>
  );
};
