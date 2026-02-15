import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

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
}

const GROUP_ICONS: Record<string, string> = {
  'Water Adventures': '🌊',
  'Mountain Adventures': '⛰️',
  'Sky Adventures': '☁️',
  'Nature & Wildlife': '🌿',
  'Scenic & Cultural': '🏛️',
};

export const MultiSelectQuestion = ({
  options,
  selected,
  onChange,
  maxSelections = 4,
  grouped = false,
}: MultiSelectQuestionProps) => {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

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

  if (grouped) {
    const groups: Record<string, Option[]> = {};
    const ungrouped: Option[] = [];
    options.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground text-center">
          Select up to {maxSelections} options
        </p>
        <div className="space-y-2">
          {Object.entries(groups).map(([groupName, groupOptions]) => {
            const isExpanded = expandedGroups.includes(groupName);
            const selectedInGroup = groupOptions.filter((o) => selected.includes(o.value)).length;

            return (
              <div key={groupName} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleGroup(groupName)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-primary/5 transition-colors duration-150"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <span>{GROUP_ICONS[groupName] || '✨'}</span>
                    {groupName}
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
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="px-3 pb-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      {groupOptions.map((option) => {
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
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
        {ungrouped.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {ungrouped.map((option) => {
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
