import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface InterestGridQuestionProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

export const InterestGridQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 4,
}: InterestGridQuestionProps) => {
  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < maxSelections) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Select up to {maxSelections}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[680px] mx-auto">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-5 transition-all duration-150 cursor-pointer min-h-[80px]',
                'bg-card shadow-sm hover:shadow-md',
                isSelected
                  ? 'border-primary bg-accent/30'
                  : 'border-border/50 hover:border-border'
              )}
            >
              {option.icon && <span className="text-2xl">{option.icon}</span>}
              <span className="text-sm font-medium text-foreground">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
