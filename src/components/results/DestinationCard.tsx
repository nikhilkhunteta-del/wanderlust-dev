import { CityRecommendation } from "@/types/recommendations";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface DestinationCardProps {
  recommendation: CityRecommendation;
  onExplore: () => void;
}

export const DestinationCard = ({ recommendation, onExplore }: DestinationCardProps) => {
  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Hero Image using new image system */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <ResolvedImage
          request={{
            type: 'city_hero',
            city: recommendation.city,
            country: recommendation.country,
          }}
          alt={`${recommendation.city}, ${recommendation.country}`}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          showAttribution
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-display font-semibold text-white">
            {recommendation.city}
          </h3>
          <p className="text-white/80 text-sm">{recommendation.country}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Rationale */}
        <p className="text-foreground/80 text-base leading-relaxed mb-4 flex-1">
          {recommendation.rationale}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {recommendation.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium capitalize"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA Button */}
        <Button
          onClick={onExplore}
          className="w-full gradient-sunset text-primary-foreground border-0 gap-2 py-5"
        >
          Explore City
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </article>
  );
};
