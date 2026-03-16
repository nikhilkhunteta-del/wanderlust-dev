interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="w-full h-1 rounded-sm bg-muted overflow-hidden">
        <div
          className="h-full rounded-sm bg-primary transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground/70 font-body tracking-wide">
        A few quick questions · Takes about 1 minute
      </span>
    </div>
  );
};
