import { PackingTip } from "@/types/weather";
import { Sun, Umbrella, Shirt, Glasses, Layers, HardHat, Backpack, Droplets, ShieldCheck, PackageX } from "lucide-react";

interface PackingTipsProps {
  tips: PackingTip[];
  notNeeded: string[];
}

const iconMap: Record<string, React.ElementType> = {
  sun: Sun, umbrella: Umbrella, jacket: Shirt, sunglasses: Glasses,
  layers: Layers, hat: HardHat, water: Droplets, default: Backpack,
};

const categoryLabels: Record<string, string> = {
  clothing: "Clothing",
  sun: "Sun Protection",
  health: "Health & Comfort",
};

export const PackingTips = ({ tips, notNeeded }: PackingTipsProps) => {
  const grouped = tips.reduce<Record<string, PackingTip[]>>((acc, tip) => {
    const cat = tip.category || "clothing";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tip);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Backpack className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">Packing Suggestions</h3>
      </div>

      {Object.entries(grouped).map(([category, categoryTips]) => (
        <div key={category}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {categoryLabels[category] || category}
          </h4>
          <div className="space-y-2">
            {categoryTips.map((tip, index) => {
              const Icon = iconMap[tip.icon] || iconMap.default;
              return (
                <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border/50">
                  <div className="p-1.5 rounded-md bg-muted">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-foreground">{tip.tip}</p>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Not Needed */}
      {notNeeded.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-2">
            <PackageX className="w-3.5 h-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">You likely won't need</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {notNeeded.map((item, i) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground border border-border/30">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
