import { ExternalLink, Compass } from "lucide-react";
import { shouldShowTourLink } from "@/lib/getYourGuideLinks";
import { SignatureExperience } from "@/types/cityHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface HighlightsCuratedToursProps {
  experiences: SignatureExperience[];
  cityName: string;
  country: string;
  userInterests?: string[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

function buildGygUrl(title: string, city: string): string {
  return `https://www.getyourguide.com/s/?q=${encodeURIComponent(title)}&loc=${encodeURIComponent(city)}`;
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

export const HighlightsCuratedTours = ({
  experiences,
  cityName,
  country,
}: HighlightsCuratedToursProps) => {
  const bookable = experiences.filter((e) => shouldShowTourLink(e.title));
  const tours = bookable.slice(0, 5);
  const hasMore = bookable.length > 5;

  if (tours.length === 0) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h3 className="font-display font-semibold text-[22px] flex items-center gap-2.5 text-foreground border-l-[3px] border-l-[#EA580C] pl-3">
          Book these experiences
        </h3>
        <p className="text-sm text-muted-foreground mt-1.5 pl-[15px]">
          Curated options matched to your interests · via GetYourGuide
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {tours.map((tour, index) => (
          <div
            key={index}
            className="flex items-center gap-4 rounded-xl border border-border/60 p-3 md:p-4 transition-colors hover:bg-[#FFF7ED]"
          >
            {/* Thumbnail */}
            <div className="flex-shrink-0 w-[80px] h-[80px] rounded-lg overflow-hidden">
              <ResolvedImage
                request={{
                  type: "attraction",
                  city: cityName,
                  country,
                  entityName: tour.title,
                }}
                alt={tour.title}
                className="w-full h-full"
                fallbackCategory="culture"
              />
            </div>

            {/* Middle — title + description */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm text-foreground leading-snug">
                {tour.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {truncateWords(tour.description, 12)}
              </p>
            </div>

            {/* Right — CTA */}
            <div className="flex-shrink-0 text-right">
              <a
                href={buildGygUrl(tour.title, cityName)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-[#EA580C] hover:underline whitespace-nowrap"
              >
                Check availability
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* More link */}
      {hasMore && (
        <div className="mt-4 text-center">
          <a
            href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(cityName)}&lc=en`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-[#EA580C] hover:underline"
          >
            View more on GetYourGuide
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground/60 mt-4">
        Links open GetYourGuide in a new tab. We don't receive commissions.
      </p>
    </div>
  );
};
