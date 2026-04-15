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
      <article className="group rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-card">
        {/* Image — clean, no text overlay */}
        <div className="relative aspect-[21/9] md:aspect-[3/1] overflow-hidden">
          {onToggleSave && (
            <button
              onClick={() => onToggleSave(experience.title)}
              aria-label={isSaved ? "Remove from saved" : "Save for later"}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
            >
              <Bookmark
                className={`w-5 h-5 transition-colors ${isSaved ? "fill-[#EA580C] text-[#EA580C]" : "text-white"}`}
              />
            </button>
          )}
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

        {/* Text area below image */}
        <div className="p-6 md:p-8">
          <span
            className="text-primary font-medium mb-2 inline-block"
            style={{ fontSize: 12, fontVariant: "small-caps", letterSpacing: "0.08em" }}
          >
            Best Match For Your Interests
          </span>
          <h3 className="text-2xl md:text-3xl font-display font-semibold text-foreground mb-2">
            {experience.title}
          </h3>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
            {experience.description}
          </p>
        </div>
      </article>
    </section>
  );
};
