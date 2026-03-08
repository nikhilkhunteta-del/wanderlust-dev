import { DimensionWeights, DIMENSION_LABELS, DEFAULT_WEIGHTS } from "@/types/comparison";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, RotateCcw } from "lucide-react";
import { useState } from "react";

interface WeightSlidersProps {
  weights: DimensionWeights;
  onChange: (weights: DimensionWeights) => void;
  onReset: () => void;
}

const DIMS: (keyof DimensionWeights)[] = [
  "personalMatch",
  "weatherFit",
  "gettingThere",
  "safety",
  "seasonalEvents",
  "accommodationValue",
];

export const WeightSliders = ({ weights, onChange, onReset }: WeightSlidersProps) => {
  const [open, setOpen] = useState(false);

  const isDefault = DIMS.every((d) => weights[d] === DEFAULT_WEIGHTS[d]);

  const handleChange = (dim: keyof DimensionWeights, value: number[]) => {
    onChange({ ...weights, [dim]: value[0] });
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
        Adjust what matters to you
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <div className="bg-card/50 rounded-xl border border-border/50 p-5 space-y-5">
          {DIMS.map((dim) => (
            <div key={dim} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {DIMENSION_LABELS[dim]}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {weights[dim]}%
                </span>
              </div>
              <Slider
                value={[weights[dim]]}
                onValueChange={(v) => handleChange(dim, v)}
                min={0}
                max={50}
                step={5}
                className="w-full"
              />
            </div>
          ))}

          {!isDefault && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to default
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
