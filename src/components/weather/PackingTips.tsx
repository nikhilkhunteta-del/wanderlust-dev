import { PackingTip } from "@/types/weather";
import { Sun, Umbrella, Shirt, Glasses, Layers, HardHat, Backpack, Calendar } from "lucide-react";

interface PackingTipsProps {
  tips: PackingTip[];
  bestTimeToVisit: string;
}

const iconMap: Record<string, React.ElementType> = {
  sun: Sun,
  umbrella: Umbrella,
  jacket: Shirt,
  sunglasses: Glasses,
  layers: Layers,
  hat: HardHat,
  default: Backpack,
};

export const PackingTips = ({ tips, bestTimeToVisit }: PackingTipsProps) => {
  return (
    <div className="space-y-6">
      {/* Best Time */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-1">Best Time to Visit</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{bestTimeToVisit}</p>
          </div>
        </div>
      </div>

      {/* Packing Tips */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Packing Suggestions</h3>
        <div className="grid gap-3">
          {tips.map((tip, index) => {
            const Icon = iconMap[tip.icon] || iconMap.default;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-foreground">{tip.tip}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
