import { Sparkles, Eye, Scale } from "lucide-react";

const values = [
  {
    icon: Sparkles,
    title: "Personalized discovery",
    description: "Cities matched to your interests and travel timing.",
  },
  {
    icon: Eye,
    title: "See what makes each place special",
    description: "Highlights, seasonal experiences, itineraries, and local insight.",
  },
  {
    icon: Scale,
    title: "Choose with confidence",
    description: "Compare cities side-by-side before committing.",
  },
];

export const ValuePropositions = () => {
  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {values.map((value, index) => (
            <div
              key={value.title}
              className="text-center group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6 group-hover:scale-110 transition-transform duration-300">
                <value.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {value.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
