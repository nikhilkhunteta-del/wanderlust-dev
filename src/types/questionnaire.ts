export interface TravelPreferences {
  interests: string[];
  adventureExperiences: string[];
  departureCity: string;
  travelMonth: string;
  continentPreference: string[];
  weatherPreference: number;
  tripDuration: number;
  travelCompanions: string;
  travelPace: number;
}

export interface QuestionConfig {
  id: keyof TravelPreferences;
  questionText: string;
  subtitle: string;
  inputType: 'multi-select' | 'single-select' | 'slider' | 'dropdown' | 'text-input';
  options?: { value: string; label: string; icon?: string; group?: string }[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    labels: string[];
    unit?: string;
    emotionalLabels?: { range: [number, number]; label: string }[];
  };
  placeholder?: string;
  defaultValue: string | string[] | number;
  grouped?: boolean;
}

export const QUESTIONS: QuestionConfig[] = [
  {
    id: 'interests',
    questionText: 'What experiences excite you most?',
    subtitle: "We'll use this to shape places you'll truly love.",
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
    questionText: 'Which experiences call to you?',
    subtitle: "Pick the adventures that make your heart race - or none at all.",
    inputType: 'multi-select',
    grouped: true,
    options: [
      { value: 'scuba-diving', label: 'Scuba Diving', icon: '🤿', group: 'Water Adventures' },
      { value: 'snorkelling', label: 'Snorkelling', icon: '🐠', group: 'Water Adventures' },
      { value: 'surfing', label: 'Surfing', icon: '🏄', group: 'Water Adventures' },
      { value: 'kayaking', label: 'Kayaking', icon: '🛶', group: 'Water Adventures' },
      { value: 'rafting', label: 'River Rafting', icon: '🌊', group: 'Water Adventures' },
      { value: 'hiking', label: 'Hiking & Trekking', icon: '🥾', group: 'Mountain Adventures' },
      { value: 'skiing', label: 'Skiing', icon: '⛷️', group: 'Mountain Adventures' },
      { value: 'climbing', label: 'Rock Climbing', icon: '🧗', group: 'Mountain Adventures' },
      { value: 'camping', label: 'Camping', icon: '🏕️', group: 'Mountain Adventures' },
      { value: 'paragliding', label: 'Paragliding', icon: '🪂', group: 'Sky Adventures' },
      { value: 'skydiving', label: 'Sky Diving', icon: '🪂', group: 'Sky Adventures' },
      { value: 'bungee', label: 'Bungee Jumping', icon: '🤸', group: 'Sky Adventures' },
      { value: 'hot-air-balloon', label: 'Hot Air Balloon', icon: '🎈', group: 'Sky Adventures' },
      { value: 'safari', label: 'Safari & Wildlife', icon: '🦁', group: 'Nature & Wildlife' },
      { value: 'northern-lights', label: 'Northern Lights', icon: '🌌', group: 'Nature & Wildlife' },
      { value: 'desert', label: 'Desert Experience', icon: '🏜️', group: 'Nature & Wildlife' },
      { value: 'reindeer-sledging', label: 'Reindeer Sledging', icon: '🦌', group: 'Nature & Wildlife' },
      { value: 'scenic-train', label: 'Scenic Train Ride', icon: '🚂', group: 'Scenic & Cultural' },
      { value: 'unesco', label: 'UNESCO Heritage Sites', icon: '🏛️', group: 'Scenic & Cultural' },
      { value: 'museums', label: 'Museums', icon: '🖼️', group: 'Scenic & Cultural' },
      { value: 'cycling', label: 'Cycling Tours', icon: '🚴', group: 'Scenic & Cultural' },
      { value: 'all-inclusive', label: 'All Inclusive Resort', icon: '🏖️', group: 'Scenic & Cultural' },
      { value: 'none', label: 'Keep it Relaxed', icon: '😌' },
    ],
    defaultValue: [],
  },
  {
    id: 'continentPreference',
    questionText: 'Which regions are you drawn to?',
    subtitle: "Dream wide - we'll find the perfect match within your chosen horizons.",
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
    questionText: 'Where will your journey begin?',
    subtitle: 'This helps us find the best routes and travel times for you.',
    inputType: 'text-input',
    placeholder: 'e.g., Tokyo, Paris, New York...',
    defaultValue: '',
  },
  {
    id: 'travelMonth',
    questionText: 'When do you want to travel?',
    subtitle: "Timing shapes everything - weather, crowds, and hidden gems.",
    inputType: 'single-select',
    options: [
      { value: 'jan', label: 'January', icon: '❄️' },
      { value: 'feb', label: 'February', icon: '💕' },
      { value: 'mar', label: 'March', icon: '🌱' },
      { value: 'apr', label: 'April', icon: '🌸' },
      { value: 'may', label: 'May', icon: '☀️' },
      { value: 'jun', label: 'June', icon: '🌻' },
      { value: 'jul', label: 'July', icon: '🏖️' },
      { value: 'aug', label: 'August', icon: '🌅' },
      { value: 'sep', label: 'September', icon: '🍂' },
      { value: 'oct', label: 'October', icon: '🍁' },
      { value: 'nov', label: 'November', icon: '🌧️' },
      { value: 'dec', label: 'December', icon: '🎄' },
      { value: 'flexible', label: "I'm Flexible", icon: '✨' },
    ],
    defaultValue: '',
  },
  {
    id: 'travelCompanions',
    questionText: "Who's joining you?",
    subtitle: 'Your travel companions shape the kind of experience we recommend.',
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
    subtitle: "Whether it's a weekend or a month, we'll plan every day beautifully.",
    inputType: 'slider',
    sliderConfig: {
      min: 3,
      max: 30,
      step: 1,
      labels: ['Weekend', '1 Week', '2 Weeks', '3 Weeks', 'Month'],
      unit: 'days',
      emotionalLabels: [
        { range: [3, 4], label: 'A quick escape' },
        { range: [5, 7], label: 'A refreshing break' },
        { range: [8, 14], label: 'A full immersion' },
        { range: [15, 21], label: 'A deep exploration' },
        { range: [22, 30], label: 'A once-in-a-lifetime journey' },
      ],
    },
    defaultValue: 7,
  },
  {
    id: 'weatherPreference',
    questionText: 'What weather do you prefer?',
    subtitle: "Sun or snow - there's magic in every climate.",
    inputType: 'slider',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 25,
      labels: ['Cold & Snowy', 'Cool & Mild', 'Warm & Pleasant', 'Hot & Tropical'],
      emotionalLabels: [
        { range: [0, 0], label: 'Crisp mountain air and cozy firesides' },
        { range: [25, 25], label: 'Fresh breezes and gentle sunshine' },
        { range: [50, 50], label: 'Golden light and comfortable warmth' },
        { range: [75, 75], label: 'Tropical heat and endless blue skies' },
        { range: [100, 100], label: 'Blazing sun and ocean-warm nights' },
      ],
    },
    defaultValue: 50,
  },
  {
    id: 'travelPace',
    questionText: 'How do you like to explore?',
    subtitle: "There's no wrong answer - only your rhythm.",
    inputType: 'slider',
    sliderConfig: {
      min: 0,
      max: 100,
      step: 25,
      labels: ['Slow & Relaxed', 'Balanced', 'Active & Packed'],
      emotionalLabels: [
        { range: [0, 0], label: 'Linger over coffee, wander without a plan' },
        { range: [25, 25], label: 'A gentle mix of discovery and downtime' },
        { range: [50, 50], label: 'See the highlights with room to breathe' },
        { range: [75, 75], label: 'Packed days with purposeful energy' },
        { range: [100, 100], label: 'Every hour an adventure, every day a story' },
      ],
    },
    defaultValue: 50,
  },
];
