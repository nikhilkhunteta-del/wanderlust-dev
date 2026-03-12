import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { EXPERIENCE_CATEGORIES, ExperienceCategory } from '@/types/questionnaire';

interface Option {
  value: string;
  label: string;
  icon?: string;
  group?: string;
}

interface MultiSelectQuestionProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelections?: number;
  grouped?: boolean;
  onSkip?: () => void;
}

const MAX_VISIBLE_PER_CATEGORY = 4;

export const MultiSelectQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 10,
  grouped = false,
  onSkip,
}: MultiSelectQuestionProps) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [showMoreGroups, setShowMoreGroups] = useState<string[]>([]);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < maxSelections) {
      onChange([...selected, value]);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const toggleShowMore = (group: string) => {
    setShowMoreGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  if (grouped) {
    // Build categories from options using EXPERIENCE_CATEGORIES for metadata
    const categoryMap = new Map<string, { cat: ExperienceCategory; opts: Option[] }>();
    
    for (const opt of options) {
      if (!opt.group) continue;
      if (!categoryMap.has(opt.group)) {
        const catDef = EXPERIENCE_CATEGORIES.find((c) => c.id === opt.group);
        if (catDef) {
          categoryMap.set(opt.group, { cat: catDef, opts: [] });
        }
      }
      categoryMap.get(opt.group)?.opts.push(opt);
    }

    const categories = Array.from(categoryMap.values());
    const totalCategories = categories.length;

    // Auto-expand logic: 1-2 categories → all expanded; 3+ → first only
    const getInitialExpanded = () => {
      if (totalCategories <= 2) return categories.map((c) => c.cat.id);
      return [categories[0]?.cat.id].filter(Boolean);
    };

    // Initialize expanded state on first render
    if (expandedGroups.length === 0 && categories.length > 0) {
      const initial = getInitialExpanded();
      if (initial.length > 0) {
        // Use setTimeout to avoid setState during render
        setTimeout(() => setExpandedGroups(initial), 0);
      }
    }

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Select experiences that define your dream trip
        </p>
        <div className="space-y-2">
          {categories.map(({ cat, opts }) => {
            const isExpanded = expandedGroups.includes(cat.id);
            const isShowingMore = showMoreGroups.includes(cat.id);
            const selectedInGroup = opts.filter((o) => selected.includes(o.value)).length;
            const visibleOpts = isShowingMore ? opts : opts.slice(0, MAX_VISIBLE_PER_CATEGORY);
            const hasMore = opts.length > MAX_VISIBLE_PER_CATEGORY;

            return (
              <div key={cat.id} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(cat.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary/5 transition-colors duration-150"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-base">{cat.icon}</span>
                    {cat.label}
                    {selectedInGroup > 0 && (
                      <span className="text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                        {selectedInGroup}
                      </span>
                    )}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="px-3 pb-3"
                    >
                      <div className="flex flex-wrap gap-2">
                        {visibleOpts.map((option) => {
                          const isSelected = selected.includes(option.value);
                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() => toggleOption(option.value)}
                              animate={{ scale: isSelected ? 1.02 : 1 }}
                              transition={{ duration: 0.14, ease: 'easeOut' }}
                              className={cn(
                                'option-chip text-sm',
                                isSelected && 'option-chip-selected'
                              )}
                            >
                              {option.icon && <span className="mr-1.5">{option.icon}</span>}
                              {option.label}
                            </motion.button>
                          );
                        })}
                      </div>
                      {hasMore && !isShowingMore && (
                        <button
                          type="button"
                          onClick={() => toggleShowMore(cat.id)}
                          className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                        >
                          Show more ▾
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Skip Q2 escape */}
        {onSkip && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onSkip}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              Just match my interests
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground text-center">
        Select up to {maxSelections} options
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <motion.button
              key={option.value}
              type="button"
              onClick={() => toggleOption(option.value)}
              animate={{ scale: isSelected ? 1.02 : 1 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className={cn(
                'option-chip',
                isSelected && 'option-chip-selected'
              )}
            >
              {option.icon && <span className="mr-2">{option.icon}</span>}
              {option.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
