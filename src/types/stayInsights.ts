export interface StayInsightsRequest {
  city: string;
  country: string;
  travelMonth: string;
  departureCity?: string;
  travelCompanions?: string;
  groupType?: string;
  tripDuration?: number;
  styleTags?: string[];
  travelPace?: number;
}

export interface PriceCategory {
  category: "budget" | "midRange" | "premium" | "luxury";
  label: string;
  starRating: string;
  lowPrice: number;
  highPrice: number;
  currency: string;
  travellerLowPrice?: number;
  travellerHighPrice?: number;
  travellerCurrency?: string;
  typicalInclusions: string[];
  bookingAdvance?: string;
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

export interface HotelVsApartment {
  bestForApartments: string;
  priceComparison: string;
  whatToKnow: string;
}

export interface StayInsightsData {
  city: string;
  country: string;
  travelMonth: string;
  overview: string;
  personalRecommendation?: string;
  priceCategories: PriceCategory[];
  neighbourhoods: Neighbourhood[];
  areaGuidance: AreaGuidance;
  hotelVsApartment?: HotelVsApartment;
  practicalInsights: StayInsight[];
  travellerCurrency?: string;
  bookingUrl: string;
  disclaimer: string;
  lastUpdated: string;
}
