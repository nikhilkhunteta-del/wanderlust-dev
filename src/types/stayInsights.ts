export interface StayInsightsRequest {
  city: string;
  country: string;
  travelMonth: string;
  departureCity?: string;
}

export interface PriceCategory {
  category: "budget" | "midRange" | "premium" | "luxury";
  label: string;
  starRating: string;
  lowPrice: number;
  highPrice: number;
  currency: string;
  typicalInclusions: string[];
}

export interface Neighbourhood {
  name: string;
  description: string;
  bestFor: string[];
  imageQuery: string;
}

export interface AreaGuidance {
  centralVsOuter: string;
  priceVsConvenience: string;
  noiseVsQuiet: string;
}

export interface StayInsight {
  icon: "calendar" | "coins" | "users" | "building" | "info";
  title: string;
  description: string;
}

export interface StayInsightsData {
  city: string;
  country: string;
  travelMonth: string;
  overview: string;
  priceCategories: PriceCategory[];
  neighbourhoods: Neighbourhood[];
  areaGuidance: AreaGuidance;
  practicalInsights: StayInsight[];
  bookingUrl: string;
  disclaimer: string;
  lastUpdated: string;
}
