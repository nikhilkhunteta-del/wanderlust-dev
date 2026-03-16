import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhenAndHowLongQuestionProps {
  monthOptions: { value: string; label: string; icon?: string }[];
  durationOptions: { value: string; label: string; icon?: string; description?: string }[];
  selectedMonth: string;
  selectedDuration: string;
  onMonthChange: (value: string) => void;
  onDurationChange: (value: string) => void;
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

export const WhenAndHowLongQuestion = ({
  monthOptions,
  durationOptions,
  selectedMonth,
  selectedDuration,
  onMonthChange,
  onDurationChange,
}: WhenAndHowLongQuestionProps) => {
  const months = monthOptions.filter((o) => o.value !== 'flexible');
  const flexibleOption = monthOptions.find((o) => o.value === 'flexible');
  const insight = selectedMonth ? MONTH_INSIGHTS[selectedMonth] : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Month grid */}
      <div
        className="grid grid-cols-3 md:grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Select travel month"
      >
        {months.map((option) => {
          const isSelected = selectedMonth === option.value;
          return (
            <motion.button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onMonthChange(option.value)}
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
            aria-checked={selectedMonth === flexibleOption.value}
            onClick={() => onMonthChange(flexibleOption.value)}
            animate={{ scale: selectedMonth === flexibleOption.value ? 1.02 : 1 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'option-chip',
              selectedMonth === flexibleOption.value && 'option-chip-selected'
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
            key={selectedMonth}
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

      {/* Divider */}
      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">How long?</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Duration cards */}
      <div className="grid grid-cols-5 gap-2 w-full max-[640px]:grid-cols-2">
        {durationOptions.map((option, index) => {
          const isSelected = selectedDuration === option.value;
          const isLastOdd = durationOptions.length % 2 !== 0 && index === durationOptions.length - 1;
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onDurationChange(option.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative flex flex-col items-center justify-center text-center rounded-xl px-2 py-4 cursor-pointer transition-all duration-200',
                'min-h-[88px]',
                isLastOdd && 'max-[640px]:col-span-2',
                isSelected
                  ? 'ring-2 ring-primary bg-primary/10 shadow-md shadow-primary/10'
                  : 'ring-1 ring-border/50 bg-card/50 hover:ring-border hover:bg-card/80'
              )}
            >
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-primary-foreground" />
                </motion.div>
              )}
              {option.icon && <span className="text-2xl mb-1">{option.icon}</span>}
              <span className="text-sm font-medium text-foreground">{option.label}</span>
              {option.description && (
                <span className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{option.description}</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
