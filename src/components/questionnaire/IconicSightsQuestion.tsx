import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { IconicSight } from '@/data/iconicSights';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

const CATEGORY_ORDER = [
  'otherworldly',
  'natural-power',
  'ancient-wonders',
  'sacred-spiritual',
  'iconic',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  'otherworldly': 'Otherworldly',
  'natural-power': 'Natural Power',
  'ancient-wonders': 'Ancient Wonders',
  'sacred-spiritual': 'Sacred & Spiritual',
  'iconic': 'Iconic',
};

interface IconicSightsQuestionProps {
  sights: IconicSight[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onSkip: () => void;
}

export const IconicSightsQuestion = ({
  sights,
  selected,
  onChange,
  onSkip,
}: IconicSightsQuestionProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const grouped = sights.reduce<Record<string, IconicSight[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleImageError = (value: string) =>
    setImageErrors((prev) => new Set(prev).add(value));

  const renderCard = (sight: IconicSight) => {
    const isSelected = selected.includes(sight.value);
    const hasError = imageErrors.has(sight.value);

    return (
      <motion.button
        key={sight.value}
        type="button"
        onClick={() => toggle(sight.value)}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative w-full h-[calc(100vh-200px)] rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary block',
          isSelected
            ? 'ring-[3px] ring-primary shadow-lg shadow-primary/20'
            : 'ring-1 ring-white/10'
        )}
      >
        {/* Image at natural proportions — no cropping */}
        {!hasError ? (
          <img
            src={sight.image.url}
            alt={sight.label}
            className="object-cover object-top w-full h-full absolute inset-0"
            loading="lazy"
            onError={() => handleImageError(sight.value)}
          />
        ) : (
          <div className="h-48 bg-muted" />
        )}

        {/* Dark gradient overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Checkmark */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-3 left-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md z-20"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}

        {/* Text overlay — sits on gradient */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12 z-10 text-left">
          <p className="text-2xl font-bold text-white leading-tight">
            {sight.label}
          </p>
          <p className="text-sm text-white/70 mt-1">{sight.location}</p>
          <p className="text-sm text-white/80 mt-2 leading-relaxed line-clamp-2">
            {sight.description}
          </p>
          {sight.wikiUrl && (
            <a
              href={sight.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-xs font-medium text-white/70 hover:text-white transition-colors mt-2 underline underline-offset-2"
            >
              Learn more ↗
            </a>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-7 w-full">
      {/* Counter */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">Select as many as you like</p>
        {selected.length > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs font-semibold text-primary"
          >
            {selected.length} selected
          </motion.span>
        )}
      </div>

      {CATEGORY_ORDER.map((catId) => {
        const items = grouped[catId];
        if (!items || items.length === 0) return null;
        return (
          <div key={catId} className="space-y-3 pt-4">
            <p className="text-xl font-bold text-foreground px-1">
              {CATEGORY_LABELS[catId]}
            </p>
            <Carousel opts={{ align: 'start', loop: false }} className="w-full">
              <CarouselContent className="-ml-3">
                {items.map((sight) => (
                  <CarouselItem key={sight.value} className="pl-3 basis-[88%]">
                    {renderCard(sight)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-sm hidden md:flex shadow-md" />
              <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-sm hidden md:flex shadow-md" />
            </Carousel>
          </div>
        );
      })}

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
};
