import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface InterestGridQuestionProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
  primaryInterest?: string;
  onPrimaryChange?: (value: string) => void;
  discoveryStyle?: string;
  onDiscoveryChange?: (value: string) => void;
}

const INTEREST_LABELS: Record<string, string> = {
  'culture-experiences': 'Culture & Experiences',
  'sun-rest': 'Sun & Rest',
  'nature-adventure': 'Nature & Adventure',
  'food-nightlife': 'Food & Nightlife',
  'wellness': 'Wellness',
  'celebration': 'Celebration',
};

const DISCOVERY_OPTIONS = [
  { value: 'classics', label: 'Stick to the classics' },
  { value: 'off-beaten-path', label: 'Open to hidden gems' },
  { value: 'surprise', label: 'Surprise me completely' },
];

export const InterestGridQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 4,
  primaryInterest,
  onPrimaryChange,
  discoveryStyle,
  onDiscoveryChange,
}: InterestGridQuestionProps) => {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const fetchImages = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('q1-category-images');
        if (!error && data) {
          setCategoryImages(data as Record<string, string>);
        }
      } catch (err) {
        console.error('Failed to fetch category images:', err);
      }
    };
    fetchImages();
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      const newSelected = selected.filter((v) => v !== value);
      onChange(newSelected);
      if (primaryInterest === value && onPrimaryChange) {
        onPrimaryChange(newSelected[0] || '');
      }
    } else if (selected.length < maxSelections) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-center">
        <span className="inline-flex items-center px-3.5 py-1 rounded-full border border-border/60 text-[13px] font-medium text-muted-foreground">
          Select up to {maxSelections}
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const bgUrl = categoryImages[option.value];
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex flex-col rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer',
                'shadow-sm hover:shadow-lg bg-card',
                isSelected
                  ? 'border-[3px] border-primary'
                  : 'border border-border/40 hover:border-border/60',
              )}
            >
              {/* Square image area */}
              <div className="relative w-full flex-none aspect-[4/3] overflow-hidden">
                {bgUrl ? (
                  <img src={bgUrl} alt={option.label} loading="eager" className="w-full h-full object-cover object-center block" />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>

              {/* Text area */}
              <div className="flex flex-col gap-1 px-5 py-4 text-left">
                <span className="font-semibold tracking-[0.1em] uppercase text-foreground text-sm">
                  {option.label}
                </span>
                {option.description && (
                  <span className="leading-relaxed text-muted-foreground text-sm">
                    {option.description}
                  </span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Inline primary interest picker */}
      {selected.length >= 2 && onPrimaryChange && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="pt-3 border-t border-border/30"
        >
          <p className="text-sm text-muted-foreground text-center mb-3">
            What's this trip mainly about? <span className="text-xs opacity-70">Pick your main focus</span>
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {selected.map((val) => (
              <motion.button
                key={val}
                type="button"
                onClick={() => onPrimaryChange(val)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border',
                  primaryInterest === val
                    ? 'border-primary bg-[hsl(var(--primary)/0.1)] text-primary'
                    : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                )}
              >
                {INTEREST_LABELS[val] || val}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Discovery style toggle */}
      {onDiscoveryChange && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="pt-3 border-t border-border/30"
        >
          <p className="text-sm text-muted-foreground text-center mb-3">
            How do you like to discover?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {DISCOVERY_OPTIONS.map((opt) => (
              <motion.button
                key={opt.value}
                type="button"
                onClick={() => onDiscoveryChange(opt.value)}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer border',
                  discoveryStyle === opt.value
                    ? 'border-primary bg-[hsl(var(--primary)/0.1)] text-primary'
                    : 'border-border/50 bg-card text-muted-foreground hover:border-border'
                )}
              >
                {opt.label}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
