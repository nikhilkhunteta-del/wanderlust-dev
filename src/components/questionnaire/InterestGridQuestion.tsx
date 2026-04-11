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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 -mx-6 md:-mx-12 w-[calc(100%+48px)] md:w-[calc(100%+96px)]">
        {options.map((option, i) => {
          const isSelected = selected.includes(option.value);
          const bgUrl = categoryImages[option.value];
          const total = options.length;
          const isLast = i === total - 1;
          const spanFull2 = isLast && total % 2 !== 0;
          const spanFull3 = isLast && total % 3 !== 0;
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex flex-col rounded-2xl overflow-hidden transition-all duration-150 cursor-pointer h-[320px]',
                'shadow-sm hover:shadow-lg bg-card',
                isSelected
                  ? 'border-[3px] border-primary'
                  : 'border border-border/40 hover:border-border/60',
                spanFull2 ? 'col-span-2 sm:col-span-1' : '',
                spanFull3 ? 'sm:col-span-1' : '',
                spanFull2 && spanFull3 ? 'sm:col-span-1' : '',
              )}
            >
              {/* Image area ~75% */}
              <div className="relative w-full h-[75%] flex-none">
                {bgUrl ? (
                  <img src={bgUrl} alt={option.label} className="w-full h-full object-cover" style={{ objectPosition: 'center 60%' }} />
                ) : (
                  <div className="w-full h-full bg-muted" />
                )}
              </div>

              {/* Text area ~25% */}
              <div className="flex flex-col justify-center gap-0.5 px-4 py-3 text-left flex-1">
                <span className="text-[15px] font-semibold leading-tight text-foreground">
                  {option.label}
                </span>
                {option.description && (
                  <span className="text-xs leading-tight text-muted-foreground">
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
