import { cn } from '@/lib/utils';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'progress-step',
              index === currentStep && 'progress-step-active',
              index < currentStep && 'progress-step-completed'
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground/70 font-body tracking-wide">
        8 quick questions · Takes about 1 minute
      </span>
    </div>
  );
};
