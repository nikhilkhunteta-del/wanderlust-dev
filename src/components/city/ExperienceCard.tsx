import { SignatureExperience } from "@/types/cityHighlights";
import { ExternalLink } from "lucide-react";
import { ResolvedImage } from "@/components/shared/ResolvedImage";
import { getYourGuideSearchUrl, shouldShowTourLink } from "@/lib/getYourGuideLinks";

interface ExperienceCardProps {
  experience: SignatureExperience;
  city: string;
  country: string;
}

export const ExperienceCard = ({ experience, city, country }: ExperienceCardProps) => {
  const showTourLink = shouldShowTourLink(experience.title);
  const tourUrl = getYourGuideSearchUrl(experience.title, city, country);

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
        <p className="text-muted-foreground text-sm leading-relaxed mb-3">
          {experience.description}
        </p>
        
        {showTourLink && (
          <a
            href={tourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            View guided tour
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </article>
  );
};
