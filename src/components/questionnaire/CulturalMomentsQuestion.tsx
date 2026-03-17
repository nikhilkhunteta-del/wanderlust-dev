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
      setMonthConflict(value);
      onChange([...selected, value]);
      return;
    }
    onChange([...selected, value]);
  };

  const handleConfirmMonthChange = (moment: CulturalMoment) => {
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
          className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border ${
            isSelected
              ? 'ring-2 ring-primary shadow-lg shadow-primary/20 border-primary bg-card'
              : 'border-border/50 hover:border-border hover:shadow-md bg-card'
          }`}
        >
          {/* Image top half */}
          <div className="relative w-full aspect-[16/10] overflow-hidden">
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

            {/* Selected checkmark */}
            {isSelected && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-md"
              >
                <Check className="w-4 h-4 text-primary-foreground" />
              </motion.div>
            )}
          </div>

          {/* Text bottom half */}
          <div className="p-3.5 space-y-1.5" style={isOutOfWindowCard ? { backgroundColor: '#F5F5F0' } : undefined}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-tight text-foreground">
                {moment.label}
              </p>
              {/* Month badge chip */}
              <span
                className={`flex-none px-2 py-0.5 rounded-full text-[11px] font-medium ${
                  isOutOfWindowCard
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                }`}
              >
                {formatMonth(moment.months)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{moment.location}</p>
            {moment.description && (
              <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2">
                {moment.description}
              </p>
            )}
            {moment.dateNote && (
              <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-medium">
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
    <div className="space-y-5 w-full">
      {/* Instruction */}
      <p className="text-xs text-muted-foreground text-center">Select up to 2</p>

      {/* Section 1 — In your travel window */}
      {inWindow.length > 0 && (
        <div className="space-y-2">
          {!isFlexible && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
              In your travel window
            </p>
          )}
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            <div className="grid grid-cols-2 gap-3">
              {inWindow.map((m, i) => (
                <div key={m.id} className={inWindow.length % 2 !== 0 && i === inWindow.length - 1 ? 'col-span-2' : ''}>
                  {renderCard(m, false)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Divider + Section 2 — Outside travel window */}
      {outOfWindow.length > 0 && (
        <>
          <div className="relative flex items-center py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
              Outside your travel window
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {outOfWindow.map((m) => renderCard(m, true))}
          </div>
        </>
      )}

      {/* Empty state */}
      {inWindow.length === 0 && outOfWindow.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No cultural moments match your travel month — explore other options below.
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
