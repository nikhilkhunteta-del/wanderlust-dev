export type TripStyle = "relaxed" | "balanced" | "fast-paced";
export type BudgetLevel = "value" | "mid" | "premium";
export type DiningPreference = "local-street" | "casual" | "fine-dining" | "mixed";

export interface ItinerarySettings {
  tripStyle: TripStyle;
  focusInterest: string;
  budgetLevel: BudgetLevel;
  diningPreference: DiningPreference;
  mustDoExperiences: string[];
  includeFreeTime: boolean;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  category: string;
  isMustDo?: boolean;
}

export interface TimeSlot {
  period: "morning" | "afternoon" | "evening";
  activities: Activity[];
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  slots: TimeSlot[];
}

export interface CityItinerary {
  days: ItineraryDay[];
  tips: string[];
}

export interface ItineraryRequest {
  city: string;
  country: string;
  tripDuration: number;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  settings: ItinerarySettings;
}

export const DEFAULT_ITINERARY_SETTINGS: ItinerarySettings = {
  tripStyle: "balanced",
  focusInterest: "",
  budgetLevel: "mid",
  diningPreference: "mixed",
  mustDoExperiences: [],
  includeFreeTime: true,
};
