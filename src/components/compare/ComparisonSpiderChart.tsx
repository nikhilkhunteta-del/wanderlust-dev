import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { CityScores, CITY_COLORS, DIMENSION_LABELS, DimensionWeights } from "@/types/comparison";

interface SpiderChartProps {
  cityScores: CityScores[];
  onAxisClick?: (dimension: keyof DimensionWeights, bestCitySlug: string) => void;
}

const DIMENSIONS: (keyof DimensionWeights)[] = [
  "personalMatch",
  "weatherFit",
  "gettingThere",
  "safety",
  "seasonalEvents",
  "accommodationValue",
];

const AXIS_TO_TAB: Record<keyof DimensionWeights, string> = {
  personalMatch: "highlights",
  weatherFit: "weather",
  gettingThere: "flights",
  safety: "ground",
  seasonalEvents: "seasonal",
  accommodationValue: "stays",
};

export const ComparisonSpiderChart = ({ cityScores, onAxisClick }: SpiderChartProps) => {
  const chartData = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      const entry: any = { dimension: DIMENSION_LABELS[dim], dimKey: dim };
      cityScores.forEach((cs, i) => {
        entry[`city${i}`] = cs[dim].score;
      });
      return entry;
    });
  }, [cityScores]);

  const handleAxisClick = (dim: keyof DimensionWeights) => {
    // Find highest-scoring city for this dimension
    let bestIdx = 0;
    let bestScore = 0;
    cityScores.forEach((cs, i) => {
      if (cs[dim].score > bestScore) {
        bestScore = cs[dim].score;
        bestIdx = i;
      }
    });
    const slug = cityScores[bestIdx].city.city.toLowerCase().replace(/\s+/g, "-");
    onAxisClick?.(dim, slug);
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={380}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={({ x, y, payload, index }: any) => {
              const dim = DIMENSIONS[index];
              return (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs fill-muted-foreground cursor-pointer hover:fill-foreground transition-colors"
                  onClick={() => handleAxisClick(dim)}
                >
                  {payload.value}
                </text>
              );
            }}
          />
          <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
          {cityScores.map((cs, i) => (
            <Radar
              key={cs.city.city}
              name={cs.city.city}
              dataKey={`city${i}`}
              stroke={CITY_COLORS[i]}
              fill={CITY_COLORS[i]}
              fillOpacity={0.12}
              strokeWidth={2}
            />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: number, name: string) => {
              const idx = parseInt(name.replace("city", ""));
              return [`${value}/10`, cityScores[idx]?.city.city ?? name];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2">
        {cityScores.map((cs, i) => (
          <div key={cs.city.city} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CITY_COLORS[i] }}
            />
            <span className="text-xs font-medium text-foreground">{cs.city.city}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
