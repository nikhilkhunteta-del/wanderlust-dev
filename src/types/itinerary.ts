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
  location?: string;
  seasonalNote?: string;
  personalNote?: string;
  lat?: number;
  lng?: number;
  transitTo?: string;
}

export interface TimeSlot {
  period: "morning" | "afternoon" | "evening";
  activities: Activity[];
}

export interface BudgetBreakdown {
  entranceFees: number;
  food: number;
  transport: number;
}

export interface ItineraryDay {
  dayNumber: number;
  theme: string;
  slots: TimeSlot[];
  neighbourhood?: string;
  neighbourhoodVibe?: string;
  estimatedWalkingKm?: number;
  estimatedTransitMinutes?: number;
  paceLabel?: "leisurely" | "moderate" | "active";
  moodLine?: string;
  estimatedDailyBudget?: number;
  budgetBreakdown?: BudgetBreakdown;
  budgetCurrency?: string;
  weatherRationale?: string;
}

export interface DayTrip {
  destination: string;
  travelTime: string;
  description: string;
  matchedInterests: string[];
  suggestedDayToReplace?: number;
}

export interface ExtensionSuggestion {
  title: string;
  description: string;
  highlights: string[];
}

export interface CityItinerary {
  days: ItineraryDay[];
  tips: string[];
  dayTrips?: DayTrip[];
  extensionSuggestions?: ExtensionSuggestion[];
}

export interface ItineraryRequest {
  city: string;
  country: string;
  tripDuration: number;
  travelMonth: string;
  userInterests: string[];
  adventureTypes: string[];
  settings: ItinerarySettings;
  regenerateDay?: number;
  adjustment?: string;
}

export const DEFAULT_ITINERARY_SETTINGS: ItinerarySettings = {
  tripStyle: "balanced",
  focusInterest: "",
  budgetLevel: "mid",
  diningPreference: "mixed",
  mustDoExperiences: [],
  includeFreeTime: true,
};
