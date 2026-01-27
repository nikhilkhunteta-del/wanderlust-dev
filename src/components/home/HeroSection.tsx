import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import heroImage from "@/assets/hero-santorini.jpg";

interface HeroSectionProps {
  onStartExploring: () => void;
  onHowItWorks: () => void;
}

export const HeroSection = ({ onStartExploring, onHowItWorks }: HeroSectionProps) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Beautiful travel destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold text-white mb-6 leading-tight tracking-tight">
          Decide where to travel next.
        </h1>
        <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
          Tell us what you love. We'll show you three cities you'll want to go to.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={onStartExploring}
            size="lg"
            className="gradient-sunset text-white border-0 px-8 py-6 text-lg font-medium rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 group"
          >
            Start exploring
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <button
            onClick={onHowItWorks}
            className="text-white/80 hover:text-white text-sm font-medium underline underline-offset-4 transition-colors"
          >
            How it works
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-6 h-6 text-white/60" />
      </div>
    </section>
  );
};
