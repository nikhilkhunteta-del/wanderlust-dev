import { SignatureExperience, ExperienceTheme } from "@/types/cityHighlights";
import { ExperienceCard } from "./ExperienceCard";

interface ExperienceGridProps {
  experiences: SignatureExperience[];
  city: string;
  country: string;
  isSaved?: (title: string) => boolean;
  onToggleSave?: (title: string) => void;
}

const ExperienceGrid = ({ experiences, city, country, isSaved, onToggleSave }: ExperienceGridProps) => {
  const count = experiences.length;

  if (count === 0) return null;

  // 1 card: full-width centred, max-width 65%
  if (count === 1) {
    return (
      <div className="flex justify-center">
        <div className="w-full max-w-[65%] max-md:max-w-full" data-scroll-fade>
          <ExperienceCard experience={experiences[0]} city={city} country={country} isSaved={isSaved?.(experiences[0].title)} onToggleSave={onToggleSave} />
        </div>
      </div>
    );
  }

  // 2 cards: two equal columns
  if (count === 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiences.map((exp, i) => (
          <div key={i} data-scroll-fade>
            <ExperienceCard experience={exp} city={city} country={country} isSaved={isSaved?.(exp.title)} onToggleSave={onToggleSave} />
          </div>
        ))}
      </div>
    );
  }

  // 3 cards: standard three-column grid
  if (count === 3) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.map((exp, i) => (
          <div key={i} data-scroll-fade>
            <ExperienceCard experience={exp} city={city} country={country} isSaved={isSaved?.(exp.title)} onToggleSave={onToggleSave} />
          </div>
        ))}
      </div>
    );
  }

  // 4 cards: first 3 in grid, last 1 full-width centred
  if (count === 4) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.slice(0, 3).map((exp, i) => (
            <div key={i} data-scroll-fade>
              <ExperienceCard experience={exp} city={city} country={country} isSaved={isSaved?.(exp.title)} onToggleSave={onToggleSave} />
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <div className="w-full max-w-[65%] max-md:max-w-full" data-scroll-fade>
            <ExperienceCard experience={experiences[3]} city={city} country={country} isSaved={isSaved?.(experiences[3].title)} onToggleSave={onToggleSave} />
          </div>
        </div>
      </div>
    );
  }

  // 5+ cards: three-column grid, handle last row remainder
  const remainder = count % 3;
  const fullGridCount = remainder === 0 ? count : count - remainder;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {experiences.slice(0, fullGridCount).map((exp, i) => (
          <div key={i} data-scroll-fade>
            <ExperienceCard experience={exp} city={city} country={country} isSaved={isSaved?.(exp.title)} onToggleSave={onToggleSave} />
          </div>
        ))}
      </div>
      {remainder === 1 && (
        <div className="flex justify-center">
          <div className="w-full max-w-[65%] max-md:max-w-full" data-scroll-fade>
            <ExperienceCard experience={experiences[fullGridCount]} city={city} country={country} isSaved={isSaved?.(experiences[fullGridCount].title)} onToggleSave={onToggleSave} />
          </div>
        </div>
      )}
      {remainder === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {experiences.slice(fullGridCount).map((exp, i) => (
            <div key={i} data-scroll-fade>
              <ExperienceCard experience={exp} city={city} country={country} isSaved={isSaved?.(exp.title)} onToggleSave={onToggleSave} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

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
  if (!themes || themes.length === 0) {
    const remaining = experiences.filter((_, i) => i !== featuredIndex);
    return (
      <section className="mb-14">
        <h2 className="text-2xl font-display font-semibold mb-6 text-foreground">
          More experiences for you
        </h2>
        <ExperienceGrid experiences={remaining} city={city} country={country} isSaved={isSaved} onToggleSave={onToggleSave} />
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
