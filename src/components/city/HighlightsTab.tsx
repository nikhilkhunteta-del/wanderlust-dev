import { CityHighlights } from "@/types/cityHighlights";
import { PersonalMatchSection } from "./PersonalMatchSection";
import { PerfectDayStrip } from "./PerfectDayStrip";
import { ExperienceCard } from "./ExperienceCard";
import { ThemedExperienceSection } from "./ThemedExperienceSection";
import { VibeStrip } from "./VibeStrip";
import { InsiderMissedSection } from "./InsiderMissedSection";
import { LandmarkStrip } from "./LandmarkStrip";
import { CityStatsStrip } from "./CityStatsStrip";

import { Loader2 } from "lucide-react";
import { useScrollFade } from "@/hooks/useScrollFade";
import { useSavedExperiences } from "@/hooks/useSavedExperiences";
import { useHeroCollage } from "@/hooks/useHeroCollage";

interface HighlightsTabProps {
  city: string;
  country: string;
  highlights: CityHighlights | null;
  isLoading: boolean;
  error: string | null;
  travelMonth?: string;
  onSwitchTab?: (tab: string) => void;
  allCities?: any[] | null;
  profile?: any | null;
}

export const HighlightsTab = ({
  city,
  country,
  highlights,
  isLoading,
  error,
  travelMonth,
  onSwitchTab,
  allCities,
  profile,
}: HighlightsTabProps) => {
  const scrollRef = useScrollFade<HTMLDivElement>();
  const { isSaved, toggle } = useSavedExperiences(city, country);
  const primaryInterest = profile?.primaryInterest || "culture-history";
  const { data: heroData } = useHeroCollage(city, country, profile?.interests ?? [], primaryInterest);
  const stripPlaces = heroData?.places ?? [];

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
      {/* Stats strip */}
      <CityStatsStrip
        city={city}
        country={country}
        primaryInterest={profile?.primaryInterest || "culture-history"}
      />

      {/* Main Content */}
      <div className="page-container py-12 space-y-12">
        {/* 1. Personal match reasons */}
        <PersonalMatchSection
          city={city}
          reasons={highlights.personalMatchReasons ?? []}
        />

        {/* City Vibe */}
        <section>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-foreground mb-4">
            City vibe
          </h2>
          <VibeStrip tags={highlights.vibeTags} />
        </section>
      </div>

      {/* Interest-driven photo strip — full bleed */}
      {stripPlaces.length > 0 && (
        <div className="mb-12">
          <LandmarkStrip city={city} country={country} places={stripPlaces} primaryInterest={primaryInterest} />
        </div>
      )}

      <div className="page-container space-y-12">

        {/* 2. Perfect day narrative */}
        <PerfectDayStrip
          city={city}
          narrative={highlights.perfectDayNarrative ?? ""}
          perfectDayTimeline={highlights.perfectDayTimeline}
          travelMonth={travelMonth}
          onSwitchTab={onSwitchTab}
        />

        {/* 3. Featured experience */}
        {featuredExperience && (
          <section>
            <h2 className="text-xl md:text-2xl font-display font-semibold mb-6 text-foreground">
              Made for you
            </h2>
            <ExperienceCard
              experience={featuredExperience}
              city={city}
              country={country}
              isSaved={isSaved(featuredExperience.title)}
              onToggleSave={toggle}
            />
          </section>
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
      </div>
    </div>
  );
};
