import { useState } from "react";
import { Neighbourhood } from "@/types/stayInsights";
import { Card, CardContent } from "@/components/ui/card";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { stripMarkdown } from "@/lib/stripMarkdown";

interface NeighbourhoodCardProps {
  neighbourhood: Neighbourhood;
  city: string;
  country: string;
  alternateQuery?: boolean;
}

export const NeighbourhoodCard = ({ neighbourhood, city, country, alternateQuery }: NeighbourhoodCardProps) => {
  const [expanded, setExpanded] = useState(false);

  // Build explicit neighbourhood-specific image query
  const imageQuery = alternateQuery
    ? `${neighbourhood.name} ${city} local area architecture`
    : `${neighbourhood.name} ${city} residential street buildings`;

  return (
    <Card className="overflow-hidden group">
      <div className="aspect-[4/3] relative overflow-hidden">
        <ResolvedImage
          request={{
            type: 'neighborhood',
            city,
            country,
            entityName: imageQuery,
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
        <div className="relative">
          <p
            className={`text-sm text-muted-foreground mb-1 ${expanded ? "" : "line-clamp-2"}`}
          >
            {stripMarkdown(neighbourhood.description)}
          </p>
          {!expanded && neighbourhood.description.length > 120 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              More →
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {neighbourhood.bestFor.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs capitalize"
              style={{ backgroundColor: "#F3F4F6", color: "#374151" }}
            >
              {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
