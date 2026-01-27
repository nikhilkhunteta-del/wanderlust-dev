import { SignatureExperience } from "@/types/cityHighlights";
import { getExperienceImageUrl } from "@/lib/cityHighlights";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ExperienceCardProps {
  experience: SignatureExperience;
}

export const ExperienceCard = ({ experience }: ExperienceCardProps) => {
  const imageUrl = getExperienceImageUrl(experience.imageQuery);

  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <div className="aspect-[3/2] overflow-hidden">
        <img
          src={imageUrl}
          alt={experience.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </div>
      
      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold mb-2 text-foreground">
          {experience.title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">
          {experience.description}
        </p>
        
        {experience.bookingUrl && (
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => window.open(experience.bookingUrl!, "_blank")}
          >
            Book Experience
            <ExternalLink className="w-3 h-3" />
          </Button>
        )}
      </div>
    </article>
  );
};
