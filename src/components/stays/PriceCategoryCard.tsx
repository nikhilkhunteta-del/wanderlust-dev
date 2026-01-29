import { PriceCategory } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PriceCategoryCardProps {
  category: PriceCategory;
}

export const PriceCategoryCard = ({ category }: PriceCategoryCardProps) => {
  const getCategoryStyles = () => {
    switch (category.category) {
      case "budget":
        return "border-l-4 border-l-muted-foreground/50";
      case "midRange":
        return "border-l-4 border-l-primary/50";
      case "premium":
        return "border-l-4 border-l-primary";
      case "luxury":
        return "border-l-4 border-l-amber-500";
      default:
        return "";
    }
  };

  return (
    <Card className={`${getCategoryStyles()} bg-card/50`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-semibold text-foreground">{category.label}</h4>
            <span className="text-sm text-muted-foreground">{category.starRating}</span>
          </div>
        </div>
        
        <div className="mb-3">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-bold text-foreground">
              ${category.lowPrice}
            </span>
            <span className="text-muted-foreground">–</span>
            <span className="text-2xl font-display font-bold text-foreground">
              ${category.highPrice}
            </span>
            <span className="text-sm text-muted-foreground ml-1">/night</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {category.typicalInclusions.map((inclusion, index) => (
            <Badge key={index} variant="secondary" className="text-xs font-normal">
              {inclusion}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
