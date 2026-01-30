import { SignatureExperience } from "@/types/cityHighlights";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface ExperienceCardProps {
  experience: SignatureExperience;
  city: string;
  country: string;
}

export const ExperienceCard = ({ experience, city, country }: ExperienceCardProps) => {
  return (
    <article className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      {/* Image using new image system */}
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
