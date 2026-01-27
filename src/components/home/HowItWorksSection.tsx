import { forwardRef } from "react";
import { MessageSquare, Map, CalendarDays } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Share your preferences",
    description: "Answer a few quick questions about your interests, travel style, and timing.",
  },
  {
    icon: Map,
    step: "02",
    title: "Get matched cities",
    description: "We analyze your preferences and suggest three destinations tailored just for you.",
  },
  {
    icon: CalendarDays,
    step: "03",
    title: "Explore and plan",
    description: "Dive into highlights, weather, festivals, and custom itineraries for each city.",
  },
];

export const HowItWorksSection = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <section ref={ref} className="py-24 md:py-32 bg-card">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three simple steps to finding your perfect destination.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-px bg-border" />
              )}

              <div className="relative bg-background rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-4xl font-display font-semibold text-muted-foreground/30">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

HowItWorksSection.displayName = "HowItWorksSection";
