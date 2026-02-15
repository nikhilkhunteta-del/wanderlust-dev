import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface MonthGridQuestionProps {
  options: Option[];
  selected: string;
  onChange: (value: string) => void;
}

const MONTH_INSIGHTS: Record<string, string> = {
  jan: 'Crisp winter escapes, northern lights season, and tropical warmth below the equator.',
  feb: 'Carnival energy in Brazil, quieter European cities, and ideal Southeast Asian weather.',
  mar: 'Spring awakens across the Mediterranean, whale season in Baja, and desert wildflowers.',
  apr: 'Cherry blossoms in Japan, spring blooms in Europe, and warm desert days in Morocco.',
  may: 'Shoulder season magic — fewer crowds, perfect temperatures, and longer golden evenings.',
  jun: 'European summer begins, midnight sun in Scandinavia, and safari season in East Africa.',
  jul: 'Peak summer adventures, festival season worldwide, and Patagonian winter escapes.',
  aug: 'Mediterranean warmth, Mongolian steppes at their greenest, and Australian ski season.',
  sep: 'Harvest festivals, autumn colors beginning, and ideal conditions across the Middle East.',
  oct: 'Fall foliage in New England and Japan, Oktoberfest, and the Sahara at its most pleasant.',
  nov: 'Southern hemisphere spring, Diwali celebrations, and the start of Caribbean high season.',
  dec: 'Christmas markets in Europe, summer in the southern hemisphere, and tropical island retreats.',
  flexible: 'We\'ll find the best time for your ideal destination — weather, crowds, and all.',
};

export const MonthGridQuestion = ({
  options,
  selected,
  onChange,
}: MonthGridQuestionProps) => {
  // Separate months from the "flexible" option
  const months = options.filter((o) => o.value !== 'flexible');
  const flexibleOption = options.find((o) => o.value === 'flexible');
  const insight = selected ? MONTH_INSIGHTS[selected] : null;

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Month grid — 4 columns on md, 3 on small */}
      <div
        className="grid grid-cols-3 md:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Select travel month"
      >
        {months.map((option) => {
          const isSelected = selected === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              animate={{ scale: isSelected ? 1.03 : 1 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-sm font-medium',
                'transition-all duration-150 ease-out cursor-pointer select-none',
                'border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected &&
                  'border-primary bg-primary/15 text-primary shadow-md shadow-primary/10'
              )}
            >
              <span className="text-lg leading-none">{option.icon}</span>
              <span>{option.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Flexible option */}
      {flexibleOption && (
        <div className="flex justify-center">
          <motion.button
            type="button"
            role="radio"
            aria-checked={selected === flexibleOption.value}
            onClick={() => onChange(flexibleOption.value)}
            animate={{ scale: selected === flexibleOption.value ? 1.02 : 1 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'option-chip',
              selected === flexibleOption.value && 'option-chip-selected'
            )}
          >
            {flexibleOption.icon && <span className="mr-2">{flexibleOption.icon}</span>}
            {flexibleOption.label}
          </motion.button>
        </div>
      )}

      {/* Contextual insight */}
      <AnimatePresence mode="wait">
        {insight && (
          <motion.p
            key={selected}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-sm text-muted-foreground text-center italic leading-relaxed px-2"
          >
            {insight}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
