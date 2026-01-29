export interface AirportInfo {
  code: string;
  name: string;
  isMain: boolean;
  notes?: string;
}

export interface PriceSnapshot {
  typicalPrice: number;
  lowPrice: number;
  highPrice: number;
  trend: "lower" | "typical" | "higher";
  trendExplanation: string;
  currency: string;
}

export interface TimingInsight {
  title: string;
  description: string;
}

export interface AirportComparison {
  airport: string;
  priceNote: string;
  convenienceNote: string;
}

export interface SmartInsight {
  icon: "plane" | "clock" | "calendar" | "map" | "lightbulb";
  title: string;
  description: string;
}

export interface FlightInsightsData {
  originCity: string;
  originAirports: AirportInfo[];
  destinationCity: string;
  destinationCountry: string;
  destinationAirports: AirportInfo[];
  travelMonth: string;
  priceSnapshot: PriceSnapshot;
  timingInsight: TimingInsight | null;
  airportComparisons: AirportComparison[];
  smartInsights: SmartInsight[];
  googleFlightsUrl: string;
  disclaimer: string;
  lastUpdated: string;
}

export interface FlightInsightsRequest {
  departureCity: string;
  destinationCity: string;
  destinationCountry: string;
  travelMonth: string;
}
