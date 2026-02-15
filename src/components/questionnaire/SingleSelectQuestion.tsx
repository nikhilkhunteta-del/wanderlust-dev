import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: string;
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
  return (
    <div className="flex flex-wrap justify-center gap-3">
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
              isSelected && 'option-chip-selected'
            )}
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            {option.label}
          </motion.button>
        );
      })}
    </div>
  );
};
