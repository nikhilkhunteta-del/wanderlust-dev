import { SignatureExperience } from "@/types/cityHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { Bookmark } from "lucide-react";

interface FeaturedExperienceCardProps {
  experience: SignatureExperience;
  city: string;
  country: string;
  isSaved?: boolean;
  onToggleSave?: (title: string) => void;
}

export const FeaturedExperienceCard = ({ experience, city, country, isSaved, onToggleSave }: FeaturedExperienceCardProps) => {
  return (
    <section className="mb-14">
      <article className="group relative rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
        {/* Save button */}
        {onToggleSave && (
          <button
            onClick={() => onToggleSave(experience.title)}
            aria-label={isSaved ? "Remove from saved" : "Save for later"}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
          >
            <Bookmark
              className={`w-5 h-5 transition-colors ${isSaved ? "fill-primary text-primary" : "text-white"}`}
            />
          </button>
        )}

        <div className="aspect-[21/9] md:aspect-[3/1] overflow-hidden">
          <ResolvedImage
            request={{
              type: 'attraction',
              city,
              country,
              entityName: experience.title,
            }}
            alt={experience.title}
            className="w-full h-full group-hover:scale-[1.03] transition-transform duration-700"
            showAttribution
            fallbackCategory="culture"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="text-xs font-medium uppercase tracking-wider text-primary-foreground/70 bg-primary/80 px-2.5 py-1 rounded-full mb-3 inline-block">
            Best match for your interests
          </span>
          <h3 className="text-2xl md:text-3xl font-display font-semibold text-white mb-2">
            {experience.title}
          </h3>
          <p className="text-white/85 text-sm md:text-base leading-relaxed max-w-2xl">
            {experience.description}
          </p>
        </div>
      </article>
    </section>
  );
};
