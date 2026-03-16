import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface SingleSelectQuestionProps {
  options: Option[];
  selected: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'card-grid' | 'journey-scale';
}

export const SingleSelectQuestion = ({
  options,
  selected,
  onChange,
  variant = 'default',
}: SingleSelectQuestionProps) => {
  if (variant === 'journey-scale') {
    return (
      <div className="grid grid-cols-5 gap-2 w-full max-w-3xl mx-auto max-[640px]:grid-cols-2">
        {options.map((option, index) => {
          const isSelected = selected === option.value;
          const isLastOdd = options.length % 2 !== 0 && index === options.length - 1;
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
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
    );
  }

  if (variant === 'card-grid') {
    return (
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {options.map((option, index) => {
          const isSelected = selected === option.value;
          const isLastOdd = options.length % 2 !== 0 && index === options.length - 1;
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'relative flex flex-col items-center justify-center text-center rounded-xl px-3 py-4 cursor-pointer transition-all duration-200',
                'min-h-[80px]',
                isLastOdd && 'col-span-2',
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
    );
  }

  const hasDescriptions = options.some((o) => o.description);

  return (
    <div className={cn(
      'flex flex-wrap justify-center gap-3',
      hasDescriptions && 'flex-col items-center max-w-lg mx-auto'
    )}>
      {options.map((option) => {
        const isSelected = selected === option.value;
        return (
          <motion.button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            animate={{ scale: isSelected ? 1.02 : 1 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className={cn(
              'option-chip',
              isSelected && 'option-chip-selected',
              hasDescriptions && 'w-full flex-col items-start text-left py-3 px-4'
            )}
          >
            <span className="flex items-center">
              {option.icon && <span className="mr-2">{option.icon}</span>}
              {option.label}
            </span>
            {option.description && (
              <span className="text-xs text-muted-foreground mt-0.5">{option.description}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};
