export interface TravelPreferences {
  interests: string[];
  adventureExperiences: string[];
  departureCity: string;
  travelMonth: string;
  continentPreference: string[];
  weatherPreference: number;
  tripDuration: number;
  budgetRange: number;
  travelCompanions: string;
  travelPace: number;
}

export interface QuestionConfig {
  id: keyof TravelPreferences;
  questionText: string;
  inputType: 'multi-select' | 'single-select' | 'slider' | 'dropdown' | 'text-input';
  options?: { value: string; label: string; icon?: string }[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    labels: string[];
    unit?: string;
  };
  placeholder?: string;
  defaultValue: string | string[] | number;
}

export const QUESTIONS: QuestionConfig[] = [
  {
    id: 'interests',
    questionText: 'What experiences excite you most?',
    inputType: 'multi-select',
    options: [
      { value: 'culture', label: 'Culture & History', icon: '🏛️' },
      { value: 'nature', label: 'Nature & Wildlife', icon: '🌿' },
      { value: 'beach', label: 'Beach & Relaxation', icon: '🏖️' },
      { value: 'food', label: 'Food & Culinary', icon: '🍜' },
      { value: 'nightlife', label: 'Nightlife & Entertainment', icon: '🎉' },
      { value: 'shopping', label: 'Shopping & Markets', icon: '🛍️' },
      { value: 'photography', label: 'Photography', icon: '📸' },
      { value: 'wellness', label: 'Wellness & Spa', icon: '🧘' },
    ],
    defaultValue: [],
  },
  {
    id: 'adventureExperiences',
    questionText: 'Which adventures call to you?',
    inputType: 'multi-select',
    options: [
      { value: 'hiking', label: 'Hiking & Trekking', icon: '🥾' },
      { value: 'diving', label: 'Diving & Snorkeling', icon: '🤿' },
      { value: 'skiing', label: 'Skiing & Snowboarding', icon: '⛷️' },
      { value: 'safari', label: 'Safari & Wildlife Tours', icon: '🦁' },
      { value: 'watersports', label: 'Water Sports', icon: '🏄' },
      { value: 'climbing', label: 'Rock Climbing', icon: '🧗' },
      { value: 'cycling', label: 'Cycling Tours', icon: '🚴' },
      { value: 'none', label: 'Keep it Relaxed', icon: '😌' },
    ],
    defaultValue: [],
  },
  {
    id: 'continentPreference',
    questionText: 'Which regions are you drawn to?',
    inputType: 'multi-select',
    options: [
      { value: 'europe', label: 'Europe', icon: '🏰' },
      { value: 'asia', label: 'Asia', icon: '🏯' },
      { value: 'north-america', label: 'North America', icon: '🗽' },
      { value: 'south-america', label: 'South America', icon: '🌄' },
      { value: 'africa', label: 'Africa', icon: '🌍' },
      { value: 'oceania', label: 'Oceania', icon: '🦘' },
      { value: 'anywhere', label: 'Surprise Me!', icon: '🌎' },
    ],
    defaultValue: [],
  },
  {
    id: 'departureCity',
    questionText: "Where will your journey begin?",
    inputType: 'text-input',
    placeholder: 'e.g., Tokyo, Paris, New York...',
    defaultValue: '',
  },
  {
    id: 'travelMonth',
    questionText: 'When do you want to travel?',
    inputType: 'dropdown',
    options: [
      { value: 'jan', label: 'January' },
      { value: 'feb', label: 'February' },
      { value: 'mar', label: 'March' },
      { value: 'apr', label: 'April' },
      { value: 'may', label: 'May' },
      { value: 'jun', label: 'June' },
      { value: 'jul', label: 'July' },
      { value: 'aug', label: 'August' },
      { value: 'sep', label: 'September' },
      { value: 'oct', label: 'October' },
      { value: 'nov', label: 'November' },
      { value: 'dec', label: 'December' },
      { value: 'flexible', label: "I'm Flexible" },
    ],
    defaultValue: '',
  },
  {
    id: 'travelCompanions',
    questionText: "Who's joining you?",
    inputType: 'single-select',
    options: [
      { value: 'solo', label: 'Solo Adventure', icon: '🎒' },
      { value: 'couple', label: 'Romantic Getaway', icon: '💑' },
      { value: 'family', label: 'Family Trip', icon: '👨‍👩‍👧‍👦' },
      { value: 'friends', label: 'Friends Trip', icon: '👯' },
      { value: 'group', label: 'Group Travel', icon: '🚌' },
    ],
    defaultValue: '',
  },
  {
    id: 'tripDuration',
    questionText: 'How long is your ideal trip?',
    inputType: 'slider',
    sliderConfig: {
      min: 3,
      max: 30,
      step: 1,
      labels: ['Weekend', '1 Week', '2 Weeks', '3 Weeks', 'Month'],
      unit: 'days',
    },
    defaultValue: 7,
  },
  {
    id: 'weatherPreference',
    questionText: 'What weather do you prefer?',
    inputType: 'slider',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 25,
      labels: ['Cold & Snowy', 'Cool & Mild', 'Warm & Pleasant', 'Hot & Tropical'],
    },
    defaultValue: 50,
  },
  {
    id: 'budgetRange',
    questionText: "What's your daily budget per person?",
    inputType: 'slider',
    sliderConfig: {
      min: 50,
      max: 500,
      step: 50,
      labels: ['Budget', 'Moderate', 'Comfortable', 'Luxury'],
      unit: 'USD',
    },
    defaultValue: 150,
  },
  {
    id: 'travelPace',
    questionText: 'How do you like to explore?',
    inputType: 'slider',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 25,
      labels: ['Slow & Relaxed', 'Balanced', 'Active & Packed'],
    },
    defaultValue: 50,
  },
];
