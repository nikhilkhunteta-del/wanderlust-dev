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

// Experience category definitions for Q2
export interface ExperienceCategory {
  id: string;
  label: string;
  icon: string;
  triggeredBy: string[];
  experiences: { value: string; label: string; icon: string }[];
}

export const EXPERIENCE_CATEGORIES: ExperienceCategory[] = [
  {
    id: 'water-ocean',
    label: 'Water & Ocean',
    icon: '🌊',
    triggeredBy: ['beach-coastal', 'nature-outdoors', 'active-sport'],
    experiences: [
      { value: 'scuba-diving', label: 'Scuba Diving', icon: '🤿' },
      { value: 'snorkelling', label: 'Snorkelling', icon: '🐠' },
      { value: 'surfing', label: 'Surfing', icon: '🏄' },
      { value: 'kayaking', label: 'Kayaking & Paddleboarding', icon: '🛶' },
      { value: 'whale-watching', label: 'Whale Watching', icon: '🐋' },
      { value: 'whale-sharks', label: 'Swimming with Whale Sharks', icon: '🦈' },
      { value: 'river-rafting', label: 'River Rafting', icon: '🚣' },
    ],
  },
  {
    id: 'sky-heights',
    label: 'Sky & Heights',
    icon: '🪂',
    triggeredBy: ['active-sport', 'nature-outdoors'],
    experiences: [
      { value: 'paragliding', label: 'Paragliding', icon: '🪂' },
      { value: 'skydiving', label: 'Skydiving', icon: '🎯' },
      { value: 'bungee-jumping', label: 'Bungee Jumping', icon: '⬇' },
      { value: 'hot-air-balloon', label: 'Hot Air Balloon', icon: '🎈' },
    ],
  },
  {
    id: 'mountain-land',
    label: 'Mountain & Land',
    icon: '🏔',
    triggeredBy: ['active-sport', 'nature-outdoors'],
    experiences: [
      { value: 'hiking-trekking', label: 'Hiking & Trekking', icon: '🥾' },
      { value: 'skiing', label: 'Skiing & Snowboarding', icon: '⛷' },
      { value: 'cycling-routes', label: 'Cycling Routes', icon: '🚴' },
      { value: 'volcano-trekking', label: 'Volcano Trekking', icon: '🌋' },
      { value: 'camping', label: 'Camping & Wild Stays', icon: '⛺' },
    ],
  },
  {
    id: 'wildlife-nature',
    label: 'Wildlife & Nature',
    icon: '🦁',
    triggeredBy: ['nature-outdoors'],
    experiences: [
      { value: 'safari', label: 'Safari', icon: '🦁' },
      { value: 'northern-lights', label: 'Northern Lights', icon: '🌌' },
      { value: 'stargazing', label: 'Stargazing', icon: '⭐' },
      { value: 'reindeer-sledging', label: 'Reindeer Sledging', icon: '🦌' },
      { value: 'dog-sledding', label: 'Dog Sledding', icon: '🐕' },
      { value: 'cave-exploration', label: 'Cave Exploration', icon: '🕳' },
    ],
  },
  {
    id: 'landscapes',
    label: 'Landscapes & Journeys',
    icon: '🏜',
    triggeredBy: ['nature-outdoors', 'culture-history'],
    experiences: [
      { value: 'desert-experience', label: 'Desert Experience', icon: '🏜' },
      { value: 'scenic-train', label: 'Scenic Train Journey', icon: '🚂' },
    ],
  },
  {
    id: 'culture-heritage',
    label: 'Culture & Heritage',
    icon: '🏛',
    triggeredBy: ['culture-history'],
    experiences: [
      { value: 'unesco-sites', label: 'UNESCO Heritage Sites', icon: '🏛' },
      { value: 'museums-galleries', label: 'Museums & Galleries', icon: '🖼' },
      { value: 'cultural-performance', label: 'Cultural Performances', icon: '🎭' },
      { value: 'ancient-ruins', label: 'Ancient Ruins & Archaeology', icon: '🗿' },
    ],
  },
  {
    id: 'food-drink',
    label: 'Food & Drink',
    icon: '🍜',
    triggeredBy: ['food-culinary'],
    experiences: [
      { value: 'street-food-tours', label: 'Street Food Tours', icon: '🍢' },
      { value: 'cooking-classes', label: 'Cooking Classes', icon: '👨‍🍳' },
      { value: 'wine-vineyards', label: 'Wine & Vineyard Tours', icon: '🍷' },
      { value: 'food-markets', label: 'Food Market Exploration', icon: '🥬' },
    ],
  },
  {
    id: 'wellness',
    label: 'Wellness & Restoration',
    icon: '🧘',
    triggeredBy: ['wellness-slow-travel'],
    experiences: [
      { value: 'thermal-baths', label: 'Thermal Baths & Hot Springs', icon: '♨️' },
      { value: 'yoga-retreats', label: 'Yoga & Meditation Retreats', icon: '🧘' },
      { value: 'spa-hammam', label: 'Spa & Hammam', icon: '💆' },
    ],
  },
];

/**
 * Get relevant experience categories based on Q1 selections.
 * Returns null if Q2 should be skipped entirely.
 */
export function getRelevantCategories(q1Selections: string[]): ExperienceCategory[] | null {
  // Skip Q2 entirely if only shopping/arts-music-nightlife selected (no categories triggered)
  const relevant = EXPERIENCE_CATEGORIES.filter((cat) =>
    cat.triggeredBy.some((trigger) => q1Selections.includes(trigger))
  );
  return relevant.length > 0 ? relevant : null;
}

export function shouldShowFoodQuestion(q1Selections: string[]): boolean {
  // Food-only Q2 is now handled by the food-drink category in EXPERIENCE_CATEGORIES
  // This is kept for backward compat but no longer used for standalone food question
  return false;
}

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
  // Q2 (adventureExperiences) is inserted dynamically
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
 * Inserts categorized Q2 or skips Q2 entirely.
 */
export function buildDynamicQuestions(interests: string[]): QuestionConfig[] {
  const baseQuestions = [...QUESTIONS];
  const categories = getRelevantCategories(interests);

  if (categories && categories.length > 0) {
    // Flatten all relevant experiences into options with group field
    const options = categories.flatMap((cat) =>
      cat.experiences.map((exp) => ({ ...exp, group: cat.id }))
    );
    const adventureQ: QuestionConfig = {
      id: 'adventureExperiences',
      questionText: 'Which experiences call to you?',
      subtitle: "Pick the adventures that make your heart race — or skip ahead.",
      inputType: 'multi-select',
      grouped: true,
      options,
      defaultValue: [],
    };
    baseQuestions.splice(1, 0, adventureQ);
  }

  return baseQuestions;
}
