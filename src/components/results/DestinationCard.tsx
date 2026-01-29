import { useState, useEffect } from "react";
import { CityRecommendation } from "@/types/recommendations";
import { getUnsplashImages, UnsplashImage } from "@/lib/unsplash";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface DestinationCardProps {
  recommendation: CityRecommendation;
  onExplore: () => void;
}

export const DestinationCard = ({ recommendation, onExplore }: DestinationCardProps) => {
  const [image, setImage] = useState<UnsplashImage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchImage = async () => {
      setLoading(true);
      try {
        const images = await getUnsplashImages(recommendation.imageQuery, 1);
        if (mounted && images.length > 0) {
          setImage(images[0]);
        }
      } catch {
        // Silently fail
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchImage();

    return () => {
      mounted = false;
    };
  }, [recommendation.imageQuery]);

  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Hero Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {loading ? (
          <div className="w-full h-full bg-muted animate-pulse" />
        ) : image ? (
          <img
            src={image.url}
            alt={`${recommendation.city}, ${recommendation.country}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-2xl font-display font-semibold text-white">
            {recommendation.city}
          </h3>
          <p className="text-white/80 text-sm">{recommendation.country}</p>
        </div>
        {/* Unsplash Attribution */}
        {image && (
          <a
            href={`${image.unsplashUrl}?utm_source=travel_app&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 text-[10px] text-white/60 hover:text-white/90 bg-black/30 px-1.5 py-0.5 rounded transition-colors"
          >
            📷 {image.photographer}
          </a>
        )}
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
