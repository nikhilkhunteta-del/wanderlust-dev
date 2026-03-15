import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CulturalMoment } from '@/data/culturalMoments';

const MONTH_KEY_TO_FULL: Record<string, string> = {
  jan: 'january', feb: 'february', mar: 'march', apr: 'april',
  may: 'may', jun: 'june', jul: 'july', aug: 'august',
  sep: 'september', oct: 'october', nov: 'november', dec: 'december',
};

const MONTH_FULL_TO_LABEL: Record<string, string> = {
  january: 'January', february: 'February', march: 'March', april: 'April',
  may: 'May', june: 'June', july: 'July', august: 'August',
  september: 'September', october: 'October', november: 'November', december: 'December',
};

interface CulturalMomentsQuestionProps {
  moments: CulturalMoment[];
  selected: string[];
  travelMonth: string;
  onChange: (selected: string[]) => void;
  onSkip: () => void;
  onMonthChange: (newMonth: string) => void;
}

export const CulturalMomentsQuestion = ({
  moments,
  selected,
  travelMonth,
  onChange,
  onSkip,
  onMonthChange,
}: CulturalMomentsQuestionProps) => {
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const [monthConflict, setMonthConflict] = useState<string | null>(null);

  const isFlexible = travelMonth === 'flexible';
  const fullMonth = MONTH_KEY_TO_FULL[travelMonth] || '';

  const { inWindow, outOfWindow } = useMemo(() => {
    if (isFlexible) return { inWindow: moments, outOfWindow: [] as CulturalMoment[] };
    return {
      inWindow: moments.filter((m) => m.months.includes(fullMonth)),
      outOfWindow: moments.filter((m) => !m.months.includes(fullMonth)),
    };
  }, [moments, fullMonth, isFlexible]);

  const toggleMoment = (value: string, isOutOfWindow: boolean) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
      if (monthConflict === value) setMonthConflict(null);
      return;
    }

    if (selected.length >= 2) return;

    if (isOutOfWindow) {
      // Show conflict prompt instead of immediately selecting
      setMonthConflict(value);
      onChange([...selected, value]);
      return;
    }

    onChange([...selected, value]);
  };

  const handleConfirmMonthChange = (moment: CulturalMoment) => {
    // Find the first month of this moment and convert to short key
    const momentFullMonth = moment.months[0];
    const shortKey = Object.entries(MONTH_KEY_TO_FULL).find(
      ([, full]) => full === momentFullMonth
    )?.[0];
    if (shortKey) onMonthChange(shortKey);
    setMonthConflict(null);
  };

  const handleKeepMonth = () => {
    setMonthConflict(null);
  };

  const handleImageError = (value: string) => {
    setImageErrors((prev) => new Set(prev).add(value));
  };

  const formatMonth = (months: string[]) => {
    if (months.length === 0) return '';
    return MONTH_FULL_TO_LABEL[months[0]]?.slice(0, 3) || months[0].slice(0, 3);
  };

  const currentMonthLabel = MONTH_FULL_TO_LABEL[fullMonth] || travelMonth;

  const renderCard = (moment: CulturalMoment, isOutOfWindowCard: boolean) => {
    const isSelected = selected.includes(moment.value);
    const hasError = imageErrors.has(moment.value);
    const hasConflict = monthConflict === moment.value;

    return (
      <div key={moment.value} className="space-y-0">
        <motion.button
          type="button"
          onClick={() => toggleMoment(moment.value, isOutOfWindowCard)}
          whileTap={{ scale: 0.97 }}
          className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            isSelected
              ? 'ring-2 ring-primary shadow-lg shadow-primary/20'
              : 'ring-1 ring-border/50 hover:ring-border'
          }`}
          style={{ height: 320 }}
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
          <div
            className={`absolute inset-0 ${
              isOutOfWindowCard
                ? 'bg-gradient-to-t from-black/70 via-black/40 to-black/20'
                : 'bg-gradient-to-t from-black/70 via-black/20 to-transparent'
            }`}
          />

          {/* Month badge top-right */}
          <span
            className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-medium backdrop-blur-sm ${
              isOutOfWindowCard
                ? 'bg-black/50 text-white/60'
                : 'bg-emerald-600/80 text-white'
            }`}
          >
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
          <div className="absolute bottom-0 left-0 right-0 p-4 text-left space-y-1">
            <p className={`text-base font-semibold leading-tight ${isOutOfWindowCard ? 'text-white/80' : 'text-white'}`}>
              {moment.label}
            </p>
            <p className={`text-xs ${isOutOfWindowCard ? 'text-white/50' : 'text-white/70'}`}>
              {moment.location}
            </p>
            {moment.description && (
              <p className={`text-[11px] italic leading-snug line-clamp-2 ${isOutOfWindowCard ? 'text-white/50' : 'text-white/60'}`}>
                {moment.description}
              </p>
            )}
            {moment.dateNote && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-medium backdrop-blur-sm">
                {moment.dateNote}
              </span>
            )}
          </div>
        </motion.button>

        {/* Month conflict prompt */}
        {hasConflict && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 rounded-lg bg-card border border-border p-3 text-left space-y-2"
          >
            <p className="text-xs text-foreground leading-relaxed">
              <span className="font-semibold">{moment.label}</span> falls in{' '}
              <span className="font-semibold">{MONTH_FULL_TO_LABEL[moment.months[0]]}</span>.
              Would you like to adjust your travel window?
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleConfirmMonthChange(moment)}
                className="text-xs px-3 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                Yes, change to {MONTH_FULL_TO_LABEL[moment.months[0]]}
              </button>
              <button
                type="button"
                onClick={handleKeepMonth}
                className="text-xs px-3 py-1.5 rounded-md bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
              >
                No, keep {currentMonthLabel}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 max-w-[600px] mx-auto">
      {/* Section 1 — In your travel window */}
      {inWindow.length > 0 && (
        <div className="space-y-2">
          {!isFlexible && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              In your travel window
            </p>
          )}
          {inWindow.length === 1 ? (
            <div className="flex justify-center">
              <div className="w-[280px]">{renderCard(inWindow[0], false)}</div>
            </div>
          ) : inWindow.length === 2 ? (
            <div className="grid grid-cols-2 gap-3">
              {inWindow.map((m) => renderCard(m, false))}
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory pr-8">
                {inWindow.map((m) => (
                  <div key={m.value} className="flex-none w-[260px] snap-start">
                    {renderCard(m, false)}
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent" />
            </div>
          )}
        </div>
      )}

      {/* Section 2 — Out of window (collapsed by default) */}
      {outOfWindow.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
            Worth knowing about
          </p>
          {outOfWindow.length <= 2 ? (
            <div className="grid grid-cols-2 gap-3">
              {outOfWindow.map((m) => renderCard(m, true))}
            </div>
          ) : (
            <div className="relative">
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin snap-x snap-mandatory pr-8">
                {outOfWindow.map((m) => (
                  <div key={m.value} className="flex-none w-[260px] snap-start">
                    {renderCard(m, true)}
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-card to-transparent" />
            </div>
          )}
        </div>
      )}

      {/* Empty state — all moments are out of window and none in window */}
      {inWindow.length === 0 && outOfWindow.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No cultural moments match your travel month — expand below to explore other options.
        </p>
      )}

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
