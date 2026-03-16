import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface InterestGridQuestionProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
  primaryInterest?: string;
  onPrimaryChange?: (value: string) => void;
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

export const InterestGridQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 4,
  primaryInterest,
  onPrimaryChange,
}: InterestGridQuestionProps) => {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      const newSelected = selected.filter((v) => v !== value);
      onChange(newSelected);
      // Clear primary if deselected
      if (primaryInterest === value && onPrimaryChange) {
        onPrimaryChange(newSelected[0] || '');
      }
    } else if (selected.length < maxSelections) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-border/60 text-[13px] font-medium text-muted-foreground">
          Select up to {maxSelections}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[860px] mx-auto">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-4 transition-all duration-150 cursor-pointer min-h-[80px]',
                'bg-card shadow-sm hover:shadow-md',
                isSelected
                  ? 'border-primary bg-[hsl(var(--primary)/0.06)]'
                  : 'border-border/50 hover:border-border'
              )}
            >
              {option.icon && <span className="text-2xl">{option.icon}</span>}
              <span className="text-sm font-medium text-foreground leading-tight">{option.label}</span>
              {option.description && (
                <span className="text-[11px] text-muted-foreground leading-tight">{option.description}</span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Inline primary interest picker */}
      {selected.length >= 2 && onPrimaryChange && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="pt-3 border-t border-border/30"
        >
          <p className="text-sm text-muted-foreground text-center mb-3">
            What's this trip mainly about? <span className="text-xs opacity-70">Pick your main focus</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.map((val) => (
              <motion.button
                key={val}
                type="button"
                onClick={() => onPrimaryChange(val)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border',
                  primaryInterest === val
                    ? 'border-primary bg-[hsl(var(--primary)/0.1)] text-primary'
                    : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                )}
              >
                {INTEREST_LABELS[val] || val}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
