import { useMemo } from "react";
import { DailyWeather, WeeklyWeather } from "@/types/weather";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemperatureUnit, formatTempValue } from "./TemperatureToggle";

interface WeatherChartsProps {
  dailyData: DailyWeather[];
  weeklyData: WeeklyWeather[];
  month: string;
  unit: TemperatureUnit;
}

export const WeatherCharts = ({ dailyData, weeklyData, month, unit }: WeatherChartsProps) => {
  const tempSymbol = unit === "fahrenheit" ? "°F" : "°C";

  // Convert data based on unit
  const convertedDailyData = useMemo(() => {
    return dailyData.map((day) => ({
      ...day,
      high: formatTempValue(day.high, unit),
      low: formatTempValue(day.low, unit),
    }));
  }, [dailyData, unit]);

  const convertedWeeklyData = useMemo(() => {
    return weeklyData.map((week) => ({
      ...week,
      avgHigh: formatTempValue(week.avgHigh, unit),
      avgLow: formatTempValue(week.avgLow, unit),
    }));
  }, [weeklyData, unit]);

  return (
    <div className="space-y-6">
      {/* Temperature Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Daily Temperature Range
            <span className="text-sm font-normal text-muted-foreground">({month})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={convertedDailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}°`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value}${tempSymbol}`]}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Area
                  type="monotone"
                  dataKey="high"
                  fill="url(#tempGradient)"
                  stroke="none"
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke="hsl(25, 95%, 53%)"
                  strokeWidth={2}
                  dot={false}
                  name="High"
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  dot={false}
                  name="Low"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Rainfall Chart */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            Daily Rainfall
            <span className="text-sm font-normal text-muted-foreground">(mm)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`${value} mm`, "Rainfall"]}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Bar
                  dataKey="rainfall"
                  fill="hsl(199, 89%, 48%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={12}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Weekly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={convertedWeeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="weekLabel"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="temp"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}°`}
                  className="text-muted-foreground"
                />
                <YAxis
                  yAxisId="rain"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}mm`}
                  className="text-muted-foreground"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name.includes("Rainfall")) return [`${value} mm`, name];
                    return [`${value}${tempSymbol}`, name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  yAxisId="rain"
                  dataKey="totalRainfall"
                  fill="hsl(199, 89%, 48%)"
                  radius={[4, 4, 0, 0]}
                  name="Rainfall (mm)"
                  opacity={0.6}
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="avgHigh"
                  stroke="hsl(25, 95%, 53%)"
                  strokeWidth={2}
                  name="Avg High"
                />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="avgLow"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  name="Avg Low"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
