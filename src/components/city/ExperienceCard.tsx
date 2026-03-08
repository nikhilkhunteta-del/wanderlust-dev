import { SignatureExperience } from "@/types/cityHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { Bookmark } from "lucide-react";

interface ExperienceCardProps {
  experience: SignatureExperience;
  city: string;
  country: string;
  isSaved?: boolean;
  onToggleSave?: (title: string) => void;
}

export const ExperienceCard = ({ experience, city, country, isSaved, onToggleSave }: ExperienceCardProps) => {
  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 relative">
      {/* Save button */}
      {onToggleSave && (
        <button
          onClick={() => onToggleSave(experience.title)}
          aria-label={isSaved ? "Remove from saved" : "Save for later"}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"
        >
          <Bookmark
            className={`w-4 h-4 transition-colors ${isSaved ? "fill-[#EA580C] text-[#EA580C]" : "text-white"}`}
          />
        </button>
      )}

      {/* Image */}
      <div className="aspect-[3/2] overflow-hidden">
        <ResolvedImage
          request={{
            type: 'attraction',
            city,
            country,
            entityName: experience.title,
          }}
          alt={experience.title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          showAttribution
          fallbackCategory="culture"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          {experience.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {experience.description}
        </p>
        {experience.childNote && (
          <p className="text-muted-foreground text-xs italic mt-2 leading-relaxed">
            {experience.childNote}
          </p>
        )}
      </div>
    </article>
  );
};
