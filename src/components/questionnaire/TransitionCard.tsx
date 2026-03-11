import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TransitionCardProps {
  interests: string[];
}

const INTEREST_LABELS: Record<string, string> = {
  'culture-history': 'Culture & History',
  'nature-outdoors': 'Nature & Outdoors',
  'beach-coastal': 'Beach & Coastal',
  'food-culinary': 'Food & Culinary',
  'arts-music-nightlife': 'Arts, Music & Nightlife',
  'active-sport': 'Active & Sport',
  'shopping-markets': 'Shopping & Markets',
  'wellness-slow-travel': 'Wellness & Slow Travel',
};

export const TransitionCard = ({ interests }: TransitionCardProps) => {
  const labels = interests.slice(0, 2).map((i) => INTEREST_LABELS[i] || i);

  const message =
    labels.length === 1
      ? `A ${labels[0].toLowerCase()} lover — we have some perfect matches in mind.`
      : `${labels[0]} and ${labels[1]} — we know exactly where to take you.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto text-center py-16"
    >
      <motion.div
        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        className="mb-6"
      >
        <Sparkles className="w-10 h-10 text-primary mx-auto" />
      </motion.div>
      <p className="text-2xl md:text-3xl font-display font-semibold text-foreground leading-relaxed">
        {message}
      </p>
    </motion.div>
  );
};
