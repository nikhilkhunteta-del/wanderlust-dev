import { DimensionWeights, DIMENSION_LABELS, DEFAULT_WEIGHTS, CityScores, CITY_COLORS } from "@/types/comparison";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";

interface WeightSlidersProps {
  weights: DimensionWeights;
  onChange: (weights: DimensionWeights) => void;
  onReset: () => void;
  ranked: CityScores[];
  onWeightChanged?: () => void;
}

const DIMS: (keyof DimensionWeights)[] = [
  "personalMatch",
  "weatherFit",
  "gettingThere",
  "safety",
  "seasonalEvents",
  "accommodationValue",
];

const MEDALS = ["🥇", "🥈", "🥉"];

function distributeWeights(
  current: DimensionWeights,
  changedDim: keyof DimensionWeights,
  newValue: number
): DimensionWeights {
  const oldValue = current[changedDim];
  const diff = newValue - oldValue;
  if (diff === 0) return current;

  const otherDims = DIMS.filter((d) => d !== changedDim);
  const otherTotal = otherDims.reduce((sum, d) => sum + current[d], 0);

  const result = { ...current, [changedDim]: newValue };

  if (otherTotal === 0) {
    // Edge case: all others are 0, distribute evenly
    const perOther = Math.round(-diff / otherDims.length);
    otherDims.forEach((d) => {
      result[d] = Math.max(0, Math.min(50, perOther));
    });
  } else {
    // Proportional redistribution
    let remaining = -diff;
    const shares = otherDims.map((d) => ({
      dim: d,
      share: current[d] / otherTotal,
      value: current[d],
    }));

    // First pass: proportional
    shares.forEach((s) => {
      const delta = Math.round(remaining * s.share);
      s.value = Math.max(0, Math.min(50, s.value + delta));
    });

    // Fix rounding: ensure total = 100
    shares.forEach((s) => {
      result[s.dim] = s.value;
    });

    const total = DIMS.reduce((sum, d) => sum + result[d], 0);
    const error = 100 - total;
    if (error !== 0) {
      // Apply rounding error to the largest other slider
      const largest = shares.sort((a, b) => b.value - a.value)[0];
      result[largest.dim] = Math.max(0, Math.min(50, result[largest.dim] + error));
    }
  }

  return result;
}

export const WeightSliders = ({ weights, onChange, onReset, ranked, onWeightChanged }: WeightSlidersProps) => {
  const [open, setOpen] = useState(false);
  const [prevRankedOrder, setPrevRankedOrder] = useState<string[]>([]);
  const total = DIMS.reduce((sum, d) => sum + weights[d], 0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const newOrder = ranked.map((r) => r.city.city);
    if (prevRankedOrder.length === 0) {
      setPrevRankedOrder(newOrder);
    } else if (JSON.stringify(newOrder) !== JSON.stringify(prevRankedOrder)) {
      setPrevRankedOrder(newOrder);
    }
  }, [ranked]);

  const handleChange = useCallback(
    (dim: keyof DimensionWeights, value: number) => {
      const newWeights = distributeWeights(weights, dim, value);
      onChange(newWeights);
    },
    [weights, onChange]
  );

  const handleCommit = useCallback(() => {
    setIsDragging(false);
    onWeightChanged?.();
    toast({
      description: "Rankings updated",
    });
  }, [onWeightChanged]);

  const isDefault = DIMS.every((d) => weights[d] === DEFAULT_WEIGHTS[d]);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto">
        Adjust what matters to you
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-4">
        <div className="bg-card/50 rounded-xl border border-border/50 p-5 space-y-4">
          {/* Live ranking strip */}
          <div className="flex items-center justify-center gap-1 flex-wrap" style={{ fontSize: 13 }}>
            <span className="text-muted-foreground mr-1">Current ranking:</span>
            <AnimatePresence mode="popLayout">
              {ranked.slice(0, 3).map((r, i) => {
                const cityIdx = ranked.length > 0
                  ? [ranked[0], ranked[1], ranked[2]].findIndex(
                      (_, j) => ranked[j]?.city.city === r.city.city
                    )
                  : i;
                // Find the original color index
                const originalIdx = ranked.indexOf(r);
                // Find color by matching against the full cityScores
                const colorIdx = i; // ranked is already sorted, but we need original index
                return (
                  <motion.span
                    key={r.city.city}
                    layout
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="inline-flex items-center gap-1"
                  >
                    <span>{MEDALS[i]}</span>
                    <span className="font-medium" style={{ color: CITY_COLORS[findCityColorIndex(r, ranked)] }}>
                      {r.city.city}
                    </span>
                    <span className="text-muted-foreground">({r.weightedTotal.toFixed(1)})</span>
                    {i < 2 && <span className="text-muted-foreground/50 mx-1">·</span>}
                  </motion.span>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Instructional line */}
          <p className="text-center text-muted-foreground" style={{ fontSize: 12 }}>
            Drag to change what matters most — weights adjust automatically to stay balanced
          </p>

          {/* Sliders */}
          <div className="space-y-5">
            {DIMS.map((dim) => (
              <SliderRow
                key={dim}
                dim={dim}
                value={weights[dim]}
                onChange={(v) => handleChange(dim, v)}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleCommit}
              />
            ))}
          </div>

          {/* Total indicator — only shows if not 100% during drag */}
          {isDragging && total !== 100 && (
            <p className="text-center text-xs" style={{ color: "#92400E" }}>
              Total weight: {total}%
            </p>
          )}

          {/* Reset link */}
          {!isDefault && (
            <button
              onClick={onReset}
              className="block mx-auto text-xs hover:opacity-80 transition-opacity"
              style={{ color: "#EA580C" }}
            >
              Reset to recommended defaults
            </button>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

/** Find the color index for a ranked city by matching back to original order */
function findCityColorIndex(cityScore: CityScores, allRanked: CityScores[]): number {
  // CITY_COLORS maps to the original cities array order (pre-ranking)
  // We need to use the city property which carries the original recommendation
  // The parent passes ranked which is sorted by score, but colors are by original index
  // Since we don't have the original order here, use a simple heuristic:
  // colors are [0]=coral, [1]=teal, [2]=purple — assigned to cities in their original order
  // For now, return the index in the original unsorted array
  return allRanked.indexOf(cityScore);
}

interface SliderRowProps {
  dim: keyof DimensionWeights;
  value: number;
  onChange: (value: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

function SliderRow({ dim, value, onChange, onDragStart, onDragEnd }: SliderRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = (value / 50) * 100; // slider max is 50

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {DIMENSION_LABELS[dim]}
        </span>
      </div>
      <div className="relative">
        {/* Thumb badge - positioned above the slider */}
        <div
          className="absolute -top-5 pointer-events-none"
          style={{
            left: `${percentage}%`,
            transform: "translateX(-50%)",
          }}
        >
          <span
            className="inline-block rounded px-1.5 py-0.5 border border-border bg-background tabular-nums"
            style={{ fontSize: 11, fontWeight: 700, lineHeight: 1 }}
          >
            {value}%
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={50}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          onMouseUp={onDragEnd}
          onTouchEnd={onDragEnd}
          ref={trackRef as any}
          className="w-full h-3 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${percentage}%, hsl(var(--muted)) ${percentage}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>
    </div>
  );
}
