import { CityRecommendation } from "./recommendations";
import { TravelProfile } from "./travelProfile";

export interface DimensionScore {
  score: number; // 1-10
  summary: string;
}

export interface CityScores {
  city: CityRecommendation;
  personalMatch: DimensionScore;
  weatherFit: DimensionScore;
  gettingThere: DimensionScore;
  safety: DimensionScore;
  seasonalEvents: DimensionScore;
  accommodationValue: DimensionScore;
  weightedTotal: number;
}

export interface ComparisonVerdict {
  topCity: string;
  verdictParagraph: string;
  runnerUp: string;
  runnerUpReason: string;
  whyNot: { city: string; reason: string }[];
}

export interface DimensionWeights {
  personalMatch: number;
  weatherFit: number;
  gettingThere: number;
  safety: number;
  seasonalEvents: number;
  accommodationValue: number;
}

export const DEFAULT_WEIGHTS: DimensionWeights = {
  personalMatch: 25,
  weatherFit: 20,
  gettingThere: 15,
  safety: 15,
  seasonalEvents: 15,
  accommodationValue: 10,
};

export const DIMENSION_LABELS: Record<keyof DimensionWeights, string> = {
  personalMatch: "Personal Match",
  weatherFit: "Weather Fit",
  gettingThere: "Getting There",
  safety: "Safety",
  seasonalEvents: "Seasonal Events",
  accommodationValue: "Accommodation Value",
};

export const CITY_COLORS = ["#EA580C", "#0D9488", "#7C3AED"] as const;
export const CITY_BG_COLORS = ["rgba(234,88,12,0.08)", "rgba(13,148,136,0.08)", "rgba(124,58,237,0.08)"] as const;
