export interface TravelPreferences {
  interests: string[];
  primaryInterest: string;
  adventureExperiences: string[];
  foodDepth: string;
  departureCity: string;
  travelMonth: string;
  travelCompanions: string;
  tripDuration: string;
  noveltyPreference: string;
}

export interface QuestionConfig {
  id: keyof TravelPreferences;
  questionText: string;
  subtitle: string;
  inputType: 'multi-select' | 'single-select' | 'slider' | 'dropdown' | 'text-input';
  options?: { value: string; label: string; icon?: string; group?: string; description?: string }[];
  sliderConfig?: {
    min: number;
    max: number;
    step: number;
    labels: string[];
    unit?: string;
    emotionalLabels?: { range: [number, number]; label: string }[];
    tickMarks?: { value: number; label: string }[];
  };
  placeholder?: string;
  defaultValue: string | string[] | number;
  grouped?: boolean;
}

// Adventure experience category mapping from Q1 interests
const ADVENTURE_CATEGORY_MAP: Record<string, string[] | null> = {
  'culture-history': ['Scenic & Cultural'],
  'nature-outdoors': ['Water Adventures', 'Mountain Adventures', 'Nature & Wildlife', 'Sky Adventures'],
  'beach-coastal': ['Water Adventures'],
  'food-culinary': null,
  'arts-music-nightlife': null,
  'active-sport': ['Mountain Adventures', 'Water Adventures', 'Sky Adventures'],
  'shopping-markets': null,
  'wellness-slow-travel': null,
};

export function getRelevantAdventureCategories(q1Selections: string[]): string[] | null {
  // Skip Q2 entirely if only shopping/wellness/arts selected
  if (q1Selections.every(s => ['shopping-markets', 'wellness-slow-travel', 'arts-music-nightlife'].includes(s))) {
    return null;
  }

  const relevant = new Set<string>();
  for (const interest of q1Selections) {
    const cats = ADVENTURE_CATEGORY_MAP[interest];
    if (cats) cats.forEach((c) => relevant.add(c));
  }
  return relevant.size > 0 ? Array.from(relevant) : null;
}

export function shouldShowFoodQuestion(q1Selections: string[]): boolean {
  return q1Selections.length === 1 && q1Selections[0] === 'food-culinary';
}

// All adventure experience options
export const ADVENTURE_OPTIONS: { value: string; label: string; icon?: string; group?: string }[] = [
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
];

export const FOOD_DEPTH_QUESTION: QuestionConfig = {
  id: 'foodDepth',
  questionText: 'What kind of food experiences?',
  subtitle: "Let's match you with the perfect culinary destinations.",
  inputType: 'single-select',
  options: [
    { value: 'street-food', label: 'Street food & markets', icon: '🥘' },
    { value: 'cooking-classes', label: 'Cooking classes & workshops', icon: '👨‍🍳' },
    { value: 'fine-dining', label: 'Fine dining & wine', icon: '🍷' },
    { value: 'local-hidden', label: 'Local hidden spots', icon: '🗺️' },
    { value: 'all-food', label: 'All of the above', icon: '🍽️' },
  ],
  defaultValue: '',
};

// Base questions (excluding dynamic Q2)
export const QUESTIONS: QuestionConfig[] = [
  {
    id: 'interests',
    questionText: 'What experiences excite you most?',
    subtitle: "We'll use this to shape places you'll truly love.",
    inputType: 'multi-select',
    options: [
      { value: 'culture-history', label: 'Culture & History', icon: '🏛', description: 'Museums, heritage, ancient sites' },
      { value: 'nature-outdoors', label: 'Nature & Outdoors', icon: '🌿', description: 'Landscapes, parks, wildlife' },
      { value: 'beach-coastal', label: 'Beach & Coastal', icon: '🏖', description: 'Coastlines, islands, ocean' },
      { value: 'food-culinary', label: 'Food & Culinary', icon: '🍜', description: 'Markets, restaurants, local flavours' },
      { value: 'arts-music-nightlife', label: 'Arts, Music & Nightlife', icon: '🎭', description: 'Live music, theatre, festivals, bars' },
      { value: 'active-sport', label: 'Active & Sport', icon: '🚴', description: 'Cycling, hiking, golf, skiing' },
      { value: 'shopping-markets', label: 'Shopping & Markets', icon: '🛍', description: 'Street markets, boutiques, crafts' },
      { value: 'wellness-slow-travel', label: 'Wellness & Slow Travel', icon: '🧘', description: 'Spas, retreats, restorative pace' },
    ],
    defaultValue: [],
  },
  // Q2 (adventureExperiences or foodDepth) is inserted dynamically
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
    inputType: 'single-select',
    options: [
      { value: '3', label: 'Weekend', icon: '🌙', description: '2–3 days' },
      { value: '5', label: 'Short break', icon: '☀️', description: '4–5 days' },
      { value: '7', label: 'One week', icon: '✈️', description: '7 days' },
      { value: '14', label: 'Two weeks', icon: '🗺️', description: '14 days' },
      { value: '21', label: 'Extended trip', icon: '🌍', description: '21+ days' },
    ],
    defaultValue: '',
  },
  {
    id: 'noveltyPreference',
    questionText: 'How do you like to discover?',
    subtitle: 'Helps us choose between celebrated classics and hidden gems.',
    inputType: 'single-select',
    options: [
      { value: 'classics', label: 'The classics done well', icon: '🏠', description: 'Iconic destinations, done properly' },
      { value: 'mix', label: 'A mix of known and new', icon: '🗺️', description: 'Some familiar, some surprising' },
      { value: 'off-beaten-path', label: 'Off the beaten path', icon: '🌍', description: 'Somewhere most travellers miss' },
      { value: 'surprise', label: 'Surprise me completely', icon: '🎲', description: 'I trust you entirely' },
    ],
    defaultValue: '',
  },
];

/**
 * Build the dynamic question list based on Q1 selections.
 * Inserts adventure Q2, food Q2, or skips Q2 entirely.
 */
export function buildDynamicQuestions(interests: string[]): QuestionConfig[] {
  const baseQuestions = [...QUESTIONS];
  const categories = getRelevantAdventureCategories(interests);
  const showFood = shouldShowFoodQuestion(interests);

  if (categories) {
    const filteredOptions = ADVENTURE_OPTIONS.filter(
      (opt) => !opt.group || categories.includes(opt.group)
    );
    const adventureQ: QuestionConfig = {
      id: 'adventureExperiences',
      questionText: 'Which experiences call to you?',
      subtitle: "Pick the adventures that make your heart race - or none at all.",
      inputType: 'multi-select',
      grouped: true,
      options: filteredOptions,
      defaultValue: [],
    };
    baseQuestions.splice(1, 0, adventureQ);
  } else if (showFood) {
    baseQuestions.splice(1, 0, FOOD_DEPTH_QUESTION);
  }

  return baseQuestions;
}
