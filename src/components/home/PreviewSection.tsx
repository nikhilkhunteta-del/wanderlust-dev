import kyotoImage from "@/assets/preview-kyoto.jpg";
import marrakechImage from "@/assets/preview-marrakech.jpg";
import lisbonImage from "@/assets/preview-lisbon.jpg";

const destinations = [
  {
    city: "Kyoto",
    country: "Japan",
    teaser: "Ancient temples meet cherry blossoms in spring",
    image: kyotoImage,
  },
  {
    city: "Marrakech",
    country: "Morocco",
    teaser: "Sensory overload in the heart of the medina",
    image: marrakechImage,
  },
  {
    city: "Lisbon",
    country: "Portugal",
    teaser: "Sunset tiles and vintage trams on cobbled hills",
    image: lisbonImage,
  },
];

export const PreviewSection = () => {
  return (
    <section className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Discover your next adventure
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Here's a glimpse of what your personalized results could look like.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {destinations.map((destination, index) => (
            <article
              key={destination.city}
              className="group cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-lg">
                <img
                  src={destination.image}
                  alt={`${destination.city}, ${destination.country}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="space-y-1">
                <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                  {destination.city}
                </h3>
                <p className="text-sm text-muted-foreground uppercase tracking-wider">
                  {destination.country}
                </p>
                <p className="text-muted-foreground text-sm pt-1">
                  {destination.teaser}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
