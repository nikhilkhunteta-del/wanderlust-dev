import { ItineraryDay } from "@/types/itinerary";

export interface MultiCityStop {
  city: string;
  country: string;
  days: number;
  highlights: string[];
  lat: number;
  lng: number;
}

export interface MultiCityLeg {
  from: string;
  to: string;
  travelTime: string;
  transportMode: "flight" | "train" | "bus" | "ferry" | "drive";
  distanceKm?: number;
}

export interface MultiCityRoute {
  stops: MultiCityStop[];
  legs: MultiCityLeg[];
  totalDays: number;
  routeRationale: string;
}

export interface MultiCityDay extends ItineraryDay {
  cityName: string;
  isTravelDay?: boolean;
}

export interface CityTransition {
  fromCity: string;
  toCity: string;
  dayNumber: number;
  transportMode: string;
  travelTime: string;
  tip?: string;
}

export interface MultiCityItinerary {
  days: MultiCityDay[];
  tips: string[];
  cityTransitions: CityTransition[];
}

export interface MultiCityItineraryRequest {
  route: MultiCityRoute;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  tripStyle: string;
  budgetLevel: string;
  diningPreference: string;
  includeFreeTime: boolean;
}

export interface MultiCityRequest {
  originCity: string;
  originCountry: string;
  totalDays: number;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  tripStyle: string;
  budgetLevel: string;
}
