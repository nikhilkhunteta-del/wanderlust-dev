import { ExternalLink, Compass } from "lucide-react";
import { getYourGuideSearchUrl, shouldShowTourLink } from "@/lib/getYourGuideLinks";

interface HighlightsCuratedToursProps {
  experiences: { title: string; description: string; category?: string }[];
  cityName: string;
  country: string;
  userInterests?: string[];
  sectionTitle?: string;
  sectionSubtitle?: string;
}

export const HighlightsCuratedTours = ({
  experiences,
  cityName,
  country,
  sectionTitle = "Helpful tours & experiences",
  sectionSubtitle = "Hand-picked options aligned with your interests — browse only if you're ready.",
}: HighlightsCuratedToursProps) => {
  const tours = experiences
    .filter((e) => shouldShowTourLink(e.title))
    .slice(0, 5)
    .map((e) => ({
      title: e.title,
      rationale:
        e.description.length > 100
          ? e.description.slice(0, 97) + "…"
          : e.description,
      url: getYourGuideSearchUrl(e.title, cityName, country),
    }));

  if (tours.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-primary/3 to-primary/5 rounded-xl p-5 md:p-6 border border-primary/10">
      <h3 className="font-display font-semibold text-lg flex items-center gap-2.5 mb-1.5 text-foreground">
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Compass className="w-4 h-4 text-primary" />
        </div>
        {sectionTitle}
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
      If this feels like your kind of journey, here is how to begin.
      </p>

      <div className="space-y-3">
        {tours.map((tour, index) => (
          <a
            key={index}
            href={tour.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 bg-card/80 backdrop-blur-sm rounded-lg border border-border/50 p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">
                {tour.title}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {tour.rationale}
              </p>
            </div>
            <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors pt-0.5 whitespace-nowrap">
              View guided option
              <ExternalLink className="w-3 h-3" />
            </span>
          </a>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground/60 mt-4">
        Links open GetYourGuide in a new tab. We don't receive commissions.
      </p>
    </div>
  );
};
