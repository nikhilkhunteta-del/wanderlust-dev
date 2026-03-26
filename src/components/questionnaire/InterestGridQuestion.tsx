import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
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
}

const INTEREST_LABELS: Record<string, string> = {
  'culture-history': 'Culture & History',
  'nature-outdoors': 'Nature & Outdoors',
  'beach-coastal': 'Beach & Coastal',
  'food-culinary': 'Food & Culinary',
  'arts-music-nightlife': 'Arts, Music & Nightlife',
  'active-sport': 'Active & Sport',
  'shopping-markets': 'Shopping & Markets',
  'wellness-slow-travel': 'Wellness & Slow Travel',
};

export const InterestGridQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 4,
  primaryInterest,
  onPrimaryChange,
}: InterestGridQuestionProps) => {
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({});

  useEffect(() => {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
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
                'relative flex flex-col justify-end rounded-xl border-2 overflow-hidden transition-all duration-150 cursor-pointer h-[280px]',
                'shadow-sm hover:shadow-lg',
                isSelected
                  ? 'border-primary ring-1 ring-primary/30 brightness-110'
                  : 'border-transparent hover:border-border/50'
              )}
              style={bgUrl ? {
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              } : undefined}
            >
              {/* Dark gradient overlay — bottom 30% */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

              {/* Fallback background if no image */}
              {!bgUrl && (
                <div className="absolute inset-0 bg-muted" />
              )}

              {/* Text content — bottom 30% */}
              <div className="relative z-10 flex flex-col items-start gap-0.5 px-5 pb-5 text-left">
                <span className={cn(
                  "text-base font-bold leading-tight drop-shadow-md",
                  bgUrl ? "text-white" : "text-foreground"
                )}>
                  {option.label}
                </span>
                {option.description && (
                  <span className={cn(
                    "text-xs leading-tight drop-shadow-sm",
                    bgUrl ? "text-white/80" : "text-muted-foreground"
                  )}>
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
    </div>
  );
};
