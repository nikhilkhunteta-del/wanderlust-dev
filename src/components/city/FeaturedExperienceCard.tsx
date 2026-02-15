import { SignatureExperience } from "@/types/cityHighlights";
import { ResolvedImage } from "@/components/shared/ResolvedImage";

interface FeaturedExperienceCardProps {
  experience: SignatureExperience;
  city: string;
  country: string;
}

export const FeaturedExperienceCard = ({ experience, city, country }: FeaturedExperienceCardProps) => {
  return (
    <section className="mb-14">
      <article className="group relative rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
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
