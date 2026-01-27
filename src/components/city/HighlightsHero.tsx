import { getHeroImageUrl } from "@/lib/cityHighlights";

interface HighlightsHeroProps {
  city: string;
  country: string;
  heroImageQuery: string;
  matchStatement: string;
}

export const HighlightsHero = ({
  city,
  country,
  heroImageQuery,
  matchStatement,
}: HighlightsHeroProps) => {
  const imageUrl = getHeroImageUrl(heroImageQuery);

  return (
    <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
      {/* Hero Image */}
      <img
        src={imageUrl}
        alt={`${city}, ${country}`}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12">
        <div className="max-w-4xl">
          <span className="text-white/70 text-sm font-medium uppercase tracking-wider mb-2 block">
            {country}
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-semibold text-white mb-4">
            {city}
          </h1>
          <p className="text-white/90 text-lg md:text-xl leading-relaxed max-w-2xl">
            {matchStatement}
          </p>
        </div>
      </div>
    </section>
  );
};
