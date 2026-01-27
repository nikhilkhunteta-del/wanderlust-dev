export interface WeatherStats {
  avgHighTemp: number;
  avgLowTemp: number;
  sunshineHours: number;
  totalRainfall: number;
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
}

export interface CityWeather {
  verdict: string;
  stats: WeatherStats;
  dailyData: DailyWeather[];
  weeklyData: WeeklyWeather[];
  insights: WeatherInsight[];
  bestTimeToVisit: string;
  packingTips: PackingTip[];
}

export interface WeatherRequest {
  city: string;
  country: string;
  travelMonth: string;
}
