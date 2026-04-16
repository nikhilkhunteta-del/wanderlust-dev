export interface WeatherStats {
  avgHighTemp: number;
  avgLowTemp: number;
  sunshineHours: number;
  totalRainfall: number;
  humidity: number;
  rainyDays: number;
  unit: "celsius" | "fahrenheit";
}

export interface DailyWeather {
  day: number;
  high: number;
  low: number;
  rainfall: number;
}

export interface WeeklyWeather {
  week: number;
  weekLabel: string;
  avgHigh: number;
  avgLow: number;
  totalRainfall: number;
}

export interface WeatherInsight {
  type: "favorable" | "unfavorable" | "neutral";
  text: string;
}

export interface PackingTip {
  icon: string;
  tip: string;
  category: "clothing" | "sun" | "health";
}

export interface WeatherRisk {
  risk: string;
  severity: "low" | "moderate" | "high";
  detail: string;
}

export interface SensoryPeriod {
  period: "morning" | "afternoon" | "evening";
  description: string;
}

export interface ChartSummary {
  warmestWeek: string;
  coolestMornings: string;
  rainLikelihood: string;
  outdoorComfortScore: number;
  outdoorComfortExplanation: string;
  planningNote: string;
}

export interface MonthRanking {
  rank: number;
  totalMonths: number;
  rating: "excellent" | "good" | "mixed" | "poor";
  dataYears: number;
  avoidMonths: string;
  rankingInsight: string;
}

export interface UsefulInsight {
  label: string;
  stat: string;
  body: string;
}

export interface CityWeather {
  usefulInsights: UsefulInsight[];
  verdict: string;
  monthRanking: MonthRanking;
  stats: WeatherStats;
  dailyData: DailyWeather[];
  weeklyData: WeeklyWeather[];
  chartSummary: ChartSummary;
  insights: WeatherInsight[];
  weatherRisks: WeatherRisk[];
  sensoryNarrative: SensoryPeriod[];
  bestTimeToVisit: string;
  packingTips: PackingTip[];
  notNeeded: string[];
}

export interface WeatherRequest {
  city: string;
  country: string;
  travelMonth: string;
  primaryInterest?: string;
}
