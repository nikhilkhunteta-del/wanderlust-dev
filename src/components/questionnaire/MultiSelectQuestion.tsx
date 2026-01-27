import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
  icon?: string;
}

interface MultiSelectQuestionProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
}

export const MultiSelectQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 4,
}: MultiSelectQuestionProps) => {
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
        Select up to {maxSelections} options
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleOption(option.value)}
            className={cn(
              'option-chip',
              selected.includes(option.value) && 'option-chip-selected'
            )}
          >
            {option.icon && <span className="mr-2">{option.icon}</span>}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};
