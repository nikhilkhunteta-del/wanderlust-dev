import { motion } from 'framer-motion';
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
}

export const SingleSelectQuestion = ({
  options,
  selected,
  onChange,
}: SingleSelectQuestionProps) => {
  const hasDescriptions = options.some((o) => o.description);

  return (
    <div className={cn(
      'flex flex-wrap justify-center gap-3',
      hasDescriptions && 'flex-col items-center max-w-md mx-auto'
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
