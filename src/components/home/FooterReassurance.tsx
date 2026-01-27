import { Heart } from "lucide-react";

export const FooterReassurance = () => {
  return (
    <footer className="py-12 bg-background border-t border-border/50">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <p className="text-muted-foreground text-sm flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          No ads. No booking pressure. Just inspiration and planning.
        </p>
      </div>
    </footer>
  );
};
