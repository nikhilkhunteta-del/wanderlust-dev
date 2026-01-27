import { Plane } from "lucide-react";

export const ResultsHeader = () => {
  return (
    <header className="py-6 px-4 border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center">
            <Plane className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-semibold">Wanderlust</span>
        </div>
        <span className="text-sm text-muted-foreground">Your Destinations</span>
      </div>
    </header>
  );
};
