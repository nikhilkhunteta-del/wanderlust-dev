import { Slider } from '@/components/ui/slider';

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  labels: string[];
  unit?: string;
}

interface SliderQuestionProps {
  config: SliderConfig;
  value: number;
  onChange: (value: number) => void;
}

export const SliderQuestion = ({ config, value, onChange }: SliderQuestionProps) => {
  const { min, max, step, labels, unit } = config;

  const getLabel = () => {
    const percentage = ((value - min) / (max - min)) * 100;
    const labelIndex = Math.min(
      Math.floor((percentage / 100) * labels.length),
      labels.length - 1
    );
    return labels[labelIndex];
  };

  return (
    <div className="space-y-8 px-4 max-w-md mx-auto">
      <div className="text-center">
        <div className="text-4xl font-display font-semibold text-primary">
          {value}
          {unit && <span className="text-2xl ml-1 text-muted-foreground">{unit}</span>}
        </div>
        <div className="text-lg text-muted-foreground mt-1">{getLabel()}</div>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0])}
        className="w-full"
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
};
