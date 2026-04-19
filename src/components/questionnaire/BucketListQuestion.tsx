import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { BucketListActivity } from '@/data/bucketListActivities';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

const CATEGORY_ORDER = [
  'water-ocean',
  'wildlife-safari',
  'sky-heights',
  'ice-snow',
  'landscapes-journeys',
  'scenic-rail',
  'road-trips',
  'adrenaline',
  'cultural-immersion',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  'water-ocean': 'Water & Ocean',
  'adrenaline': 'Adrenaline',
  'sky-heights': 'Sky & Heights',
  'wildlife-safari': 'Wildlife & Safari',
  'landscapes-journeys': 'Landscapes & Journeys',
  'ice-snow': 'Ice & Snow',
  'scenic-rail': 'Scenic Rail',
  'road-trips': 'Road Trips',
  'cultural-immersion': 'Cultural Immersion',
};

const INTENSITY_LABEL: Record<string, string> = {
  low: 'Relaxed',
  medium: 'Moderate',
  high: 'Intense',
};

interface BucketListQuestionProps {
  activities: BucketListActivity[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onSkip: () => void;
}

export const BucketListQuestion = ({
  activities,
  selected,
  onChange,
  onSkip,
}: BucketListQuestionProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [openCategory, setOpenCategory] = useState<string>('water-ocean');

  const toggleCategory = (catId: string) =>
    setOpenCategory((prev) => (prev === catId ? '' : catId));

  const grouped = activities.reduce<Record<string, BucketListActivity[]>>((acc, act) => {
    if (!acc[act.category]) acc[act.category] = [];
    acc[act.category].push(act);
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

  const renderCard = (activity: BucketListActivity) => {
    const isSelected = selected.includes(activity.value);
    const hasError = imageErrors.has(activity.value);

    return (
      <motion.button
        key={activity.value}
        type="button"
        onClick={() => toggle(activity.value)}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary block',
          isSelected
            ? 'ring-[3px] ring-primary shadow-lg shadow-primary/20'
            : 'ring-1 ring-white/10'
        )}
      >
        {!hasError ? (
          <img
            src={activity.image.url}
            alt={activity.label}
            className="object-cover object-center w-full h-full absolute inset-0"
            loading="lazy"
            onError={() => handleImageError(activity.value)}
          />
        ) : (
          <div className="absolute inset-0 bg-muted" />
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
            {activity.label}
          </p>
          <p className="text-sm text-white/70 mt-1">{INTENSITY_LABEL[activity.intensity]}</p>
          <p className="text-sm text-white/80 mt-2 leading-relaxed line-clamp-2">
            {activity.description}
          </p>
          {activity.wikiUrl && (
            <a
              href={activity.wikiUrl}
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
    <div className="space-y-2 w-full">
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
        const isOpen = openCategory === catId;
        return (
          <div key={catId} className="border border-border/40 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => toggleCategory(catId)}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-muted/40 transition-colors"
            >
              <span className="text-xl font-bold text-foreground">
                {CATEGORY_LABELS[catId]}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {items.length} {items.length === 1 ? 'activity' : 'activities'}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  'w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0',
                  isOpen && 'rotate-180'
                )}
              />
            </button>
            {isOpen && (
              <div className="pb-4">
                <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                  <CarouselContent className="-ml-3">
                    {items.map((activity) => (
                      <CarouselItem key={activity.value} className="pl-3 basis-[88%]">
                        {renderCard(activity)}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-sm hidden md:flex shadow-md" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-sm hidden md:flex shadow-md" />
                </Carousel>
              </div>
            )}
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
