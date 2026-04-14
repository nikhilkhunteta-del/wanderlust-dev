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

const SEASONAL_BORDER: Record<string, string> = {
  dec: '#B8D4E8', jan: '#B8D4E8', feb: '#B8D4E8',
  mar: '#B8D4B0', apr: '#B8D4B0', may: '#B8D4B0',
  jun: '#F0C070', jul: '#F0C070', aug: '#F0C070',
  sep: '#D4845A', oct: '#D4845A', nov: '#D4845A',
};

export const MonthGridQuestion = ({
  options,
  selected,
  onChange,
}: MonthGridQuestionProps) => {
  const months = options.filter((o) => o.value !== 'flexible');
  const flexibleOption = options.find((o) => o.value === 'flexible');
  const insight = selected ? MONTH_INSIGHTS[selected] : null;

  return (
    <div className="space-y-5 w-full">
      <div
        className="grid grid-cols-3 md:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Select travel month"
      >
        {months.map((option) => {
          const isSelected = selected === option.value;
          const borderColor = SEASONAL_BORDER[option.value] || '#C8B89A';
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              animate={{ scale: isSelected ? 1.03 : 1 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{
                borderBottomWidth: isSelected ? '4px' : '3px',
                borderBottomColor: borderColor,
              }}
              className={cn(
                'flex items-center justify-center rounded-xl border-2 px-3 py-3 text-sm font-bold',
                'transition-all duration-150 ease-out cursor-pointer select-none',
                'border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected &&
                  'border-primary bg-primary/15 text-primary shadow-md shadow-primary/10'
              )}
            >
              <span>{option.label}</span>
            </motion.button>
          );
        })}
      </div>

      {flexibleOption && (
        <div className="flex justify-center">
          <motion.button
            type="button"
            role="radio"
            aria-checked={selected === flexibleOption.value}
            onClick={() => onChange(flexibleOption.value)}
            animate={{ scale: selected === flexibleOption.value ? 1.02 : 1 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            style={{
              borderBottomWidth: '3px',
              borderBottomColor: '#C8B89A',
            }}
            className={cn(
              'option-chip',
              selected === flexibleOption.value && 'option-chip-selected'
            )}
          >
            {flexibleOption.label}
          </motion.button>
        </div>
      )}

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
