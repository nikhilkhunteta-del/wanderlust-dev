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

export interface MultiCityItinerary {
  route: MultiCityRoute;
  days: import("@/types/itinerary").ItineraryDay[];
  tips: string[];
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
