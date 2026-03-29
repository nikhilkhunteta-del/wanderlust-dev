import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { CulturalMoment } from '@/data/culturalMoments';
import { cn } from '@/lib/utils';

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
  const [showAllOutOfWindow, setShowAllOutOfWindow] = useState(false);

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
          className={cn(
            'flex flex-col rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[320px] bg-card shadow-sm hover:shadow-lg',
            isSelected
              ? 'border-[3px] border-primary shadow-lg shadow-primary/20'
              : 'border border-border/40 hover:border-border/60'
          )}
        >
          {/* Image area ~75% */}
          <div className="relative w-full h-[240px] flex-none overflow-hidden">
            {!hasError ? (
              <img
                src={moment.image.url}
                alt={moment.label}
                className="w-full h-full object-cover object-center"
                loading="lazy"
                onError={() => handleImageError(moment.value)}
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}

            {/* Selected checkmark */}
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

          {/* Text area */}
          <div className="flex flex-col justify-center gap-0.5 px-4 py-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[15px] font-semibold leading-tight text-foreground line-clamp-1">
                {moment.label}
              </p>
              <span
                className={cn(
                  'flex-none shrink-0 px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap',
                  isOutOfWindowCard
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                )}
              >
                {formatMonth(moment.months)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{moment.location}</p>
            <p className="text-xs text-muted-foreground">{moment.description}</p>
            {moment.wikiUrl && (
              <a
                href={moment.wikiUrl}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-6">
            {inWindow.map((m, i) => {
              const total = inWindow.length;
              const isLast = i === total - 1;
              const spanFull2 = isLast && total % 2 !== 0;
              const isOrphan3 = isLast && total % 3 === 1;
              return (
                <div key={m.value} className={cn(
                  spanFull2 ? 'col-span-2 sm:col-span-1' : '',
                  isOrphan3 ? 'sm:col-span-2' : '',
                )}>
                  {renderCard(m, false)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider + Section 2 — Outside travel window */}
      {outOfWindow.length > 0 && (
        <>
          <div className="mt-8 space-y-2">
            <div className="relative flex items-center py-2">
              <div className="flex-1 h-[2px] bg-border" />
              <span className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                Outside your travel window
              </span>
              <div className="flex-1 h-[2px] bg-border" />
            </div>
            <p className="text-xs text-muted-foreground italic text-center">
              Festivals outside your dates — worth knowing about for future trips.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 px-6">
            {(showAllOutOfWindow ? outOfWindow : outOfWindow.slice(0, 4)).map((m, i) => {
              const visibleList = showAllOutOfWindow ? outOfWindow : outOfWindow.slice(0, 4);
              const total = visibleList.length;
              const isLast = i === total - 1;
              const spanFull2 = isLast && total % 2 !== 0;
              const spanFull3 = isLast && total % 3 !== 0 && total % 3 === 1;
              return (
                <div key={m.value} className={cn(
                  spanFull2 ? 'col-span-2 sm:col-span-1' : '',
                  spanFull3 ? 'sm:col-span-3' : '',
                )}>
                  {renderCard(m, true)}
                </div>
              );
            })}
          </div>
          {!showAllOutOfWindow && outOfWindow.length > 4 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowAllOutOfWindow(true)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Show more moments →
              </button>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {inWindow.length === 0 && outOfWindow.length > 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No cultural moments match your travel month — explore other options below.
        </p>
      )}
    </div>
  );
};
