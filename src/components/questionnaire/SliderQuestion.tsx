import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';

interface EmotionalLabel {
  range: [number, number];
  label: string;
}

interface TickMark {
  value: number;
  label: string;
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  labels: string[];
  unit?: string;
  emotionalLabels?: EmotionalLabel[];
  tickMarks?: TickMark[];
}

interface SliderQuestionProps {
  config: SliderConfig;
  value: number;
  onChange: (value: number) => void;
}

export const SliderQuestion = ({ config, value, onChange }: SliderQuestionProps) => {
  const { min, max, step, labels, emotionalLabels, tickMarks } = config;

  const getLabel = () => {
    if (emotionalLabels) {
      const match = emotionalLabels.find(
        (el) => value >= el.range[0] && value <= el.range[1]
      );
      if (match) return match.label;
    }
    const percentage = ((value - min) / (max - min)) * 100;
    const labelIndex = Math.min(
      Math.floor((percentage / 100) * labels.length),
      labels.length - 1
    );
    return labels[labelIndex];
  };

  // Snap to nearest tick mark if tick marks exist
  const handleChange = (newValue: number) => {
    if (tickMarks && tickMarks.length > 0) {
      const nearest = tickMarks.reduce((prev, curr) =>
        Math.abs(curr.value - newValue) < Math.abs(prev.value - newValue) ? curr : prev
      );
      onChange(nearest.value);
    } else {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-8 px-4 max-w-md mx-auto">
      {/* Emotional descriptor only — no numeric value */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={getLabel()}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="text-xl text-foreground font-display font-medium italic"
          >
            {getLabel()}
          </motion.div>
        </AnimatePresence>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => handleChange(values[0])}
        className="w-full"
      />

      {/* Tick marks for duration slider */}
      {tickMarks && tickMarks.length > 0 ? (
        <div className="relative w-full h-6">
          {tickMarks.map((tick) => {
            const pct = ((tick.value - min) / (max - min)) * 100;
            const isActive = value === tick.value;
            return (
              <button
                key={tick.value}
                type="button"
                onClick={() => onChange(tick.value)}
                className="absolute -translate-x-1/2 flex flex-col items-center gap-0.5 cursor-pointer"
                style={{ left: `${pct}%` }}
              >
                <div
                  className={`w-1 h-1 rounded-full ${
                    isActive ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
                <span
                  className={`text-[11px] ${
                    isActive
                      ? 'text-primary font-semibold'
                      : 'text-muted-foreground/60'
                  }`}
                >
                  {tick.label}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      )}
    </div>
  );
};
