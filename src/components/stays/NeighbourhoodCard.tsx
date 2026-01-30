import { Neighbourhood } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface NeighbourhoodCardProps {
  neighbourhood: Neighbourhood;
  city: string;
  country: string;
}

export const NeighbourhoodCard = ({ neighbourhood, city, country }: NeighbourhoodCardProps) => {
  return (
    <Card className="overflow-hidden group">
      <div className="aspect-[4/3] relative overflow-hidden">
        <ResolvedImage
          request={{
            type: 'neighborhood',
            city,
            country,
            entityName: neighbourhood.name,
          }}
          alt={neighbourhood.name}
          className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          showAttribution
          fallbackCategory="neighborhood"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <h4 className="text-lg font-semibold text-white mb-1">{neighbourhood.name}</h4>
        </div>
      </div>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {neighbourhood.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {neighbourhood.bestFor.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs capitalize">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
