import { Input } from '@/components/ui/input';
import { MapPin } from 'lucide-react';

interface TextInputQuestionProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TextInputQuestion = ({
  value,
  onChange,
  placeholder = 'Enter your city...',
}: TextInputQuestionProps) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-12 py-6 text-lg rounded-xl border-2 border-border/50 bg-card/50 backdrop-blur-sm focus:border-primary/50 transition-colors"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-3 text-center">
        Enter any city name worldwide
      </p>
    </div>
  );
};
