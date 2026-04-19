import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { BucketListActivity } from '@/data/bucketListActivities';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';

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

const INTENSITY_STYLE: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  high: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
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

  const grouped = activities.reduce<Record<string, BucketListActivity[]>>((acc, act) => {
    if (!acc[act.category]) acc[act.category] = [];
    acc[act.category].push(act);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

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
        whileTap={{ scale: 0.97 }}
        className={cn(
          'flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 w-80 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-card shadow-sm hover:shadow-lg',
          isSelected
            ? 'border-[3px] border-primary shadow-lg shadow-primary/20'
            : 'border border-border/40 hover:border-border/60'
        )}
      >
        {/* Image — aspect-video (16:9) */}
        <div className="relative w-full flex-none aspect-video overflow-hidden">
          {!hasError ? (
            <img
              src={activity.image.url}
              alt={activity.label}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              onError={() => handleImageError(activity.value)}
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md z-20"
            >
              <Check className="w-4 h-4 text-primary-foreground" />
            </motion.div>
          )}
        </div>

        {/* Text */}
        <div className="flex flex-col flex-1 gap-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] font-semibold leading-tight text-foreground">
              {activity.label}
            </p>
            <span
              className={cn(
                'flex-none shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap',
                INTENSITY_STYLE[activity.intensity]
              )}
            >
              {INTENSITY_LABEL[activity.intensity]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
          {activity.bookingNote && (
            <p className="text-[11px] text-muted-foreground/70 italic line-clamp-1">
              {activity.bookingNote}
            </p>
          )}
          {activity.wikiUrl && (
            <a
              href={activity.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors mt-0.5"
            >
              Learn more ↗
            </a>
          )}
        </div>
      </motion.button>
    );
  };

  return (
    <div className="space-y-8 w-full">
      <p className="text-xs text-muted-foreground text-center">Select as many as you like</p>

      {categories.map((catId) => (
        <div key={catId} className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
            {CATEGORY_LABELS[catId] || catId}
          </p>
          <div className="relative">
            <Carousel opts={{ align: 'start', loop: false }} className="w-full">
              <CarouselContent className="-ml-4">
                {grouped[catId].map((activity) => (
                  <CarouselItem key={activity.value} className="pl-4 basis-auto h-full">
                    {renderCard(activity)}
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-border bg-background shadow-md" />
              <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-border bg-background shadow-md" />
            </Carousel>
          </div>
        </div>
      ))}

      <div className="flex justify-center pt-2">
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
