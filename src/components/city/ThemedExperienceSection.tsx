import { SignatureExperience, ExperienceTheme } from "@/types/cityHighlights";
import { ExperienceCard } from "./ExperienceCard";

interface ThemedExperienceSectionProps {
  themes: ExperienceTheme[];
  experiences: SignatureExperience[];
  featuredIndex: number;
  city: string;
  country: string;
  isSaved?: (title: string) => boolean;
  onToggleSave?: (title: string) => void;
}

export const ThemedExperienceSection = ({
  themes,
  experiences,
  featuredIndex,
  city,
  country,
  isSaved,
  onToggleSave,
}: ThemedExperienceSectionProps) => {
  // If no themes provided, fall back to flat grid (excluding featured)
  if (!themes || themes.length === 0) {
    const remaining = experiences.filter((_, i) => i !== featuredIndex);
    return (
      <section className="mb-14">
        <h2 className="text-2xl font-display font-semibold mb-6 text-foreground">
          More experiences for you
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {remaining.map((exp, i) => (
            <ExperienceCard key={i} experience={exp} city={city} country={country} isSaved={isSaved?.(exp.title)} onToggleSave={onToggleSave} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-14">
      {themes.map((theme, ti) => {
        const themeExperiences = theme.experienceIndices
          .filter((idx) => idx !== featuredIndex && idx < experiences.length)
          .map((idx) => experiences[idx]);

        if (themeExperiences.length === 0) return null;

        const count = themeExperiences.length;

        return (
          <section key={ti} data-scroll-fade>
            <h2 className="text-xl md:text-2xl font-display font-semibold mb-6 text-foreground">
              {theme.themeLabel}
            </h2>
            <ExperienceGrid
              experiences={themeExperiences}
              city={city}
              country={country}
              isSaved={isSaved}
              onToggleSave={onToggleSave}
            />
          </section>
        );
      })}
    </div>
  );
};
