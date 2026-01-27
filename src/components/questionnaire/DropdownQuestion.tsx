import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Option {
  value: string;
  label: string;
}

interface DropdownQuestionProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const DropdownQuestion = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
}: DropdownQuestionProps) => {
  return (
    <div className="max-w-sm mx-auto">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-14 text-lg bg-card border-2 border-border hover:border-primary/50 transition-colors">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className="text-base py-3">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
