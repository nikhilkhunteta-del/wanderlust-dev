import { useMemo, useState } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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

export const ComparisonSpiderChart = ({ cityScores, onAxisClick }: SpiderChartProps) => {
  const [hoveredCity, setHoveredCity] = useState<number | null>(null);

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

  // Size constants
  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = 180;

  return (
    <div className="w-full flex flex-col items-center">
      <div style={{ width: size, maxWidth: "100%", aspectRatio: "1/1" }}>
        <RadarChart
          width={size}
          height={size}
          data={chartData}
          cx={cx}
          cy={cy}
          outerRadius={outerRadius}
          onMouseLeave={() => setHoveredCity(null)}
        >
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="dimension"
            tick={({ x, y, payload, index }: any) => {
              const dim = DIMENSIONS[index];
              // Push labels outward by 16px from polygon edge
              const dx = x - cx;
              const dy = y - cy;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const pad = 16;
              const nx = x + (dx / dist) * pad;
              const ny = y + (dy / dist) * pad;

              // Show score label for hovered city
              const scoreLabel =
                hoveredCity !== null
                  ? ` (${chartData[index][`city${hoveredCity}`]})`
                  : "";

              return (
                <text
                  x={nx}
                  y={ny}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-xs fill-muted-foreground cursor-pointer hover:fill-foreground transition-colors"
                  onClick={() => handleAxisClick(dim)}
                >
                  <tspan>{payload.value}</tspan>
                  {hoveredCity !== null && (
                    <tspan
                      className="font-semibold"
                      style={{ fill: CITY_COLORS[hoveredCity] }}
                    >
                      {scoreLabel}
                    </tspan>
                  )}
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
              fillOpacity={hoveredCity === null ? 0.12 : hoveredCity === i ? 0.25 : 0.04}
              strokeWidth={hoveredCity === null ? 2 : hoveredCity === i ? 3 : 1}
              strokeOpacity={hoveredCity === null ? 1 : hoveredCity === i ? 1 : 0.3}
              onMouseEnter={() => setHoveredCity(i)}
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
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-2">
        {cityScores.map((cs, i) => (
          <button
            key={cs.city.city}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setHoveredCity(i)}
            onMouseLeave={() => setHoveredCity(null)}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: CITY_COLORS[i] }}
            />
            <span className="text-xs font-medium text-foreground">{cs.city.city}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
