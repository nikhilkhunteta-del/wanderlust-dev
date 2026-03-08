import { CityHighlights } from "@/types/cityHighlights";
import { HighlightsHero } from "./HighlightsHero";
import { PersonalMatchSection } from "./PersonalMatchSection";
import { PerfectDayStrip } from "./PerfectDayStrip";
import { FeaturedExperienceCard } from "./FeaturedExperienceCard";
import { ThemedExperienceSection } from "./ThemedExperienceSection";
import { VibeStrip } from "./VibeStrip";
import { InsiderMissedSection } from "./InsiderMissedSection";
import { HighlightsCuratedTours } from "./HighlightsCuratedTours";
import { Loader2 } from "lucide-react";
import { useScrollFade } from "@/hooks/useScrollFade";
import { useSavedExperiences } from "@/hooks/useSavedExperiences";

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
  const scrollRef = useScrollFade<HTMLDivElement>();
  const { isSaved, toggle } = useSavedExperiences(city, country);

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

  const featuredIndex = highlights.featuredExperienceIndex ?? 0;
  const featuredExperience = highlights.experiences[featuredIndex] ?? highlights.experiences[0];

  return (
    <div ref={scrollRef}>
      {/* Hero Section */}
      <HighlightsHero
        city={city}
        country={country}
        matchStatement={highlights.matchStatement}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12 space-y-0">
        {/* 1. Personal match reasons */}
        <PersonalMatchSection
          city={city}
          reasons={highlights.personalMatchReasons ?? []}
        />

        {/* 2. Perfect day narrative */}
        <PerfectDayStrip
          city={city}
          narrative={highlights.perfectDayNarrative ?? ""}
        />

        {/* City Vibe */}
        <section className="mb-14">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
            City Vibe
          </h2>
          <VibeStrip tags={highlights.vibeTags} />
        </section>

        {/* 3. Featured experience */}
        {featuredExperience && (
          <FeaturedExperienceCard
            experience={featuredExperience}
            city={city}
            country={country}
            isSaved={isSaved(featuredExperience.title)}
            onToggleSave={toggle}
          />
        )}

        {/* 4. Themed experiences */}
        <ThemedExperienceSection
          themes={highlights.experienceThemes ?? []}
          experiences={highlights.experiences}
          featuredIndex={featuredIndex}
          city={city}
          country={country}
          isSaved={isSaved}
          onToggleSave={toggle}
        />

        {/* 5. What most visitors miss */}
        {highlights.insiderMissed && (
          <InsiderMissedSection city={city} content={highlights.insiderMissed} />
        )}

        {/* 6. Action-oriented tours section */}
        <section className="mt-14" data-scroll-fade>
          <HighlightsCuratedTours
            experiences={highlights.experiences}
            cityName={city}
            country={country}
          />
        </section>
      </div>
    </div>
  );
};
