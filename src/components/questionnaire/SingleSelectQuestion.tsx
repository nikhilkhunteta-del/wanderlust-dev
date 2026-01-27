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
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'option-chip',
            selected === option.value && 'option-chip-selected'
          )}
        >
          {option.icon && <span className="mr-2">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
};
