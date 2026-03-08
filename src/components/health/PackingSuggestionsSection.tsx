import { Backpack, Shirt, ShieldCheck, FileText, MapPin } from "lucide-react";

interface PackingSuggestionsSectionProps {
  suggestions: string[];
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  "Clothing & comfort": { label: "Clothing & Comfort", icon: Shirt },
  "Health & pharmacy": { label: "Health & Pharmacy", icon: ShieldCheck },
  "Documents & money": { label: "Documents & Money", icon: FileText },
  "City-specific essentials": { label: "City-Specific Essentials", icon: MapPin },
};

function parseCategoryItem(item: string): { category: string; text: string } {
  const match = item.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (match) {
    return { category: match[1], text: match[2] };
  }
  return { category: "City-specific essentials", text: item };
}

export const PackingSuggestionsSection = ({ suggestions }: PackingSuggestionsSectionProps) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <section>
        <p className="text-sm text-muted-foreground">
          No specialist packing required for this destination — standard travel preparation applies.
        </p>
      </section>
    );
  }

  // Group by category
  const grouped: Record<string, string[]> = {};
  for (const item of suggestions) {
    const { category, text } = parseCategoryItem(item);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(text);
  }

  // Order categories
  const orderedCategories = [
    "Clothing & comfort",
    "Health & pharmacy",
    "Documents & money",
    "City-specific essentials",
  ];

  return (
    <section className="space-y-5">
      <div className="flex items-center gap-2">
        <Backpack className="w-4 h-4 text-primary" />
        <h3 className="text-lg font-semibold">Packing List</h3>
      </div>
      <p className="text-sm text-muted-foreground -mt-2">
        Weather, health, and destination essentials — everything in one bag.
      </p>

      {orderedCategories.map((cat) => {
        const items = grouped[cat];
        if (!items || items.length === 0) return null;
        const config = CATEGORY_CONFIG[cat] || { label: cat, icon: Backpack };
        const Icon = config.icon;

        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {config.label}
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Any uncategorized items */}
      {Object.entries(grouped)
        .filter(([cat]) => !orderedCategories.includes(cat))
        .map(([cat, items]) => (
          <div key={cat}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {cat}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {items.map((text, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
    </section>
  );
};
