import { CityRecommendation } from "@/types/recommendations";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plane, Calendar } from "lucide-react";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { stripMarkdown } from "@/lib/stripMarkdown";

const TAG_LABELS: Record<string, string> = {
  'culture-history': 'Culture & History',
  'nature-outdoors': 'Nature & Outdoors',
  'beach-coastal': 'Beach & Coastal',
  'food-culinary': 'Food & Culinary',
  'arts-music-nightlife': 'Arts, Music & Nightlife',
  'active-sport': 'Active & Sport',
  'shopping-markets': 'Shopping & Markets',
  'wellness-slow-travel': 'Wellness & Slow Travel',
};

const humanizeTag = (tag: string): string => {
  const lower = tag.toLowerCase();
  if (TAG_LABELS[lower]) return TAG_LABELS[lower];
  return tag.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

interface DestinationCardProps {
  recommendation: CityRecommendation;
  onExplore: () => void;
  departureCity?: string;
  userInterests?: string[];
}

// Map of related interests — used to allow at most one closely related secondary chip
const RELATED_INTERESTS: Record<string, string[]> = {
  'active-sport': ['nature-outdoors'],
  'nature-outdoors': ['active-sport', 'wellness-slow-travel'],
  'beach-coastal': ['wellness-slow-travel', 'nature-outdoors'],
  'culture-history': ['arts-music-nightlife'],
  'arts-music-nightlife': ['culture-history'],
  'food-culinary': ['shopping-markets', 'culture-history'],
  'shopping-markets': ['food-culinary'],
  'wellness-slow-travel': ['nature-outdoors', 'beach-coastal'],
};

const filterRelevantTags = (tags: string[], userInterests?: string[]): string[] => {
  if (!userInterests || userInterests.length === 0) return tags;
  const selected = new Set(userInterests.map(i => i.toLowerCase()));
  const allowedSecondary = new Set<string>();
  userInterests.forEach(i => {
    (RELATED_INTERESTS[i.toLowerCase()] || []).forEach(r => allowedSecondary.add(r));
  });

  const primary: string[] = [];
  const secondary: string[] = [];
  tags.forEach(tag => {
    const lower = tag.toLowerCase();
    if (selected.has(lower)) primary.push(tag);
    else if (allowedSecondary.has(lower)) secondary.push(tag);
  });

  // Show all selected matches + at most 1 closely related secondary
  return [...primary, ...secondary.slice(0, primary.length > 0 ? 1 : 0)];
};

const formatFlightTime = (hours: number): string => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const DestinationCard = ({ recommendation, onExplore, departureCity, userInterests }: DestinationCardProps) => {
  const visibleTags = filterRelevantTags(recommendation.tags, userInterests);
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

        {/* Flight time badge */}
        {recommendation.estimatedFlightHours != null && recommendation.estimatedFlightHours > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs font-medium">
            <Plane className="w-3 h-3" />
            <span>~{formatFlightTime(recommendation.estimatedFlightHours)}{departureCity ? ` from ${departureCity}` : ''}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        {/* Best months chip */}
        {recommendation.bestMonths && (
          <div className="flex mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium dark:bg-emerald-950/40 dark:text-emerald-400">
              <Calendar className="w-3 h-3" />
              Best visited: {recommendation.bestMonths}
            </span>
          </div>
        )}

        {/* Rationale */}
        <p className="text-foreground/80 text-base leading-relaxed mb-4 flex-1">
          {stripMarkdown(recommendation.rationale)}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {recommendation.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
            >
              {humanizeTag(tag)}
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
