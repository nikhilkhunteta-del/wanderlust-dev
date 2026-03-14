import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CulturalMoment } from '@/data/culturalMoments';

interface CulturalMomentsQuestionProps {
  moments: CulturalMoment[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onSkip: () => void;
}

export const CulturalMomentsQuestion = ({
  moments,
  selected,
  onChange,
  onSkip,
}: CulturalMomentsQuestionProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const toggleMoment = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < 2) {
      onChange([...selected, value]);
    }
  };

  const handleImageError = (value: string) => {
    setImageErrors((prev) => new Set(prev).add(value));
  };

  const formatMonth = (months: string[]) => {
    if (months.length === 0) return '';
    const month = months[0];
    return month.charAt(0).toUpperCase() + month.slice(1, 3);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 max-w-[600px] mx-auto">
        {moments.map((moment) => {
          const isSelected = selected.includes(moment.value);
          const hasError = imageErrors.has(moment.value);

          return (
            <motion.button
              key={moment.value}
              type="button"
              onClick={() => toggleMoment(moment.value)}
              whileTap={{ scale: 0.97 }}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
                  : 'ring-1 ring-border/50 hover:ring-border'
              }`}
              style={{ width: '100%', height: 180 }}
            >
              {/* Image */}
              {!hasError ? (
                <img
                  src={moment.image.url}
                  alt={moment.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={() => handleImageError(moment.value)}
                />
              ) : (
                <div className="absolute inset-0 bg-muted" />
              )}

              {/* Dark gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

              {/* Month badge top-right */}
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                {formatMonth(moment.months)}
              </span>

              {/* Selected checkmark overlay */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.div>
              )}

              {/* Text at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <p className="text-sm font-semibold text-white leading-tight">
                  {moment.label}
                </p>
                <p className="text-[11px] text-white/70 mt-0.5">
                  {moment.location}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Skip link */}
      <div className="text-center pt-1">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/40"
        >
          None of these — just match my interests →
        </button>
      </div>
    </div>
  );
};
