import { CityHighlights } from "@/types/cityHighlights";
import { HighlightsHero } from "./HighlightsHero";
import { ExperienceCard } from "./ExperienceCard";
import { VibeStrip } from "./VibeStrip";
import { Loader2 } from "lucide-react";

interface HighlightsTabProps {
  city: string;
  country: string;
  highlights: CityHighlights | null;
  isLoading: boolean;
  error: string | null;
}

export const HighlightsTab = ({
  city,
  country,
  highlights,
  isLoading,
  error,
}: HighlightsTabProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Curating highlights for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-2">Failed to load highlights</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (!highlights) {
    return null;
  }

  return (
    <div>
      {/* Hero Section */}
      <HighlightsHero
        city={city}
        country={country}
        heroImageQuery={highlights.heroImageQuery}
        matchStatement={highlights.matchStatement}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        {/* City Vibe */}
        <section className="mb-12">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            City Vibe
          </h2>
          <VibeStrip tags={highlights.vibeTags} />
        </section>

        {/* Signature Experiences */}
        <section>
          <h2 className="text-2xl font-display font-semibold mb-6">
            Signature Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.experiences.map((experience, index) => (
              <ExperienceCard key={index} experience={experience} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
