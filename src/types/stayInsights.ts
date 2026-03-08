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
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  currency?: string;
}

export interface TopProperty {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  pricePerNight: number | null;
  totalPrice: number | null;
  amenities: string[];
  type: string;
  neighbourhood: string | null;
  link: string | null;
  thumbnail: string | null;
}

export interface PriceCategory {
  category: "budget" | "midRange" | "premium" | "luxury";
  label: string;
  starRating: string;
  lowPrice: number | null;
  highPrice: number | null;
  medianPrice: number | null;
  currency: string;
  travellerLowPrice?: number;
  travellerHighPrice?: number;
  travellerCurrency?: string;
  typicalInclusions: string[];
  bookingAdvance?: string | null;
  topProperties?: TopProperty[];
  priceInsights?: any;
  resultCount?: number;
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

export interface VacationRentals {
  resultCount: number;
  lowestPrice: number | null;
  medianPrice: number | null;
  topProperties: TopProperty[];
}

export interface StayInsightsData {
  city: string;
  country: string;
  travelMonth: string;
  overview: string;
  personalRecommendation?: string | null;
  priceCategories: PriceCategory[];
  neighbourhoods: Neighbourhood[];
  areaGuidance: AreaGuidance;
  hotelVsApartment?: HotelVsApartment | null;
  vacationRentals?: VacationRentals | null;
  practicalInsights: StayInsight[];
  travellerCurrency?: string | null;
  bookingUrl: string;
  dataSource?: string;
  fetchedAt?: string;
  stayDuration?: number;
  disclaimer: string;
  lastUpdated: string;
}
